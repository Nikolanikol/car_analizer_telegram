import { KkarData } from '../scrapers/kkar';
import { translateModelName, MANUFACTURER_MAP } from './translations';
import { t, type Lang } from '../i18n';

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type BiMap = Record<string, { ru: string; en: string }>;

const FUEL_MAP: BiMap = {
  '가솔린':      { ru: 'Бензин',                   en: 'Gasoline' },
  '디젤':        { ru: 'Дизель',                   en: 'Diesel' },
  'LPG':         { ru: 'ГАЗ',                      en: 'LPG' },
  '전기':        { ru: 'Электро',                  en: 'Electric' },
  '하이브리드':  { ru: 'Гибрид',                   en: 'Hybrid' },
  '가솔린+전기': { ru: 'Гибрид (Бензин+Электро)',  en: 'Hybrid (Gas+Electric)' },
  '디젤+전기':   { ru: 'Гибрид (Дизель+Электро)',  en: 'Hybrid (Diesel+Electric)' },
};

const TRANSMISSION_MAP: BiMap = {
  '오토':       { ru: 'Автомат',     en: 'Automatic' },
  '수동':       { ru: 'Механика',    en: 'Manual' },
  'CVT':        { ru: 'Вариатор',    en: 'CVT' },
  '듀얼클러치': { ru: 'Робот (DCT)', en: 'Dual-clutch (DCT)' },
};

const DRIVE_MAP: BiMap = {
  '전륜': { ru: 'Передний (FWD)', en: 'Front-wheel (FWD)' },
  '후륜': { ru: 'Задний (RWD)',   en: 'Rear-wheel (RWD)' },
  '사륜': { ru: 'Полный (AWD)',   en: 'All-wheel (AWD)' },
  '4WD':  { ru: 'Полный (4WD)',   en: '4-wheel (4WD)' },
  'AWD':  { ru: 'Полный (AWD)',   en: 'All-wheel (AWD)' },
};

const COLOR_MAP: BiMap = {
  '흰색':    { ru: 'Белый',         en: 'White' },
  '화이트':  { ru: 'Белый',         en: 'White' },
  '검정':    { ru: 'Чёрный',        en: 'Black' },
  '검정색':  { ru: 'Чёрный',        en: 'Black' },
  '블랙':    { ru: 'Чёрный',        en: 'Black' },
  '은색':    { ru: 'Серебристый',   en: 'Silver' },
  '실버':    { ru: 'Серебристый',   en: 'Silver' },
  '회색':    { ru: 'Серый',         en: 'Grey' },
  '쥐색':    { ru: 'Графитовый',    en: 'Graphite' },
  '다크그레이': { ru: 'Тёмно-серый', en: 'Dark grey' },
  '빨간색':  { ru: 'Красный',       en: 'Red' },
  '레드':    { ru: 'Красный',       en: 'Red' },
  '파란색':  { ru: 'Синий',         en: 'Blue' },
  '청색':    { ru: 'Синий',         en: 'Blue' },
  '블루':    { ru: 'Синий',         en: 'Blue' },
  '남색':    { ru: 'Тёмно-синий',   en: 'Navy blue' },
  '네이비':  { ru: 'Тёмно-синий',   en: 'Navy' },
  '갈색':    { ru: 'Коричневый',    en: 'Brown' },
  '브라운':  { ru: 'Коричневый',    en: 'Brown' },
  '베이지':  { ru: 'Бежевый',       en: 'Beige' },
  '샴페인':  { ru: 'Шампань',       en: 'Champagne' },
  '진주색':  { ru: 'Перламутровый', en: 'Pearl' },
  '펄':      { ru: 'Перламутровый', en: 'Pearl' },
  '골드':    { ru: 'Золотой',       en: 'Gold' },
};

function phone(num: string): string {
  return num ? esc(num) : '—';
}

function tr(map: BiMap, value: string, lang: Lang): string {
  if (!value) return '—';
  const entry = map[value];
  return entry ? `${entry[lang]} (${esc(value)})` : esc(value);
}

function formatDate(d: string): string {
  if (d.length === 8) return `${d.slice(6)}.${d.slice(4, 6)}.${d.slice(0, 4)}`;
  return esc(d);
}

function manufacturerEn(name: string): string {
  return MANUFACTURER_MAP[name] ?? name;
}

export function formatKkarReport(data: KkarData, short = false, lang: Lang = 'ru'): string {
  const lines: string[] = [];
  const s = t(lang);
  const url = `https://www.kcar.com/bc/detail/carInfoDtl?i_sCarCd=${data.carCd}`;

  const mfrEn = manufacturerEn(data.manufacturerName);
  const modelEn = translateModelName(data.modelName);
  const fullName = `${mfrEn} ${modelEn}`;
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';

  const hasMyAccident    = data.myAccidentCnt > 0;
  const hasOtherAccident = data.otherAccidentCnt > 0;
  const hasAnyAccident   = hasMyAccident || hasOtherAccident;

  const mileageFmt = `${data.mileage.toLocaleString(locale)} ${lang === 'ru' ? 'км' : 'km'}`;

  if (short) {
    const insurancePart = hasMyAccident
      ? s.shortInsuranceCost(data.myAccidentCost.toLocaleString(locale))
      : s.shortNoInsurance;

    lines.push(`<b>${esc(fullName)}</b> / ${esc(data.vehicleNo)} / ${insurancePart}`);

    const flags: string[] = [];
    if (data.totalLossCnt > 0)   flags.push(s.reportTotalLoss(data.totalLossCnt));
    if (data.floodCnt > 0)       flags.push(s.reportFloodLoss(data.floodCnt));
    if (data.theftCnt > 0)       flags.push(s.reportTheft(data.theftCnt));
    if (data.ownerChangeCnt > 0) flags.push(s.reportOwnerChange(data.ownerChangeCnt));
    if (data.rentHistory)        flags.push(s.reportRentHistory);
    if (data.bizuseHistory)      flags.push(s.reportBizUseHistory);

    if (flags.length > 0) {
      lines.push('');
      lines.push(...flags);
    }
    return lines.join('\n');
  }

  lines.push(
    `🚗 <b>${esc(fullName)}</b>`,
    `<i>${esc(data.gradeName)}</i>`,
    `<a href="${url}">${url}</a>`,
    '',
    s.reportMainData,
    `${s.reportPlate.padEnd(14)}<b>${esc(data.vehicleNo)}</b>`,
    `${s.reportVin.padEnd(14)}<b>${data.vin ? esc(data.vin) : '—'}</b>`,
    `${s.reportYear.padEnd(14)}<b>${data.year}</b>`,
    `${s.reportMileage.padEnd(14)}<b>${mileageFmt}</b>`,
    `${s.reportPrice.padEnd(14)}<b>${data.price.toLocaleString(locale)} ₩</b>`,
    `${s.reportTransmission.padEnd(14)}${tr(TRANSMISSION_MAP, data.transmission, lang)}`,
    `${s.reportFuel.padEnd(14)}${tr(FUEL_MAP, data.fuelType, lang)}`,
    `${s.reportEngine.padEnd(14)}${data.displacement ? (data.displacement / 1000).toFixed(1) + 'L' : '—'}`,
    `${s.reportColor.padEnd(14)}${tr(COLOR_MAP, data.color, lang)}`,
    `${s.reportDrive.padEnd(14)}${tr(DRIVE_MAP, data.driveType, lang)}`,
    `${s.reportAddress.padEnd(14)}${esc(data.address)}`,
    '',
    s.reportInsuranceHistory,
  );

  const allClean = !hasAnyAccident && data.totalLossCnt === 0 && data.floodCnt === 0
    && data.theftCnt === 0 && data.ownerChangeCnt === 0
    && !data.rentHistory && !data.bizuseHistory;

  if (allClean) {
    lines.push(s.reportCleanHistory);
  } else {
    if (hasMyAccident)
      lines.push(s.reportAccidentFault(data.myAccidentCnt, data.myAccidentCost.toLocaleString(locale)));
    if (hasOtherAccident)
      lines.push(s.reportAccidentVictim(data.otherAccidentCnt, data.otherAccidentCost.toLocaleString(locale)));
    if (data.totalLossCnt > 0)   lines.push(s.reportTotalLoss(data.totalLossCnt));
    if (data.floodCnt > 0)       lines.push(s.reportFloodLoss(data.floodCnt));
    if (data.theftCnt > 0)       lines.push(s.reportTheft(data.theftCnt));
    if (data.ownerChangeCnt > 0) lines.push(s.reportOwnerChange(data.ownerChangeCnt));
    if (data.rentHistory)        lines.push(s.reportRentHistory);
    if (data.bizuseHistory)      lines.push(s.reportBizUseHistory);
  }

  if (data.firstRegDate)
    lines.push(`${s.reportFirstReg.padEnd(16)}${formatDate(data.firstRegDate)}`);

  if (data.sellerName || data.centerName) {
    lines.push('');
    lines.push(s.reportSeller);
    if (data.centerName)  lines.push(`${s.reportCenter.padEnd(10)}${esc(data.centerName)}`);
    if (data.sellerName)  lines.push(`${s.reportDealer.padEnd(10)}${esc(data.sellerName)}`);
    if (data.sellerPhone) lines.push(`${s.reportPhone.padEnd(10)}${phone(data.sellerPhone)}`);
    if (data.address)     lines.push(`${s.reportAddress.padEnd(10)}${esc(data.address)}`);
  }

  return lines.join('\n');
}
