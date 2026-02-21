import { createDefaultPlanData } from '../../data/maintenancePlanSeedData';
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  computeRowTotal,
  recalcSummaryRows,
  computeYearlyTotals,
  getLagkravItems,
  buildByggdelMap,
} from '../../components/maintenance/maintenancePlanHelpers';

// ============================================================================
// Seed data structure validation
// ============================================================================

describe('Seed data – structure', () => {
  const planData = createDefaultPlanData();
  const { rows } = planData;

  test('createDefaultPlanData returns non-empty rows', () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  test('has columns array with expected fields', () => {
    expect(planData.columns).toContain('nr');
    expect(planData.columns).toContain('byggdel');
    expect(planData.columns).toContain('atgard');
    expect(planData.columns).toContain('year_2026');
    expect(planData.columns).toContain('year_2035');
  });

  test('has exactly 4 sections', () => {
    const sections = rows.filter(r => r.rowType === 'section');
    expect(sections).toHaveLength(4);
    expect(sections.map(s => s.nr)).toEqual(['1', '2', '3', '4']);
  });

  test('section names are correct', () => {
    const sections = rows.filter(r => r.rowType === 'section');
    expect(sections[0].byggdel).toBe('Utvändigt');
    expect(sections[1].byggdel).toBe('Invändigt');
    expect(sections[2].byggdel).toBe('Installationer');
    expect(sections[3].byggdel).toBe('Säkerhet & myndighetskrav');
  });

  test('has subsections under each section', () => {
    const subsections = rows.filter(r => r.rowType === 'subsection');
    expect(subsections.length).toBeGreaterThan(0);

    // At least one subsection per section
    for (const secNr of ['1', '2', '3', '4']) {
      const subs = subsections.filter(s => s.nr.startsWith(secNr + '.'));
      expect(subs.length).toBeGreaterThan(0);
    }
  });

  test('has item rows', () => {
    const items = rows.filter(r => r.rowType === 'item');
    expect(items.length).toBeGreaterThan(0);
  });

  test('has exactly 3 summary rows', () => {
    const summaries = rows.filter(r => r.rowType === 'summary');
    expect(summaries).toHaveLength(3);
    expect(summaries[0].byggdel).toBe('Summa beräknad kostnad');
    expect(summaries[1].byggdel).toBe('Osäkerhet');
    expect(summaries[2].byggdel).toBe('Totalt inkl osäkerhet');
  });

  test('osäkerhet row has 10% in atgard', () => {
    const osak = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Osäkerhet');
    expect(osak).toBeDefined();
    expect(osak!.atgard).toBe('10%');
  });

  test('all rows have unique ids', () => {
    const ids = rows.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all rows have valid sortIndex', () => {
    for (const r of rows) {
      expect(r.sortIndex).toBeGreaterThan(0);
    }
  });

  test('section and subsection rows are locked', () => {
    const structural = rows.filter(r => r.rowType === 'section' || r.rowType === 'subsection' || r.rowType === 'summary');
    for (const r of structural) {
      expect(r.isLocked).toBe(true);
    }
  });

  test('item rows are not locked', () => {
    const items = rows.filter(r => r.rowType === 'item');
    for (const r of items) {
      expect(r.isLocked).toBe(false);
    }
  });

  test('all rows have status "" (empty string)', () => {
    for (const r of rows) {
      expect(r.status).toBe('');
    }
  });

  test('sections have indentLevel 0', () => {
    const sections = rows.filter(r => r.rowType === 'section');
    for (const s of sections) {
      expect(s.indentLevel).toBe(0);
    }
  });

  test('subsections have indentLevel 1', () => {
    const subs = rows.filter(r => r.rowType === 'subsection');
    for (const s of subs) {
      expect(s.indentLevel).toBe(1);
    }
  });

  test('items have indentLevel 2', () => {
    const items = rows.filter(r => r.rowType === 'item');
    for (const i of items) {
      expect(i.indentLevel).toBe(2);
    }
  });
});

// ============================================================================
// Seed data – specific cost values
// ============================================================================

describe('Seed data – specific values', () => {
  const { rows } = createDefaultPlanData();

  test('Balkonger lagning has costs in 2026 and 2027', () => {
    const balkonger = rows.find(r => r.atgard === 'Lagning' && r.rowType === 'item');
    expect(balkonger).toBeDefined();
    expect(balkonger!.year_2026).toBe(60000);
    expect(balkonger!.year_2027).toBe(125000);
  });

  test('Takfönster Byte has correct a_pris and antal', () => {
    const takfonster = rows.find(r => r.byggdel === 'Takfönster' && r.atgard === 'Byte');
    expect(takfonster).toBeDefined();
    expect(takfonster!.a_pris).toBe(27500);
    expect(takfonster!.antal).toBe(12);
    expect(takfonster!.year_2028).toBe(330000);
  });

  test('Fönster (övriga) Byte has costs in 2028 and 2029', () => {
    const item = rows.find(r => r.byggdel === 'Fönster (övriga)' && r.atgard === 'Byte');
    expect(item).toBeDefined();
    expect(item!.year_2028).toBe(250000);
    expect(item!.year_2029).toBe(250000);
  });

  test('Sophus målning has cost in 2028', () => {
    const item = rows.find(r => r.atgard === 'Målning' && r.byggdel === 'Sophus');
    expect(item).toBeDefined();
    expect(item!.year_2028).toBe(25000);
  });

  test('Träplank mot norr has cost in 2031', () => {
    const item = rows.find(r => r.byggdel === 'Träplank mot norr');
    expect(item).toBeDefined();
    expect(item!.year_2031).toBe(250000);
  });

  test('Takavvattning Rensning has costs in 2026 and 2029', () => {
    const item = rows.find(r => r.byggdel === 'Takavvattning' && r.atgard === 'Rensning');
    expect(item).toBeDefined();
    expect(item!.year_2026).toBe(10000);
    expect(item!.year_2029).toBe(12000);
  });

  test('Avrinning Åtgärd has cost in 2026', () => {
    const item = rows.find(r => r.byggdel === 'Avrinning' && r.atgard === 'Åtgärd');
    expect(item).toBeDefined();
    expect(item!.year_2026).toBe(12000);
  });

  test('Staket framsida has cost in 2032', () => {
    const item = rows.find(r => r.byggdel === 'Staket framsida');
    expect(item).toBeDefined();
    expect(item!.year_2032).toBe(150000);
  });

  test('Tvättmaskiner Byte has costs in 2026 and 2028', () => {
    const item = rows.find(r => r.byggdel === 'Tvättmaskiner' && r.atgard === 'Byte');
    expect(item).toBeDefined();
    expect(item!.year_2026).toBe(60000);
    expect(item!.year_2028).toBe(60000);
    expect(item!.antal).toBe(10);
  });

  test('Obligatorisk ventilationskontroll has cost in 2029', () => {
    const item = rows.find(r => r.atgard === 'Obligatorisk ventilationskontroll');
    expect(item).toBeDefined();
    expect(item!.year_2029).toBe(20000);
  });

  test('Värmesystem Uppgradering has cost in 2030', () => {
    const item = rows.find(r => r.byggdel === 'Värmesystem' && r.atgard === 'Uppgradering');
    expect(item).toBeDefined();
    expect(item!.year_2030).toBe(150000);
  });
});

// ============================================================================
// Seed data – calculation correctness
// ============================================================================

describe('Seed data – recalcSummaryRows', () => {
  test('summa row matches manual sum of all item costs per year', () => {
    const { rows } = createDefaultPlanData();
    recalcSummaryRows(rows);

    const items = rows.filter(r => r.rowType === 'item' && r.status !== 'completed');
    const summa = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Summa beräknad kostnad')!;

    for (const yc of YEAR_COLUMNS) {
      const manualSum = items.reduce((acc, item) => {
        const val = item[yc];
        return acc + (typeof val === 'number' ? val : 0);
      }, 0);
      expect(summa[yc]).toBe(manualSum);
    }
  });

  test('osäkerhet is 10% of summa for each year', () => {
    const { rows } = createDefaultPlanData();
    recalcSummaryRows(rows);

    const summa = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Summa beräknad kostnad')!;
    const osak = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Osäkerhet')!;

    for (const yc of YEAR_COLUMNS) {
      const sumVal = (summa[yc] as number) || 0;
      expect(osak[yc]).toBe(Math.round(sumVal * 0.1));
    }
  });

  test('totalt = summa + osäkerhet for each year', () => {
    const { rows } = createDefaultPlanData();
    recalcSummaryRows(rows);

    const summa = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Summa beräknad kostnad')!;
    const osak = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Osäkerhet')!;
    const totalt = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Totalt inkl osäkerhet')!;

    for (const yc of YEAR_COLUMNS) {
      const sumVal = (summa[yc] as number) || 0;
      const osakVal = (osak[yc] as number) || 0;
      expect(totalt[yc]).toBe(sumVal + osakVal);
    }
  });

  test('computeYearlyTotals matches summa row', () => {
    const { rows } = createDefaultPlanData();
    recalcSummaryRows(rows);

    const yearlyTotals = computeYearlyTotals(rows);
    const summa = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Summa beräknad kostnad')!;

    for (const yc of YEAR_COLUMNS) {
      expect(yearlyTotals[yc]).toBe(summa[yc]);
    }
  });
});

// ============================================================================
// Seed data – specific yearly totals
// ============================================================================

describe('Seed data – expected yearly totals', () => {
  const { rows } = createDefaultPlanData();
  recalcSummaryRows(rows);
  const summa = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Summa beräknad kostnad')!;

  // Manually computed from seed data values:
  // 2026: 60000 (balkonger) + 10000 (stuprännor) + 12000 (avrinning) + 60000 (tvättmaskin) = 142000
  test('year 2026 sum = 142000', () => {
    expect(summa.year_2026).toBe(142000);
  });

  // 2027: 125000 (balkonger)
  test('year 2027 sum = 125000', () => {
    expect(summa.year_2027).toBe(125000);
  });

  // 2028: 330000 (takfönster EFG) + 250000 (övriga fönster) + 25000 (sophus) + 60000 (tvättmaskin) = 665000
  test('year 2028 sum = 665000', () => {
    expect(summa.year_2028).toBe(665000);
  });

  // 2029: 250000 (övriga fönster) + 12000 (stuprännor) + 20000 (OVK) = 282000
  test('year 2029 sum = 282000', () => {
    expect(summa.year_2029).toBe(282000);
  });

  // 2030: 150000 (värmesystem)
  test('year 2030 sum = 150000', () => {
    expect(summa.year_2030).toBe(150000);
  });

  // 2031: 250000 (träplank norr)
  test('year 2031 sum = 250000', () => {
    expect(summa.year_2031).toBe(250000);
  });

  // 2032: 150000 (staket)
  test('year 2032 sum = 150000', () => {
    expect(summa.year_2032).toBe(150000);
  });

  // 2033-2035: no costs
  test('years 2033–2035 sum = 0', () => {
    expect(summa.year_2033).toBe(0);
    expect(summa.year_2034).toBe(0);
    expect(summa.year_2035).toBe(0);
  });

  test('10-year grand total (summa) is correct', () => {
    const total = computeRowTotal(summa);
    // 142000 + 125000 + 665000 + 282000 + 150000 + 250000 + 150000 + 0 + 0 + 0 = 1764000
    expect(total).toBe(1764000);
  });

  test('10-year grand total with osäkerhet is correct', () => {
    const totalt = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Totalt inkl osäkerhet')!;
    const total = computeRowTotal(totalt);
    // Each year: summa * 1.1, but osäkerhet is rounded per year
    // So total = sum of (summa[y] + round(summa[y] * 0.1)) for each year
    const expectedPerYear = [142000, 125000, 665000, 282000, 150000, 250000, 150000, 0, 0, 0];
    const expected = expectedPerYear.reduce((acc, v) => acc + v + Math.round(v * 0.1), 0);
    expect(total).toBe(expected);
  });
});

// ============================================================================
// Seed data – lagkrav items
// ============================================================================

describe('Seed data – lagkrav detection', () => {
  test('finds items in section 4 (Säkerhet & myndighetskrav)', () => {
    const { rows } = createDefaultPlanData();
    const lagkrav = getLagkravItems(rows);
    expect(lagkrav.length).toBeGreaterThan(0);

    // Should include OVK, energideklaration, radon, brandskydd items
    const atgarder = lagkrav.map(r => r.atgard.toLowerCase());
    expect(atgarder.some(a => a.includes('ovk') || a.includes('ventilationskontroll'))).toBe(true);
    expect(atgarder.some(a => a.includes('energideklaration'))).toBe(true);
    expect(atgarder.some(a => a.includes('radon'))).toBe(true);
    expect(atgarder.some(a => a.includes('brandskydd') || a.includes('sba'))).toBe(true);
  });

  test('finds OVK item in section 4 (Obligatorisk ventilationskontroll)', () => {
    const { rows } = createDefaultPlanData();
    const lagkrav = getLagkravItems(rows);
    // The OVK item in section 4.7 has "Obligatorisk ventilationskontroll" in atgard
    const ovkItems = lagkrav.filter(r => r.atgard.toLowerCase().includes('ventilationskontroll'));
    expect(ovkItems.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Seed data – byggdel map
// ============================================================================

describe('Seed data – byggdel map', () => {
  test('items inherit byggdel from parent section/subsection', () => {
    const { rows } = createDefaultPlanData();
    const map = buildByggdelMap(rows);

    // All items should have a mapped byggdel
    const items = rows.filter(r => r.rowType === 'item');
    for (const item of items) {
      expect(map.has(item.id)).toBe(true);
      const mappedByggdel = map.get(item.id);
      expect(mappedByggdel).toBeDefined();
      expect(typeof mappedByggdel).toBe('string');
      // Should be non-empty (either own or inherited)
      expect(mappedByggdel!.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Seed data is deterministic
// ============================================================================

describe('Seed data – determinism', () => {
  test('calling createDefaultPlanData twice produces same number of rows', () => {
    const data1 = createDefaultPlanData();
    const data2 = createDefaultPlanData();
    expect(data1.rows.length).toBe(data2.rows.length);
  });

  test('calling createDefaultPlanData twice produces same columns', () => {
    const data1 = createDefaultPlanData();
    const data2 = createDefaultPlanData();
    expect(data1.columns).toEqual(data2.columns);
  });

  test('calling createDefaultPlanData twice produces same byggdel/atgard for each row', () => {
    const data1 = createDefaultPlanData();
    const data2 = createDefaultPlanData();
    for (let i = 0; i < data1.rows.length; i++) {
      expect(data1.rows[i].byggdel).toBe(data2.rows[i].byggdel);
      expect(data1.rows[i].atgard).toBe(data2.rows[i].atgard);
      expect(data1.rows[i].rowType).toBe(data2.rows[i].rowType);
      expect(data1.rows[i].nr).toBe(data2.rows[i].nr);
    }
  });

  test('ids differ between calls (UUID generation)', () => {
    const data1 = createDefaultPlanData();
    const data2 = createDefaultPlanData();
    // At least one id should differ (since they're UUIDs)
    const sameIds = data1.rows.filter((r, i) => r.id === data2.rows[i].id);
    expect(sameIds.length).toBeLessThan(data1.rows.length);
  });
});
