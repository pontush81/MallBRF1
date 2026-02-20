import * as XLSX from 'xlsx';
import { PlanRow } from '../../services/maintenancePlanService';
import {
  applyExcelFormulas,
  buildExportRows,
  COLUMN_HEADERS,
  COLUMN_WIDTHS,
  computeRowTotal,
} from '../../components/maintenance/maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<PlanRow> = {}): PlanRow {
  return {
    id: overrides.id ?? 'test-id',
    rowType: 'item',
    nr: '',
    byggdel: '',
    atgard: '',
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
    sortIndex: 1,
    indentLevel: 2,
    isLocked: false,
    status: 'planned',
    ...overrides,
  };
}

/**
 * Build a worksheet from rows using the same approach as the actual export,
 * with 4 title rows + 1 header row before data.
 */
function buildWorksheet(rows: PlanRow[]): XLSX.WorkSheet {
  const wsData: (string | number | null)[][] = [];
  wsData.push(['Underhållsplan']);
  wsData.push(['Brf Test']);
  wsData.push(['Exporterad']);
  wsData.push([]);
  wsData.push(COLUMN_HEADERS);

  const exportData = buildExportRows(rows);
  // Skip header from buildExportRows (we already added COLUMN_HEADERS)
  for (let i = 1; i < exportData.length; i++) {
    wsData.push(exportData[i]);
  }

  return XLSX.utils.aoa_to_sheet(wsData);
}

// ============================================================================
// Total column formulas (column R)
// ============================================================================

describe('applyExcelFormulas – total column (R)', () => {
  test('every data row gets a SUM formula in the total column', () => {
    const rows = [
      makeRow({ id: 'a', atgard: 'A', year_2026: 100, year_2028: 200 }),
      makeRow({ id: 'b', atgard: 'B', year_2027: 300 }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    // Data starts at row 5 (0-indexed), so Excel rows 6 and 7
    // Total column = R = column index 17
    const cellA = ws[XLSX.utils.encode_cell({ r: 5, c: 17 })];
    expect(cellA.f).toBe('SUM(G6:P6)');

    const cellB = ws[XLSX.utils.encode_cell({ r: 6, c: 17 })];
    expect(cellB.f).toBe('SUM(G7:P7)');
  });

  test('section rows also get total formula', () => {
    const rows = [
      makeRow({ rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ atgard: 'Byte', year_2026: 100 }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    const sectionCell = ws[XLSX.utils.encode_cell({ r: 5, c: 17 })];
    expect(sectionCell.f).toBe('SUM(G6:P6)');
  });

  test('summary rows get total formula', () => {
    const rows = [
      makeRow({ atgard: 'Byte', year_2026: 100 }),
      makeRow({ rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    const summaCell = ws[XLSX.utils.encode_cell({ r: 6, c: 17 })];
    expect(summaCell.f).toBe('SUM(G7:P7)');
  });
});

// ============================================================================
// Summa row formulas
// ============================================================================

describe('applyExcelFormulas – Summa beräknad kostnad', () => {
  test('Summa row gets SUM formula across data rows for each year column', () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'a', atgard: 'A', year_2026: 100 }),
      makeRow({ id: 'b', atgard: 'B', year_2026: 200 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    // Summa is at sheet row 8 (0-indexed), data rows 5-7
    // firstDataSheetRow=5, lastNonSummarySheetRow=7 (item 'b')
    // Excel: G6:G8
    const summaG = ws[XLSX.utils.encode_cell({ r: 8, c: 6 })]; // year_2026
    expect(summaG.f).toBe('SUM(G6:G8)');

    const summaH = ws[XLSX.utils.encode_cell({ r: 8, c: 7 })]; // year_2027
    expect(summaH.f).toBe('SUM(H6:H8)');
  });

  test('Summa formula covers all year columns G through P', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    const yearCols = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    for (const col of yearCols) {
      const addr = ws[XLSX.utils.encode_cell({ r: 6, c: yearCols.indexOf(col) + 6 })];
      expect(addr.f).toContain(`${col}6`);
    }
  });
});

// ============================================================================
// Osäkerhet row formulas
// ============================================================================

describe('applyExcelFormulas – Osäkerhet', () => {
  test('Osäkerhet row gets ROUND(Summa*0.1,0) formula', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    // Summa at sheet row 6, Osäkerhet at sheet row 7
    // Excel: Summa=row 7, Osäkerhet=row 8
    const osakG = ws[XLSX.utils.encode_cell({ r: 7, c: 6 })];
    expect(osakG.f).toBe('ROUND(G7*0.1,0)');
  });

  test('Osäkerhet uses correct percentage from atgard field', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '15%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    const osakG = ws[XLSX.utils.encode_cell({ r: 7, c: 6 })];
    expect(osakG.f).toBe('ROUND(G7*0.15,0)');
  });

  test('Osäkerhet defaults to 0 when no percentage found', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    const osakG = ws[XLSX.utils.encode_cell({ r: 7, c: 6 })];
    expect(osakG.f).toBe('ROUND(G7*0,0)');
  });
});

// ============================================================================
// Totalt row formulas
// ============================================================================

describe('applyExcelFormulas – Totalt inkl osäkerhet', () => {
  test('Totalt row gets Summa+Osäkerhet formula', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    // Summa at Excel row 7, Osäkerhet at row 8, Totalt at row 9
    const totaltG = ws[XLSX.utils.encode_cell({ r: 8, c: 6 })];
    expect(totaltG.f).toBe('G7+G8');
  });

  test('Totalt formula works for all year columns', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    const yearCols = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    for (let i = 0; i < yearCols.length; i++) {
      const addr = XLSX.utils.encode_cell({ r: 8, c: 6 + i });
      expect(ws[addr].f).toBe(`${yearCols[i]}7+${yearCols[i]}8`);
    }
  });

  test('recognizes "Totalt inkl moms" as totalt row', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl moms', isLocked: true }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    const totaltG = ws[XLSX.utils.encode_cell({ r: 8, c: 6 })];
    expect(totaltG.f).toBe('G7+G8');
  });
});

// ============================================================================
// No summary rows – graceful handling
// ============================================================================

describe('applyExcelFormulas – no summary rows', () => {
  test('works when no summary rows exist (only total column formulas)', () => {
    const rows = [
      makeRow({ id: 'a', atgard: 'A', year_2026: 100 }),
      makeRow({ id: 'b', atgard: 'B', year_2026: 200 }),
    ];
    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    // Total column should still have formulas
    const cellA = ws[XLSX.utils.encode_cell({ r: 5, c: 17 })];
    expect(cellA.f).toBe('SUM(G6:P6)');
  });
});

// ============================================================================
// Full integration: export with formulas, read back, verify
// ============================================================================

describe('applyExcelFormulas – full integration', () => {
  test('all formula types present on worksheet before write', () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', nr: '1', byggdel: 'Utvändigt', isLocked: true }),
      makeRow({ id: 'a', atgard: 'Byte', year_2026: 100000, year_2028: 200000 }),
      makeRow({ id: 'b', atgard: 'Målning', year_2026: 50000 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];

    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    // Total column for item 'Byte' (sheet row 6, Excel row 7)
    const totalCell = ws[XLSX.utils.encode_cell({ r: 6, c: 17 })];
    expect(totalCell.f).toBe('SUM(G7:P7)');

    // Summa row (sheet row 8, Excel row 9) year_2026 column
    const summaCell = ws[XLSX.utils.encode_cell({ r: 8, c: 6 })];
    expect(summaCell.f).toBe('SUM(G6:G8)');

    // Osäkerhet row (sheet row 9, Excel row 10) year_2026 column
    const osakCell = ws[XLSX.utils.encode_cell({ r: 9, c: 6 })];
    expect(osakCell.f).toBe('ROUND(G9*0.1,0)');

    // Totalt row (sheet row 10, Excel row 11) year_2026 column
    const totaltCell = ws[XLSX.utils.encode_cell({ r: 10, c: 6 })];
    expect(totaltCell.f).toBe('G9+G10');
  });

  test('worksheet can be written to xlsx without errors', () => {
    const rows = [
      makeRow({ id: 'a', atgard: 'Byte', year_2026: 100000 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];

    const ws = buildWorksheet(rows);
    applyExcelFormulas(ws, rows, 4);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plan');
    expect(() => XLSX.write(wb, { type: 'array', bookType: 'xlsx' })).not.toThrow();
  });
});
