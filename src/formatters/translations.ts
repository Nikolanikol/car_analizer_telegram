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
  // BMW
  '5시리즈': '5 Series', '3시리즈': '3 Series', '7시리즈': '7 Series',
  '1시리즈': '1 Series', '2시리즈': '2 Series', '4시리즈': '4 Series',
  '6시리즈': '6 Series', '8시리즈': '8 Series',
  'X1': 'X1', 'X2': 'X2', 'X3': 'X3', 'X4': 'X4',
  'X5': 'X5', 'X6': 'X6', 'X7': 'X7',
  // Mercedes
  'C클래스': 'C-Class', 'E클래스': 'E-Class', 'S클래스': 'S-Class',
  'A클래스': 'A-Class', 'B클래스': 'B-Class', 'G클래스': 'G-Class',
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
};

// Корейские префиксы/суффиксы в названиях моделей
const KOREAN_MODIFIERS: [RegExp, string][] = [
  [/올\s*뉴\s*/gi, ''],      // 올뉴 = All New → убираем
  [/더\s*뉴\s*/gi, ''],      // 더뉴 = The New → убираем
  [/뉴\s*/gi, ''],            // 뉴 = New → убираем
  [/더\s*넥스트\s*/gi, ''],
  [/\s*\d+세대/gi, ''],      // 2세대, 3세대 = поколение → убираем
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

  // Заменяем корейские модели
  for (const [ko, en] of Object.entries(MODEL_MAP)) {
    result = result.replace(new RegExp(ko, 'g'), en);
  }

  return result.replace(/\s+/g, ' ').trim();
}
