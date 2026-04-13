import { KkarData } from '../scrapers/kkar';
import { translateModelName, MANUFACTURER_MAP } from './translations';

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FUEL_MAP: Record<string, string> = {
  '가솔린': 'Бензин', '디젤': 'Дизель', 'LPG': 'ГАЗ',
  '전기': 'Электро', '하이브리드': 'Гибрид',
  '가솔린+전기': 'Гибрид (Бензин+Электро)',
  '디젤+전기': 'Гибрид (Дизель+Электро)',
};

const TRANSMISSION_MAP: Record<string, string> = {
  '오토': 'Автомат', '수동': 'Механика', 'CVT': 'Вариатор',
  '듀얼클러치': 'Робот (DCT)',
};

const DRIVE_MAP: Record<string, string> = {
  '전륜': 'Передний (FWD)',
  '후륜': 'Задний (RWD)',
  '사륜': 'Полный (AWD)',
  '4WD': 'Полный (4WD)',
  'AWD': 'Полный (AWD)',
};

const COLOR_MAP: Record<string, string> = {
  '흰색': 'Белый', '화이트': 'Белый',
  '검정': 'Чёрный', '검정색': 'Чёрный', '블랙': 'Чёрный',
  '은색': 'Серебристый', '실버': 'Серебристый',
  '회색': 'Серый', '쥐색': 'Графитовый', '다크그레이': 'Тёмно-серый',
  '빨간색': 'Красный', '레드': 'Красный',
  '파란색': 'Синий', '청색': 'Синий', '블루': 'Синий',
  '남색': 'Тёмно-синий', '네이비': 'Тёмно-синий',
  '갈색': 'Коричневый', '브라운': 'Коричневый',
  '베이지': 'Бежевый', '샴페인': 'Шампань',
  '진주색': 'Перламутровый', '펄': 'Перламутровый',
  '골드': 'Золотой',
};

function phone(num: string): string {
  return num ? esc(num) : '—';
}

function tr(map: Record<string, string>, value: string): string {
  if (!value) return '—';
  const translated = map[value];
  return translated ? `${translated} (${esc(value)})` : esc(value);
}

function formatDate(d: string): string {
  // 20201015 → 15.10.2020
  if (d.length === 8) return `${d.slice(6)}.${d.slice(4, 6)}.${d.slice(0, 4)}`;
  return esc(d);
}

function manufacturerEn(name: string): string {
  return MANUFACTURER_MAP[name] ?? name;
}

export function formatKkarReport(data: KkarData, short = false): string {
  const lines: string[] = [];
  const url = `https://www.kcar.com/bc/detail/carInfoDtl?i_sCarCd=${data.carCd}`;

  const manufacturerEn_val = manufacturerEn(data.manufacturerName);
  const modelEn = translateModelName(data.modelName);
  const fullName = `${manufacturerEn_val} ${modelEn}`;

  const hasMyAccident    = data.myAccidentCnt > 0;
  const hasOtherAccident = data.otherAccidentCnt > 0;
  const hasAnyAccident   = hasMyAccident || hasOtherAccident;

  if (short) {
    // ── Короткое сообщение ──────────────────────────────────────────────────
    const insurancePart = hasMyAccident
      ? `страховых на ${data.myAccidentCost.toLocaleString('ru-RU')} ₩`
      : '✅ страховых нет';

    lines.push(`<b>${esc(fullName)}</b> / ${esc(data.vehicleNo)} / ${insurancePart}`);

    const flags: string[] = [];
    if (data.totalLossCnt > 0)   flags.push(`🚨 Тотальные потери: ${data.totalLossCnt}`);
    if (data.floodCnt > 0)       flags.push(`🚨 Потоп (тотал): ${data.floodCnt}`);
    if (data.theftCnt > 0)       flags.push(`🚨 Угон: ${data.theftCnt}`);
    if (data.ownerChangeCnt > 0) flags.push(`⚠️ Смена владельца: ${data.ownerChangeCnt}`);
    if (data.rentHistory)        flags.push(`⚠️ История проката`);
    if (data.bizuseHistory)      flags.push(`⚠️ Коммерческое использование`);

    if (flags.length > 0) {
      lines.push('');
      lines.push(...flags);
    }

    return lines.join('\n');
  }

  // ── Полное сообщение ──────────────────────────────────────────────────────
  lines.push(
    `🚗 <b>${esc(fullName)}</b>`,
    `<i>${esc(data.gradeName)}</i>`,
    `<a href="${url}">${url}</a>`,
    '',
    '📋 <b>Основные данные</b>',
    `Номер авто:   <b>${esc(data.vehicleNo)}</b>`,
    `VIN:          <b>${data.vin ? esc(data.vin) : '—'}</b>`,
    `Год выпуска:  <b>${data.year}</b>`,
    `Пробег:       <b>${data.mileage.toLocaleString('ru-RU')} км</b>`,
    `Цена:         <b>${data.price.toLocaleString('ru-RU')} ₩</b>`,
    `КПП:          ${tr(TRANSMISSION_MAP, data.transmission)}`,
    `Топливо:      ${tr(FUEL_MAP, data.fuelType)}`,
    `Двигатель:    ${data.displacement ? (data.displacement / 1000).toFixed(1) + 'л' : '—'}`,
    `Цвет:         ${tr(COLOR_MAP, data.color)}`,
    `Привод:       ${tr(DRIVE_MAP, data.driveType)}`,
    `Адрес:        ${esc(data.address)}`,
    '',
    '🔍 <b>Страховая история</b>',
  );

  const allClean = !hasAnyAccident && data.totalLossCnt === 0 && data.floodCnt === 0
    && data.theftCnt === 0 && data.ownerChangeCnt === 0
    && !data.rentHistory && !data.bizuseHistory;

  if (allClean) {
    lines.push('✅ Чистая история');
  } else {
    if (hasMyAccident)
      lines.push(`⚠️ Аварий (виновник): ${data.myAccidentCnt} — ${data.myAccidentCost.toLocaleString('ru-RU')} ₩`);
    if (hasOtherAccident)
      lines.push(`⚠️ Аварий (пострадавший): ${data.otherAccidentCnt} — ${data.otherAccidentCost.toLocaleString('ru-RU')} ₩`);
    if (data.totalLossCnt > 0)
      lines.push(`🚨 Тотальные потери: ${data.totalLossCnt}`);
    if (data.floodCnt > 0)
      lines.push(`🚨 Потоп (тотал): ${data.floodCnt}`);
    if (data.theftCnt > 0)
      lines.push(`🚨 Угон: ${data.theftCnt}`);
    if (data.ownerChangeCnt > 0)
      lines.push(`⚠️ Смена владельца: ${data.ownerChangeCnt}`);
    if (data.rentHistory)
      lines.push(`⚠️ История проката`);
    if (data.bizuseHistory)
      lines.push(`⚠️ Коммерческое использование`);
  }

  if (data.firstRegDate)
    lines.push(`Первая рег.:    ${formatDate(data.firstRegDate)}`);

  // ── Продавец ─────────────────────────────────────────────────────────────
  if (data.sellerName || data.centerName) {
    lines.push('');
    lines.push('👤 <b>Продавец</b>');
    if (data.centerName)  lines.push(`Центр:    ${esc(data.centerName)}`);
    if (data.sellerName)  lines.push(`Дилер:    ${esc(data.sellerName)}`);
    if (data.sellerPhone) lines.push(`Тел.:     ${phone(data.sellerPhone)}`);
    if (data.address)     lines.push(`Адрес:    ${esc(data.address)}`);
  }

  return lines.join('\n');
}
