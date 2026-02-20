import * as XLSX from 'xlsx';
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
  const totaltRow = rows.find(r => r.rowType === 'summary' && (r.byggdel === 'Totalt inkl osäkerhet' || r.byggdel === 'Totalt inkl moms'));

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

  // Osakerhet = dynamic % of Summa (read from atgard field, e.g. "10%")
  const pctMatch = osakerhetRow.atgard.match(/(\d+)/);
  const osakerhetPct = pctMatch ? parseFloat(pctMatch[1]) / 100 : 0;
  for (const yc of YEAR_COLUMNS) {
    const sumVal = (summaRow[yc] as number) || 0;
    setYearValue(osakerhetRow, yc, Math.round(sumVal * osakerhetPct));
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

// ---------------------------------------------------------------------------
// Export helpers (shared by Excel, CSV, and clipboard export)
// ---------------------------------------------------------------------------

/** Build a 2D array of export data (header + rows). Used by Excel, CSV, and TSV. */
export function buildExportRows(rows: PlanRow[]): (string | number | null)[][] {
  const data: (string | number | null)[][] = [];
  data.push([...COLUMN_HEADERS]);
  for (const row of rows) {
    const cells: (string | number | null)[] = [];
    for (const key of FIELD_KEYS) {
      if (key === 'total') {
        cells.push(computeRowTotal(row));
      } else {
        const val = row[key];
        if (val === null || val === undefined) {
          cells.push(null);
        } else if (typeof val === 'boolean') {
          cells.push(null);
        } else {
          cells.push(val as string | number);
        }
      }
    }
    data.push(cells);
  }
  return data;
}

/** Convert a 2D data array to a TSV string (tab-separated, for Google Sheets paste). */
export function exportDataToTsv(data: (string | number | null)[][]): string {
  return data.map(row => row.map(cell => cell ?? '').join('\t')).join('\n');
}

/** Convert a 2D data array to a CSV string. */
export function exportDataToCsv(data: (string | number | null)[][]): string {
  return data.map(row =>
    row.map(cell => {
      if (cell === null || cell === undefined) return '';
      const s = String(cell);
      // Quote fields that contain comma, newline, or double-quote
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',')
  ).join('\n');
}

/**
 * Apply Excel formulas to a worksheet for summary rows and totals.
 * - "Totalt kr inkl moms" column: =SUM(year columns) for each data row
 * - "Summa beräknad kostnad" row: =SUM(item cells) per year column
 * - "Osäkerhet" row: =Summa cell * percentage per year column
 * - "Totalt inkl osäkerhet" row: =Summa + Osäkerhet per year column
 *
 * @param ws The worksheet (mutated in-place)
 * @param rows The PlanRow data used to generate the sheet
 * @param headerRowOffset 0-indexed row of the column headers in the sheet (data starts at headerRowOffset+1)
 */
export function applyExcelFormulas(
  ws: XLSX.WorkSheet,
  rows: PlanRow[],
  headerRowOffset: number,
): void {
  const YEAR_COL_START = 6;  // Column G (0-indexed)
  const YEAR_COL_END = 15;   // Column P (0-indexed)
  const TOTAL_COL = 17;      // Column R (0-indexed)

  const dataStartRow = headerRowOffset + 1; // 0-indexed row of first data row

  // Find row indices (0-indexed in sheet) for summary rows
  let summaSheetRow = -1;
  let osakSheetRow = -1;
  let totaltSheetRow = -1;

  // Track which sheet rows are "item-like" (have costs that should be summed)
  // We include all non-summary rows in the SUM range since sections/subsections have no values
  let firstDataSheetRow = dataStartRow;
  let lastNonSummarySheetRow = dataStartRow;

  for (let i = 0; i < rows.length; i++) {
    const sheetRow = dataStartRow + i;
    const r = rows[i];

    if (r.rowType === 'summary') {
      if (r.byggdel === 'Summa beräknad kostnad') summaSheetRow = sheetRow;
      else if (r.byggdel === 'Osäkerhet') osakSheetRow = sheetRow;
      else if (r.byggdel === 'Totalt inkl osäkerhet' || r.byggdel === 'Totalt inkl moms') totaltSheetRow = sheetRow;
    } else if (r.rowType !== 'blank') {
      lastNonSummarySheetRow = sheetRow;
    }
  }

  // 1. Total column (R) for each data row: =SUM(G{n}:P{n})
  for (let i = 0; i < rows.length; i++) {
    const sheetRow = dataStartRow + i;
    const excelRow = sheetRow + 1; // Excel is 1-indexed
    const addr = XLSX.utils.encode_cell({ r: sheetRow, c: TOTAL_COL });
    const firstYearCol = XLSX.utils.encode_col(YEAR_COL_START);
    const lastYearCol = XLSX.utils.encode_col(YEAR_COL_END);
    ws[addr] = { f: `SUM(${firstYearCol}${excelRow}:${lastYearCol}${excelRow})`, t: 'n' };
  }

  // 2. Summa row: =SUM(col{first}:col{lastNonSummary}) per year column
  if (summaSheetRow >= 0) {
    const excelFirst = firstDataSheetRow + 1;
    const excelLast = lastNonSummarySheetRow + 1;
    for (let c = YEAR_COL_START; c <= YEAR_COL_END; c++) {
      const col = XLSX.utils.encode_col(c);
      const addr = XLSX.utils.encode_cell({ r: summaSheetRow, c });
      ws[addr] = { f: `SUM(${col}${excelFirst}:${col}${excelLast})`, t: 'n' };
    }
  }

  // 3. Osäkerhet row: =SummaCell * percentage
  if (osakSheetRow >= 0 && summaSheetRow >= 0) {
    const pctMatch = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Osäkerhet')?.atgard.match(/(\d+)/);
    const pctValue = pctMatch ? parseInt(pctMatch[1], 10) / 100 : 0;
    const summaExcelRow = summaSheetRow + 1;
    for (let c = YEAR_COL_START; c <= YEAR_COL_END; c++) {
      const col = XLSX.utils.encode_col(c);
      const addr = XLSX.utils.encode_cell({ r: osakSheetRow, c });
      ws[addr] = { f: `ROUND(${col}${summaExcelRow}*${pctValue},0)`, t: 'n' };
    }
  }

  // 4. Totalt row: =Summa + Osäkerhet
  if (totaltSheetRow >= 0 && summaSheetRow >= 0 && osakSheetRow >= 0) {
    const summaExcelRow = summaSheetRow + 1;
    const osakExcelRow = osakSheetRow + 1;
    for (let c = YEAR_COL_START; c <= YEAR_COL_END; c++) {
      const col = XLSX.utils.encode_col(c);
      const addr = XLSX.utils.encode_cell({ r: totaltSheetRow, c });
      ws[addr] = { f: `${col}${summaExcelRow}+${col}${osakExcelRow}`, t: 'n' };
    }
  }
}

// ---------------------------------------------------------------------------
// Dashboard helper functions
// ---------------------------------------------------------------------------

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
