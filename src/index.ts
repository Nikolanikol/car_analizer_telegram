import { fetchEncarData } from './scrapers/encar';
import { formatEncarReport } from './formatters/report';

async function main() {
  // Машина с заменой панели
  const id = '41767330';
  console.log(`Fetching data for id: ${id}\n`);

  const data = await fetchEncarData(id);
  const report = formatEncarReport(data);

  console.log('=== TELEGRAM REPORT ===\n');
  console.log(report);
}

main().catch(console.error);
