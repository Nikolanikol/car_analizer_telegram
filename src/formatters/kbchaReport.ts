import { KbchaData } from '../scrapers/kbcha';
import { translateModelName } from './translations';
import { t, type Lang } from '../i18n';

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function phone(num: string): string {
  return num ? esc(num) : '—';
}

type BiMap = Record<string, { ru: string; en: string }>;

const FUEL_MAP: BiMap = {
  '가솔린':            { ru: 'Бензин',             en: 'Gasoline' },
  '디젤':              { ru: 'Дизель',              en: 'Diesel' },
  'LPG':               { ru: 'ГАЗ',                en: 'LPG' },
  '전기':              { ru: 'Электро',             en: 'Electric' },
  '하이브리드':        { ru: 'Гибрид',              en: 'Hybrid' },
  '하이브리드(가솔린)': { ru: 'Гибрид (Бензин)',    en: 'Hybrid (Gasoline)' },
  '하이브리드(디젤)':  { ru: 'Гибрид (Дизель)',     en: 'Hybrid (Diesel)' },
};

const TRANSMISSION_MAP: BiMap = {
  '오토': { ru: 'Автомат',  en: 'Automatic' },
  '수동': { ru: 'Механика', en: 'Manual' },
  'CVT':  { ru: 'Вариатор', en: 'CVT' },
};

const COLOR_MAP: BiMap = {
  '흰색':      { ru: 'Белый',         en: 'White' },
  '검정':      { ru: 'Чёрный',        en: 'Black' },
  '검정색':    { ru: 'Чёрный',        en: 'Black' },
  '은색':      { ru: 'Серебристый',   en: 'Silver' },
  '실버':      { ru: 'Серебристый',   en: 'Silver' },
  '회색':      { ru: 'Серый',         en: 'Grey' },
  '쥐색':      { ru: 'Графитовый',    en: 'Graphite' },
  '빨간색':    { ru: 'Красный',       en: 'Red' },
  '파란색':    { ru: 'Синий',         en: 'Blue' },
  '블루':      { ru: 'Синий',         en: 'Blue' },
  '갈색':      { ru: 'Коричневый',    en: 'Brown' },
  '베이지':    { ru: 'Бежевый',       en: 'Beige' },
  '샴페인':    { ru: 'Шампань',       en: 'Champagne' },
  '진주색':    { ru: 'Перламутровый', en: 'Pearl' },
  '펄':        { ru: 'Перламутровый', en: 'Pearl' },
  '골드':      { ru: 'Золотой',       en: 'Gold' },
  '카본블랙':  { ru: 'Карбон-чёрный', en: 'Carbon black' },
  '다크그레이': { ru: 'Тёмно-серый',  en: 'Dark grey' },
};

function tr(map: BiMap, value: string, lang: Lang): string {
  if (!value) return '—';
  const entry = map[value];
  return entry ? `${entry[lang]} (${esc(value)})` : esc(value);
}

function price(val: number | null, lang: Lang): string {
  if (val === null) return '—';
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  return `<b>${(val * 10000).toLocaleString(locale)} ₩</b>`;
}

function noVal(val: string): boolean {
  return !val || val === '없음' || val === '정보없음';
}

export function formatKbchaReport(data: KbchaData, carSeq: string, short = false, lang: Lang = 'ru'): string {
  const lines: string[] = [];
  const s = t(lang);
  const url = `https://www.kbchachacha.com/public/car/detail.kbc?carSeq=${carSeq}`;
  const modelEn = translateModelName(data.modelName);
  const hasAccident = (data.accident ?? '').includes('사고있음');

  const mileageFmt = data.mileage !== null
    ? `${data.mileage.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} ${lang === 'ru' ? 'км' : 'km'}`
    : '—';

  if (short) {
    const accidentPart = hasAccident ? s.shortHasAccidents : s.shortNoInsurance;
    lines.push(`<b>${esc(modelEn)}</b> / ${esc(data.vehicleNo)} / ${accidentPart}`);

    const flags: string[] = [];
    if (!noVal(data.totalLoss))    flags.push(`🚨 ${s.reportTotalLoss(0).split(':')[0]}: ${esc(data.totalLoss)}`);
    if (!noVal(data.flood))        flags.push(`🚨 ${lang === 'ru' ? 'Потоп' : 'Flood'}: ${esc(data.flood)}`);
    if (!noVal(data.usageHistory)) flags.push(`⚠️ ${s.reportUsageHistory} ${esc(data.usageHistory)}`);
    if (!noVal(data.seizure))      flags.push(`⚠️ ${lang === 'ru' ? 'Арест' : 'Seizure'}: ${esc(data.seizure)}`);
    if (!noVal(data.lien))         flags.push(`⚠️ ${lang === 'ru' ? 'Залог' : 'Lien'}: ${esc(data.lien)}`);
    if (flags.length > 0) {
      lines.push('');
      lines.push(...flags);
    }
    return lines.join('\n');
  }

  lines.push(`🚗 <b>${esc(modelEn)}</b>`, `<a href="${url}">${url}</a>`, '');

  lines.push(s.reportMainData);
  if (data.vehicleNo) lines.push(`${s.reportPlate.padEnd(14)}<b>${esc(data.vehicleNo)}</b>`);
  lines.push(
    `${s.reportVin.padEnd(14)}<b>${data.vin ? esc(data.vin) : '—'}</b>`,
    `${s.reportYear.padEnd(14)}<b>${esc(data.year)}</b>`,
    `${s.reportMileage.padEnd(14)}<b>${mileageFmt}</b>`,
    `${s.reportPrice.padEnd(14)}${price(data.price, lang)}`,
    `${s.reportTransmission.padEnd(14)}${tr(TRANSMISSION_MAP, data.transmission, lang)}`,
    `${s.reportFuel.padEnd(14)}${tr(FUEL_MAP, data.fuel, lang)}`,
    `${s.reportColor.padEnd(14)}${tr(COLOR_MAP, data.color, lang)}`,
  );
  if (data.displacement) lines.push(`${s.reportEngine.padEnd(14)}${esc(data.displacement)}`);
  if (data.region)       lines.push(`${s.reportRegion.padEnd(14)}${esc(data.region)}`);
  lines.push('');

  lines.push(s.reportInsuranceHistory);
  lines.push(`${s.reportAccidents.padEnd(17)}${hasAccident ? s.reportAccidentsYes : s.reportAccidentsNone}`);
  if (!noVal(data.totalLoss))    lines.push(`${lang === 'ru' ? 'Тотальные потери' : 'Total loss'}:   ⚠️ ${esc(data.totalLoss)}`);
  if (!noVal(data.flood))        lines.push(`${lang === 'ru' ? 'Потоп' : 'Flood'}:           ⚠️ ${esc(data.flood)}`);
  if (!noVal(data.usageHistory)) lines.push(`${s.reportUsageHistory.padEnd(17)}${esc(data.usageHistory)}`);
  if (!noVal(data.seizure))      lines.push(`${lang === 'ru' ? 'Арест' : 'Seizure'}:          ⚠️ ${esc(data.seizure)}`);
  if (!noVal(data.lien))         lines.push(`${lang === 'ru' ? 'Залог' : 'Lien'}:            ⚠️ ${esc(data.lien)}`);

  if (data.dealerName || data.dealerCompany) {
    lines.push('');
    lines.push(s.reportSeller);
    if (data.dealerName)       lines.push(`${s.reportDealer.padEnd(10)}${esc(data.dealerName)}`);
    if (data.dealerCompany)    lines.push(`${s.reportCompany.padEnd(10)}${esc(data.dealerCompany)}`);
    if (data.dealerAddress)    lines.push(`${s.reportAddress.padEnd(10)}${esc(data.dealerAddress)}`);
    else if (data.dealerPlace) lines.push(`${s.reportPlace.padEnd(10)}${esc(data.dealerPlace)}`);
    if (data.dealerPhone)      lines.push(`${s.reportPhone.padEnd(10)}${phone(data.dealerPhone)}`);
  }

  return lines.join('\n');
}
