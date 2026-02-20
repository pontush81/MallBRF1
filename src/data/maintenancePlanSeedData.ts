import { PlanRow, PlanData } from '../services/maintenancePlanService';
import { v4 as uuidv4 } from 'uuid';

function row(
  overrides: Partial<PlanRow> & Pick<PlanRow, 'rowType'>
): PlanRow {
  return {
    id: uuidv4(),
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
    sortIndex: 0,
    indentLevel: 0,
    isLocked: false,
    status: 'planned',
    ...overrides,
  };
}

let idx = 0;
function nextIdx(): number { return ++idx; }

export function createDefaultPlanData(): PlanData {
  idx = 0;

  const rows: PlanRow[] = [
    // =========================================================================
    // SECTION 1: Utvändigt (klimatskal)
    // =========================================================================
    row({ rowType: 'section', nr: '1', byggdel: 'Utvändigt', isLocked: true, sortIndex: nextIdx() }),

    // --- 1.1 Fasader ---
    row({ rowType: 'subsection', nr: '1.1', byggdel: 'Fasader', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Träplank mot söder', atgard: 'Byte + avgränsningar', tek_livslangd: '25 år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Träplank mot norr', atgard: 'Byte + avgränsningar', year_2031: 250000, sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Sophus', atgard: 'Målning', year_2028: 25000, sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Ventilationsintag', atgard: 'Plåtarbeten', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Fasad övrigt', atgard: 'Målning/putslagning', tek_livslangd: '15–20 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Bedöm behov' }),

    // --- 1.1.1 Fönster ---
    row({ rowType: 'subsection', nr: '1.1.1', byggdel: 'Fönster', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Byte takfönster', tek_livslangd: '25 år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Byte takfönster lägenhet E F G', a_pris: 27500, antal: 12, year_2028: 330000, sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Övriga fönster', year_2028: 250000, year_2029: 250000, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 1.1.2 Dörrar ---
    row({ rowType: 'subsection', nr: '1.1.2', byggdel: 'Dörrar', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Lägenhetsdörr bottenvån', tek_livslangd: '30 år', a_pris: 25000, antal: 4, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 1.1.3 Balkonger ---
    row({ rowType: 'subsection', nr: '1.1.3', byggdel: 'Balkonger', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Lagning', year_2026: 60000, year_2027: 125000, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 1.2 Tak ---
    row({ rowType: 'subsection', nr: '1.2', byggdel: 'Yttertak', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Målning plåt (ev ingår i takfönster)', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Takbesiktning / statusbedömning', tek_livslangd: '30–50 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera skick' }),

    // --- 1.3 Takavvattning ---
    row({ rowType: 'subsection', nr: '1.3', byggdel: 'Takavvattning', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Rensning stuprännor', year_2026: 10000, year_2029: 12000, sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Byte hängrännor/stuprör', tek_livslangd: '30 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Bedöm skick' }),

    // --- 1.4 Gård & mark ---
    row({ rowType: 'subsection', nr: '1.4', byggdel: 'Gård & mark', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Grind/Dörrar', atgard: 'Byte låssystem', tek_livslangd: '15 år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Avrining Tinas lägenhet', year_2026: 12000, sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Staket framsida', atgard: 'Byte', year_2032: 150000, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 1.5 Mark/grund/dränering ---
    row({ rowType: 'subsection', nr: '1.5', byggdel: 'Mark & dränering', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Dräneringsbesiktning', tek_livslangd: '40–60 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Utreda skick, prioritera' }),
    row({ rowType: 'item', atgard: 'Markarbeten / ytskikt gård', sortIndex: nextIdx(), indentLevel: 2 }),

    // =========================================================================
    // SECTION 2: Invändigt (gemensamma utrymmen)
    // =========================================================================
    row({ rowType: 'section', nr: '2', byggdel: 'Invändigt', isLocked: true, sortIndex: nextIdx() }),

    // --- 2.1 Källare ---
    row({ rowType: 'subsection', nr: '2.1', byggdel: 'Källare', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Översyn fuktsäkerhet', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera regelbundet' }),

    // --- 2.1.1 Tvättstuga ---
    row({ rowType: 'subsection', nr: '2.1.1', byggdel: 'Tvättstuga', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Byte maskiner', tek_livslangd: '8–12 år', antal: 10, year_2026: 60000, year_2028: 60000, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 2.1.2 Gästlägenhet ---
    row({ rowType: 'subsection', nr: '2.1.2', byggdel: 'Gästlägenhet', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Iordningställande', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 2.2 Trapphus ---
    row({ rowType: 'subsection', nr: '2.2', byggdel: 'Trapphus', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Målning trapphus', tek_livslangd: '10–15 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Bedöm behov' }),

    // --- 2.3 Loftgång ---
    row({ rowType: 'subsection', nr: '2.3', byggdel: 'Loftgång', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),

    // --- 2.3.1 Dörrar ---
    row({ rowType: 'subsection', nr: '2.3.1', byggdel: 'Dörrar', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),

    // --- 2.4 Förråd ---
    row({ rowType: 'subsection', nr: '2.4', byggdel: 'Förråd', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Översyn/underhåll', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 2.5 Vind ---
    row({ rowType: 'subsection', nr: '2.5', byggdel: 'Vind', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),

    // --- 2.6 Lägenheter ---
    row({ rowType: 'subsection', nr: '2.6', byggdel: 'Lägenheter', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),

    // =========================================================================
    // SECTION 3: Installationer
    // =========================================================================
    row({ rowType: 'section', nr: '3', byggdel: 'Installationer', isLocked: true, sortIndex: nextIdx() }),

    // --- 3.1 El installationer ---
    row({ rowType: 'subsection', nr: '3.1', byggdel: 'El installationer', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Översyn timer, jordfelsbrytare, byte av utebelysning', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Elcentral – besiktning/byte', tek_livslangd: '30–40 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera ålder' }),
    row({ rowType: 'item', atgard: 'Utomhusbelysning', tek_livslangd: '15–20 år', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 3.2 Ventilation ---
    row({ rowType: 'subsection', nr: '3.2', byggdel: 'Ventilation', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'OVK (obligatorisk ventilationskontroll)', tek_livslangd: 'Var 6:e år (FT) / 9:e år (S)', year_2029: 20000, sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Fläktar – byte/service', tek_livslangd: '15–20 år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Ventilationskanaler – rensning', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 3.3 Värmesystem ---
    row({ rowType: 'subsection', nr: '3.3', byggdel: 'Värmesystem', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Uppgradering värmesystem', year_2030: 150000, sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Fjärrvärmeväxlare/panna – byte', tek_livslangd: '20–25 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera ålder' }),
    row({ rowType: 'item', atgard: 'Cirkulationspumpar', tek_livslangd: '15–20 år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Termostater/styrsystem', tek_livslangd: '15 år', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 3.4 VA system ---
    row({ rowType: 'subsection', nr: '3.4', byggdel: 'VA system', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Stammar – relining/byte', tek_livslangd: '40–60 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Filma/inspektera stammar' }),
    row({ rowType: 'item', atgard: 'Avloppsspolning (återkommande)', tek_livslangd: 'Var 5–10:e år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Vattenledningar – översyn', tek_livslangd: '40–60 år', sortIndex: nextIdx(), indentLevel: 2 }),

    // =========================================================================
    // SECTION 4: Säkerhet & myndighetskrav
    // =========================================================================
    row({ rowType: 'section', nr: '4', byggdel: 'Säkerhet & myndighetskrav', isLocked: true, sortIndex: nextIdx() }),

    // --- 4.1 OVK ---
    row({ rowType: 'subsection', nr: '4.1', byggdel: 'OVK', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Obligatorisk ventilationskontroll', tek_livslangd: 'Lagkrav', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Nästa: se 3.2' }),

    // --- 4.2 Energideklaration ---
    row({ rowType: 'subsection', nr: '4.2', byggdel: 'Energideklaration', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Energideklaration (lagkrav)', tek_livslangd: 'Var 10:e år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera giltighetstid' }),

    // --- 4.3 Radon ---
    row({ rowType: 'subsection', nr: '4.3', byggdel: 'Radonmätning', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Radonmätning', tek_livslangd: 'Var 10:e år (rek.)', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Senaste mätning?' }),

    // --- 4.4 Brandskydd ---
    row({ rowType: 'subsection', nr: '4.4', byggdel: 'Brandskydd', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Brandskyddsgenomgång (SBA)', tek_livslangd: 'Årligen', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', atgard: 'Brandvarnare – byte/kontroll', tek_livslangd: '10 år', sortIndex: nextIdx(), indentLevel: 2 }),

    // Empty rows for future use
    row({ rowType: 'blank', sortIndex: nextIdx() }),
    row({ rowType: 'blank', sortIndex: nextIdx() }),
    row({ rowType: 'blank', sortIndex: nextIdx() }),

    // =========================================================================
    // SUMMARY ROWS
    // =========================================================================
    row({ rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true, sortIndex: 200 }),
    row({ rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true, sortIndex: 201 }),
    row({ rowType: 'summary', byggdel: 'Totalt inkl osäkerhet', isLocked: true, sortIndex: 202 }),
  ];

  return {
    columns: [
      'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
      'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
      'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035',
      'utredningspunkter'
    ],
    rows,
  };
}
