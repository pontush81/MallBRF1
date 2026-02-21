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
    status: '',
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
    row({ rowType: 'item', byggdel: 'Takfönster', atgard: 'Byte', tek_livslangd: '25 år', a_pris: 27500, antal: 12, year_2028: 330000, sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Lgh E/F/G' }),
    row({ rowType: 'item', byggdel: 'Fönster (övriga)', atgard: 'Byte', year_2028: 250000, year_2029: 250000, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 1.1.2 Dörrar ---
    row({ rowType: 'subsection', nr: '1.1.2', byggdel: 'Dörrar', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Lägenhetsdörrar (bottenvån)', atgard: 'Byte', tek_livslangd: '30 år', a_pris: 25000, antal: 4, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 1.1.3 Balkonger ---
    row({ rowType: 'subsection', nr: '1.1.3', byggdel: 'Balkonger', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Balkonger', atgard: 'Lagning', year_2026: 60000, year_2027: 125000, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 1.2 Tak ---
    row({ rowType: 'subsection', nr: '1.2', byggdel: 'Yttertak', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Takplåt', atgard: 'Målning', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Ev ingår i takfönsterbyte' }),
    row({ rowType: 'item', byggdel: 'Yttertak', atgard: 'Besiktning & statusbedömning', tek_livslangd: '30–50 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera skick' }),

    // --- 1.3 Takavvattning ---
    row({ rowType: 'subsection', nr: '1.3', byggdel: 'Takavvattning', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Takavvattning', atgard: 'Rensning', year_2026: 10000, year_2029: 12000, sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Stuprännor' }),
    row({ rowType: 'item', byggdel: 'Takavvattning', atgard: 'Byte', tek_livslangd: '30 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Hängrännor/stuprör. Bedöm skick' }),

    // --- 1.4 Gård & mark ---
    row({ rowType: 'subsection', nr: '1.4', byggdel: 'Gård & mark', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Grind/Dörrar', atgard: 'Byte låssystem', tek_livslangd: '15 år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Avrinning', atgard: 'Åtgärd', year_2026: 12000, sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Berör lgh Tina' }),
    row({ rowType: 'item', byggdel: 'Staket framsida', atgard: 'Byte', year_2032: 150000, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 1.5 Mark/grund/dränering ---
    row({ rowType: 'subsection', nr: '1.5', byggdel: 'Mark & dränering', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Dränering', atgard: 'Besiktning', tek_livslangd: '40–60 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Utreda skick, prioritera' }),
    row({ rowType: 'item', byggdel: 'Markyta gård', atgard: 'Underhåll', sortIndex: nextIdx(), indentLevel: 2 }),

    // =========================================================================
    // SECTION 2: Invändigt (gemensamma utrymmen)
    // =========================================================================
    row({ rowType: 'section', nr: '2', byggdel: 'Invändigt', isLocked: true, sortIndex: nextIdx() }),

    // --- 2.1 Källare ---
    row({ rowType: 'subsection', nr: '2.1', byggdel: 'Källare', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Källare', atgard: 'Översyn fuktsäkerhet', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera regelbundet' }),

    // --- 2.1.1 Tvättstuga ---
    row({ rowType: 'subsection', nr: '2.1.1', byggdel: 'Tvättstuga', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Tvättmaskiner', atgard: 'Byte', tek_livslangd: '8–12 år', antal: 10, year_2026: 60000, year_2028: 60000, sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 2.1.2 Gästlägenhet ---
    row({ rowType: 'subsection', nr: '2.1.2', byggdel: 'Gästlägenhet', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Gästlägenhet', atgard: 'Iordningställande', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 2.2 Trapphus ---
    row({ rowType: 'subsection', nr: '2.2', byggdel: 'Trapphus', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Trapphus', atgard: 'Målning', tek_livslangd: '10–15 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Bedöm behov' }),

    // --- 2.3 Loftgång ---
    row({ rowType: 'subsection', nr: '2.3', byggdel: 'Loftgång', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),

    // --- 2.3.1 Dörrar ---
    row({ rowType: 'subsection', nr: '2.3.1', byggdel: 'Dörrar', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),

    // --- 2.4 Förråd ---
    row({ rowType: 'subsection', nr: '2.4', byggdel: 'Förråd', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Förråd', atgard: 'Översyn', sortIndex: nextIdx(), indentLevel: 2 }),

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
    row({ rowType: 'item', byggdel: 'Elinstallationer', atgard: 'Översyn (timer, jordfelsbrytare)', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Elcentral', atgard: 'Besiktning/byte', tek_livslangd: '30–40 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera ålder' }),
    row({ rowType: 'item', byggdel: 'Utomhusbelysning', atgard: 'Byte', tek_livslangd: '15–20 år', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 3.2 Ventilation ---
    row({ rowType: 'subsection', nr: '3.2', byggdel: 'Ventilation', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Fläktar', atgard: 'Byte/service', tek_livslangd: '15–20 år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Ventilationskanaler', atgard: 'Rensning', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 3.3 Värmesystem ---
    row({ rowType: 'subsection', nr: '3.3', byggdel: 'Värmesystem', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Värmesystem', atgard: 'Uppgradering', year_2030: 150000, sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Fjärrvärmeväxlare', atgard: 'Byte', tek_livslangd: '20–25 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Kontrollera ålder' }),
    row({ rowType: 'item', byggdel: 'Cirkulationspumpar', atgard: 'Byte', tek_livslangd: '15–20 år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Styrsystem', atgard: 'Uppgradering/byte', tek_livslangd: '15 år', sortIndex: nextIdx(), indentLevel: 2 }),

    // --- 3.4 VA system ---
    row({ rowType: 'subsection', nr: '3.4', byggdel: 'VA system', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Stammar', atgard: 'Relining/byte', tek_livslangd: '40–60 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Filma/inspektera stammar' }),
    row({ rowType: 'item', byggdel: 'Avlopp', atgard: 'Spolning', tek_livslangd: 'Var 5–10:e år', sortIndex: nextIdx(), indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Vattenledningar', atgard: 'Översyn', tek_livslangd: '40–60 år', sortIndex: nextIdx(), indentLevel: 2 }),

    // =========================================================================
    // SECTION 4: Säkerhet & myndighetskrav
    // =========================================================================
    row({ rowType: 'section', nr: '4', byggdel: 'Säkerhet & myndighetskrav', isLocked: true, sortIndex: nextIdx() }),

    // --- 4.1 Brandskydd ---
    row({ rowType: 'subsection', nr: '4.1', byggdel: 'Brandskydd', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Systematiskt brandskyddsarbete (SBA)', tek_livslangd: 'Årligen', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'LSO 2 kap. 2§ – dokumenterad genomgång av brandskydd, utrymningsvägar, släckutrustning', info_url: 'https://www.mcf.se/sv/amnesomraden/skydd-mot-olyckor-och-farliga-amnen/stod-till-kommunal-raddningstjanst/brandskydd-och-forebyggande/ansvar-sba-och-skriftlig-redogorelse/' }),
    row({ rowType: 'item', atgard: 'Brandvarnare – byte/kontroll', tek_livslangd: '10 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Gemensamma utrymmen. Lgh-innehavare ansvarar för egna.' }),

    // --- 4.2 Energideklaration ---
    row({ rowType: 'subsection', nr: '4.2', byggdel: 'Energideklaration', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Energideklaration', tek_livslangd: 'Var 10:e år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Lag (2006:985) – certifierad energiexpert, registreras hos Boverket', info_url: 'https://www.boverket.se/sv/energideklaration/' }),

    // --- 4.3 Radon ---
    row({ rowType: 'subsection', nr: '4.3', byggdel: 'Radonmätning', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Radonmätning', tek_livslangd: 'Var 10:e år (rek.)', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Strålskyddslagen – gränsvärde 200 Bq/m³, mätning okt–apr minst 2 mån', info_url: 'https://www.stralsakerhetsmyndigheten.se/omraden/radon/' }),

    // --- 4.4 Taksäkerhet ---
    row({ rowType: 'subsection', nr: '4.4', byggdel: 'Taksäkerhet', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Taksäkerhetsbesiktning', tek_livslangd: 'Var 5:e år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'PBL 8 kap. 4§ – takstegar, gångbryggor, snörasskydd, förankringspunkter', info_url: 'https://www.boverket.se/sv/PBL-kunskapsbanken/regler-om-byggande/boverkets-byggregler/sakerhet-vid-anvandning/taksakerhet/' }),

    // --- 4.5 Egenkontroll vatten ---
    row({ rowType: 'subsection', nr: '4.5', byggdel: 'Egenkontroll vatten', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Legionellakontroll (temperatur)', tek_livslangd: 'Löpande', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Miljöbalken egenkontroll – VV ≥60°C i beredare, ≥50°C vid tappställe', info_url: 'https://www.folkhalsomyndigheten.se/regler-och-tillsyn/tillsynsvagledning-och-stod/halsoskydd-vagledning-och-tillsyn/vagledning-om-smitta-fran-objekt-och-djur/tillsynsvagledning-om-legionella/fragor-och-svar-om-legionella/' }),

    // --- 4.6 Elrevision ---
    row({ rowType: 'subsection', nr: '4.6', byggdel: 'Elrevision', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Elrevision gemensamma anläggningar', tek_livslangd: 'Var 3–5 år', sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Elsäkerhetslagen (2016:732) – dokumenterad kontroll av elanläggning', info_url: 'https://www.elsakerhetsverket.se/om-oss/lag-och-ratt/vad-innebar-de-nya-starkstromsforeskrifterna/' }),

    // --- 4.7 OVK ---
    row({ rowType: 'subsection', nr: '4.7', byggdel: 'OVK', isLocked: true, sortIndex: nextIdx(), indentLevel: 1 }),
    row({ rowType: 'item', atgard: 'Obligatorisk ventilationskontroll', tek_livslangd: 'Var 6:e år (FT/S)', year_2029: 20000, sortIndex: nextIdx(), indentLevel: 2, utredningspunkter: 'Plan- och byggförordningen 5 kap. – certifierad kontrollant, protokoll till kommunen', info_url: 'https://www.boverket.se/sv/byggande/halsa-och-inomhusmiljo/ventilation/ovk/' }),

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
