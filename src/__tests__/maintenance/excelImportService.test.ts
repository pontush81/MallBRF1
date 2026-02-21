import * as XLSX from 'xlsx';
import { parseExcelFile, ImportResult } from '../../services/excelImportService';

// ---------------------------------------------------------------------------
// Helper: create an in-memory Excel workbook from a 2D array
// ---------------------------------------------------------------------------

function makeExcelBuffer(data: (string | number | null)[][], sheetName = 'Plan'): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return out;
}

function makeMultiSheetBuffer(
  sheets: { name: string; data: (string | number | null)[][] }[]
): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.data);
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  }
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

// ---------------------------------------------------------------------------
// Minimal valid sheet with header + 1 data row
// ---------------------------------------------------------------------------

const MINIMAL_HEADER = ['Nr', 'Byggdel', 'Åtgärd', 'Tek livslängd', 'a-pris', 'Antal', 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 'Utredningspunkter'];
const MINIMAL_ITEM = ['1.1', 'Fasader', 'Målning', '15 år', 25000, 4, 100000, null, null, null, null, null, null, null, null, null, 'Notering'];

// ============================================================================
// Basic parsing
// ============================================================================

describe('parseExcelFile – basic', () => {
  test('parses a minimal valid file', () => {
    const buf = makeExcelBuffer([MINIMAL_HEADER, MINIMAL_ITEM]);
    const result = parseExcelFile(buf);
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    expect(result.itemCount).toBeGreaterThanOrEqual(1);
    expect(result.yearRange.start).toBeLessThanOrEqual(2035);
    expect(result.yearRange.end).toBeGreaterThanOrEqual(2026);
  });

  test('populates text fields correctly', () => {
    const buf = makeExcelBuffer([MINIMAL_HEADER, MINIMAL_ITEM]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item).toBeDefined();
    expect(item!.byggdel).toBe('Fasader');
    expect(item!.atgard).toBe('Målning');
    expect(item!.tek_livslangd).toBe('15 år');
    expect(item!.utredningspunkter).toBe('Notering');
  });

  test('populates numeric fields correctly', () => {
    const buf = makeExcelBuffer([MINIMAL_HEADER, MINIMAL_ITEM]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.a_pris).toBe(25000);
    expect(item!.antal).toBe(4);
    expect(item!.year_2026).toBe(100000);
    expect(item!.year_2027).toBeNull();
  });

  test('all rows have a unique id', () => {
    const buf = makeExcelBuffer([
      MINIMAL_HEADER,
      MINIMAL_ITEM,
      ['1.2', 'Tak', 'Byte', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
    ]);
    const result = parseExcelFile(buf);
    const ids = result.rows.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('sortIndex is sequential starting from 1', () => {
    const buf = makeExcelBuffer([
      MINIMAL_HEADER,
      ['1', 'Utvändigt', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      MINIMAL_ITEM,
    ]);
    const result = parseExcelFile(buf);
    const nonSummaryRows = result.rows.filter(r => r.atgard !== 'Summa');
    for (let i = 0; i < nonSummaryRows.length; i++) {
      expect(nonSummaryRows[i].sortIndex).toBe(i + 1);
    }
  });
});

// ============================================================================
// Header detection
// ============================================================================

describe('parseExcelFile – header detection', () => {
  test('detects header not on first row', () => {
    const buf = makeExcelBuffer([
      ['Underhållsplan för Brf Gulmåran'],  // title (no year numbers!)
      ['Brf Gulmåran'],                     // subtitle
      [],                                   // blank
      MINIMAL_HEADER,                       // actual header on row 4
      MINIMAL_ITEM,
    ]);
    const result = parseExcelFile(buf);
    expect(result.itemCount).toBeGreaterThanOrEqual(1);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.year_2026).toBe(100000);
  });

  test('throws when no header row found', () => {
    const buf = makeExcelBuffer([
      ['Rubrik utan årtal'],
      ['Data utan årtal'],
    ]);
    expect(() => parseExcelFile(buf)).toThrow('Kunde inte hitta en rubrikrad');
  });

  test('requires at least 1 year column', () => {
    const buf = makeExcelBuffer([
      ['Nr', 'Byggdel', 'Åtgärd'],
      ['1', 'Tak', 'Byte'],
    ]);
    expect(() => parseExcelFile(buf)).toThrow();
  });
});

// ============================================================================
// Column aliases
// ============================================================================

describe('parseExcelFile – column aliases', () => {
  test('recognizes "komponent" as byggdel', () => {
    const header = ['Nr', 'Komponent', 'Aktivitet', 2026];
    const data = ['1.1', 'Takplåt', 'Byte', 50000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.byggdel).toBe('Takplåt');
  });

  test('recognizes "aktivitet" as atgard', () => {
    const header = ['Nr', 'Byggdel', 'Aktivitet', 2026];
    const data = ['1.1', 'Tak', 'Målning', 50000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.atgard).toBe('Målning');
  });

  test('recognizes "beskrivning" as atgard', () => {
    const header = ['Nr', 'Byggdel', 'Beskrivning', 2026];
    const data = ['1.1', 'Tak', 'Byte plåt', 50000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.atgard).toBe('Byte plåt');
  });

  test('recognizes "notering" as utredningspunkter', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026, 'Notering'];
    const data = ['1.1', 'Tak', 'Byte', 50000, 'Bör utredas'];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.utredningspunkter).toBe('Bör utredas');
  });

  test('warns about missing columns', () => {
    const header = [2026]; // minimal – only a year column
    const data = [50000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    expect(result.warnings.some(w => w.includes('hittades inte'))).toBe(true);
  });
});

// ============================================================================
// Year parsing
// ============================================================================

describe('parseExcelFile – year parsing', () => {
  test('handles string year headers', () => {
    const header = ['Åtgärd', '2026', '2027'];
    const data = ['Byte tak', 100000, 200000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.year_2026).toBe(100000);
    expect(item!.year_2027).toBe(200000);
  });

  test('handles numeric year headers', () => {
    const header = ['Åtgärd', 2026, 2027];
    const data = ['Byte', 100000, 200000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.year_2026).toBe(100000);
    expect(item!.year_2027).toBe(200000);
  });

  test('year range reported correctly', () => {
    const header = ['Åtgärd', 2028, 2029, 2030];
    const data = ['Byte', 100, 200, 300];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    expect(result.yearRange.start).toBe(2028);
    expect(result.yearRange.end).toBe(2030);
  });
});

// ============================================================================
// Year clamping & accumulation
// ============================================================================

describe('parseExcelFile – year clamping', () => {
  test('clamps years before 2026 to 2026', () => {
    const header = ['Åtgärd', 2024, 2025, 2026];
    const data = ['Byte', 100, 200, 300];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    // 2024→2026, 2025→2026, 2026→2026 = 100+200+300 = 600
    expect(item!.year_2026).toBe(600);
  });

  test('clamps years after 2035 to 2035', () => {
    const header = ['Åtgärd', 2035, 2036, 2037];
    const data = ['Byte', 100, 200, 300];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    // 2035→2035, 2036→2035, 2037→2035 = 100+200+300 = 600
    expect(item!.year_2035).toBe(600);
  });

  test('warns about years outside 2026–2035', () => {
    const header = ['Åtgärd', 2024, 2026];
    const data = ['Byte', 100, 200];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    expect(result.warnings.some(w => w.includes('utanför 2026–2035'))).toBe(true);
  });

  test('accumulates multiple source years to same target', () => {
    const header = ['Åtgärd', 2022, 2023, 2024, 2025];
    const data = ['Byte', 100, 200, 300, 400];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    // All 4 years clamp to 2026
    expect(item!.year_2026).toBe(1000);
  });
});

// ============================================================================
// Row classification
// ============================================================================

describe('parseExcelFile – row classification', () => {
  test('classifies section rows (nr without dots)', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const data = ['1', 'Utvändigt', '', null];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const section = result.rows.find(r => r.nr === '1');
    expect(section!.rowType).toBe('section');
  });

  test('classifies item rows (have costs)', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const data = ['', '', 'Målning', 50000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.atgard === 'Målning');
    expect(item!.rowType).toBe('item');
  });

  test('classifies item rows (have atgard but no costs)', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const data = ['', '', 'Översyn', null];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.atgard === 'Översyn');
    expect(item!.rowType).toBe('item');
  });

  test('classifies summary rows (keyword "summa")', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const data = ['', 'Summa beräknad kostnad', '', 500000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const summary = result.rows.find(r => r.byggdel === 'Summa beräknad kostnad');
    expect(summary!.rowType).toBe('summary');
  });

  test('classifies summary rows (keyword "totalt")', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const data = ['', 'Totalt inkl osäkerhet', '', 550000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const summary = result.rows.find(r => r.byggdel.includes('Totalt'));
    expect(summary!.rowType).toBe('summary');
  });

  test('classifies summary rows (keyword "osäkerhet")', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const data = ['', 'Osäkerhet', '10%', 50000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const summary = result.rows.find(r => r.byggdel === 'Osäkerhet');
    expect(summary!.rowType).toBe('summary');
  });

  test('sections and subsections are locked', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const rows = [
      ['1', 'Utvändigt', '', null],
      ['1.1', 'Fasader', '', null],
    ];
    const buf = makeExcelBuffer([header, ...rows]);
    const result = parseExcelFile(buf);
    const section = result.rows.find(r => r.nr === '1');
    const subsection = result.rows.find(r => r.nr === '1.1');
    expect(section!.isLocked).toBe(true);
    expect(subsection!.isLocked).toBe(true);
  });

  test('items are not locked', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const data = ['', '', 'Målning', 50000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.isLocked).toBe(false);
  });

  test('all imported rows get empty status', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const rows = [
      ['1', 'Utvändigt', '', null],
      ['', 'Fasad', 'Målning', 50000],
    ];
    const buf = makeExcelBuffer([header, ...rows]);
    const result = parseExcelFile(buf);
    for (const r of result.rows) {
      expect(r.status).toBe('');
    }
  });
});

// ============================================================================
// Indent levels
// ============================================================================

describe('parseExcelFile – indent levels', () => {
  test('section has indentLevel 0', () => {
    const header = ['Nr', 'Byggdel', 2026];
    const buf = makeExcelBuffer([header, ['1', 'Utvändigt', null]]);
    const result = parseExcelFile(buf);
    const section = result.rows.find(r => r.rowType === 'section');
    expect(section!.indentLevel).toBe(0);
  });

  test('subsection has indentLevel 1', () => {
    const header = ['Nr', 'Byggdel', 2026];
    const buf = makeExcelBuffer([header, ['1', 'S', null], ['1.1', 'Fasader', null]]);
    const result = parseExcelFile(buf);
    const sub = result.rows.find(r => r.nr === '1.1');
    expect(sub!.indentLevel).toBe(1);
  });

  test('item with dotted nr gets deeper indent', () => {
    const header = ['Nr', 'Åtgärd', 2026];
    const buf = makeExcelBuffer([header, ['1.1.1', 'Byte', 5000]]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    // nr "1.1.1" has 2 dots → indent = min(2+1, 3) = 3
    expect(item!.indentLevel).toBe(3);
  });

  test('summary has indentLevel 0', () => {
    const header = ['Nr', 'Byggdel', 2026];
    const buf = makeExcelBuffer([header, ['', 'Summa', 5000]]);
    const result = parseExcelFile(buf);
    const summary = result.rows.find(r => r.rowType === 'summary');
    expect(summary!.indentLevel).toBe(0);
  });
});

// ============================================================================
// Empty rows and edge cases
// ============================================================================

describe('parseExcelFile – empty rows & edge cases', () => {
  test('skips completely empty rows', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const rows = [
      ['', '', 'Målning', 50000],
      ['', '', '', null],           // completely empty
      ['', '', 'Byte', 60000],
    ];
    const buf = makeExcelBuffer([header, ...rows]);
    const result = parseExcelFile(buf);
    const items = result.rows.filter(r => r.rowType === 'item');
    expect(items).toHaveLength(2);
  });

  test('auto-generates summary row when none present', () => {
    const header = ['Nr', 'Åtgärd', 2026];
    const data = ['', 'Målning', 50000]; // item, no summary keywords
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    expect(result.warnings.some(w => w.includes('summarad'))).toBe(true);
    const summaryRows = result.rows.filter(r => r.rowType === 'summary');
    expect(summaryRows.length).toBeGreaterThanOrEqual(1);
  });

  test('does not auto-generate summary when one exists', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const rows = [
      ['', '', 'Målning', 50000],
      ['', 'Summa', '', 50000],
    ];
    const buf = makeExcelBuffer([header, ...rows]);
    const result = parseExcelFile(buf);
    expect(result.warnings.every(w => !w.includes('summarad'))).toBe(true);
  });

  test('throws for empty sheet', () => {
    // A sheet with no !ref (empty) should throw
    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};
    XLSX.utils.book_append_sheet(wb, ws, 'Tom');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    expect(() => parseExcelFile(buf)).toThrow();
  });

  test('warns about multiple sheets', () => {
    const buf = makeMultiSheetBuffer([
      { name: 'Plan', data: [MINIMAL_HEADER, MINIMAL_ITEM] },
      { name: 'Extra', data: [['data']] },
    ]);
    const result = parseExcelFile(buf);
    expect(result.warnings.some(w => w.includes('blad'))).toBe(true);
  });

  test('uses only the first sheet', () => {
    const buf = makeMultiSheetBuffer([
      { name: 'Plan', data: [MINIMAL_HEADER, MINIMAL_ITEM] },
      { name: 'Extra', data: [['Åtgärd', 2026], ['Annan data', 999]] },
    ]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.atgard).toBe('Målning'); // from first sheet
  });

  test('warns when no data rows found after header', () => {
    const buf = makeExcelBuffer([MINIMAL_HEADER]); // header only, no data
    const result = parseExcelFile(buf);
    // All rows will be empty and skipped
    expect(result.rows.length).toBe(0);
    expect(result.warnings.some(w => w.includes('Inga datarader'))).toBe(true);
  });
});

// ============================================================================
// Swedish number formatting
// ============================================================================

describe('parseExcelFile – Swedish number formatting', () => {
  test('handles numbers with space thousand separators (string values)', () => {
    // We create cells that contain string "1 000 000" instead of numeric 1000000
    // This simulates a badly formatted Excel where numbers are stored as text
    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    // Header
    ws['A1'] = { v: 'Åtgärd', t: 's' };
    ws['B1'] = { v: 2026, t: 'n' };

    // Data with Swedish formatted string
    ws['A2'] = { v: 'Byte tak', t: 's' };
    ws['B2'] = { v: '1 000 000', t: 's' }; // string with spaces

    ws['!ref'] = 'A1:B2';
    XLSX.utils.book_append_sheet(wb, ws, 'Plan');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.year_2026).toBe(1000000);
  });

  test('handles comma decimal separator (string values)', () => {
    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    ws['A1'] = { v: 'Åtgärd', t: 's' };
    ws['B1'] = { v: 2026, t: 'n' };
    ws['A2'] = { v: 'Byte', t: 's' };
    ws['B2'] = { v: '50000,50', t: 's' };

    ws['!ref'] = 'A1:B2';
    XLSX.utils.book_append_sheet(wb, ws, 'Plan');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.year_2026).toBe(50000.50);
  });
});

// ============================================================================
// Section and item counts
// ============================================================================

describe('parseExcelFile – counts', () => {
  test('sectionCount reflects number of section rows', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const rows = [
      ['1', 'Utvändigt', '', null],
      ['', '', 'Målning', 50000],
      ['2', 'Invändigt', '', null],
      ['', '', 'Byte', 60000],
      ['', 'Summa', '', 110000],
    ];
    const buf = makeExcelBuffer([header, ...rows]);
    const result = parseExcelFile(buf);
    expect(result.sectionCount).toBe(2);
  });

  test('itemCount reflects number of item rows', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 2026];
    const rows = [
      ['1', 'Utvändigt', '', null],
      ['', '', 'Målning', 50000],
      ['', '', 'Byte', 60000],
      ['', '', 'Lagning', 70000],
      ['', 'Summa', '', 180000],
    ];
    const buf = makeExcelBuffer([header, ...rows]);
    const result = parseExcelFile(buf);
    expect(result.itemCount).toBe(3);
  });
});

// ============================================================================
// Full realistic import
// ============================================================================

describe('parseExcelFile – realistic import', () => {
  test('handles a full 4-section plan', () => {
    const header = ['Nr', 'Byggdel', 'Åtgärd', 'Tek livslängd', 'a-pris', 'Antal', 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 'Utredningspunkter'];
    const rows = [
      ['1', 'Utvändigt', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      ['1.1', 'Fasader', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      ['', 'Träplank', 'Byte', '25 år', null, null, null, null, null, null, null, 250000, null, null, null, null, ''],
      ['', 'Sophus', 'Målning', '', null, null, null, null, 25000, null, null, null, null, null, null, null, ''],
      ['2', 'Invändigt', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      ['2.1', 'Källare', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      ['', '', 'Fuktsäkerhet', '', null, null, null, null, null, null, null, null, null, null, null, null, 'Kontrollera'],
      ['3', 'Installationer', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      ['3.1', 'El', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      ['', '', 'Elcentral besiktning', '30 år', null, null, null, null, null, null, null, null, null, null, null, null, 'Kontrollera ålder'],
      ['4', 'Säkerhet', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      ['4.1', 'OVK', '', '', null, null, null, null, null, null, null, null, null, null, null, null, ''],
      ['', '', 'OVK kontroll', 'Lagkrav', null, null, null, null, null, 20000, null, null, null, null, null, null, ''],
      ['', 'Summa beräknad kostnad', '', '', null, null, null, null, 25000, 20000, null, 250000, null, null, null, null, ''],
      ['', 'Osäkerhet', '10%', '', null, null, null, null, 2500, 2000, null, 25000, null, null, null, null, ''],
      ['', 'Totalt inkl osäkerhet', '', '', null, null, null, null, 27500, 22000, null, 275000, null, null, null, null, ''],
    ];

    const buf = makeExcelBuffer([header, ...rows]);
    const result = parseExcelFile(buf);

    expect(result.sectionCount).toBe(4);
    // Byte, Målning, Fuktsäkerhet, Elcentral besiktning, OVK kontroll = 5 items
    expect(result.itemCount).toBe(5);
    expect(result.yearRange).toEqual({ start: 2026, end: 2035 });

    const summaries = result.rows.filter(r => r.rowType === 'summary');
    expect(summaries.length).toBe(3);
  });
});

// ============================================================================
// Year header as text "År 2026"
// ============================================================================

describe('parseExcelFile – year header formats', () => {
  test('handles "År 2026" text format', () => {
    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    ws['A1'] = { v: 'Åtgärd', t: 's' };
    ws['B1'] = { v: 'År 2026', t: 's' };
    ws['C1'] = { v: 'År 2027', t: 's' };

    ws['A2'] = { v: 'Byte', t: 's' };
    ws['B2'] = { v: 100000, t: 'n' };
    ws['C2'] = { v: 200000, t: 'n' };

    ws['!ref'] = 'A1:C2';
    XLSX.utils.book_append_sheet(wb, ws, 'Plan');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.year_2026).toBe(100000);
    expect(item!.year_2027).toBe(200000);
  });
});

// ============================================================================
// Null / zero year values
// ============================================================================

describe('parseExcelFile – null handling in year columns', () => {
  test('null year values stay null', () => {
    const header = ['Åtgärd', 2026, 2027, 2028];
    const data = ['Byte', 100000, null, null];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.year_2026).toBe(100000);
    expect(item!.year_2027).toBeNull();
    expect(item!.year_2028).toBeNull();
  });

  test('zero year values are treated as no cost (null)', () => {
    const header = ['Åtgärd', 2026, 2027];
    const data = ['Byte', 0, 100000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    // The code skips val === 0, so year_2026 stays null
    expect(item!.year_2026).toBeNull();
    expect(item!.year_2027).toBe(100000);
  });

  test('years not present in file remain null', () => {
    const header = ['Åtgärd', 2026]; // only 2026
    const data = ['Byte', 100000];
    const buf = makeExcelBuffer([header, data]);
    const result = parseExcelFile(buf);
    const item = result.rows.find(r => r.rowType === 'item');
    expect(item!.year_2026).toBe(100000);
    expect(item!.year_2027).toBeNull();
    expect(item!.year_2035).toBeNull();
  });
});
