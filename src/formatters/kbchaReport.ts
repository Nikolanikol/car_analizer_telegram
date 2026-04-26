import { KbchaData } from '../scrapers/kbcha';
import { translateModelName } from './translations';

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function phone(num: string): string {
  return num ? esc(num) : '—';
}

const FUEL_MAP: Record<string, string> = {
  '가솔린': 'Бензин', '디젤': 'Дизель', 'LPG': 'ГАЗ',
  '전기': 'Электро', '하이브리드': 'Гибрид',
  '하이브리드(가솔린)': 'Гибрид (Бензин)', '하이브리드(디젤)': 'Гибрид (Дизель)',
};

const TRANSMISSION_MAP: Record<string, string> = {
  '오토': 'Автомат', '수동': 'Механика', 'CVT': 'Вариатор',
};

const COLOR_MAP: Record<string, string> = {
  '흰색': 'Белый', '검정': 'Чёрный', '검정색': 'Чёрный', '은색': 'Серебристый',
  '실버': 'Серебристый', '회색': 'Серый', '쥐색': 'Графитовый',
  '빨간색': 'Красный', '파란색': 'Синий', '블루': 'Синий',
  '갈색': 'Коричневый', '베이지': 'Бежевый', '샴페인': 'Шампань',
  '진주색': 'Перламутровый', '펄': 'Перламутровый', '골드': 'Золотой',
  '카본블랙': 'Карбон-чёрный', '다크그레이': 'Тёмно-серый',
};

function tr(map: Record<string, string>, value: string): string {
  if (!value) return '—';
  const translated = map[value];
  return translated ? `${translated} (${esc(value)})` : esc(value);
}

function price(val: number | null): string {
  if (val === null) return '—';
  return `<b>${(val * 10000).toLocaleString('ru-RU')} ₩</b>`;
}


function noVal(val: string): boolean {
  return !val || val === '없음' || val === '정보없음';
}

export function formatKbchaReport(data: KbchaData, carSeq: string, short = false): string {
  const lines: string[] = [];
  const url = `https://www.kbchachacha.com/public/car/detail.kbc?carSeq=${carSeq}`;
  const modelEn = translateModelName(data.modelName);
  const hasAccident = (data.accident ?? '').includes('사고있음');

  if (short) {
    // ── Короткое сообщение ────────────────────────────────────────────────────
    const accidentPart = hasAccident ? '⚠️ Есть аварии' : '✅ страховых нет';
    lines.push(`<b>${esc(modelEn)}</b> / ${esc(data.vehicleNo)} / ${accidentPart}`);

    const flags: string[] = [];
    if (!noVal(data.totalLoss))    flags.push(`🚨 Тотал: ${esc(data.totalLoss)}`);
    if (!noVal(data.flood))        flags.push(`🚨 Потоп: ${esc(data.flood)}`);
    if (!noVal(data.usageHistory)) flags.push(`⚠️ История исп.: ${esc(data.usageHistory)}`);
    if (!noVal(data.seizure))      flags.push(`⚠️ Арест: ${esc(data.seizure)}`);
    if (!noVal(data.lien))         flags.push(`⚠️ Залог: ${esc(data.lien)}`);
    if (flags.length > 0) {
      lines.push('');
      lines.push(...flags);
    }

    return lines.join('\n');
  }

  // ── Полное сообщение ────────────────────────────────────────────────────────
  lines.push(
    `🚗 <b>${esc(modelEn)}</b>`,
    `<a href="${url}">${url}</a>`,
    '',
  );

  // ── Основные данные ────────────────────────────────────────────────────────
  lines.push('📋 <b>Основные данные</b>');
  if (data.vehicleNo) lines.push(`Номер авто:   <b>${esc(data.vehicleNo)}</b>`);
  lines.push(`VIN:          <b>${data.vin ? esc(data.vin) : '—'}</b>`);
  lines.push(
    `Год выпуска:  <b>${esc(data.year)}</b>`,
    `Пробег:       <b>${data.mileage !== null ? data.mileage.toLocaleString('ru-RU') + ' км' : '—'}</b>`,
    `Цена:         ${price(data.price)}`,
    `КПП:          ${tr(TRANSMISSION_MAP, data.transmission)}`,
    `Топливо:      ${tr(FUEL_MAP, data.fuel)}`,
    `Цвет:         ${tr(COLOR_MAP, data.color)}`,
  );
  if (data.displacement) lines.push(`Двигатель:    ${esc(data.displacement)}`);
  if (data.region)       lines.push(`Регион:       ${esc(data.region)}`);
  lines.push('');

  // ── Страховая история ──────────────────────────────────────────────────────
  lines.push('🔍 <b>Страховая история</b>');
  lines.push(`Аварии:          ${hasAccident ? '⚠️ Есть' : '✅ Нет'}`);
  if (!noVal(data.totalLoss))    lines.push(`Тотальные потери: ⚠️ ${esc(data.totalLoss)}`);
  if (!noVal(data.flood))        lines.push(`Потоп:           ⚠️ ${esc(data.flood)}`);
  if (!noVal(data.usageHistory)) lines.push(`История исп.:    ${esc(data.usageHistory)}`);
  if (!noVal(data.seizure))      lines.push(`Арест:           ⚠️ ${esc(data.seizure)}`);
  if (!noVal(data.lien))         lines.push(`Залог:           ⚠️ ${esc(data.lien)}`);

  // ── Дилер ─────────────────────────────────────────────────────────────────
  if (data.dealerName || data.dealerCompany) {
    lines.push('');
    lines.push('👤 <b>Продавец</b>');
    if (data.dealerName)       lines.push(`Дилер:    ${esc(data.dealerName)}`);
    if (data.dealerCompany)    lines.push(`Компания: ${esc(data.dealerCompany)}`);
    if (data.dealerAddress)    lines.push(`Адрес:    ${esc(data.dealerAddress)}`);
    else if (data.dealerPlace) lines.push(`Место:    ${esc(data.dealerPlace)}`);
    if (data.dealerPhone)      lines.push(`Тел.:     ${phone(data.dealerPhone)}`);
  }

  return lines.join('\n');
}
