import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { PlanRow, RowType, YEAR_COLUMNS } from './maintenancePlanService';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ImportResult {
  rows: PlanRow[];
  sectionCount: number;
  itemCount: number;
  yearRange: { start: number; end: number };
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Column alias mappings  (lowercase comparisons)
// ---------------------------------------------------------------------------

const COLUMN_ALIASES: Record<string, string[]> = {
  nr: ['nr', 'pos', '#', 'nummer', 'position'],
  byggdel: ['byggdel', 'komponent', 'del', 'byggnadsdel', 'objekt'],
  atgard: ['åtgärd', 'atgard', 'atgärd', 'aktivitet', 'beskrivning'],
  tek_livslangd: ['livslängd', 'tek livslängd', 'tek livslangd', 'teknisk livslängd'],
  a_pris: ['a-pris', 'apris', 'à-pris', 'styckpris', 'a pris'],
  antal: ['antal', 'st', 'mängd'],
  utredningspunkter: ['utredningspunkter', 'utrednings punkter', 'notering', 'anmärkning', 'kommentar'],
};

/** Year numbers we are interested in (2026-2035). */
const PLAN_YEARS = YEAR_COLUMNS.map((c) => parseInt(c.replace('year_', ''), 10));
const PLAN_YEAR_START = PLAN_YEARS[0]; // 2026
const PLAN_YEAR_END = PLAN_YEARS[PLAN_YEARS.length - 1]; // 2035

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a header cell value to a comparable lowercase string.
 * Trims whitespace and removes non-printable characters.
 */
function normalise(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Try to extract a year number from a cell value.
 * Handles: plain numbers (2026), strings ("2026"), and year ranges ("År 2024-2025", "2028-2031").
 * Returns the first (start) year found.
 */
function parseYear(val: unknown): number | null {
  if (val === null || val === undefined) return null;

  // Plain number
  if (typeof val === 'number') {
    if (val >= 2000 && val <= 2099) return val;
    return null;
  }

  const str = String(val).trim();

  // Try plain integer first
  const plain = parseInt(str, 10);
  if (!isNaN(plain) && plain >= 2000 && plain <= 2099 && String(plain) === str) return plain;

  // Extract first 4-digit year from text like "År 2024-2025", "2028-2031", "År 2024"
  const match = str.match(/(20\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year >= 2000 && year <= 2099) return year;
  }

  return null;
}

/**
 * Try to interpret a cell value as a number (for costs / quantities).
 * Returns null for empty / non-numeric values.
 */
function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  // Handle Swedish formatting: spaces as thousands separator, comma as decimal
  const cleaned = String(val)
    .replace(/\s/g, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function cellString(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

// ---------------------------------------------------------------------------
// Header detection
// ---------------------------------------------------------------------------

interface HeaderMapping {
  /** 0-based row index of the header in the sheet */
  headerRowIndex: number;
  /** Maps our internal field name -> 0-based column index */
  fieldToCol: Record<string, number>;
  /** Maps year number (e.g. 2026) -> 0-based column index */
  yearToCol: Record<number, number>;
  /** Which years were found in the sheet */
  yearsFound: number[];
}

/**
 * Scans the first `maxRows` rows of the sheet to find the header row.
 * The header row is identified by the presence of year columns (2026-2035).
 */
function detectHeader(
  sheet: XLSX.WorkSheet,
  maxRows: number = 15
): HeaderMapping | null {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const searchRows = Math.min(maxRows, range.e.r + 1);

  for (let r = range.s.r; r < searchRows; r++) {
    const yearToCol: Record<number, number> = {};
    const fieldToCol: Record<string, number> = {};

    // First pass: look for year columns (accept any year 2000-2099)
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (!cell) continue;
      const year = parseYear(cell.v);
      if (year !== null) {
        yearToCol[year] = c;
      }
    }

    // We require at least 1 year column to consider this the header row
    if (Object.keys(yearToCol).length < 1) continue;

    // Second pass: match text columns by alias
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (!cell) continue;
      const norm = normalise(cell.v);
      if (!norm) continue;

      for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
        if (aliases.includes(norm) && !(field in fieldToCol)) {
          fieldToCol[field] = c;
          break;
        }
      }
    }

    const yearsFound = Object.keys(yearToCol)
      .map(Number)
      .sort((a, b) => a - b);

    return { headerRowIndex: r, fieldToCol, yearToCol, yearsFound };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Row classification
// ---------------------------------------------------------------------------

const SUMMARY_KEYWORDS = ['summa', 'totalt', 'osäkerhet'];

function classifyRow(
  nr: string,
  byggdel: string,
  atgard: string,
  hasCosts: boolean
): RowType {
  const combined = `${nr} ${byggdel} ${atgard}`.toLowerCase();

  // Summary rows
  if (SUMMARY_KEYWORDS.some((kw) => combined.includes(kw))) {
    return 'summary';
  }

  // Item rows: have costs or a non-empty action
  if (hasCosts || atgard.length > 0) {
    return 'item';
  }

  // Section / subsection: distinguished by dots in nr
  if (nr.length > 0) {
    return nr.includes('.') ? 'subsection' : 'section';
  }

  // Fallback: if there is a byggdel but nothing else treat as section header
  if (byggdel.length > 0) {
    return 'section';
  }

  return 'item';
}

/**
 * Determine indent level based on row type and nr structure.
 */
function indentLevel(rowType: RowType, nr: string): number {
  if (rowType === 'section') return 0;
  if (rowType === 'summary') return 0;
  if (rowType === 'subsection') return 1;
  // Items inherit depth from their nr or default to 2
  if (nr && nr.includes('.')) {
    const dots = (nr.match(/\./g) || []).length;
    return Math.min(dots + 1, 3);
  }
  return 2;
}

// ---------------------------------------------------------------------------
// Summary row generation
// ---------------------------------------------------------------------------

function createSummaryRow(sortIndex: number): PlanRow {
  return {
    id: uuidv4(),
    rowType: 'summary',
    nr: '',
    byggdel: '',
    atgard: 'Summa',
    tek_livslangd: '',
    a_pris: null,
    antal: null,
    year_2026: null,
    year_2027: null,
    year_2028: null,
    year_2029: null,
    year_2030: null,
    year_2031: null,
    year_2032: null,
    year_2033: null,
    year_2034: null,
    year_2035: null,
    utredningspunkter: '',
    sortIndex,
    indentLevel: 0,
    isLocked: true,
    status: '',
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Parse an Excel file (ArrayBuffer) into an ImportResult.
 */
export function parseExcelFile(buffer: ArrayBuffer): ImportResult {
  const warnings: string[] = [];

  // 1. Read workbook
  const wb = XLSX.read(buffer, { type: 'array' });
  if (wb.SheetNames.length === 0) {
    throw new Error('Excelfilen innehåller inga blad.');
  }

  // Use the first sheet
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) {
    throw new Error('Bladet är tomt.');
  }

  if (wb.SheetNames.length > 1) {
    warnings.push(
      `Filen innehåller ${wb.SheetNames.length} blad. Bara det första bladet ("${sheetName}") importeras.`
    );
  }

  // 2. Detect header row
  const header = detectHeader(sheet);
  if (!header) {
    throw new Error(
      'Kunde inte hitta en rubrikrad med årskolumner bland de första 15 raderna. Kolumnrubrikerna bör innehålla årtal (t.ex. 2026, 2027, eller "År 2026-2028").'
    );
  }

  // Warn about missing text columns
  const expectedFields = Object.keys(COLUMN_ALIASES);
  const missingFields = expectedFields.filter((f) => !(f in header.fieldToCol));
  if (missingFields.length > 0) {
    warnings.push(
      `Följande kolumner hittades inte och lämnas tomma: ${missingFields.join(', ')}`
    );
  }

  // Warn about year mapping
  const outsideYears = header.yearsFound.filter(y => y < PLAN_YEAR_START || y > PLAN_YEAR_END);
  if (outsideYears.length > 0) {
    warnings.push(
      `Årskolumner utanför 2026–2035 (${outsideYears.join(', ')}) mappas till närmaste år i planen.`
    );
  }

  // 3. Parse data rows
  const range = XLSX.utils.decode_range(sheet['!ref']!);
  const dataStartRow = header.headerRowIndex + 1;
  const rows: PlanRow[] = [];
  let sortIndex = 0;
  let hasSummaryRow = false;

  for (let r = dataStartRow; r <= range.e.r; r++) {
    // Read text fields
    const nr = header.fieldToCol.nr !== undefined
      ? cellString(sheet[XLSX.utils.encode_cell({ r, c: header.fieldToCol.nr })]?.v)
      : '';
    const byggdel = header.fieldToCol.byggdel !== undefined
      ? cellString(sheet[XLSX.utils.encode_cell({ r, c: header.fieldToCol.byggdel })]?.v)
      : '';
    const atgard = header.fieldToCol.atgard !== undefined
      ? cellString(sheet[XLSX.utils.encode_cell({ r, c: header.fieldToCol.atgard })]?.v)
      : '';
    const tekLivslangd = header.fieldToCol.tek_livslangd !== undefined
      ? cellString(sheet[XLSX.utils.encode_cell({ r, c: header.fieldToCol.tek_livslangd })]?.v)
      : '';
    const aPris = header.fieldToCol.a_pris !== undefined
      ? parseNumber(sheet[XLSX.utils.encode_cell({ r, c: header.fieldToCol.a_pris })]?.v)
      : null;
    const antal = header.fieldToCol.antal !== undefined
      ? parseNumber(sheet[XLSX.utils.encode_cell({ r, c: header.fieldToCol.antal })]?.v)
      : null;
    const utredningspunkter = header.fieldToCol.utredningspunkter !== undefined
      ? cellString(sheet[XLSX.utils.encode_cell({ r, c: header.fieldToCol.utredningspunkter })]?.v)
      : '';

    // Read year columns — map all found years to nearest year_XXXX in our model
    const yearValues: Record<string, number | null> = {};
    // Initialize all plan years to null
    for (const y of PLAN_YEARS) {
      yearValues[`year_${y}`] = null;
    }
    let hasCosts = false;
    for (const year of header.yearsFound) {
      const val = parseNumber(
        sheet[XLSX.utils.encode_cell({ r, c: header.yearToCol[year] })]?.v
      );
      if (val === null || val === 0) continue;
      hasCosts = true;
      // Map to nearest plan year (clamp to 2026-2035)
      const clampedYear = Math.max(PLAN_YEAR_START, Math.min(PLAN_YEAR_END, year));
      const colKey = `year_${clampedYear}`;
      // Accumulate if multiple source years map to same plan year
      yearValues[colKey] = (yearValues[colKey] || 0) + val;
    }

    // Skip completely empty rows
    if (
      !nr && !byggdel && !atgard && !tekLivslangd &&
      aPris === null && antal === null && !hasCosts && !utredningspunkter
    ) {
      continue;
    }

    // Classify
    const rowType = classifyRow(nr, byggdel, atgard, hasCosts);
    if (rowType === 'summary') hasSummaryRow = true;
    const indent = indentLevel(rowType, nr);

    sortIndex++;

    const planRow: PlanRow = {
      id: uuidv4(),
      rowType,
      nr,
      byggdel,
      atgard,
      tek_livslangd: tekLivslangd,
      a_pris: aPris,
      antal,
      year_2026: yearValues.year_2026 ?? null,
      year_2027: yearValues.year_2027 ?? null,
      year_2028: yearValues.year_2028 ?? null,
      year_2029: yearValues.year_2029 ?? null,
      year_2030: yearValues.year_2030 ?? null,
      year_2031: yearValues.year_2031 ?? null,
      year_2032: yearValues.year_2032 ?? null,
      year_2033: yearValues.year_2033 ?? null,
      year_2034: yearValues.year_2034 ?? null,
      year_2035: yearValues.year_2035 ?? null,
      utredningspunkter,
      sortIndex,
      indentLevel: indent,
      isLocked: rowType === 'section' || rowType === 'subsection' || rowType === 'summary',
      status: '',
    };

    rows.push(planRow);
  }

  // 4. Add summary row if none present
  if (!hasSummaryRow && rows.length > 0) {
    sortIndex++;
    rows.push(createSummaryRow(sortIndex));
    warnings.push('Ingen summarad hittades i filen. En tom summarad har lagts till.');
  }

  // 5. Build result
  const sectionCount = rows.filter((r) => r.rowType === 'section').length;
  const itemCount = rows.filter((r) => r.rowType === 'item').length;
  const yearsFound = header.yearsFound;
  const yearRange = {
    start: yearsFound.length > 0 ? yearsFound[0] : PLAN_YEAR_START,
    end: yearsFound.length > 0 ? yearsFound[yearsFound.length - 1] : PLAN_YEAR_END,
  };

  if (rows.length === 0) {
    warnings.push('Inga datarader hittades efter rubrikraden.');
  }

  return { rows, sectionCount, itemCount, yearRange, warnings };
}
