export const MODEL_MAP: Record<string, string> = {
  // Kia
  '쏘렌토': 'Sorento', '스포티지': 'Sportage', '카니발': 'Carnival',
  '셀토스': 'Seltos', '니로': 'Niro', '스팅어': 'Stinger',
  '레이': 'Ray', '모닝': 'Morning', 'K3': 'K3', 'K5': 'K5',
  'K8': 'K8', 'K9': 'K9', 'EV6': 'EV6', 'EV9': 'EV9', '봉고': 'Bongo',
  // Hyundai
  '아반떼': 'Avante', '쏘나타': 'Sonata', '그랜저': 'Grandeur',
  '투싼': 'Tucson', '싼타페': 'Santa Fe', '팰리세이드': 'Palisade',
  '코나': 'Kona', '넥쏘': 'Nexo', '아이오닉': 'Ioniq',
  '아이오닉5': 'Ioniq 5', '아이오닉6': 'Ioniq 6',
  '스타렉스': 'Starex', '포터': 'Porter', '베뉴': 'Venue',
  // Genesis
  'G70': 'G70', 'G80': 'G80', 'G90': 'G90',
  'GV70': 'GV70', 'GV80': 'GV80', 'GV90': 'GV90',
  // KG Mobility (SsangYong)
  '토레스': 'Torres', '렉스턴': 'Rexton', '코란도': 'Korando',
  '티볼리': 'Tivoli', '액티언': 'Actyon',
  // Renault Korea
  'QM6': 'QM6', 'SM6': 'SM6', 'XM3': 'XM3', '조에': 'Zoe',
  // Chevrolet / GM Korea
  '트레일블레이저': 'Trailblazer', '트랙스': 'Trax',
  '말리부': 'Malibu', '스파크': 'Spark', '이쿼녹스': 'Equinox',
  // Volkswagen
  '티구안': 'Tiguan', '골프': 'Golf', '파사트': 'Passat',
  '폴로': 'Polo', '아테온': 'Arteon', '투아렉': 'Touareg',
  '티록': 'T-Roc', '티크로스': 'T-Cross', '샤란': 'Sharan',
  // BMW
  '5시리즈': '5 Series', '3시리즈': '3 Series', '7시리즈': '7 Series',
  '1시리즈': '1 Series', '2시리즈': '2 Series', '4시리즈': '4 Series',
  '6시리즈': '6 Series', '8시리즈': '8 Series',
  'X1': 'X1', 'X2': 'X2', 'X3': 'X3', 'X4': 'X4',
  'X5': 'X5', 'X6': 'X6', 'X7': 'X7',
  // Mercedes (с дефисом и без — оба варианта встречаются на Encar)
  'C-클래스': 'C-Class', 'C클래스': 'C-Class',
  'E-클래스': 'E-Class', 'E클래스': 'E-Class',
  'S-클래스': 'S-Class', 'S클래스': 'S-Class',
  'A-클래스': 'A-Class', 'A클래스': 'A-Class',
  'B-클래스': 'B-Class', 'B클래스': 'B-Class',
  'G-클래스': 'G-Class', 'G클래스': 'G-Class',
  'CLA-클래스': 'CLA-Class', 'CLA클래스': 'CLA-Class',
  'CLS-클래스': 'CLS-Class', 'CLS클래스': 'CLS-Class',
  'GLA-클래스': 'GLA-Class', 'GLA클래스': 'GLA-Class',
  'GLB-클래스': 'GLB-Class', 'GLB클래스': 'GLB-Class',
  'GLC-클래스': 'GLC-Class', 'GLC클래스': 'GLC-Class',
  'GLE-클래스': 'GLE-Class', 'GLE클래스': 'GLE-Class',
  'GLS-클래스': 'GLS-Class', 'GLS클래스': 'GLS-Class',
  // Audi
  'A3': 'A3', 'A4': 'A4', 'A5': 'A5', 'A6': 'A6', 'A7': 'A7', 'A8': 'A8',
  'Q3': 'Q3', 'Q5': 'Q5', 'Q7': 'Q7', 'Q8': 'Q8',
  // Land Rover / Jaguar
  '레인지로버 이보크': 'Range Rover Evoque',
  '레인지로버 벨라': 'Range Rover Velar',
  '레인지로버 스포츠': 'Range Rover Sport',
  '레인지로버': 'Range Rover',
  '디스커버리 스포츠': 'Discovery Sport',
  '디스커버리': 'Discovery',
  'F-페이스': 'F-Pace', 'E-페이스': 'E-Pace', 'I-페이스': 'I-Pace',
  'XE': 'XE', 'XF': 'XF', 'XJ': 'XJ',
  // Volvo
  'XC40': 'XC40', 'XC60': 'XC60', 'XC90': 'XC90',
  'S60': 'S60', 'S90': 'S90', 'V60': 'V60', 'V90': 'V90',
  // Porsche
  '카이엔': 'Cayenne', '마칸': 'Macan', '파나메라': 'Panamera',
  '타이칸': 'Taycan', '카이맨': 'Cayman', '박스터': 'Boxster',
  // Toyota / Lexus
  '캠리': 'Camry', '코롤라': 'Corolla', '아발론': 'Avalon',
  '프리우스': 'Prius', '라브4': 'RAV4', '하이랜더': 'Highlander',
  'ES': 'ES', 'IS': 'IS', 'GS': 'GS', 'LS': 'LS',
  'NX': 'NX', 'RX': 'RX', 'GX': 'GX', 'LX': 'LX',
  // Honda / Nissan
  '어코드': 'Accord', '시빅': 'Civic', 'CR-V': 'CR-V', 'HR-V': 'HR-V',
  '알티마': 'Altima', '맥시마': 'Maxima', '무라노': 'Murano', '로그': 'Rogue',
  // Citroen / DS
  '그랜드 C4 스페이스투어러': 'Grand C4 Spacetourer',
  'C4 스페이스투어러': 'C4 Spacetourer',
  'C3': 'C3', 'C4': 'C4', 'C5': 'C5',
  // Common Korean word parts in model names
  '그랜드': 'Grand', '스페이스투어러': 'Spacetourer',
};

export const MANUFACTURER_MAP: Record<string, string> = {
  '기아': 'Kia', '현대': 'Hyundai', '제네시스': 'Genesis',
  'KG모빌리티': 'KG Mobility', '쌍용': 'SsangYong',
  '르노코리아': 'Renault Korea', '르노삼성': 'Renault Korea',
  '한국GM': 'Chevrolet', '쉐보레': 'Chevrolet',
  'BMW': 'BMW', '벤츠': 'Mercedes-Benz', '메르세데스-벤츠': 'Mercedes-Benz',
  '아우디': 'Audi', '폭스바겐': 'Volkswagen', '포르쉐': 'Porsche',
  '볼보': 'Volvo', '랜드로버': 'Land Rover', '재규어': 'Jaguar',
  '토요타': 'Toyota', '렉서스': 'Lexus', '혼다': 'Honda',
  '닛산': 'Nissan', '인피니티': 'Infiniti', '미쓰비시': 'Mitsubishi',
  '시트로엥': 'Citroen', 'DS': 'DS', '푸조': 'Peugeot',
  '피아트': 'Fiat', '알파로메오': 'Alfa Romeo', '마세라티': 'Maserati',
  '페라리': 'Ferrari', '람보르기니': 'Lamborghini',
  '폴스타': 'Polestar', '테슬라': 'Tesla',
  '지프': 'Jeep', '크라이슬러': 'Chrysler', '포드': 'Ford',
  '링컨': 'Lincoln',
};

// Нормализация английских названий производителей из Encar API
export const MANUFACTURER_EN_NORMALIZE: Record<string, string> = {
  'ChevroletGMDaewoo': 'Chevrolet',
  'GMDaewoo': 'Chevrolet',
  'GM Daewoo': 'Chevrolet',
  'KGMobility': 'KG Mobility',
  'SsangYong': 'KG Mobility',
  'Citroen-DS': 'Citroen',
  'CitroenDS': 'Citroen',
};

export function normalizeManufacturer(name: string): string {
  return MANUFACTURER_EN_NORMALIZE[name] ?? name;
}

// ─── Grade translation (shared across all platforms) ─────────────────────────

const GRADE_WORD_MAP: [RegExp, string][] = [
  // Fuel (порядок важен — составные раньше одиночных)
  [/가솔린\+전기/g, 'Hybrid'], [/디젤\+전기/g, 'Hybrid'],
  [/가솔린/g, 'Gasoline'], [/디젤/g, 'Diesel'],
  [/전기/g, 'Electric'], [/하이브리드/g, 'Hybrid'],
  // Compound Korean words containing 뉴 — must be before 뉴 → New
  [/매뉴팩처/g, 'Manufaktur'],
  [/매뉴얼/g, 'Manual'],
  // Generation / prefix
  [/올\s*뉴/gi, 'All New'], [/더\s*뉴/gi, 'The New'],
  // 뉴 only when not inside a Korean word
  [/(?<![가-힣])뉴(?![가-힣])/g, 'New'],
  // Trim levels — universal
  [/터보/g, 'Turbo'], [/모던/g, 'Modern'], [/샤인팩/g, 'Shine Pack'],
  [/샤인/g, 'Shine'], [/프레스티지/g, 'Prestige'], [/프리미엄/g, 'Premium'],
  [/익스클루시브/g, 'Exclusive'], [/노블레스/g, 'Noblesse'],
  [/시그니처/g, 'Signature'], [/인스퍼레이션/g, 'Inspiration'],
  [/럭셔리/g, 'Luxury'], [/익스프레션/g, 'Expression'],
  [/스마트/g, 'Smart'], [/트렌디/g, 'Trendy'],
  [/어드밴스드/g, 'Advanced'], [/컴포트/g, 'Comfort'],
  [/마스터/g, 'Master'], [/엘리트/g, 'Elite'],
  // Drive type
  [/사륜구동/g, 'AWD'], [/전륜구동/g, 'FWD'], [/후륜구동/g, 'RWD'],
  // Land Rover / Jaguar
  [/다이나믹/g, 'Dynamic'],
  [/오토바이오그래피/g, 'Autobiography'],
  [/퍼스트\s*에디션/g, 'First Edition'],
  [/블랙\s*에디션/g, 'Black Edition'],
  // BMW (M 스포츠 до общего 스포츠)
  [/M\s*스포츠/g, 'M Sport'],
  [/컴페티션/g, 'Competition'],
  [/카본\s*에디션/g, 'Carbon Edition'],
  // Audi
  [/스포츠백/g, 'Sportback'],
  [/올로드/g, 'Allroad'],
  // General
  [/스포츠/g, 'Sport'],
];

/** Переводит корейский грейд через словарь (fallback когда нет английского поля) */
export function translateGradeText(grade: string): string {
  let result = grade;
  for (const [pattern, replacement] of GRADE_WORD_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Корейские префиксы/суффиксы в названиях моделей
const KOREAN_MODIFIERS: [RegExp, string][] = [
  [/올\s*뉴\s*/gi, 'All New '],     // 올뉴 = All New
  [/더\s*뉴\s*/gi, 'The New '],     // 더뉴 = The New
  [/더\s*넥스트\s*/gi, 'Next '],
  [/뉴\s*/gi, 'New '],              // 뉴 = New
  [/\s*\d+세대/gi, ''],             // 2세대, 3세대 = поколение → убираем
];

/** Переводит/очищает название авто от корейских модификаторов и марок */
export function translateModelName(raw: string): string {
  let result = raw;

  // Заменяем корейские производители
  for (const [ko, en] of Object.entries(MANUFACTURER_MAP)) {
    result = result.replace(new RegExp(ko, 'g'), en);
  }

  // Убираем корейские префиксы типа "올뉴", "더뉴"
  for (const [pattern, replacement] of KOREAN_MODIFIERS) {
    result = result.replace(pattern, replacement);
  }

  // Заменяем корейские модели — сортируем по длине (длинные первыми),
  // чтобы короткие ключи не совпадали внутри длинных слов (напр. 레이 в 트레일블레이저)
  const sortedModelEntries = Object.entries(MODEL_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [ko, en] of sortedModelEntries) {
    result = result.replace(new RegExp(ko, 'g'), en);
  }

  return result.replace(/\s+/g, ' ').trim();
}
