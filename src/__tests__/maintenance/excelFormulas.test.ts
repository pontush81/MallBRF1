import * as XLSX from 'xlsx';
import { PlanRow } from '../../services/maintenancePlanService';
import {
  exportToExcelBuffer,
  COLUMN_HEADERS,
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
    status: '',
    ...overrides,
  };
}

/**
 * Export rows via exportToExcelBuffer, then read back with xlsx for verification.
 * Returns the worksheet and the xlsx library for cell address encoding.
 */
async function exportAndRead(rows: PlanRow[]): Promise<XLSX.WorkSheet> {
  const buffer = await exportToExcelBuffer(rows);
  const wb = XLSX.read(buffer, { type: 'array' });
  return wb.Sheets['Underhållsplan'];
}

// ============================================================================
// Total column formulas (column R)
// ============================================================================

describe('exportToExcelBuffer – total column (R)', () => {
  test('every data row gets a SUM formula in the total column', async () => {
    const rows = [
      makeRow({ id: 'a', atgard: 'A', year_2026: 100, year_2028: 200 }),
      makeRow({ id: 'b', atgard: 'B', year_2027: 300 }),
    ];
    const ws = await exportAndRead(rows);

    // Data starts at Excel row 6 (0-indexed row 5)
    // Total column = R = column index 17
    const cellA = ws[XLSX.utils.encode_cell({ r: 5, c: 17 })];
    expect(cellA.f).toBe('SUM(G6:P6)');

    const cellB = ws[XLSX.utils.encode_cell({ r: 6, c: 17 })];
    expect(cellB.f).toBe('SUM(G7:P7)');
  });

  test('section rows also get total formula', async () => {
    const rows = [
      makeRow({ rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ atgard: 'Byte', year_2026: 100 }),
    ];
    const ws = await exportAndRead(rows);

    const sectionCell = ws[XLSX.utils.encode_cell({ r: 5, c: 17 })];
    expect(sectionCell.f).toBe('SUM(G6:P6)');
  });

  test('summary rows get total formula', async () => {
    const rows = [
      makeRow({ atgard: 'Byte', year_2026: 100 }),
      makeRow({ rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    const summaCell = ws[XLSX.utils.encode_cell({ r: 6, c: 17 })];
    expect(summaCell.f).toBe('SUM(G7:P7)');
  });
});

// ============================================================================
// Summa row formulas
// ============================================================================

describe('exportToExcelBuffer – Summa beräknad kostnad', () => {
  test('Summa row gets SUM formula across data rows for each year column', async () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'a', atgard: 'A', year_2026: 100 }),
      makeRow({ id: 'b', atgard: 'B', year_2026: 200 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    // Summa is at Excel row 9 (0-indexed row 8), data rows 6-8
    const summaG = ws[XLSX.utils.encode_cell({ r: 8, c: 6 })]; // year_2026
    expect(summaG.f).toBe('SUM(G6:G8)');

    const summaH = ws[XLSX.utils.encode_cell({ r: 8, c: 7 })]; // year_2027
    expect(summaH.f).toBe('SUM(H6:H8)');
  });

  test('Summa formula covers all year columns G through P', async () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

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

describe('exportToExcelBuffer – Osäkerhet', () => {
  test('Osäkerhet row gets ROUND(Summa*0.1,0) formula', async () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    const osakG = ws[XLSX.utils.encode_cell({ r: 7, c: 6 })];
    expect(osakG.f).toBe('ROUND(G7*0.1,0)');
  });

  test('Osäkerhet uses correct percentage from atgard field', async () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '15%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    const osakG = ws[XLSX.utils.encode_cell({ r: 7, c: 6 })];
    expect(osakG.f).toBe('ROUND(G7*0.15,0)');
  });

  test('Osäkerhet defaults to 0 when no percentage found', async () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    const osakG = ws[XLSX.utils.encode_cell({ r: 7, c: 6 })];
    expect(osakG.f).toBe('ROUND(G7*0,0)');
  });
});

// ============================================================================
// Totalt row formulas
// ============================================================================

describe('exportToExcelBuffer – Totalt inkl osäkerhet', () => {
  test('Totalt row gets Summa+Osäkerhet formula', async () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    const totaltG = ws[XLSX.utils.encode_cell({ r: 8, c: 6 })];
    expect(totaltG.f).toBe('G7+G8');
  });

  test('Totalt formula works for all year columns', async () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    const yearCols = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    for (let i = 0; i < yearCols.length; i++) {
      const addr = XLSX.utils.encode_cell({ r: 8, c: 6 + i });
      expect(ws[addr].f).toBe(`${yearCols[i]}7+${yearCols[i]}8`);
    }
  });

  test('recognizes "Totalt inkl moms" as totalt row', async () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl moms', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    const totaltG = ws[XLSX.utils.encode_cell({ r: 8, c: 6 })];
    expect(totaltG.f).toBe('G7+G8');
  });
});

// ============================================================================
// No summary rows – graceful handling
// ============================================================================

describe('exportToExcelBuffer – no summary rows', () => {
  test('works when no summary rows exist (only total column formulas)', async () => {
    const rows = [
      makeRow({ id: 'a', atgard: 'A', year_2026: 100 }),
      makeRow({ id: 'b', atgard: 'B', year_2026: 200 }),
    ];
    const ws = await exportAndRead(rows);

    const cellA = ws[XLSX.utils.encode_cell({ r: 5, c: 17 })];
    expect(cellA.f).toBe('SUM(G6:P6)');
  });
});

// ============================================================================
// Full integration: export with formulas, read back, verify
// ============================================================================

describe('exportToExcelBuffer – full integration', () => {
  test('all formula types present in exported workbook', async () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', nr: '1', byggdel: 'Utvändigt', isLocked: true }),
      makeRow({ id: 'a', atgard: 'Byte', year_2026: 100000, year_2028: 200000 }),
      makeRow({ id: 'b', atgard: 'Målning', year_2026: 50000 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];
    const ws = await exportAndRead(rows);

    // Total column for item 'Byte' (Excel row 7, 0-indexed row 6)
    const totalCell = ws[XLSX.utils.encode_cell({ r: 6, c: 17 })];
    expect(totalCell.f).toBe('SUM(G7:P7)');

    // Summa row (Excel row 9, 0-indexed row 8) year_2026 column
    const summaCell = ws[XLSX.utils.encode_cell({ r: 8, c: 6 })];
    expect(summaCell.f).toBe('SUM(G6:G8)');

    // Osäkerhet row (Excel row 10, 0-indexed row 9) year_2026 column
    const osakCell = ws[XLSX.utils.encode_cell({ r: 9, c: 6 })];
    expect(osakCell.f).toBe('ROUND(G9*0.1,0)');

    // Totalt row (Excel row 11, 0-indexed row 10) year_2026 column
    const totaltCell = ws[XLSX.utils.encode_cell({ r: 10, c: 6 })];
    expect(totaltCell.f).toBe('G9+G10');
  });

  test('exported workbook can be written without errors', async () => {
    const rows = [
      makeRow({ id: 'a', atgard: 'Byte', year_2026: 100000 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true }),
    ];

    // Should not throw
    const buffer = await exportToExcelBuffer(rows);
    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  test('exported workbook has correct sheet name', async () => {
    const rows = [makeRow({ atgard: 'Test' })];
    const buffer = await exportToExcelBuffer(rows);
    const wb = XLSX.read(buffer, { type: 'array' });
    expect(wb.SheetNames).toContain('Underhållsplan');
  });

  test('exported sheet has title rows before header', async () => {
    const rows = [makeRow({ atgard: 'Test' })];
    const ws = await exportAndRead(rows);
    expect(ws['A1']?.v).toBe('Underhållsplan 2026\u20132035');
    expect(ws['A2']?.v).toBe('Brf Gulm\u00e5ran');
    expect(String(ws['A3']?.v)).toMatch(/Exporterad: \d{4}-\d{2}-\d{2}/);
  });

  test('exported sheet has correct column headers at row 5', async () => {
    const rows = [makeRow({ atgard: 'Test' })];
    const ws = await exportAndRead(rows);
    for (let i = 0; i < COLUMN_HEADERS.length; i++) {
      const addr = XLSX.utils.encode_cell({ r: 4, c: i });
      expect(String(ws[addr]?.v)).toBe(String(COLUMN_HEADERS[i]));
    }
  });
});
