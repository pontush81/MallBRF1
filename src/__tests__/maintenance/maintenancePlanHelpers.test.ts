import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  computeRowTotal,
  setYearValue,
  recalcSummaryRows,
  buildByggdelMap,
  getLagkravItems,
  computeYearlyTotals,
  groupItemsByYear,
  COLUMN_HEADERS,
  COLUMN_WIDTHS,
  FIELD_KEYS,
} from '../../components/maintenance/maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Test helper – build a PlanRow with sensible defaults
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

function makeSummaryRows(): PlanRow[] {
  return [
    makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true, sortIndex: 100 }),
    makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true, sortIndex: 101 }),
    makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true, sortIndex: 102 }),
  ];
}

// ============================================================================
// Constants
// ============================================================================

describe('Constants', () => {
  test('COLUMN_HEADERS has 18 entries', () => {
    expect(COLUMN_HEADERS).toHaveLength(18);
  });

  test('COLUMN_WIDTHS has same length as COLUMN_HEADERS', () => {
    expect(COLUMN_WIDTHS).toHaveLength(COLUMN_HEADERS.length);
  });

  test('FIELD_KEYS has same length as COLUMN_HEADERS', () => {
    expect(FIELD_KEYS).toHaveLength(COLUMN_HEADERS.length);
  });

  test('FIELD_KEYS last entry is "total"', () => {
    expect(FIELD_KEYS[FIELD_KEYS.length - 1]).toBe('total');
  });

  test('FIELD_KEYS contains all 10 year columns', () => {
    for (const yc of YEAR_COLUMNS) {
      expect(FIELD_KEYS).toContain(yc);
    }
  });

  test('COLUMN_HEADERS contains year labels 2026–2035', () => {
    for (let y = 2026; y <= 2035; y++) {
      expect(COLUMN_HEADERS).toContain(String(y));
    }
  });
});

// ============================================================================
// computeRowTotal
// ============================================================================

describe('computeRowTotal', () => {
  test('returns 0 for row with all null year values', () => {
    const row = makeRow();
    expect(computeRowTotal(row)).toBe(0);
  });

  test('sums a single year value', () => {
    const row = makeRow({ year_2026: 100000 });
    expect(computeRowTotal(row)).toBe(100000);
  });

  test('sums multiple year values', () => {
    const row = makeRow({ year_2026: 100000, year_2028: 200000, year_2035: 50000 });
    expect(computeRowTotal(row)).toBe(350000);
  });

  test('sums all 10 year values correctly', () => {
    const row = makeRow({
      year_2026: 10, year_2027: 20, year_2028: 30, year_2029: 40, year_2030: 50,
      year_2031: 60, year_2032: 70, year_2033: 80, year_2034: 90, year_2035: 100,
    });
    expect(computeRowTotal(row)).toBe(550);
  });

  test('ignores null values mixed with numbers', () => {
    const row = makeRow({ year_2026: 100, year_2027: null, year_2028: 200 });
    expect(computeRowTotal(row)).toBe(300);
  });

  test('handles negative values', () => {
    const row = makeRow({ year_2026: 100000, year_2027: -30000 });
    expect(computeRowTotal(row)).toBe(70000);
  });

  test('handles zero values', () => {
    const row = makeRow({ year_2026: 0, year_2027: 0 });
    expect(computeRowTotal(row)).toBe(0);
  });

  test('handles very large values without overflow', () => {
    const row = makeRow({ year_2026: 50000000, year_2027: 50000000 });
    expect(computeRowTotal(row)).toBe(100000000);
  });

  test('handles decimal values', () => {
    const row = makeRow({ year_2026: 100.50, year_2027: 200.75 });
    expect(computeRowTotal(row)).toBeCloseTo(301.25);
  });
});

// ============================================================================
// setYearValue
// ============================================================================

describe('setYearValue', () => {
  test('sets a year column value on a PlanRow', () => {
    const row = makeRow();
    setYearValue(row, 'year_2026', 500000);
    expect(row.year_2026).toBe(500000);
  });

  test('overwrites existing value', () => {
    const row = makeRow({ year_2026: 100 });
    setYearValue(row, 'year_2026', 200);
    expect(row.year_2026).toBe(200);
  });

  test('sets value to zero', () => {
    const row = makeRow({ year_2030: 99999 });
    setYearValue(row, 'year_2030', 0);
    expect(row.year_2030).toBe(0);
  });

  test('works for each year column', () => {
    const row = makeRow();
    for (const yc of YEAR_COLUMNS) {
      setYearValue(row, yc, 42);
      expect(row[yc]).toBe(42);
    }
  });
});

// ============================================================================
// recalcSummaryRows
// ============================================================================

describe('recalcSummaryRows', () => {
  test('sums item rows into Summa row per year', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100000, year_2027: 200000 }),
      makeRow({ id: 'b', year_2026: 50000, year_2028: 300000 }),
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const summa = rows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    expect(summa.year_2026).toBe(150000);
    expect(summa.year_2027).toBe(200000);
    expect(summa.year_2028).toBe(300000);
    expect(summa.year_2029).toBe(0);
  });

  test('calculates Osäkerhet at 10%', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100000 }),
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const osak = rows.find(r => r.byggdel === 'Osäkerhet')!;
    expect(osak.year_2026).toBe(10000); // 10% of 100000
  });

  test('calculates Totalt = Summa + Osäkerhet', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100000 }),
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const totalt = rows.find(r => r.byggdel === 'Totalt inkl osäkerhet')!;
    expect(totalt.year_2026).toBe(110000); // 100000 + 10000
  });

  test('excludes completed items from sums', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100000, status: 'planned' }),
      makeRow({ id: 'b', year_2026: 200000, status: 'completed' }),
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const summa = rows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    expect(summa.year_2026).toBe(100000); // only item 'a'
  });

  test('includes in_progress and postponed items in sums', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100000, status: 'in_progress' }),
      makeRow({ id: 'b', year_2026: 200000, status: 'postponed' }),
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const summa = rows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    expect(summa.year_2026).toBe(300000);
  });

  test('ignores non-item rows (sections, subsections, blank)', () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', year_2026: 999999 }),
      makeRow({ id: 'sub', rowType: 'subsection', year_2026: 888888 }),
      makeRow({ id: 'blank', rowType: 'blank', year_2026: 777777 }),
      makeRow({ id: 'item', rowType: 'item', year_2026: 100000 }),
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const summa = rows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    expect(summa.year_2026).toBe(100000);
  });

  test('handles different osäkerhet percentage (15%)', () => {
    const summaryRows = makeSummaryRows();
    summaryRows[1].atgard = '15%'; // Change osäkerhet to 15%

    const rows = [
      makeRow({ id: 'a', year_2026: 200000 }),
      ...summaryRows,
    ];

    recalcSummaryRows(rows);

    const osak = rows.find(r => r.byggdel === 'Osäkerhet')!;
    expect(osak.year_2026).toBe(30000); // 15% of 200000

    const totalt = rows.find(r => r.byggdel === 'Totalt inkl osäkerhet')!;
    expect(totalt.year_2026).toBe(230000);
  });

  test('handles 0% osäkerhet', () => {
    const summaryRows = makeSummaryRows();
    summaryRows[1].atgard = '0%';

    const rows = [
      makeRow({ id: 'a', year_2026: 100000 }),
      ...summaryRows,
    ];

    recalcSummaryRows(rows);

    const osak = rows.find(r => r.byggdel === 'Osäkerhet')!;
    expect(osak.year_2026).toBe(0);

    const totalt = rows.find(r => r.byggdel === 'Totalt inkl osäkerhet')!;
    expect(totalt.year_2026).toBe(100000);
  });

  test('handles osäkerhet field without number (defaults to 0%)', () => {
    const summaryRows = makeSummaryRows();
    summaryRows[1].atgard = 'okänt';

    const rows = [
      makeRow({ id: 'a', year_2026: 100000 }),
      ...summaryRows,
    ];

    recalcSummaryRows(rows);

    const osak = rows.find(r => r.byggdel === 'Osäkerhet')!;
    expect(osak.year_2026).toBe(0);
  });

  test('zeros out previous summary values before recalculating', () => {
    const summaryRows = makeSummaryRows();
    summaryRows[0].year_2026 = 999999; // stale value
    summaryRows[1].year_2026 = 888888;
    summaryRows[2].year_2026 = 777777;

    const rows = [
      makeRow({ id: 'a', year_2026: 50000 }),
      ...summaryRows,
    ];

    recalcSummaryRows(rows);

    const summa = rows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    expect(summa.year_2026).toBe(50000);

    const osak = rows.find(r => r.byggdel === 'Osäkerhet')!;
    expect(osak.year_2026).toBe(5000);

    const totalt = rows.find(r => r.byggdel === 'Totalt inkl osäkerhet')!;
    expect(totalt.year_2026).toBe(55000);
  });

  test('returns rows unchanged if summary rows are missing', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100000 }),
    ];

    const result = recalcSummaryRows(rows);
    expect(result).toBe(rows);
    expect(rows[0].year_2026).toBe(100000);
  });

  test('handles no items (all summary rows zero)', () => {
    const rows = [...makeSummaryRows()];

    recalcSummaryRows(rows);

    const summa = rows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    for (const yc of YEAR_COLUMNS) {
      expect(summa[yc]).toBe(0);
    }
  });

  test('handles all items completed (all summary rows zero)', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100000, status: 'completed' }),
      makeRow({ id: 'b', year_2027: 200000, status: 'completed' }),
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const summa = rows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    expect(summa.year_2026).toBe(0);
    expect(summa.year_2027).toBe(0);
  });

  test('computes correctly across all 10 years', () => {
    const rows = [
      makeRow({
        id: 'a',
        year_2026: 10, year_2027: 20, year_2028: 30, year_2029: 40, year_2030: 50,
        year_2031: 60, year_2032: 70, year_2033: 80, year_2034: 90, year_2035: 100,
      }),
      makeRow({
        id: 'b',
        year_2026: 5, year_2027: 10, year_2028: 15, year_2029: 20, year_2030: 25,
        year_2031: 30, year_2032: 35, year_2033: 40, year_2034: 45, year_2035: 50,
      }),
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const summa = rows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    expect(summa.year_2026).toBe(15);
    expect(summa.year_2027).toBe(30);
    expect(summa.year_2028).toBe(45);
    expect(summa.year_2029).toBe(60);
    expect(summa.year_2030).toBe(75);
    expect(summa.year_2031).toBe(90);
    expect(summa.year_2032).toBe(105);
    expect(summa.year_2033).toBe(120);
    expect(summa.year_2034).toBe(135);
    expect(summa.year_2035).toBe(150);

    const osak = rows.find(r => r.byggdel === 'Osäkerhet')!;
    // 10% rounded
    expect(osak.year_2026).toBe(Math.round(15 * 0.1));
    expect(osak.year_2035).toBe(Math.round(150 * 0.1));

    const totalt = rows.find(r => r.byggdel === 'Totalt inkl osäkerhet')!;
    expect(totalt.year_2026).toBe(15 + Math.round(15 * 0.1));
    expect(totalt.year_2035).toBe(150 + Math.round(150 * 0.1));
  });

  test('osäkerhet is rounded to nearest integer', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 333 }), // 10% = 33.3 → 33
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const osak = rows.find(r => r.byggdel === 'Osäkerhet')!;
    expect(osak.year_2026).toBe(33); // Math.round(33.3)
  });

  test('osäkerhet rounds .5 up', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 5 }), // 10% = 0.5 → 1
      ...makeSummaryRows(),
    ];

    recalcSummaryRows(rows);

    const osak = rows.find(r => r.byggdel === 'Osäkerhet')!;
    expect(osak.year_2026).toBe(1); // Math.round(0.5)
  });

  test('recognizes "Totalt inkl moms" as totalt row', () => {
    const rows = [
      makeRow({ id: 'a', year_2026: 100000 }),
      makeRow({ id: 'summa', rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true, sortIndex: 100 }),
      makeRow({ id: 'osak', rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true, sortIndex: 101 }),
      makeRow({ id: 'totalt', rowType: 'summary', byggdel: 'Totalt inkl moms', isLocked: true, sortIndex: 102 }),
    ];

    recalcSummaryRows(rows);

    const totalt = rows.find(r => r.byggdel === 'Totalt inkl moms')!;
    expect(totalt.year_2026).toBe(110000);
  });
});

// ============================================================================
// computeYearlyTotals
// ============================================================================

describe('computeYearlyTotals', () => {
  test('returns zero for all years when no items', () => {
    const totals = computeYearlyTotals([]);
    for (const yc of YEAR_COLUMNS) {
      expect(totals[yc]).toBe(0);
    }
  });

  test('sums item rows per year', () => {
    const rows = [
      makeRow({ year_2026: 100, year_2027: 200 }),
      makeRow({ year_2026: 50, year_2028: 300 }),
    ];
    const totals = computeYearlyTotals(rows);
    expect(totals.year_2026).toBe(150);
    expect(totals.year_2027).toBe(200);
    expect(totals.year_2028).toBe(300);
    expect(totals.year_2029).toBe(0);
  });

  test('excludes completed items', () => {
    const rows = [
      makeRow({ year_2026: 100, status: 'planned' }),
      makeRow({ year_2026: 200, status: 'completed' }),
    ];
    const totals = computeYearlyTotals(rows);
    expect(totals.year_2026).toBe(100);
  });

  test('excludes non-item rows', () => {
    const rows = [
      makeRow({ rowType: 'section', year_2026: 999 }),
      makeRow({ rowType: 'summary', year_2026: 888 }),
      makeRow({ rowType: 'item', year_2026: 100 }),
    ];
    const totals = computeYearlyTotals(rows);
    expect(totals.year_2026).toBe(100);
  });

  test('includes in_progress and postponed items', () => {
    const rows = [
      makeRow({ year_2026: 100, status: 'in_progress' }),
      makeRow({ year_2026: 200, status: 'postponed' }),
    ];
    const totals = computeYearlyTotals(rows);
    expect(totals.year_2026).toBe(300);
  });

  test('handles null year values gracefully', () => {
    const rows = [
      makeRow({ year_2026: null, year_2027: 100 }),
    ];
    const totals = computeYearlyTotals(rows);
    expect(totals.year_2026).toBe(0);
    expect(totals.year_2027).toBe(100);
  });
});

// ============================================================================
// buildByggdelMap
// ============================================================================

describe('buildByggdelMap', () => {
  test('items inherit byggdel from parent section', () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', byggdel: 'Fasader' }),
      makeRow({ id: 'item1', rowType: 'item', byggdel: '' }),
      makeRow({ id: 'item2', rowType: 'item', byggdel: '' }),
    ];
    const map = buildByggdelMap(rows);
    expect(map.get('item1')).toBe('Fasader');
    expect(map.get('item2')).toBe('Fasader');
  });

  test('items inherit byggdel from parent subsection', () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub', rowType: 'subsection', byggdel: 'Fönster' }),
      makeRow({ id: 'item1', rowType: 'item', byggdel: '' }),
    ];
    const map = buildByggdelMap(rows);
    expect(map.get('item1')).toBe('Fönster');
  });

  test('items with own byggdel use their own', () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', byggdel: 'Fasader' }),
      makeRow({ id: 'item1', rowType: 'item', byggdel: 'Sophus' }),
    ];
    const map = buildByggdelMap(rows);
    expect(map.get('item1')).toBe('Sophus');
  });

  test('map does not contain section/subsection rows', () => {
    const rows = [
      makeRow({ id: 'sec', rowType: 'section', byggdel: 'Fasader' }),
      makeRow({ id: 'sub', rowType: 'subsection', byggdel: 'Fönster' }),
    ];
    const map = buildByggdelMap(rows);
    expect(map.has('sec')).toBe(false);
    expect(map.has('sub')).toBe(false);
  });

  test('multiple sections produce correct mappings', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', byggdel: 'Utvändigt' }),
      makeRow({ id: 'item1', rowType: 'item', byggdel: '' }),
      makeRow({ id: 'sec2', rowType: 'section', byggdel: 'Installationer' }),
      makeRow({ id: 'item2', rowType: 'item', byggdel: '' }),
    ];
    const map = buildByggdelMap(rows);
    expect(map.get('item1')).toBe('Utvändigt');
    expect(map.get('item2')).toBe('Installationer');
  });

  test('empty byggdel on section preserves previous', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sec2', rowType: 'section', byggdel: '' }),
      makeRow({ id: 'item1', rowType: 'item', byggdel: '' }),
    ];
    const map = buildByggdelMap(rows);
    expect(map.get('item1')).toBe('Utvändigt');
  });
});

// ============================================================================
// getLagkravItems
// ============================================================================

describe('getLagkravItems', () => {
  test('returns items in section 4', () => {
    const rows = [
      makeRow({ id: 'sec4', rowType: 'section', nr: '4', byggdel: 'Säkerhet' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'Brandskyddskontroll' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('item1');
  });

  test('returns items in section 6 (legacy numbering)', () => {
    const rows = [
      makeRow({ id: 'sec6', rowType: 'section', nr: '6', byggdel: 'Lagkrav' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'OVK' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
  });

  test('returns items with "lagkrav" in tek_livslangd', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1' }),
      makeRow({ id: 'item1', rowType: 'item', tek_livslangd: 'Lagkrav' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
  });

  test('returns items with "ovk" in atgard', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'OVK kontroll' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
  });

  test('returns items with "obligatorisk" in atgard', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'Obligatorisk ventilationskontroll' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
  });

  test('returns items with "energideklaration" in atgard', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'Energideklaration' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
  });

  test('returns items with "radon" in atgard', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'Radonmätning' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
  });

  test('returns items with "brandskydd" in atgard', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'Brandskydd genomgång' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
  });

  test('does not return regular items outside lagkrav sections', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'Målning fasad' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(0);
  });

  test('section 4 scope ends at next section', () => {
    const rows = [
      makeRow({ id: 'sec4', rowType: 'section', nr: '4' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'Kontroll' }),
      makeRow({ id: 'sec5', rowType: 'section', nr: '5' }),
      makeRow({ id: 'item2', rowType: 'item', atgard: 'Vanlig uppgift' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('item1');
  });

  test('keyword matching is case-insensitive', () => {
    const rows = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1' }),
      makeRow({ id: 'item1', rowType: 'item', atgard: 'BRANDSKYDD' }),
      makeRow({ id: 'item2', rowType: 'item', tek_livslangd: 'LAGKRAV' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(2);
  });

  test('does not include section/subsection rows themselves', () => {
    const rows = [
      makeRow({ id: 'sec4', rowType: 'section', nr: '4', byggdel: 'Säkerhet' }),
      makeRow({ id: 'sub', rowType: 'subsection', nr: '4.1', byggdel: 'Brandskydd' }),
    ];
    const result = getLagkravItems(rows);
    expect(result).toHaveLength(0);
  });

  test('returns empty array for empty input', () => {
    expect(getLagkravItems([])).toHaveLength(0);
  });
});

// ============================================================================
// Consistency: computeYearlyTotals matches recalcSummaryRows
// ============================================================================

describe('computeYearlyTotals vs recalcSummaryRows consistency', () => {
  test('both produce the same yearly sums for items', () => {
    const items = [
      makeRow({ id: 'a', year_2026: 100000, year_2028: 200000 }),
      makeRow({ id: 'b', year_2026: 50000, year_2030: 300000, status: 'completed' }),
      makeRow({ id: 'c', year_2027: 75000, status: 'in_progress' }),
    ];
    const summaryRows = makeSummaryRows();
    const allRows = [...items, ...summaryRows];

    recalcSummaryRows(allRows);
    const yearlyTotals = computeYearlyTotals(items);

    const summa = allRows.find(r => r.byggdel === 'Summa beräknad kostnad')!;
    for (const yc of YEAR_COLUMNS) {
      expect(summa[yc]).toBe(yearlyTotals[yc]);
    }
  });
});

// ---------------------------------------------------------------------------
// groupItemsByYear
// ---------------------------------------------------------------------------

describe('groupItemsByYear', () => {
  it('groups items by the years they have costs in', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub1', rowType: 'subsection', byggdel: 'Fasader' }),
      makeRow({ id: 'a', atgard: 'Plåtarbeten', byggdel: 'Ventilationsintag', year_2026: 88000 }),
      makeRow({ id: 'b', atgard: 'Målning', byggdel: 'Sophus', year_2028: 25000 }),
      makeRow({ id: 'sec2', rowType: 'section', nr: '2', byggdel: 'Invändigt' }),
      makeRow({ id: 'sub2', rowType: 'subsection', byggdel: 'Tvättstuga' }),
      makeRow({ id: 'c', atgard: 'Byte maskiner', byggdel: 'Tvättstuga', year_2026: 60000, year_2028: 60000 }),
      ...makeSummaryRows(),
    ];

    const result = groupItemsByYear(rows);

    const y2026 = result.find(y => y.yearCol === 'year_2026');
    expect(y2026).toBeDefined();
    expect(y2026!.items).toHaveLength(2);
    expect(y2026!.total).toBe(148000);

    const y2028 = result.find(y => y.yearCol === 'year_2028');
    expect(y2028).toBeDefined();
    expect(y2028!.items).toHaveLength(2);
    expect(y2028!.total).toBe(85000);

    const y2027 = result.find(y => y.yearCol === 'year_2027');
    expect(y2027).toBeDefined();
    expect(y2027!.items).toHaveLength(0);
    expect(y2027!.total).toBe(0);
  });

  it('sorts items within each year by amount descending', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'a', atgard: 'Liten', byggdel: 'A', year_2026: 10000 }),
      makeRow({ id: 'b', atgard: 'Stor', byggdel: 'B', year_2026: 90000 }),
      makeRow({ id: 'c', atgard: 'Mellan', byggdel: 'C', year_2026: 50000 }),
      ...makeSummaryRows(),
    ];

    const result = groupItemsByYear(rows);
    const y2026 = result.find(y => y.yearCol === 'year_2026')!;
    expect(y2026.items[0].row.id).toBe('b');
    expect(y2026.items[1].row.id).toBe('c');
    expect(y2026.items[2].row.id).toBe('a');
  });

  it('excludes completed items', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'a', atgard: 'Klar', year_2026: 50000, status: 'completed' }),
      makeRow({ id: 'b', atgard: 'Pågår', year_2026: 30000, status: 'planned' }),
      ...makeSummaryRows(),
    ];

    const result = groupItemsByYear(rows);
    const y2026 = result.find(y => y.yearCol === 'year_2026')!;
    expect(y2026.items).toHaveLength(1);
    expect(y2026.items[0].row.id).toBe('b');
  });

  it('includes byggdel from byggdelMap', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'sec', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub', rowType: 'subsection', byggdel: 'Fasader' }),
      makeRow({ id: 'a', atgard: 'Arbete', byggdel: '', year_2026: 10000 }),
      ...makeSummaryRows(),
    ];

    const result = groupItemsByYear(rows);
    const y2026 = result.find(y => y.yearCol === 'year_2026')!;
    expect(y2026.items[0].byggdel).toBe('Fasader');
  });
});
