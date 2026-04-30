import { EncarData } from '../scrapers/encar';
import { MODEL_MAP, translateModelName } from './translations';
import { t, type Lang } from '../i18n';

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function phone(num: string): string {
  return num ? esc(num) : '—';
}

function price(val: number): string {
  const krw = val * 10000;
  const formatted = krw.toLocaleString('ru-RU');
  return `<b>${formatted} ₩</b>`;
}

// ─── Bilingual dictionaries ────────────────────────────────────────────────────

type BiMap = Record<string, { ru: string; en: string }>;

const FUEL_MAP: BiMap = {
  '가솔린':      { ru: 'Бензин',                    en: 'Gasoline' },
  '디젤':        { ru: 'Дизель',                    en: 'Diesel' },
  'LPG':         { ru: 'ГАЗ',                       en: 'LPG' },
  '전기':        { ru: 'Электро',                   en: 'Electric' },
  '하이브리드':  { ru: 'Гибрид',                    en: 'Hybrid' },
  '가솔린+전기': { ru: 'Гибрид (Бензин+Электро)',   en: 'Hybrid (Gas+Electric)' },
  '디젤+전기':   { ru: 'Гибрид (Дизель+Электро)',   en: 'Hybrid (Diesel+Electric)' },
};

const TRANSMISSION_MAP: BiMap = {
  '오토':       { ru: 'Автомат',      en: 'Automatic' },
  '수동':       { ru: 'Механика',     en: 'Manual' },
  'CVT':        { ru: 'Вариатор',     en: 'CVT' },
  '듀얼클러치': { ru: 'Робот (DCT)',  en: 'Dual-clutch (DCT)' },
  'DCT':        { ru: 'Робот (DCT)',  en: 'Dual-clutch (DCT)' },
};

const COLOR_MAP: BiMap = {
  '흰색':    { ru: 'Белый',               en: 'White' },
  '화이트':  { ru: 'Белый',               en: 'White' },
  '크림':    { ru: 'Кремовый',            en: 'Cream' },
  '검정':    { ru: 'Чёрный',              en: 'Black' },
  '검은색':  { ru: 'Чёрный',              en: 'Black' },
  '검정색':  { ru: 'Чёрный',              en: 'Black' },
  '블랙':    { ru: 'Чёрный',              en: 'Black' },
  '은색':    { ru: 'Серебристый',         en: 'Silver' },
  '실버':    { ru: 'Серебристый',         en: 'Silver' },
  '은회색':  { ru: 'Серебристо-серый',    en: 'Silver-grey' },
  '회색':    { ru: 'Серый',               en: 'Grey' },
  '그레이':  { ru: 'Серый',               en: 'Grey' },
  '쥐색':    { ru: 'Графитовый',          en: 'Graphite' },
  '진회색':  { ru: 'Тёмно-серый',         en: 'Dark grey' },
  '다크그레이': { ru: 'Тёмно-серый',      en: 'Dark grey' },
  '건메탈':  { ru: 'Тёмно-серый (Gunmetal)', en: 'Gunmetal' },
  '빨간색':  { ru: 'Красный',             en: 'Red' },
  '빨강':    { ru: 'Красный',             en: 'Red' },
  '레드':    { ru: 'Красный',             en: 'Red' },
  '와인':    { ru: 'Бордовый',            en: 'Wine' },
  '버건디':  { ru: 'Бордовый',            en: 'Burgundy' },
  '다크레드': { ru: 'Тёмно-красный',      en: 'Dark red' },
  '파란색':  { ru: 'Синий',               en: 'Blue' },
  '파랑':    { ru: 'Синий',               en: 'Blue' },
  '블루':    { ru: 'Синий',               en: 'Blue' },
  '남색':    { ru: 'Тёмно-синий',         en: 'Navy blue' },
  '네이비':  { ru: 'Тёмно-синий',         en: 'Navy' },
  '하늘색':  { ru: 'Голубой',             en: 'Sky blue' },
  '청색':    { ru: 'Синий',               en: 'Blue' },
  '딥블루':  { ru: 'Тёмно-синий',         en: 'Deep blue' },
  '초록':    { ru: 'Зелёный',             en: 'Green' },
  '그린':    { ru: 'Зелёный',             en: 'Green' },
  '초록색':  { ru: 'Зелёный',             en: 'Green' },
  '연두색':  { ru: 'Салатовый',           en: 'Light green' },
  '카키':    { ru: 'Хаки',                en: 'Khaki' },
  '올리브':  { ru: 'Оливковый',           en: 'Olive' },
  '민트':    { ru: 'Мятный',              en: 'Mint' },
  '노란색':  { ru: 'Жёлтый',             en: 'Yellow' },
  '노랑':    { ru: 'Жёлтый',             en: 'Yellow' },
  '옐로우':  { ru: 'Жёлтый',             en: 'Yellow' },
  '주황':    { ru: 'Оранжевый',           en: 'Orange' },
  '오렌지':  { ru: 'Оранжевый',           en: 'Orange' },
  '갈색':    { ru: 'Коричневый',          en: 'Brown' },
  '브라운':  { ru: 'Коричневый',          en: 'Brown' },
  '베이지':  { ru: 'Бежевый',             en: 'Beige' },
  '샴페인':  { ru: 'Шампань',             en: 'Champagne' },
  '카멜':    { ru: 'Верблюжий',           en: 'Camel' },
  '보라':    { ru: 'Фиолетовый',          en: 'Purple' },
  '퍼플':    { ru: 'Фиолетовый',          en: 'Purple' },
  '분홍':    { ru: 'Розовый',             en: 'Pink' },
  '핑크':    { ru: 'Розовый',             en: 'Pink' },
  '진주색':  { ru: 'Перламутровый',       en: 'Pearl' },
  '펄':      { ru: 'Перламутровый',       en: 'Pearl' },
  '진주':    { ru: 'Перламутровый',       en: 'Pearl' },
  '골드':    { ru: 'Золотой',             en: 'Gold' },
  '금색':    { ru: 'Золотой',             en: 'Gold' },
};

const USAGE_MAP: BiMap = {
  '렌트': { ru: 'Прокат/Аренда',     en: 'Rental' },
  '택시': { ru: 'Такси',             en: 'Taxi' },
  '회사': { ru: 'Корпоративный',     en: 'Corporate' },
  '관용': { ru: 'Служебный',         en: 'Government' },
};

const PART_MAP: BiMap = {
  '프론트 도어':        { ru: 'Передняя дверь',        en: 'Front door' },
  '리어 도어':          { ru: 'Задняя дверь',           en: 'Rear door' },
  '도어':               { ru: 'Дверь',                  en: 'Door' },
  '프론트 휀더':        { ru: 'Переднее крыло',         en: 'Front fender' },
  '프론트 펜더':        { ru: 'Переднее крыло',         en: 'Front fender' },
  '휀더':               { ru: 'Крыло',                  en: 'Fender' },
  '펜더':               { ru: 'Крыло',                  en: 'Fender' },
  '쿼터 패널':          { ru: 'Заднее крыло',           en: 'Quarter panel' },
  '리어 휀더':          { ru: 'Заднее крыло',           en: 'Rear fender' },
  '후드':               { ru: 'Капот',                  en: 'Hood' },
  '트렁크 리드':        { ru: 'Крышка багажника',       en: 'Trunk lid' },
  '트렁크':             { ru: 'Багажник',               en: 'Trunk' },
  '루프 패널':          { ru: 'Крыша',                  en: 'Roof panel' },
  '루프':               { ru: 'Крыша',                  en: 'Roof' },
  '썬루프':             { ru: 'Люк',                    en: 'Sunroof' },
  '사이드 실 패널':     { ru: 'Порог',                  en: 'Side sill panel' },
  '사이드실':           { ru: 'Порог',                  en: 'Side sill' },
  '프런트 패널':        { ru: 'Передняя панель',        en: 'Front panel' },
  '프론트 패널':        { ru: 'Передняя панель',        en: 'Front panel' },
  '리어 패널':          { ru: 'Задняя панель',          en: 'Rear panel' },
  '인사이드 패널':      { ru: 'Внутренняя панель',      en: 'Inside panel' },
  '대쉬패널':           { ru: 'Щит приборов',           en: 'Dashboard panel' },
  '플로어패널':         { ru: 'Напольная панель',       en: 'Floor panel' },
  '플로어':             { ru: 'Пол кузова',             en: 'Floor' },
  '필러패널A':          { ru: 'Стойка A',               en: 'A-pillar' },
  '필러패널B':          { ru: 'Стойка B',               en: 'B-pillar' },
  '필러패널C':          { ru: 'Стойка C',               en: 'C-pillar' },
  '필러 패널(A)':       { ru: 'Стойка A',               en: 'A-pillar' },
  '필러 패널(B)':       { ru: 'Стойка B',               en: 'B-pillar' },
  '필러 패널(C)':       { ru: 'Стойка C',               en: 'C-pillar' },
  'A필러':              { ru: 'Стойка A',               en: 'A-pillar' },
  'B필러':              { ru: 'Стойка B',               en: 'B-pillar' },
  'C필러':              { ru: 'Стойка C',               en: 'C-pillar' },
  '크로스 멤버':        { ru: 'Поперечина',             en: 'Cross member' },
  '라디에이터 서포트':  { ru: 'Рамка радиатора',        en: 'Radiator support' },
  '라디에이터서포트':   { ru: 'Рамка радиатора',        en: 'Radiator support' },
  '프론트 사이드 멤버': { ru: 'Передний лонжерон',      en: 'Front side member' },
  '리어 사이드 멤버':   { ru: 'Задний лонжерон',        en: 'Rear side member' },
  '사이드 멤버':        { ru: 'Лонжерон',               en: 'Side member' },
  '프론트 휠하우스':    { ru: 'Передняя арка',          en: 'Front wheel house' },
  '리어 휠하우스':      { ru: 'Задняя арка',            en: 'Rear wheel house' },
  '휠하우스':           { ru: 'Арка колеса',            en: 'Wheel house' },
  '트렁크 플로어':      { ru: 'Пол багажника',          en: 'Trunk floor' },
  '패키지 트레이':      { ru: 'Полка багажника',        en: 'Package tray' },
  '볼트체결부품':       { ru: 'болтовое соединение',    en: 'bolt-on part' },
};

const DAMAGE_MAP: BiMap = {
  '교환(교체)': { ru: 'Замена',              en: 'Replaced' },
  '교환':       { ru: 'Замена',              en: 'Replaced' },
  '교체':       { ru: 'Замена',              en: 'Replaced' },
  '판금/용접':  { ru: 'Рихтовка/сварка',    en: 'Panel beating/welding' },
  '판금':       { ru: 'Рихтовка',           en: 'Panel beating' },
  '용접':       { ru: 'Сварка',             en: 'Welding' },
  '부식':       { ru: 'Коррозия',           en: 'Corrosion' },
  '흠집':       { ru: 'Царапина',           en: 'Scratch' },
  '요철':       { ru: 'Деформация',         en: 'Dent' },
  '도장':       { ru: 'Покраска',           en: 'Repainted' },
  '손상':       { ru: 'Повреждение',        en: 'Damage' },
};

const ITEM_TITLE_MAP: BiMap = {
  '원동기':       { ru: 'Двигатель',                       en: 'Engine' },
  '실린더 블록':  { ru: 'Блок цилиндров',                  en: 'Cylinder block' },
  '실린더블록':   { ru: 'Блок цилиндров',                  en: 'Cylinder block' },
  '오일팬':       { ru: 'Поддон картера',                  en: 'Oil pan' },
  '실린더 헤드':  { ru: 'Головка блока',                   en: 'Cylinder head' },
  '실린더헤드':   { ru: 'Головка блока',                   en: 'Cylinder head' },
  '로커암커버':   { ru: 'Крышка клапанов',                 en: 'Valve cover' },
  '오일필터':     { ru: 'Масляный фильтр',                 en: 'Oil filter' },
  '인젝터':       { ru: 'Форсунки',                        en: 'Injectors' },
  '타이밍벨트':   { ru: 'Ремень ГРМ',                      en: 'Timing belt' },
  '변속기':       { ru: 'Коробка передач',                 en: 'Gearbox' },
  '자동변속기':   { ru: 'АКПП',                            en: 'Automatic gearbox' },
  '수동변속기':   { ru: 'МКПП',                            en: 'Manual gearbox' },
  '동력전달':     { ru: 'Трансмиссия',                     en: 'Drivetrain' },
  '추진축':       { ru: 'Карданный вал',                   en: 'Driveshaft' },
  '추친축':       { ru: 'Карданный вал',                   en: 'Driveshaft' },
  '베어링':       { ru: 'Подшипники',                      en: 'Bearings' },
  '등속조인트':   { ru: 'ШРУС',                            en: 'CV joint' },
  '차동장치':     { ru: 'Дифференциал',                    en: 'Differential' },
  '조향장치':     { ru: 'Рулевое управление',              en: 'Steering system' },
  '조향핸들':     { ru: 'Рулевое колесо',                  en: 'Steering wheel' },
  '동력조향작동': { ru: 'Гидроусилитель руля',             en: 'Power steering' },
  '제동장치':     { ru: 'Тормозная система',               en: 'Brake system' },
  '브레이크마스터 실린더': { ru: 'Главный тормозной цилиндр', en: 'Brake master cylinder' },
  '연료장치':     { ru: 'Топливная система',               en: 'Fuel system' },
  '냉각장치':     { ru: 'Система охлаждения',              en: 'Cooling system' },
  '배기장치':     { ru: 'Выхлопная система',               en: 'Exhaust system' },
  '전기장치':     { ru: 'Электрооборудование',             en: 'Electrical system' },
};

const ITEM_STATUS_MAP: BiMap = {
  '미세누유': { ru: 'Незначительный подтёк масла',    en: 'Minor oil seep' },
  '누유':     { ru: 'Подтёк масла',                   en: 'Oil leak' },
  '심한누유': { ru: 'Сильный подтёк масла',           en: 'Heavy oil leak' },
  '미세누수': { ru: 'Незначительный подтёк ОЖ',       en: 'Minor coolant seep' },
  '누수':     { ru: 'Подтёк охлаждающей жидкости',    en: 'Coolant leak' },
  '심한누수': { ru: 'Сильный подтёк ОЖ',              en: 'Heavy coolant leak' },
  '불량':     { ru: 'Неисправность',                  en: 'Defective' },
  '소음':     { ru: 'Посторонний шум',                en: 'Noise' },
  '진동':     { ru: 'Вибрация',                       en: 'Vibration' },
  '작동불량': { ru: 'Нарушение работы',               en: 'Malfunction' },
};

// ─── Translation helpers ───────────────────────────────────────────────────────

function tr(map: BiMap, value: string, lang: Lang): string {
  const entry = map[value];
  if (!entry) return esc(value);
  return `${entry[lang]} (${esc(value)})`;
}

function translateBodyPart(korean: string, lang: Lang): string {
  let result = korean;
  const dirRight = lang === 'ru' ? ' (пр.)' : ' (R)';
  const dirLeft  = lang === 'ru' ? ' (лев.)' : ' (L)';
  result = result.replace(/\(우\)/g, dirRight).replace(/\(좌\)/g, dirLeft);

  for (const [ko, vals] of Object.entries(PART_MAP)) {
    if (result.includes(ko)) {
      result = result.replace(ko, vals[lang]);
      break;
    }
  }

  if (result !== korean) return `${result} (${esc(korean)})`;
  return esc(korean);
}

function translateDamage(korean: string, lang: Lang): string {
  return DAMAGE_MAP[korean]?.[lang] ?? esc(korean);
}

function translateItemTitle(korean: string, lang: Lang): string {
  if (ITEM_TITLE_MAP[korean]) {
    return `${ITEM_TITLE_MAP[korean][lang]} (${esc(korean)})`;
  }
  const parts = korean.split(/\s*\/\s*|\s+및\s+/).map(p => p.trim());
  const translated = parts.map(p => ITEM_TITLE_MAP[p]?.[lang] ?? p).join(' / ');
  if (translated !== korean) return `${translated} (${esc(korean)})`;
  return esc(korean);
}

function translateItemStatus(korean: string, lang: Lang): string {
  return ITEM_STATUS_MAP[korean]?.[lang] ?? esc(korean);
}

function translateGrade(grade: string): string {
  return grade
    .replace(/가솔린\+전기/g, 'Hybrid')
    .replace(/디젤\+전기/g, 'Hybrid')
    .replace(/가솔린/g, 'Gasoline')
    .replace(/디젤/g, 'Diesel')
    .replace(/전기/g, 'Electric')
    .replace(/하이브리드/g, 'Hybrid')
    .replace(/LPG/g, 'LPG');
}

// ─── Main formatter ────────────────────────────────────────────────────────────

export function formatEncarReport(data: EncarData, short = false, lang: Lang = 'ru'): string {
  const { vehicle: v, record: r, inspection: ins } = data;
  const s = t(lang);
  const lines: string[] = [];

  const mileageFmt = lang === 'ru'
    ? `${v.spec.mileage.toLocaleString()} км`
    : `${v.spec.mileage.toLocaleString()} km`;

  if (short) {
    const manufacturer = esc(v.category.manufacturerEnglishName || v.category.manufacturerName);
    const model        = esc(translateModelName(v.category.modelName));
    const plate        = esc(v.vehicleNo);
    const myAccidentCost = r ? r.myAccidentCost : 0;
    const insurancePart = myAccidentCost > 0
      ? s.shortInsuranceCost(myAccidentCost.toLocaleString('ru-RU'))
      : s.shortNoInsurance;

    lines.push(`<b>${manufacturer} ${model}</b> / ${plate} / ${insurancePart}`);
    lines.push('');
  } else {
    lines.push(
      `🚗 <b>${esc(v.category.manufacturerEnglishName || v.category.manufacturerName)} ${esc(MODEL_MAP[v.category.modelName] ?? v.category.modelName)}</b>`,
      `<i>${esc(translateGrade(v.category.gradeName))}</i>`,
      `<a href="https://www.encar.com/dc/dc_cardetailview.do?carid=${v.vehicleId}">https://www.encar.com/dc/dc_cardetailview.do?carid=${v.vehicleId}</a>`,
      '',
      s.reportMainData,
      `${s.reportPlate.padEnd(14)}<b>${esc(v.vehicleNo)}</b>`,
      `${s.reportVin.padEnd(14)}<b>${v.vin ? esc(v.vin) : '—'}</b>`,
      `${s.reportYear.padEnd(14)}<b>${esc(v.category.formYear)}</b>`,
      `${s.reportMileage.padEnd(14)}<b>${mileageFmt}</b>`,
      `${s.reportPrice.padEnd(14)}${price(v.advertisement.price)}`,
      `${s.reportTransmission.padEnd(14)}${tr(TRANSMISSION_MAP, v.spec.transmissionName, lang)}`,
      `${s.reportFuel.padEnd(14)}${tr(FUEL_MAP, v.spec.fuelName, lang)}`,
      `${s.reportEngine.padEnd(14)}${(v.spec.displacement / 1000).toFixed(1)}L`,
      `${s.reportColor.padEnd(14)}${tr(COLOR_MAP, v.spec.colorName, lang)}${v.spec.customColor ? ` — ${esc(v.spec.customColor)}` : ''}`,
      `${s.reportAddress.padEnd(14)}${esc(v.contact.address)}`,
      ...(v.contact.phone ? [`${s.reportPhone.padEnd(14)}${phone(v.contact.phone)}`] : []),
      '',
      s.reportInsuranceHistory,
    );

    if (!r) {
      lines.push(s.reportNoData);
    } else {
      const hasAccident = r.myAccidentCnt > 0 || r.otherAccidentCnt > 0;
      if (!hasAccident && r.robberCnt === 0 && r.totalLossCnt === 0 && r.floodTotalLossCnt === 0) {
        lines.push(s.reportCleanHistory);
      } else {
        if (r.myAccidentCnt > 0)
          lines.push(s.reportAccidentFault(r.myAccidentCnt, r.myAccidentCost.toLocaleString()));
        if (r.otherAccidentCnt > 0)
          lines.push(s.reportAccidentVictim(r.otherAccidentCnt, r.otherAccidentCost.toLocaleString()));
        if (r.totalLossCnt > 0)
          lines.push(s.reportTotalLoss(r.totalLossCnt));
        if (r.floodTotalLossCnt > 0)
          lines.push(s.reportFloodLoss(r.floodTotalLossCnt));
        if (r.robberCnt > 0)
          lines.push(s.reportTheft(r.robberCnt));
      }
      lines.push(`${s.reportFirstReg.padEnd(16)}${esc(r.firstDate)}`);
    }
    lines.push('');
  }

  if (!short) lines.push(s.reportInspection);

  if (!ins) {
    if (!short) lines.push(lang === 'ru' ? 'Данные недоступны' : 'Data unavailable');
  } else {
    if (ins.usageTypes.length > 0) {
      const usages = ins.usageTypes.map(u => tr(USAGE_MAP, u, lang)).join(', ');
      lines.push(`${s.reportUsageHistory.padEnd(17)}${usages}`);
    }

    if (ins.problematicItems.length === 0) {
      if (!short) lines.push(s.reportNodesOk);
    } else {
      lines.push(s.reportProblematicItems);
      for (const item of ins.problematicItems) {
        const title = translateItemTitle(item.title, lang);
        const status = translateItemStatus(item.statusTitle ?? '', lang);
        lines.push(`  ⚠️ ${title}: ${status}`);
      }
    }

    if (ins.outerDamages.length === 0) {
      if (!short) lines.push(s.reportBodyOk);
    } else {
      if (!short) lines.push(s.reportBodyDamages);
      for (const d of ins.outerDamages) {
        const statuses = d.statusTypes.map(st => translateDamage(st.title, lang)).join(', ');
        const icon = d.rankOne ? '🚨' : '⚠️';
        lines.push(`  ${icon} ${translateBodyPart(d.title, lang)}: ${statuses}`);
      }
    }
  }

  return lines.join('\n');
}
