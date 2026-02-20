import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const COLUMN_HEADERS = [
  'Nr', 'Byggdel', 'Åtgärd', 'Tek livslängd', 'a-pris', 'Antal',
  '2026', '2027', '2028', '2029', '2030',
  '2031', '2032', '2033', '2034', '2035',
  'Utredningspunkter', 'Totalt kr inkl moms',
];

export const COLUMN_WIDTHS = [
  50, 130, 200, 90, 80, 50,
  90, 90, 90, 90, 90,
  90, 90, 90, 90, 90,
  120, 120,
];

/** Field keys that map each column index to a PlanRow property (or 'total'). Used by Excel export. */
export const FIELD_KEYS: (keyof PlanRow | 'total')[] = [
  'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
  'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
  'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035',
  'utredningspunkter', 'total',
];

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/** Compute row total (sum of year columns) */
export function computeRowTotal(row: PlanRow): number {
  let sum = 0;
  for (const yc of YEAR_COLUMNS) {
    const val = row[yc];
    if (typeof val === 'number') {
      sum += val;
    }
  }
  return sum;
}

/** Safely set a year column value on a PlanRow */
export function setYearValue(row: PlanRow, yearCol: typeof YEAR_COLUMNS[number], value: number): void {
  const rec = row as unknown as Record<string, number | null>;
  rec[yearCol] = value;
}

/** Recalculate summary rows in-place */
export function recalcSummaryRows(rows: PlanRow[]): PlanRow[] {
  const summaRow = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Summa beräknad kostnad');
  const osakerhetRow = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Osäkerhet');
  const totaltRow = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Totalt inkl moms');

  if (!summaRow || !osakerhetRow || !totaltRow) return rows;

  // Zero out year values on summary rows
  for (const yc of YEAR_COLUMNS) {
    setYearValue(summaRow, yc, 0);
    setYearValue(osakerhetRow, yc, 0);
    setYearValue(totaltRow, yc, 0);
  }

  // Sum all active item rows per year (skip completed)
  for (const r of rows) {
    if (r.rowType !== 'item') continue;
    if (r.status === 'completed') continue;
    for (const yc of YEAR_COLUMNS) {
      const val = r[yc];
      if (typeof val === 'number') {
        setYearValue(summaRow, yc, ((summaRow[yc] as number) || 0) + val);
      }
    }
  }

  // Osakerhet = 10% of Summa, rounded
  for (const yc of YEAR_COLUMNS) {
    const sumVal = (summaRow[yc] as number) || 0;
    setYearValue(osakerhetRow, yc, Math.round(sumVal * 0.10));
  }

  // Totalt = Summa + Osakerhet
  for (const yc of YEAR_COLUMNS) {
    const sumVal = (summaRow[yc] as number) || 0;
    const osakVal = (osakerhetRow[yc] as number) || 0;
    setYearValue(totaltRow, yc, sumVal + osakVal);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Dashboard helper functions
// ---------------------------------------------------------------------------

/** Build a map from item row id → effective byggdel (from nearest parent section/subsection) */
export function buildByggdelMap(rows: PlanRow[]): Map<string, string> {
  const map = new Map<string, string>();
  let currentByggdel = '';
  for (const r of rows) {
    if (r.rowType === 'section' || r.rowType === 'subsection') {
      currentByggdel = r.byggdel || currentByggdel;
    } else if (r.rowType === 'item') {
      map.set(r.id, r.byggdel || currentByggdel);
    }
  }
  return map;
}

/** Get legally required items (section 6 + items with lagkrav indicators) */
export function getLagkravItems(rows: PlanRow[]): PlanRow[] {
  let inLagkravSection = false;
  const result: PlanRow[] = [];
  for (const r of rows) {
    if (r.rowType === 'section') inLagkravSection = r.nr === '4' || r.nr === '6';
    if (r.rowType === 'item') {
      const isLegal = inLagkravSection ||
        r.tek_livslangd.toLowerCase().includes('lagkrav') ||
        r.atgard.toLowerCase().includes('ovk') ||
        r.atgard.toLowerCase().includes('obligatorisk') ||
        r.atgard.toLowerCase().includes('energideklaration') ||
        r.atgard.toLowerCase().includes('radon') ||
        r.atgard.toLowerCase().includes('brandskydd');
      if (isLegal) result.push(r);
    }
  }
  return result;
}

/** Compute total cost per year across all item rows */
export function computeYearlyTotals(rows: PlanRow[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const yc of YEAR_COLUMNS) totals[yc] = 0;
  for (const r of rows) {
    if (r.rowType !== 'item') continue;
    if (r.status === 'completed') continue;
    for (const yc of YEAR_COLUMNS) {
      const val = r[yc]; if (typeof val === 'number') totals[yc] += val;
    }
  }
  return totals;
}
