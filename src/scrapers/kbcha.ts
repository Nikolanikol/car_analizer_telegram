import axios from 'axios';
import * as cheerio from 'cheerio';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KbchaData {
  vehicleNo: string;
  modelName: string;
  price: number | null;
  year: string;
  mileage: number | null;
  fuel: string;
  transmission: string;
  color: string;
  displacement: string;
  region: string;
  seizure: string;        // 압류
  lien: string;           // 저당
  accident: string;       // 사고있음 / 사고없음
  totalLoss: string;      // 전손이력
  flood: string;          // 침수이력
  usageHistory: string;   // 용도이력
  ownerChanges: string;   // 소유자변경
  vin: string;
  diagnosisResult: string;
  diagnosisDesc: string;
  mainPhoto: string | null;
  dealerName: string;
  dealerPlace: string;
  dealerPhone: string;
  dealerCompany: string;
  dealerAddress: string;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  bold:   '\x1b[1m',
};

function log(color: string, tag: string, msg: string) {
  const time = new Date().toISOString().slice(11, 23);
  console.log(`${C.bold}${color}[${time}] [${tag}]${C.reset} ${msg}`);
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const BASE_URL = 'https://www.kbchachacha.com';

export async function fetchKbchaData(carSeq: string): Promise<KbchaData> {
  const url = `${BASE_URL}/public/car/detail.kbc?carSeq=${carSeq}`;
  log(C.cyan, 'kbcha', `GET ${url}`);

  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'Referer': BASE_URL,
    },
  });

  log(C.green, 'kbcha', `HTML получен, парсим...`);
  log(C.yellow, 'kbcha', `--- HTML DUMP (первые 5000 символов) ---`);
  console.log(html.slice(0, 5000));
  log(C.yellow, 'kbcha', `--- END DUMP ---`);

  const $ = cheerio.load(html);

  // ── Заголовок и номер авто ─────────────────────────────────────────────────
  const titleRaw = $('strong.car-buy-name').first().text().replace(/\s+/g, ' ').trim();
  const plateMatch = titleRaw.match(/^\(([^)]+)\)/);
  const vehicleNo = plateMatch ? plateMatch[1] : '';
  const modelName = plateMatch ? titleRaw.slice(plateMatch[0].length).trim() : titleRaw;

  // ── Цена ───────────────────────────────────────────────────────────────────
  const priceRaw = $('strong.c-title-28').first().text().trim();
  const priceMatch = priceRaw.match(/([\d,]+)만원/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : null;

  // ── Краткая строка (год, пробег, топливо, регион) ─────────────────────────
  const infoSpans = $('.car-buy-share .txt-info span').map((_, el) => $(el).text().trim()).get();
  const yearRaw    = infoSpans[0] ?? '';
  const mileageRaw = infoSpans[1] ?? '';
  const fuelShort  = infoSpans[2] ?? '';
  const region     = infoSpans[3] ?? '';
  const mileageMatch = mileageRaw.match(/([\d,]+)km/i);

  // ── Таблица характеристик (th → td) ───────────────────────────────────────
  const table: Record<string, string> = {};
  $('table.detail-info-table tr').each((_, tr) => {
    const ths = $(tr).find('th');
    const tds = $(tr).find('td');
    ths.each((i, th) => {
      const key = $(th).text().trim();
      const val = $(tds.get(i)).text().replace(/\s+/g, ' ').trim();
      if (key) table[key] = val;
    });
  });

  // ── Аварии и история — dl в detail-info02 ─────────────────────────────────
  const accident = $('#btnCarHistoryView2').text().replace(/\s+/g, ' ').trim();

  const history: Record<string, string> = {};
  $('.detail-info02 dl dt').each((_, dt) => {
    const key = $(dt).text().trim();
    const val = $(dt).next('dd').text().replace(/\s+/g, ' ').trim();
    if (key) history[key] = val;
  });

  // ── Дилер ─────────────────────────────────────────────────────────────────
  const dealerName  = $('.dealer-cnt .name').first().text().trim();
  const dealerPlace = $('.dealer-cnt .place-add').first().text().trim();
  const dealerPhone = $('.dealer-cnt .dealer-tel-num').first().text().trim();

  // Адрес из блока карты
  let dealerCompany = '';
  let dealerAddress = '';
  $('.dealer-location .map-txt p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith('상사명')) dealerCompany = text.replace('상사명 :', '').trim();
    if (text.startsWith('주소'))   dealerAddress = text.replace('주소 :', '').trim();
  });

  // ── Главное фото из JSON-LD schema ────────────────────────────────────────
  let mainPhoto: string | null = null;
  try {
    const ldJson = $('script[type="application/ld+json"]').first().html();
    if (ldJson) {
      const schema = JSON.parse(ldJson);
      const images = schema.image;
      if (Array.isArray(images) && images.length > 0) mainPhoto = images[0];
      else if (typeof images === 'string') mainPhoto = images;
    }
  } catch { /* ignore */ }

  // ── KB диагностика ─────────────────────────────────────────────────────────
  const diagnosisResult = $('.pop-tit h2').first().text().trim();
  const diagnosisDesc   = $('.diag-desc--d1').first().text().trim();

  // ── Нормализация года ─────────────────────────────────────────────────────
  // "23년08월(23년형)" / "2023년 08월" / "23년형" → "2023"
  function parseYear(raw: string): string {
    const full = raw.match(/(\d{4})년/);
    if (full) return full[1];
    const short = raw.match(/(\d{2})년/);
    if (short) return `20${short[1]}`;
    return raw;
  }

  log(C.green, 'kbcha', `готово: ${modelName}`);
  log(C.cyan,  'kbcha', `table keys: ${Object.keys(table).join(', ')}`);
  log(C.cyan,  'kbcha', `history: ${JSON.stringify(history)}`);

  return {
    vehicleNo: table['차량번호'] || table['차량정보'] || vehicleNo,
    vin: table['차대번호'] ?? '',
    modelName,
    price,
    year: parseYear(table['연식'] || yearRaw),
    mileage: mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, ''), 10) : null,
    fuel: table['연료'] || fuelShort,
    transmission: table['변속기'] ?? '',
    color: table['차량색상'] ?? '',
    displacement: table['배기량'] ?? '',
    region,
    seizure: table['압류'] ?? '',
    lien: table['저당'] ?? '',
    accident,
    totalLoss: history['전손이력'] ?? '',
    flood: history['침수이력'] ?? '',
    usageHistory: history['용도이력'] ?? '',
    ownerChanges: history['소유자변경'] ?? '',
    diagnosisResult,
    diagnosisDesc,
    mainPhoto,
    dealerName,
    dealerPlace,
    dealerPhone,
    dealerCompany,
    dealerAddress,
  };
}
