import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EncarVehicle {
  vehicleId: number;
  vehicleNo: string;
  vin: string;
  category: {
    manufacturerName: string;
    manufacturerEnglishName: string;
    modelName: string;
    gradeName: string;
    gradeEnglishName: string;
    yearMonth: string;
    formYear: string;
  };
  spec: {
    mileage: number;
    displacement: number;
    transmissionName: string;
    fuelName: string;
    colorName: string;
    customColor: string | null;
    bodyName: string;
  };
  advertisement: {
    price: number;
    status: string;
  };
  contact: {
    address: string;
    phone: string;
  };
  condition: {
    accident: {
      recordView: boolean;
      resumeView: boolean;
    };
  };
}

export interface EncarRecord {
  carNo: string;
  year: string;
  maker: string;
  model: string;
  fuel: string;
  firstDate: string;
  myAccidentCnt: number;
  otherAccidentCnt: number;
  myAccidentCost: number;
  otherAccidentCost: number;
  ownerChangeCnt: number;
  ownerChanges: { date: string; carNo: string }[];
  robberCnt: number;
  totalLossCnt: number;
  floodTotalLossCnt: number;
  loan: number;
  carInfoChanges: { date: string; carNo: string }[];
  accidents: unknown[];
}

export interface InspectionItem {
  code: string;
  title: string;
  statusCode: string | null;
  statusTitle: string | null;
}

export interface OuterDamage {
  code: string;
  title: string;                              // название панели (корейское)
  statusTypes: { code: string; title: string }[]; // типы повреждений (может быть несколько)
  rankOne: boolean;                           // RANK_ONE = серьёзное повреждение
}

export interface EncarInspection {
  accident: boolean;
  waterlog: boolean;
  usageTypes: string[];
  boardState: string;
  mileage: number;
  issueDate: string;
  comments: string;
  problematicItems: InspectionItem[];
  outerDamages: OuterDamage[];
}

export interface EncarData {
  vehicle: EncarVehicle;
  record: EncarRecord | null;
  inspection: EncarInspection | null;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

const BASE = 'https://api.encar.com/v1/readside';

export async function fetchVehicle(id: string): Promise<EncarVehicle> {
  const { data } = await axios.get(`${BASE}/vehicle/${id}`);
  return {
    vehicleId: data.vehicleId,
    vehicleNo: data.vehicleNo,
    vin: data.vin,
    category: {
      manufacturerName: data.category.manufacturerName,
      manufacturerEnglishName: data.category.manufacturerEnglishName ?? '',
      modelName: data.category.modelName,
      gradeName: data.category.gradeName,
      gradeEnglishName: data.category.gradeEnglishName ?? '',
      yearMonth: data.category.yearMonth,
      formYear: data.category.formYear,
    },
    spec: {
      mileage: data.spec.mileage,
      displacement: data.spec.displacement,
      transmissionName: data.spec.transmissionName,
      fuelName: data.spec.fuelName,
      colorName: data.spec.colorName,
      customColor: data.spec.customColor ?? null,
      bodyName: data.spec.bodyName,
    },
    advertisement: {
      price: data.advertisement.price,
      status: data.advertisement.status,
    },
    contact: {
      address: data.contact.address,
      phone: data.contact.no ?? '',
    },
    condition: {
      accident: {
        recordView: data.condition.accident.recordView,
        resumeView: data.condition.accident.resumeView,
      },
    },
  };
}

export async function fetchRecord(id: string, vehicleNo: string): Promise<EncarRecord | null> {
  const normalizedNo = vehicleNo.replace(/\s+/g, '');
  const encodedNo = encodeURIComponent(normalizedNo);
  const url = `${BASE}/record/vehicle/${id}/open?vehicleNo=${encodedNo}`;
  log(C.cyan,   'fetchRecord', `id        = ${C.bold}${id}${C.reset}`);
  log(C.cyan,   'fetchRecord', `vehicleNo = ${C.bold}${vehicleNo}${C.reset}${normalizedNo !== vehicleNo ? ` → ${C.bold}${normalizedNo}${C.reset} (убран пробел)` : ''}`);
  log(C.cyan,   'fetchRecord', `encoded   = ${C.bold}${encodedNo}${C.reset}`);
  log(C.yellow, 'fetchRecord', `GET ${url}`);
  try {
    const { data } = await axios.get(url);
    log(C.green, 'fetchRecord', `200 OK`);
    return {
      carNo: data.carNo,
      year: data.year,
      maker: data.maker,
      model: data.model,
      fuel: data.fuel,
      firstDate: data.firstDate,
      myAccidentCnt: data.myAccidentCnt,
      otherAccidentCnt: data.otherAccidentCnt,
      myAccidentCost: data.myAccidentCost,
      otherAccidentCost: data.otherAccidentCost,
      ownerChangeCnt: data.ownerChangeCnt,
      ownerChanges: data.ownerChanges ?? [],
      robberCnt: data.robberCnt,
      totalLossCnt: data.totalLossCnt,
      floodTotalLossCnt: data.floodTotalLossCnt,
      loan: data.loan,
      carInfoChanges: data.carInfoChanges ?? [],
      accidents: data.accidents ?? [],
    };
  } catch (e: any) {
    const status = e.response?.status ?? 'network error';
    log(C.red, 'fetchRecord', `${status} — ${e.message}`);
    return null;
  }
}

// Коды статусов, которые считаются "нормой" — не попадают в проблемные
const OK_STATUS_CODES = new Set(['1', '2', '3']);

export async function fetchInspection(id: string): Promise<EncarInspection | null> {
  try {
    const { data } = await axios.get(`${BASE}/inspection/vehicle/${id}`);
    const detail = data.master?.detail;
    if (!detail) return null;

    const problematic: InspectionItem[] = [];

    // Рекурсивно обходим inners, собираем пункты не в норме
    function walkInners(items: any[]) {
      for (const item of items) {
        if (item.children?.length) {
          walkInners(item.children);
        } else if (item.statusType && !OK_STATUS_CODES.has(item.statusType.code)) {
          problematic.push({
            code: item.type.code,
            title: item.type.title,
            statusCode: item.statusType.code,
            statusTitle: item.statusType.title,
          });
        }
      }
    }
    walkInners(data.inners ?? []);

    // Повреждения кузова (outers) — statusTypes это массив
    const outerDamages: OuterDamage[] = (data.outers ?? [])
      .filter((o: any) => o.statusTypes?.length > 0)
      .map((o: any) => ({
        code: o.type?.code ?? '',
        title: o.type?.title ?? '',
        statusTypes: (o.statusTypes ?? []).map((s: any) => ({ code: s.code, title: s.title })),
        rankOne: (o.attributes ?? []).includes('RANK_ONE'),
      }));

    return {
      accident: detail.accdient ?? false,
      waterlog: detail.waterlog ?? false,
      usageTypes: (detail.usageChangeTypes ?? []).map((u: any) => u.title),
      boardState: detail.boardStateType?.title ?? '',
      mileage: detail.mileage ?? 0,
      issueDate: detail.issueDate ?? '',
      comments: detail.comments ?? '',
      problematicItems: problematic,
      outerDamages,
    };
  } catch {
    return null;
  }
}

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

export async function fetchEncarData(id: string): Promise<EncarData> {
  log(C.cyan, 'encar', `fetchVehicle  id=${id}`);
  const vehicle = await fetchVehicle(id);
  const canonicalId = vehicle.vehicleId.toString();
  log(C.cyan, 'encar', `vehicleNo=${vehicle.vehicleNo}  canonicalId=${canonicalId}${canonicalId !== id ? ` (исходный: ${id})` : ''}  → fetchRecord + fetchInspection`);

  const [record, inspection] = await Promise.all([
    fetchRecord(canonicalId, vehicle.vehicleNo),
    fetchInspection(canonicalId),
  ]);

  log(record     ? C.green  : C.yellow, 'encar', `fetchRecord      ${record     ? '✓' : '— нет доступа'}`);
  log(inspection ? C.green  : C.yellow, 'encar', `fetchInspection  ${inspection ? '✓' : '— нет данных'}`);
  log(C.green, 'encar', `готово`);

  return { vehicle, record, inspection };
}
