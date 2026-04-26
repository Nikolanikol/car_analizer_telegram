import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KkarData {
  carCd: string;
  vehicleNo: string;
  vin: string;
  manufacturerName: string;
  modelName: string;
  gradeName: string;
  year: number;
  mileage: number;
  displacement: number;
  fuelType: string;
  transmission: string;
  color: string;
  bodyType: string;
  driveType: string;
  price: number;
  address: string;
  mainPhoto: string | null;
  // История
  firstRegDate: string;
  ownerChangeCnt: number;
  myAccidentCnt: number;
  myAccidentCost: number;
  otherAccidentCnt: number;
  otherAccidentCost: number;
  totalLossCnt: number;
  floodCnt: number;
  theftCnt: number;
  rentHistory: boolean;
  bizuseHistory: boolean;
  // Продавец
  sellerName: string;
  sellerPhone: string;
  centerName: string;
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

const API_URL = 'https://api.kcar.com/bc/car-info-detail-of-ng';

export async function fetchKkarData(carCd: string): Promise<KkarData> {
  const url = `${API_URL}?i_sCarCd=${carCd}&i_sPassYn=N&bltbdKnd=CM050`;
  log(C.cyan, 'kkar', `GET ${url}`);

  const { data: body } = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.kcar.com/',
    },
  });

  if (!body.success) {
    throw new Error(`kkar API вернул ошибку: ${body.message ?? body.returnCode}`);
  }

  if (!body.data?.rvo) throw new Error('Не удалось получить данные с Kcar. Попробуй позже');

  const r = body.data.rvo;
  const h = body.data.carhistory ?? {};

  log(C.green, 'kkar', `OK — ${r.mnuftrNm} ${r.modelNm} ${r.regModelyr}`);

  return {
    carCd:            r.carCd,
    vehicleNo:        r.cno ?? '',
    vin:              r.vin ?? '',
    manufacturerName: r.mnuftrNm ?? '',
    modelName:        r.modelNm ?? '',
    gradeName:        r.grdFullNm ?? '',
    year:             r.regModelyr ?? 0,
    mileage:          r.milg ?? 0,
    displacement:     r.engdispmnt ?? 0,
    fuelType:         r.fuelTypecdNm ?? '',
    transmission:     r.trnsmsncdNm ?? '',
    color:            r.extrColorNm ?? '',
    bodyType:         r.carctgr ?? '',
    driveType:        r.drvgYnNm ?? '',
    price:            (r.salprc ?? 0) * 10000,
    address:          r.fullAddr ?? r.addr ?? '',
    mainPhoto:        r.elanPath ?? null,
    // История
    firstRegDate:     h.fstInsrSigdy ?? h.fstRegDt ?? '',
    ownerChangeCnt:   h.ownrChngCnt ?? 0,
    myAccidentCnt:    Number(h.owncarDmgeAcdtCnt ?? 0),
    myAccidentCost:   Number(h.owncarDmgeInsrAmtSum ?? 0),
    otherAccidentCnt: Number(h.othrcarWrdgAcdtCnt ?? 0),
    otherAccidentCost:Number(h.othrcarWrdgInsrAmtSum ?? 0),
    totalLossCnt:     Number(h.gnrlTtlsAcdtCnt ?? 0),
    floodCnt:         Number(h.fldgAcdtCnt ?? 0),
    theftCnt:         Number(h.rbrTtlsAcdtCnt ?? 0),
    rentHistory:      h.rentHistYn === 'Y',
    bizuseHistory:    h.bizuseHistYn === 'Y',
    // Продавец
    sellerName:       r.usrNm ?? r.selerNm ?? '',
    sellerPhone:      r.selerSafeMbpno ?? r.mpno ?? r.tno ?? '',
    centerName:       r.userCenterName ?? r.cntrNm ?? '',
  };
}
