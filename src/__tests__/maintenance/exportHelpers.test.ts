import { PlanRow } from '../../services/maintenancePlanService';
import {
  buildExportRows,
  exportDataToTsv,
  exportDataToCsv,
  COLUMN_HEADERS,
  computeRowTotal,
} from '../../components/maintenance/maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Helper: build PlanRow
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

// ============================================================================
// buildExportRows
// ============================================================================

describe('buildExportRows', () => {
  test('first row is the column headers', () => {
    const data = buildExportRows([]);
    expect(data[0]).toEqual(COLUMN_HEADERS);
  });

  test('returns header + 1 row for 1 item', () => {
    const rows = [makeRow({ atgard: 'Byte' })];
    const data = buildExportRows(rows);
    expect(data).toHaveLength(2); // header + 1 data row
  });

  test('data row contains correct text fields', () => {
    const rows = [makeRow({ nr: '1.1', byggdel: 'Fasad', atgard: 'Målning', tek_livslangd: '15 år', utredningspunkter: 'Notering' })];
    const data = buildExportRows(rows);
    const row = data[1];
    expect(row[0]).toBe('1.1');       // Nr
    expect(row[1]).toBe('Fasad');     // Byggdel
    expect(row[2]).toBe('Målning');   // Åtgärd
    expect(row[3]).toBe('15 år');     // Tek livslängd
    expect(row[16]).toBe('Notering'); // Utredningspunkter
  });

  test('data row contains correct numeric fields', () => {
    const rows = [makeRow({ a_pris: 25000, antal: 4, year_2026: 100000 })];
    const data = buildExportRows(rows);
    const row = data[1];
    expect(row[4]).toBe(25000);  // a-pris
    expect(row[5]).toBe(4);      // Antal
    expect(row[6]).toBe(100000); // 2026
  });

  test('last column is computed total', () => {
    const rows = [makeRow({ year_2026: 100000, year_2028: 200000 })];
    const data = buildExportRows(rows);
    const row = data[1];
    expect(row[17]).toBe(300000); // Totalt kr inkl moms
  });

  test('null values are exported as null', () => {
    const rows = [makeRow({ year_2027: null })];
    const data = buildExportRows(rows);
    const row = data[1];
    expect(row[7]).toBeNull(); // year_2027
  });

  test('boolean fields are exported as null', () => {
    const rows = [makeRow()];
    const data = buildExportRows(rows);
    const row = data[1];
    // isLocked is boolean but not in FIELD_KEYS, so no boolean should appear
    for (const cell of row) {
      expect(typeof cell).not.toBe('boolean');
    }
  });

  test('handles multiple rows', () => {
    const rows = [
      makeRow({ atgard: 'A', year_2026: 100 }),
      makeRow({ atgard: 'B', year_2026: 200 }),
      makeRow({ atgard: 'C', year_2026: 300 }),
    ];
    const data = buildExportRows(rows);
    expect(data).toHaveLength(4); // header + 3 data rows
    expect(data[1][2]).toBe('A');
    expect(data[2][2]).toBe('B');
    expect(data[3][2]).toBe('C');
  });

  test('handles all row types', () => {
    const rows = [
      makeRow({ rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ rowType: 'subsection', nr: '1.1', byggdel: 'Fasader' }),
      makeRow({ rowType: 'item', atgard: 'Byte', year_2026: 100 }),
      makeRow({ rowType: 'summary', byggdel: 'Summa', year_2026: 100 }),
    ];
    const data = buildExportRows(rows);
    expect(data).toHaveLength(5);
  });
});

// ============================================================================
// exportDataToTsv
// ============================================================================

describe('exportDataToTsv', () => {
  test('joins cells with tabs', () => {
    const data = [['A', 'B', 'C']];
    expect(exportDataToTsv(data)).toBe('A\tB\tC');
  });

  test('joins rows with newlines', () => {
    const data = [['A', 'B'], ['C', 'D']];
    expect(exportDataToTsv(data)).toBe('A\tB\nC\tD');
  });

  test('converts null to empty string', () => {
    const data = [['A', null, 'C']];
    expect(exportDataToTsv(data)).toBe('A\t\tC');
  });

  test('handles numbers', () => {
    const data = [[100000, 'text', 42.5]];
    expect(exportDataToTsv(data)).toBe('100000\ttext\t42.5');
  });

  test('handles empty data', () => {
    expect(exportDataToTsv([])).toBe('');
  });

  test('full export row produces correct TSV', () => {
    const rows = [makeRow({ nr: '1', byggdel: 'Tak', atgard: 'Byte', year_2026: 50000 })];
    const data = buildExportRows(rows);
    const tsv = exportDataToTsv(data);
    const lines = tsv.split('\n');
    expect(lines).toHaveLength(2); // header + 1 row
    // Header line should have correct tab count
    expect(lines[0].split('\t')).toHaveLength(COLUMN_HEADERS.length);
    // Data line
    const cells = lines[1].split('\t');
    expect(cells[0]).toBe('1');     // Nr
    expect(cells[1]).toBe('Tak');   // Byggdel
    expect(cells[2]).toBe('Byte');  // Åtgärd
    expect(cells[6]).toBe('50000'); // 2026
  });

  test('pasteable into Google Sheets (tab-separated)', () => {
    const data = [
      COLUMN_HEADERS,
      ['1.1', 'Fasad', 'Målning', '15 år', 25000, 4, 100000, null, null, null, null, null, null, null, null, null, '', 100000],
    ];
    const tsv = exportDataToTsv(data);
    // Each line should have same number of tabs
    const lines = tsv.split('\n');
    const tabCount0 = (lines[0].match(/\t/g) || []).length;
    const tabCount1 = (lines[1].match(/\t/g) || []).length;
    expect(tabCount0).toBe(tabCount1);
    expect(tabCount0).toBe(COLUMN_HEADERS.length - 1); // n-1 tabs for n columns
  });
});

// ============================================================================
// exportDataToCsv
// ============================================================================

describe('exportDataToCsv', () => {
  test('joins cells with commas', () => {
    const data = [['A', 'B', 'C']];
    expect(exportDataToCsv(data)).toBe('A,B,C');
  });

  test('joins rows with newlines', () => {
    const data = [['A', 'B'], ['C', 'D']];
    expect(exportDataToCsv(data)).toBe('A,B\nC,D');
  });

  test('converts null to empty string', () => {
    const data = [['A', null, 'C']];
    expect(exportDataToCsv(data)).toBe('A,,C');
  });

  test('handles numbers', () => {
    const data = [[100000, 'text', 42.5]];
    expect(exportDataToCsv(data)).toBe('100000,text,42.5');
  });

  test('quotes fields containing commas', () => {
    const data = [['Hej, då', 'vanlig']];
    expect(exportDataToCsv(data)).toBe('"Hej, då",vanlig');
  });

  test('quotes fields containing newlines', () => {
    const data = [['Rad 1\nRad 2', 'vanlig']];
    expect(exportDataToCsv(data)).toBe('"Rad 1\nRad 2",vanlig');
  });

  test('escapes double quotes inside quoted fields', () => {
    const data = [['Han sa "hej"', 'vanlig']];
    expect(exportDataToCsv(data)).toBe('"Han sa ""hej""",vanlig');
  });

  test('handles empty data', () => {
    expect(exportDataToCsv([])).toBe('');
  });

  test('full export row produces correct CSV', () => {
    const rows = [makeRow({ nr: '1', byggdel: 'Tak', atgard: 'Byte', year_2026: 50000 })];
    const data = buildExportRows(rows);
    const csv = exportDataToCsv(data);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    // Data line should contain 50000
    expect(lines[1]).toContain('50000');
    // Nr should be first
    expect(lines[1].startsWith('1,')).toBe(true);
  });

  test('Swedish characters preserved in CSV', () => {
    const data = [['Åtgärd', 'Byggdel'], ['Översyn fuktsäkerhet', 'Källare']];
    const csv = exportDataToCsv(data);
    expect(csv).toContain('Åtgärd');
    expect(csv).toContain('Översyn fuktsäkerhet');
    expect(csv).toContain('Källare');
  });
});

// ============================================================================
// Integration: buildExportRows → TSV/CSV consistency
// ============================================================================

describe('Export integration', () => {
  const testRows = [
    makeRow({ nr: '1', rowType: 'section', byggdel: 'Utvändigt' }),
    makeRow({ nr: '1.1', rowType: 'subsection', byggdel: 'Fasader' }),
    makeRow({ atgard: 'Målning', year_2026: 100000, year_2028: 200000 }),
    makeRow({ rowType: 'summary', byggdel: 'Summa beräknad kostnad', year_2026: 100000, year_2028: 200000 }),
  ];

  test('TSV and CSV have same number of lines', () => {
    const data = buildExportRows(testRows);
    const tsv = exportDataToTsv(data);
    const csv = exportDataToCsv(data);
    expect(tsv.split('\n').length).toBe(csv.split('\n').length);
  });

  test('TSV and CSV have same number of columns per line', () => {
    const data = buildExportRows(testRows);
    const tsv = exportDataToTsv(data);
    const tsvCols = tsv.split('\n')[0].split('\t').length;
    // CSV column count is harder due to quoting, but header has no commas
    const csv = exportDataToCsv(data);
    const csvCols = csv.split('\n')[0].split(',').length;
    expect(tsvCols).toBe(csvCols);
    expect(tsvCols).toBe(COLUMN_HEADERS.length);
  });

  test('computed total matches computeRowTotal for each row', () => {
    const data = buildExportRows(testRows);
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const lastCell = row[row.length - 1];
      const expected = computeRowTotal(testRows[i - 1]);
      expect(lastCell).toBe(expected);
    }
  });
});
