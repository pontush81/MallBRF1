import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';

// ---------------------------------------------------------------------------
// Constants (extracted from MaintenancePlanSpreadsheet)
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

/** Field keys that map each Handsontable column index to a PlanRow property (or 'total'). */
export const FIELD_KEYS: (keyof PlanRow | 'total')[] = [
  'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
  'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
  'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035',
  'utredningspunkter', 'total',
];

/** Column indices for year columns (6..15) */
export const YEAR_COL_START = 6;
export const YEAR_COL_END = 15; // inclusive
export const TOTAL_COL = 17; // index of "Totalt kr inkl moms" (0-based = 17)
export const A_PRIS_COL = 4;
export const ANTAL_COL = 5;

/** Inline style tag (injected once) */
export const SPREADSHEET_STYLES = `
  .mp-row-section td { background-color: #e3f2fd !important; font-weight: 700 !important; }
  .mp-row-subsection td { background-color: #f5f5f5 !important; font-weight: 600 !important; }
  .mp-row-summary td { background-color: #fff3e0 !important; font-weight: 700 !important; border-top: 2px solid #e65100 !important; }
  .mp-row-blank td { background-color: #fafafa !important; }
`;

// ---------------------------------------------------------------------------
// Pure helper functions (extracted from MaintenancePlanSpreadsheet)
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

  // Sum all item rows per year
  for (const r of rows) {
    if (r.rowType !== 'item') continue;
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

/** Convert rows to 2D data array for Handsontable */
export function rowsToData(rows: PlanRow[]): (string | number | null)[][] {
  return rows.map(row => {
    const cells: (string | number | null)[] = [];
    for (const key of FIELD_KEYS) {
      if (key === 'total') {
        cells.push(computeRowTotal(row));
      } else {
        const val = row[key];
        if (val === null || val === undefined) {
          cells.push(null);
        } else if (typeof val === 'boolean') {
          cells.push(val ? 1 : 0);
        } else {
          cells.push(val as string | number);
        }
      }
    }
    return cells;
  });
}

/** CSS class name per row type */
export function cssClassForRowType(rowType: string): string {
  switch (rowType) {
    case 'section': return 'mp-row-section';
    case 'subsection': return 'mp-row-subsection';
    case 'summary': return 'mp-row-summary';
    case 'blank': return 'mp-row-blank';
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// New helper functions for Dashboard and Lagkrav tabs
// ---------------------------------------------------------------------------

export interface SectionSummary {
  nr: string;
  name: string;
  totalPerYear: Record<string, number>;
  grandTotal: number;
  itemCount: number;
}

/** Group items by their parent section and compute subtotals per year */
export function computeSectionSummaries(rows: PlanRow[]): SectionSummary[] {
  const summaries: SectionSummary[] = [];
  let currentSection: SectionSummary | null = null;
  for (const r of rows) {
    if (r.rowType === 'section') {
      if (currentSection) summaries.push(currentSection);
      currentSection = { nr: r.nr, name: r.byggdel, totalPerYear: {}, grandTotal: 0, itemCount: 0 };
      for (const yc of YEAR_COLUMNS) currentSection.totalPerYear[yc] = 0;
    } else if (r.rowType === 'item' && currentSection) {
      currentSection.itemCount++;
      for (const yc of YEAR_COLUMNS) {
        const val = r[yc];
        if (typeof val === 'number') { currentSection.totalPerYear[yc] += val; currentSection.grandTotal += val; }
      }
    }
  }
  if (currentSection) summaries.push(currentSection);
  return summaries;
}

/** Get the top N most expensive individual line items */
export function getTopExpenses(rows: PlanRow[], limit = 5): { row: PlanRow; total: number; year: string }[] {
  const items: { row: PlanRow; total: number; year: string }[] = [];
  for (const r of rows) {
    if (r.rowType !== 'item') continue;
    for (const yc of YEAR_COLUMNS) {
      const val = r[yc];
      if (typeof val === 'number' && val > 0) items.push({ row: r, total: val, year: yc.replace('year_', '') });
    }
  }
  items.sort((a, b) => b.total - a.total);
  return items.slice(0, limit);
}

/** Get legally required items (section 6 + items with lagkrav indicators) */
export function getLagkravItems(rows: PlanRow[]): PlanRow[] {
  let inSection6 = false;
  const result: PlanRow[] = [];
  for (const r of rows) {
    if (r.rowType === 'section') inSection6 = r.nr === '6';
    if (r.rowType === 'item') {
      const isLegal = inSection6 ||
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
    for (const yc of YEAR_COLUMNS) {
      const val = r[yc]; if (typeof val === 'number') totals[yc] += val;
    }
  }
  return totals;
}
