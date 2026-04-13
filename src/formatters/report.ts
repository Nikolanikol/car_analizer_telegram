import { EncarData } from '../scrapers/encar';
import { MODEL_MAP, translateModelName } from './translations';

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function phone(num: string): string {
  return num ? esc(num) : '—';
}

function yn(val: boolean, dangerOnTrue = true): string {
  if (val) return dangerOnTrue ? '⚠️ Да' : '✅ Да';
  return dangerOnTrue ? '✅ Нет' : '—';
}

function price(val: number): string {
  const krw = val * 10000;
  const formatted = krw.toLocaleString('ru-RU');
  return `<b>${formatted} ₩</b>`;
}

// ─── Словари переводов ────────────────────────────────────────────────────────


const FUEL_MAP: Record<string, string> = {
  '가솔린': 'Бензин',
  '디젤': 'Дизель',
  'LPG': 'ГАЗ',
  '전기': 'Электро',
  '하이브리드': 'Гибрид',
  '가솔린+전기': 'Гибрид (Бензин+Электро)',
  '디젤+전기': 'Гибрид (Дизель+Электро)',
};

const TRANSMISSION_MAP: Record<string, string> = {
  '오토': 'Автомат',
  '수동': 'Механика',
  'CVT': 'Вариатор',
  '듀얼클러치': 'Робот (DCT)',
  'DCT': 'Робот (DCT)',
};

const BODY_MAP: Record<string, string> = {
  'SUV': 'Внедорожник',
  'RV': 'Внедорожник',
  '세단': 'Седан',
  '해치백': 'Хэтчбек',
  '쿠페': 'Купе',
  '밴': 'Фургон',
  '트럭': 'Грузовик',
  '승합': 'Минивэн',
  '픽업트럭': 'Пикап',
  '왜건': 'Универсал',
  '컨버터블': 'Кабриолет',
  '경차': 'Мини (A-класс)',
  '소형차': 'Малый класс (B)',
  '준중형차': 'Компакт (C-класс)',
  '중형차': 'Средний класс (D)',
  '대형차': 'Большой класс (E)',
  '스포츠카': 'Спорткар',
  '미니밴': 'Минивэн',
};

const COLOR_MAP: Record<string, string> = {
  // Белый
  '흰색': 'Белый', '화이트': 'Белый', '크림': 'Кремовый',
  // Чёрный
  '검정': 'Чёрный', '검은색': 'Чёрный', '검정색': 'Чёрный', '블랙': 'Чёрный',
  // Серебристый / серый
  '은색': 'Серебристый', '실버': 'Серебристый', '은회색': 'Серебристо-серый',
  '회색': 'Серый', '그레이': 'Серый', '쥐색': 'Графитовый',
  '진회색': 'Тёмно-серый', '다크그레이': 'Тёмно-серый', '건메탈': 'Тёмно-серый (Gunmetal)',
  // Красный
  '빨간색': 'Красный', '빨강': 'Красный', '레드': 'Красный',
  '와인': 'Бордовый', '버건디': 'Бордовый', '다크레드': 'Тёмно-красный',
  // Синий
  '파란색': 'Синий', '파랑': 'Синий', '블루': 'Синий',
  '남색': 'Тёмно-синий', '네이비': 'Тёмно-синий', '하늘색': 'Голубой',
  '청색': 'Синий', '딥블루': 'Тёмно-синий',
  // Зелёный
  '초록': 'Зелёный', '그린': 'Зелёный', '초록색': 'Зелёный',
  '연두색': 'Салатовый', '카키': 'Хаки', '올리브': 'Оливковый',
  '민트': 'Мятный',
  // Жёлтый / оранжевый
  '노란색': 'Жёлтый', '노랑': 'Жёлтый', '옐로우': 'Жёлтый',
  '주황': 'Оранжевый', '오렌지': 'Оранжевый',
  // Коричневый / бежевый
  '갈색': 'Коричневый', '브라운': 'Коричневый', '카키브라운': 'Коричнево-хаки',
  '베이지': 'Бежевый', '샴페인': 'Шампань', '카멜': 'Верблюжий',
  // Фиолетовый / розовый
  '보라': 'Фиолетовый', '퍼플': 'Фиолетовый',
  '분홍': 'Розовый', '핑크': 'Розовый',
  // Перламутровый / золотой
  '진주색': 'Перламутровый', '펄': 'Перламутровый', '진주': 'Перламутровый',
  '골드': 'Золотой', '금색': 'Золотой',
};

const USAGE_MAP: Record<string, string> = {
  '렌트': 'Прокат/Аренда',
  '택시': 'Такси',
  '회사': 'Корпоративный',
  '관용': 'Служебный',
};

const PART_MAP: Record<string, string> = {
  // Двери
  '프론트 도어': 'Передняя дверь',
  '리어 도어': 'Задняя дверь',
  '도어': 'Дверь',
  // Крылья
  '프론트 휀더': 'Переднее крыло',
  '프론트 펜더': 'Переднее крыло',
  '휀더': 'Крыло',
  '펜더': 'Крыло',
  '쿼터 패널': 'Заднее крыло',
  '리어 휀더': 'Заднее крыло',
  // Капот / багажник / крыша
  '후드': 'Капот',
  '트렁크 리드': 'Крышка багажника',
  '트렁크': 'Багажник',
  '루프 패널': 'Крыша',
  '루프': 'Крыша',
  '썬루프': 'Люк',
  // Пороги и панели
  '사이드 실 패널': 'Порог',
  '사이드실': 'Порог',
  '프런트 패널': 'Передняя панель',
  '프론트 패널': 'Передняя панель',
  '리어 패널': 'Задняя панель',
  '인사이드 패널': 'Внутренняя панель',
  '대쉬패널': 'Щит приборов',
  '플로어패널': 'Напольная панель',
  '플로어': 'Пол кузова',
  // Стойки
  '필러패널A': 'Стойка A',
  '필러패널B': 'Стойка B',
  '필러패널C': 'Стойка C',
  '필러 패널(A)': 'Стойка A',
  '필러 패널(B)': 'Стойка B',
  '필러 패널(C)': 'Стойка C',
  'A필러': 'Стойка A',
  'B필러': 'Стойка B',
  'C필러': 'Стойка C',
  // Силовые элементы
  '크로스 멤버': 'Поперечина',
  '라디에이터 서포트': 'Рамка радиатора',
  '라디에이터서포트': 'Рамка радиатора',
  '프론트 사이드 멤버': 'Передний лонжерон',
  '리어 사이드 멤버': 'Задний лонжерон',
  '사이드 멤버': 'Лонжерон',
  '프론트 휠하우스': 'Передняя арка',
  '리어 휠하우스': 'Задняя арка',
  '휠하우스': 'Арка колеса',
  '트렁크 플로어': 'Пол багажника',
  '패키지 트레이': 'Полка багажника',
  // Пояснение к болтовому крепежу
  '볼트체결부품': 'болтовое соединение',
};

const DAMAGE_MAP: Record<string, string> = {
  '교환(교체)': 'Замена',
  '교환': 'Замена',
  '교체': 'Замена',
  '판금/용접': 'Рихтовка/сварка',
  '판금': 'Рихтовка',
  '용접': 'Сварка',
  '부식': 'Коррозия',
  '흠집': 'Царапина',
  '요철': 'Деформация',
  '도장': 'Покраска',
  '손상': 'Повреждение',
};

/** Названия узлов и агрегатов */
const ITEM_TITLE_MAP: Record<string, string> = {
  // Двигатель
  '원동기': 'Двигатель',
  '실린더 블록': 'Блок цилиндров',
  '실린더블록': 'Блок цилиндров',
  '오일팬': 'Поддон картера',
  '실린더 헤드': 'Головка блока',
  '실린더헤드': 'Головка блока',
  '로커암커버': 'Крышка клапанов',
  '오일필터': 'Масляный фильтр',
  '인젝터': 'Форсунки',
  '타이밍벨트': 'Ремень ГРМ',
  // Трансмиссия
  '변속기': 'Коробка передач',
  '자동변속기': 'АКПП',
  '수동변속기': 'МКПП',
  '동력전달': 'Трансмиссия',
  '추진축': 'Карданный вал',
  '추친축': 'Карданный вал',
  '베어링': 'Подшипники',
  '등속조인트': 'ШРУС',
  '차동장치': 'Дифференциал',
  // Рулевое
  '조향장치': 'Рулевое управление',
  '조향핸들': 'Рулевое колесо',
  '동력조향작동': 'Гидроусилитель руля',
  // Тормоза
  '제동장치': 'Тормозная система',
  '브레이크마스터 실린더': 'Главный тормозной цилиндр',
  // Прочее
  '연료장치': 'Топливная система',
  '냉각장치': 'Система охлаждения',
  '배기장치': 'Выхлопная система',
  '전기장치': 'Электрооборудование',
};

/** Статусы/состояния узлов */
const ITEM_STATUS_MAP: Record<string, string> = {
  '미세누유': 'Незначительный подтёк масла',
  '누유': 'Подтёк масла',
  '심한누유': 'Сильный подтёк масла',
  '미세누수': 'Незначительный подтёк ОЖ',
  '누수': 'Подтёк охлаждающей жидкости',
  '심한누수': 'Сильный подтёк ОЖ',
  '불량': 'Неисправность',
  '소음': 'Посторонний шум',
  '진동': 'Вибрация',
  '작동불량': 'Нарушение работы',
};

// ─── Вспомогательные функции перевода ─────────────────────────────────────────

/** Перевод по словарю. Если перевод найден — "Русский (한국어)", иначе оригинал */
function tr(map: Record<string, string>, value: string): string {
  const translated = map[value];
  if (!translated) return esc(value);
  return `${translated} (${esc(value)})`;
}

/** Перевод без сохранения оригинала (для мест, где скобки неуместны) */
function trOnly(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

/** Перевод названия кузовной панели с учётом направления (우/좌) */
function translateBodyPart(korean: string): string {
  let result = korean;

  // Перевод направления (добавляем пробел перед скобкой)
  result = result.replace(/\(우\)/g, ' (пр.)').replace(/\(좌\)/g, ' (лев.)');

  // Перевод названия детали
  for (const [ko, ru] of Object.entries(PART_MAP)) {
    if (result.includes(ko)) {
      result = result.replace(ko, ru);
      break;
    }
  }

  // Если перевод изменился — показываем "Рус. (кор.)"
  if (result !== korean) {
    return `${result} (${esc(korean)})`;
  }
  return esc(korean);
}

/** Перевод типа повреждения */
function translateDamage(korean: string): string {
  return DAMAGE_MAP[korean] ?? esc(korean);
}

/** Перевод названия узла. Поддерживает разделители "/" и "및" (и) */
function translateItemTitle(korean: string): string {
  // Сначала пробуем найти полную фразу целиком
  if (ITEM_TITLE_MAP[korean]) {
    return `${ITEM_TITLE_MAP[korean]} (${esc(korean)})`;
  }
  // Иначе разбиваем по разделителям " / " и " 및 " и переводим каждую часть
  const parts = korean.split(/\s*\/\s*|\s+및\s+/).map(p => p.trim());
  const translated = parts.map(p => ITEM_TITLE_MAP[p] ?? p).join(' / ');
  if (translated !== korean) return `${translated} (${esc(korean)})`;
  return esc(korean);
}

/** Перевод статуса узла */
function translateItemStatus(korean: string): string {
  return ITEM_STATUS_MAP[korean] ?? esc(korean);
}

/** Перевод ключевых корейских слов в строке комплектации (градации) */
function translateGrade(grade: string): string {
  return grade
    .replace(/가솔린\+전기/g, 'Гибрид')
    .replace(/디젤\+전기/g, 'Гибрид')
    .replace(/가솔린/g, 'Бензин')
    .replace(/디젤/g, 'Дизель')
    .replace(/전기/g, 'Электро')
    .replace(/하이브리드/g, 'Гибрид')
    .replace(/LPG/g, 'ГАЗ');
}

// ─── Основная функция форматирования ──────────────────────────────────────────

export function formatEncarReport(data: EncarData, short = false): string {
  const { vehicle: v, record: r, inspection: ins } = data;

  const lines: string[] = [];

  if (short) {
    // ── Короткое сообщение: одна строка + техосмотр ──────────────────────────
    const manufacturer = esc(v.category.manufacturerEnglishName || v.category.manufacturerName);
    const model        = esc(translateModelName(v.category.modelName));
    const plate        = esc(v.vehicleNo);
    const myAccidentCost = r ? r.myAccidentCost : 0;
    const insurancePart = myAccidentCost > 0
      ? `страховых на ${myAccidentCost.toLocaleString('ru-RU')}₩`
      : '✅ страховых нет';

    lines.push(`<b>${manufacturer} ${model}</b> / ${plate} / ${insurancePart}`);
    lines.push('');
  } else {
    // ── Полное сообщение: заголовок + основные данные + страховая история ────
    lines.push(
      `🚗 <b>${esc(v.category.manufacturerEnglishName || v.category.manufacturerName)} ${esc(MODEL_MAP[v.category.modelName] ?? v.category.modelName)}</b>`,
      `<i>${esc(translateGrade(v.category.gradeName))}</i>`,
      `<a href="https://www.encar.com/dc/dc_cardetailview.do?carid=${v.vehicleId}">https://www.encar.com/dc/dc_cardetailview.do?carid=${v.vehicleId}</a>`,
      '',
      '📋 <b>Основные данные</b>',
      `Номер авто:   <b>${esc(v.vehicleNo)}</b>`,
      `VIN:          <b>${v.vin ? esc(v.vin) : '—'}</b>`,
      `Год выпуска:  <b>${esc(v.category.formYear)}</b>`,
      `Пробег:       <b>${v.spec.mileage.toLocaleString()} км</b>`,
      `Цена:         ${price(v.advertisement.price)}`,
      `КПП:          ${tr(TRANSMISSION_MAP, v.spec.transmissionName)}`,
      `Топливо:      ${tr(FUEL_MAP, v.spec.fuelName)}`,
      `Двигатель:    ${(v.spec.displacement / 1000).toFixed(1)}л`,
      `Цвет:         ${tr(COLOR_MAP, v.spec.colorName)}${v.spec.customColor ? ` — ${esc(v.spec.customColor)}` : ''}`,
      `Адрес:        ${esc(v.contact.address)}`,
      ...(v.contact.phone ? [`Тел.:         ${phone(v.contact.phone)}`] : []),
      '',
      '🔍 <b>Страховая история</b>',
    );

    if (!r) {
      lines.push('⚠️ Данные недоступны');
    } else {
      const hasAccident = r.myAccidentCnt > 0 || r.otherAccidentCnt > 0;
      if (!hasAccident && r.robberCnt === 0 && r.totalLossCnt === 0 && r.floodTotalLossCnt === 0) {
        lines.push('✅ Чистая история');
      } else {
        if (r.myAccidentCnt > 0)
          lines.push(`⚠️ Аварий (виновник): ${r.myAccidentCnt} — ${r.myAccidentCost.toLocaleString()}₩`);
        if (r.otherAccidentCnt > 0)
          lines.push(`⚠️ Аварий (пострадавший): ${r.otherAccidentCnt} — ${r.otherAccidentCost.toLocaleString()}₩`);
        if (r.totalLossCnt > 0)
          lines.push(`🚨 Тотальные потери: ${r.totalLossCnt}`);
        if (r.floodTotalLossCnt > 0)
          lines.push(`🚨 Потоп (тотал): ${r.floodTotalLossCnt}`);
        if (r.robberCnt > 0)
          lines.push(`🚨 Угон: ${r.robberCnt}`);
      }
      lines.push(`Первая рег.:    ${esc(r.firstDate)}`);
    }
    lines.push('');
  }

  // ── Техосмотр ─────────────────────────────────────────────────────────────
  if (!short) lines.push('🔧 <b>Техническая инспекция</b>');

  if (!ins) {
    if (!short) lines.push('Данные недоступны');
  } else {
    if (ins.usageTypes.length > 0) {
      const usages = ins.usageTypes.map(u => tr(USAGE_MAP, u)).join(', ');
      lines.push(`История исп.:    ${usages}`);
    }

    if (ins.problematicItems.length === 0) {
      if (!short) lines.push('Узлы:            ✅ Всё в норме');
    } else {
      lines.push(short ? 'Проблемные узлы:' : 'Проблемные узлы:');
      for (const item of ins.problematicItems) {
        const title = translateItemTitle(item.title);
        const status = translateItemStatus(item.statusTitle ?? '');
        lines.push(`  ⚠️ ${title}: ${status}`);
      }
    }

    if (ins.outerDamages.length === 0) {
      if (!short) lines.push('Кузов (панели):  ✅ Без повреждений');
    } else {
      if (!short) lines.push('Кузовные повреждения:');
      for (const d of ins.outerDamages) {
        const statuses = d.statusTypes.map(s => translateDamage(s.title)).join(', ');
        const icon = d.rankOne ? '🚨' : '⚠️';
        lines.push(`  ${icon} ${translateBodyPart(d.title)}: ${statuses}`);
      }
    }
  }

  return lines.join('\n');
}
