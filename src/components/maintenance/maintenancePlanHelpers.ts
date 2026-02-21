import ExcelJS from 'exceljs';
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
// Normalization & validation
// ---------------------------------------------------------------------------

interface NormalizeOpts {
  /** Normalise whitespace around /. Default true. Set false for utredningspunkter. */
  normalizeSlash?: boolean;
}

/** Normalise a single text field value (trim, capitalise, fix separators). */
export function normalizeRowText(value: string, opts?: NormalizeOpts): string {
  let v = value.trim();
  if (!v) return v;

  // Capitalise first character
  v = v.charAt(0).toUpperCase() + v.slice(1);

  // Ensure spaces around &: "Besiktning&status" → "Besiktning & status"
  v = v.replace(/\s*&\s*/g, ' & ');

  // Collapse spaces around /: "Byte / service" → "Byte/service"
  // Skipped for utredningspunkter which may contain kr/m², dates etc.
  if (opts?.normalizeSlash !== false) {
    v = v.replace(/\s*\/\s*/g, '/');
  }

  // Collapse multiple spaces
  v = v.replace(/\s{2,}/g, ' ');

  return v;
}

export type ValidationContext = 'edit' | 'save' | 'export';
export type ValidationSeverity = 'warning' | 'error';

export interface RowValidation {
  rowId: string;
  field: string;
  severity: ValidationSeverity;
  message: string;
}

/** Validate a single plan row. Context controls severity: edit → warning, save/export → error. */
export function validatePlanRow(
  row: PlanRow,
  context: ValidationContext,
): RowValidation[] {
  const issues: RowValidation[] = [];
  const severity: ValidationSeverity = context === 'edit' ? 'warning' : 'error';

  if (row.rowType !== 'item') return issues;

  if (!row.byggdel.trim()) {
    issues.push({ rowId: row.id, field: 'byggdel', severity, message: 'Byggdel saknas' });
  }

  if (!row.atgard.trim()) {
    issues.push({ rowId: row.id, field: 'atgard', severity, message: 'Åtgärd saknas' });
  }

  return issues;
}

/** Validate all rows. Returns flat list of issues. */
export function validatePlanData(
  rows: PlanRow[],
  context: ValidationContext,
): RowValidation[] {
  return rows.flatMap(r => validatePlanRow(r, context));
}

/** Normalise byggdel, atgard and utredningspunkter on all rows. */
export function normalizeRows(rows: PlanRow[]): PlanRow[] {
  return rows.map(r => ({
    ...r,
    byggdel: normalizeRowText(r.byggdel ?? ''),
    atgard: normalizeRowText(r.atgard ?? ''),
    utredningspunkter: normalizeRowText(r.utredningspunkter ?? '', { normalizeSlash: false }),
    status: r.status ?? '',
  }));
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

/** Convert 1-based column index to Excel letter (1=A, 7=G, 18=R). */
function colLetter(c: number): string {
  return String.fromCharCode(64 + c);
}

/**
 * Build a formatted Excel workbook and return it as an ArrayBuffer.
 * Includes: bold headers, section/subsection styling, number formatting,
 * live formulas, freeze panes, and auto-filter.
 */
export async function exportToExcelBuffer(rows: PlanRow[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MallBRF1';
  wb.created = new Date();

  const ws = wb.addWorksheet('Underhållsplan', {
    views: [{ state: 'frozen' as const, ySplit: 5 }],
  });

  const TOTAL_COLS = COLUMN_HEADERS.length; // 18
  const YEAR_COL_START = 7;  // Column G (1-indexed)
  const YEAR_COL_END = 16;   // Column P (1-indexed)
  const TOTAL_COL = 18;      // Column R (1-indexed)

  // Column widths (ExcelJS uses character widths)
  for (let i = 0; i < COLUMN_WIDTHS.length; i++) {
    ws.getColumn(i + 1).width = Math.round(COLUMN_WIDTHS[i] / 7);
  }

  // -----------------------------------------------------------------------
  // Title section (rows 1-4)
  // -----------------------------------------------------------------------
  ws.mergeCells(1, 1, 1, TOTAL_COLS);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = 'Underhållsplan 2026\u20132035';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1565C0' } };
  titleCell.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, TOTAL_COLS);
  const brfCell = ws.getCell(2, 1);
  brfCell.value = 'Brf Gulm\u00e5ran';
  brfCell.font = { italic: true, size: 12, color: { argb: 'FF546E7A' } };

  ws.mergeCells(3, 1, 3, TOTAL_COLS);
  const dateCell = ws.getCell(3, 1);
  dateCell.value = `Exporterad: ${new Date().toISOString().slice(0, 10)}`;
  dateCell.font = { size: 10, color: { argb: 'FF90A4AE' } };

  // Row 4: blank spacer

  // -----------------------------------------------------------------------
  // Column headers (row 5)
  // -----------------------------------------------------------------------
  const headerRow = ws.getRow(5);
  for (let c = 0; c < COLUMN_HEADERS.length; c++) {
    headerRow.getCell(c + 1).value = COLUMN_HEADERS[c];
  }
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 28;
  for (let c = 1; c <= TOTAL_COLS; c++) {
    const cell = headerRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF0D47A1' } } };
  }

  // -----------------------------------------------------------------------
  // Data rows (row 6+)
  // -----------------------------------------------------------------------
  const DATA_START_ROW = 6;

  // Reusable fill styles
  const sectionFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF455A64' } };
  const subsectionFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFD8DC' } };
  const summaFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECEFF1' } };
  const totaltFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } };
  const altRowFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFE0E0E0' } };

  let summaExcelRow = -1;
  let osakExcelRow = -1;
  let totaltExcelRow = -1;
  const firstDataExcelRow = DATA_START_ROW;
  let lastNonSummaryExcelRow = DATA_START_ROW;
  let itemIndex = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const excelRow = DATA_START_ROW + i;

    // Build cell values
    const wsRow = ws.getRow(excelRow);
    for (let ci = 0; ci < FIELD_KEYS.length; ci++) {
      const key = FIELD_KEYS[ci];
      const cell = wsRow.getCell(ci + 1);

      if (key === 'total') {
        // Formula: =SUM(G{row}:P{row})
        cell.value = { formula: `SUM(G${excelRow}:P${excelRow})`, result: 0 } as ExcelJS.CellFormulaValue;
      } else {
        const val = r[key];
        if (val !== null && val !== undefined && typeof val !== 'boolean') {
          cell.value = val as string | number;
        }
      }
    }

    // Number formatting for currency/count columns
    for (let c = YEAR_COL_START; c <= YEAR_COL_END; c++) {
      wsRow.getCell(c).numFmt = '#,##0';
    }
    wsRow.getCell(5).numFmt = '#,##0'; // a-pris
    wsRow.getCell(6).numFmt = '#,##0'; // antal
    wsRow.getCell(TOTAL_COL).numFmt = '#,##0';

    // Grid borders on all cells
    for (let c = 1; c <= TOTAL_COLS; c++) {
      wsRow.getCell(c).border = { bottom: thinBorder, right: thinBorder };
    }

    // Row-type-specific styling
    if (r.rowType === 'section') {
      wsRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      for (let c = 1; c <= TOTAL_COLS; c++) wsRow.getCell(c).fill = sectionFill;
      wsRow.height = 24;
    } else if (r.rowType === 'subsection') {
      wsRow.font = { bold: true, size: 10 };
      for (let c = 1; c <= TOTAL_COLS; c++) wsRow.getCell(c).fill = subsectionFill;
      wsRow.getCell(1).border = {
        left: { style: 'medium', color: { argb: 'FF1565C0' } },
        bottom: thinBorder, right: thinBorder,
      };
    } else if (r.rowType === 'summary') {
      wsRow.font = { bold: true };
      if (r.byggdel === 'Summa beräknad kostnad') {
        summaExcelRow = excelRow;
        for (let c = 1; c <= TOTAL_COLS; c++) {
          wsRow.getCell(c).fill = summaFill;
          wsRow.getCell(c).border = {
            top: { style: 'medium', color: { argb: 'FF90A4AE' } },
            bottom: thinBorder, right: thinBorder,
          };
        }
      } else if (r.byggdel === 'Osäkerhet') {
        osakExcelRow = excelRow;
        wsRow.font = { italic: true };
      } else if (r.byggdel === 'Totalt inkl osäkerhet' || r.byggdel === 'Totalt inkl moms') {
        totaltExcelRow = excelRow;
        wsRow.font = { bold: true };
        for (let c = 1; c <= TOTAL_COLS; c++) {
          wsRow.getCell(c).fill = totaltFill;
          wsRow.getCell(c).border = {
            top: { style: 'thin', color: { argb: 'FF90A4AE' } },
            bottom: { style: 'medium', color: { argb: 'FF1565C0' } },
            right: thinBorder,
          };
        }
      }
    } else if (r.rowType === 'item') {
      if (itemIndex % 2 === 1) {
        for (let c = 1; c <= TOTAL_COLS; c++) wsRow.getCell(c).fill = altRowFill;
      }
      itemIndex++;
    }

    // Track non-summary rows for Summa formula range
    if (r.rowType !== 'summary' && r.rowType !== 'blank') {
      lastNonSummaryExcelRow = excelRow;
    }
  }

  // -----------------------------------------------------------------------
  // Summary formulas (overwrite value cells with formulas)
  // -----------------------------------------------------------------------
  if (summaExcelRow > 0) {
    for (let c = YEAR_COL_START; c <= YEAR_COL_END; c++) {
      const col = colLetter(c);
      ws.getRow(summaExcelRow).getCell(c).value = {
        formula: `SUM(${col}${firstDataExcelRow}:${col}${lastNonSummaryExcelRow})`, result: 0,
      } as ExcelJS.CellFormulaValue;
    }
  }

  if (osakExcelRow > 0 && summaExcelRow > 0) {
    const pctMatch = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Osäkerhet')?.atgard.match(/(\d+)/);
    const pctValue = pctMatch ? parseInt(pctMatch[1], 10) / 100 : 0;
    for (let c = YEAR_COL_START; c <= YEAR_COL_END; c++) {
      const col = colLetter(c);
      ws.getRow(osakExcelRow).getCell(c).value = {
        formula: `ROUND(${col}${summaExcelRow}*${pctValue},0)`, result: 0,
      } as ExcelJS.CellFormulaValue;
    }
  }

  if (totaltExcelRow > 0 && summaExcelRow > 0 && osakExcelRow > 0) {
    for (let c = YEAR_COL_START; c <= YEAR_COL_END; c++) {
      const col = colLetter(c);
      ws.getRow(totaltExcelRow).getCell(c).value = {
        formula: `${col}${summaExcelRow}+${col}${osakExcelRow}`, result: 0,
      } as ExcelJS.CellFormulaValue;
    }
  }

  // Auto-filter on header row
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: TOTAL_COLS } };

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
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

// ---------------------------------------------------------------------------
// Auto-enrich: map known regulatory items to official info URLs
// ---------------------------------------------------------------------------

/** Known regulatory keywords → official info URLs */
const REGULATORY_INFO_URLS: { keywords: string[]; url: string }[] = [
  {
    keywords: ['ovk', 'ventilationskontroll'],
    url: 'https://www.boverket.se/sv/byggande/halsa-och-inomhusmiljo/ventilation/ovk/',
  },
  {
    keywords: ['energideklaration'],
    url: 'https://www.boverket.se/sv/energideklaration/',
  },
  {
    keywords: ['radon'],
    url: 'https://www.stralsakerhetsmyndigheten.se/omraden/radon/',
  },
  {
    keywords: ['brandskydd', 'sba'],
    url: 'https://www.mcf.se/sv/amnesomraden/skydd-mot-olyckor-och-farliga-amnen/stod-till-kommunal-raddningstjanst/brandskydd-och-forebyggande/ansvar-sba-och-skriftlig-redogorelse/',
  },
  {
    keywords: ['taksäkerhet', 'taksäkerhetsbesiktning'],
    url: 'https://www.boverket.se/sv/PBL-kunskapsbanken/regler-om-byggande/boverkets-byggregler/sakerhet-vid-anvandning/taksakerhet/',
  },
  {
    keywords: ['legionella'],
    url: 'https://www.folkhalsomyndigheten.se/regler-och-tillsyn/tillsynsvagledning-och-stod/halsoskydd-vagledning-och-tillsyn/vagledning-om-smitta-fran-objekt-och-djur/tillsynsvagledning-om-legionella/fragor-och-svar-om-legionella/',
  },
  {
    keywords: ['elrevision', 'elsäkerhet', 'elbesiktning'],
    url: 'https://www.elsakerhetsverket.se/om-oss/lag-och-ratt/vad-innebar-de-nya-starkstromsforeskrifterna/',
  },
  {
    keywords: ['hissbesiktning', 'hiss'],
    url: 'https://www.boverket.se/sv/byggande/halsa-och-inomhusmiljo/hissar/',
  },
  {
    keywords: ['lekplats'],
    url: 'https://www.boverket.se/sv/byggande/tillganglighet--bostadsutformning/tillganglighet-pa-allman-plats/lekplatser/',
  },
  {
    keywords: ['sotning', 'skorsten'],
    url: 'https://www.mcf.se/sv/amnesomraden/skydd-mot-olyckor-och-farliga-amnen/stod-till-kommunal-raddningstjanst/brandskydd-och-forebyggande/sotning-och-brandskyddskontroll/',
  },
];

/**
 * Enrich rows with info_url for known regulatory items.
 * Always updates to the latest known URL for matching keywords,
 * ensuring stale/broken URLs in saved data get corrected on load.
 * Mutates rows in-place for efficiency.
 */
export function enrichWithInfoUrls(rows: PlanRow[]): PlanRow[] {
  for (const r of rows) {
    if (r.rowType !== 'item') continue;

    const text = `${r.atgard} ${r.byggdel} ${r.tek_livslangd}`.toLowerCase();
    for (const entry of REGULATORY_INFO_URLS) {
      if (entry.keywords.some(kw => text.includes(kw))) {
        r.info_url = entry.url;
        break;
      }
    }
  }
  return rows;
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

// ---------------------------------------------------------------------------
// Year-by-year view helpers
// ---------------------------------------------------------------------------

export interface YearGroup {
  yearCol: typeof YEAR_COLUMNS[number];
  year: string;
  items: { row: PlanRow; amount: number; byggdel: string }[];
  total: number;
}

/** Group all item rows by the years they have costs in. Returns one entry per year column, sorted chronologically. */
export function groupItemsByYear(rows: PlanRow[]): YearGroup[] {
  const byggdelMap = buildByggdelMap(rows);

  return YEAR_COLUMNS.map(yc => {
    const items: { row: PlanRow; amount: number; byggdel: string }[] = [];

    for (const r of rows) {
      if (r.rowType !== 'item') continue;
      if (r.status === 'completed') continue;
      const val = r[yc];
      if (typeof val === 'number' && val > 0) {
        items.push({
          row: r,
          amount: val,
          byggdel: r.byggdel || byggdelMap.get(r.id) || '–',
        });
      }
    }

    items.sort((a, b) => b.amount - a.amount);

    return {
      yearCol: yc,
      year: yc.replace('year_', ''),
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0),
    };
  });
}

// ---------------------------------------------------------------------------
// Add-action dialog helpers
// ---------------------------------------------------------------------------

export interface SectionInfo {
  id: string;
  label: string;
  subsections: { id: string; label: string }[];
}

/** Extract sections and their subsections from plan rows. */
export function getSectionsAndSubsections(rows: PlanRow[]): SectionInfo[] {
  const sections: SectionInfo[] = [];
  let current: SectionInfo | null = null;

  for (const r of rows) {
    if (r.rowType === 'section') {
      if (current) sections.push(current);
      current = {
        id: r.id,
        label: r.nr ? `${r.nr}. ${r.byggdel}` : r.byggdel,
        subsections: [],
      };
    } else if (r.rowType === 'subsection' && current) {
      current.subsections.push({ id: r.id, label: r.byggdel });
    }
  }
  if (current) sections.push(current);

  return sections;
}

export interface ActionSuggestion {
  atgard: string;
  byggdel: string;
  sectionId: string;
  subsectionId: string;
  amount: number;
  latestYear: string;
  tek_livslangd: string;
  utredningspunkter: string;
}

/** Build template suggestions from existing item rows. Optionally filter by subsectionId. */
export function getActionSuggestions(rows: PlanRow[], subsectionId?: string): ActionSuggestion[] {
  let currentSectionId = '';
  let currentSubsectionId = '';

  const items: { row: PlanRow; sectionId: string; subsectionId: string }[] = [];
  for (const r of rows) {
    if (r.rowType === 'section') currentSectionId = r.id;
    else if (r.rowType === 'subsection') currentSubsectionId = r.id;
    else if (r.rowType === 'item') {
      items.push({ row: r, sectionId: currentSectionId, subsectionId: currentSubsectionId });
    }
  }

  const filtered = subsectionId ? items.filter(i => i.subsectionId === subsectionId) : items;

  const map = new Map<string, ActionSuggestion>();
  for (const { row, sectionId, subsectionId: subId } of filtered) {
    const key = `${row.atgard}|${row.byggdel}`;

    let latestYear = '';
    let latestAmount = 0;
    for (const yc of YEAR_COLUMNS) {
      const val = row[yc];
      if (typeof val === 'number' && val > 0) {
        latestYear = yc.replace('year_', '');
        latestAmount = val;
      }
    }

    const existing = map.get(key);
    if (!existing || (latestYear && latestYear > (existing.latestYear || ''))) {
      map.set(key, {
        atgard: row.atgard,
        byggdel: row.byggdel,
        sectionId,
        subsectionId: subId,
        amount: latestAmount,
        latestYear,
        tek_livslangd: row.tek_livslangd,
        utredningspunkter: row.utredningspunkter,
      });
    }
  }

  return Array.from(map.values());
}
