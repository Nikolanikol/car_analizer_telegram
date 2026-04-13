export type Source = 'encar' | 'kbcha' | 'kkar';

export interface ParsedUrl {
  source: Source;
  id: string;
}

const PATTERNS: { source: Source; test: RegExp; extract: (u: URL) => string | null }[] = [
  {
    source: 'encar',
    // https://www.encar.com/dc/dc_cardetailview.do?carid=41550697
    // https://fem.encar.com/cars/detail/41694826?listAdvType=share
    test: /encar\.com/,
    extract: (u) => {
      // Вариант 1: ID в query param ?carid=
      const carid = u.searchParams.get('carid');
      if (carid) return carid;
      // Вариант 2: ID в пути /cars/detail/{id} или /detail/{id}
      const match = u.pathname.match(/\/detail\/(\d+)/);
      return match ? match[1] : null;
    },
  },
  {
    source: 'kbcha',
    // https://kbchachacha.com/public/car/detail.kbc?carSeq=12345678
    test: /kbchachacha\.com/,
    extract: (u) => u.searchParams.get('carSeq'),
  },
  {
    source: 'kkar',
    // https://www.kcar.com/bc/detail/carInfoDtl?i_sCarCd=EC61332278
    test: /kcar\.com/,
    extract: (u) => u.searchParams.get('i_sCarCd'),
  },
];

export function parseCarUrl(rawUrl: string): ParsedUrl {
  let u: URL;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    throw new Error('Некорректная ссылка');
  }

  for (const pattern of PATTERNS) {
    if (pattern.test.test(u.hostname)) {
      const id = pattern.extract(u);
      if (!id) throw new Error(`Не удалось извлечь ID из ссылки ${pattern.source}`);
      return { source: pattern.source, id };
    }
  }

  throw new Error('Источник не поддерживается. Принимаю ссылки с encar.com, kbchachacha.com, kkar.com');
}
