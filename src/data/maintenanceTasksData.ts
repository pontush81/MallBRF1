import { MaintenanceTask, MaintenanceStatus } from '../types/MaintenancePlan';
import { v4 as uuidv4 } from 'uuid';

// Kategorier baserade på användarens plan
export const maintenanceCategoriesData = [
  'UTOMHUS - Ellagården',
  'UTOMHUS - Bilparkering + Bilväg ICA',
  'INOMHUS - Soprum',
  'INOMHUS - Lägenheter',
  'INOMHUS - Korridor Plan 2',
  'INOMHUS - Källare',
  'INOMHUS - Tvättstuga',
  'Fasad/Tak m.m.',
  'Övrigt'
];

// Säsonger konverterade till månader
const sommarMånader = ['Juni', 'Juli', 'Augusti'];
const vinterMånader = ['December', 'Januari', 'Februari'];
const allaMånader = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

// Användarens underhållsplan
export const maintenanceTasksData: MaintenanceTask[] = [
  // UTOMHUS - Ellagården
  {
    id: uuidv4(),
    months: sommarMånader,
    year: new Date().getFullYear(),
    task: 'Klippa häcken',
    description: 'Klippa häcken i Ellagården',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: sommarMånader,
    year: new Date().getFullYear(),
    task: 'Rensa stensättning',
    description: 'Rensa stensättning i Ellagården',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: sommarMånader,
    year: new Date().getFullYear(),
    task: 'Rensa rabatter',
    description: 'Rensa rabatter i Ellagården',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: sommarMånader,
    year: new Date().getFullYear(),
    task: 'Sköta blommor',
    description: 'Sköta blommor i Ellagården',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: vinterMånader,
    year: new Date().getFullYear(),
    task: 'Sandning',
    description: 'Sandning i Ellagården',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: vinterMånader,
    year: new Date().getFullYear(),
    task: 'Snöröjning',
    description: 'Snöröjning i Ellagården',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['September'],
    year: new Date().getFullYear(),
    task: 'Kratta löv',
    description: 'Kratta löv i Ellagården (Lövsug/blås inköpt. Förvaring i källare.)',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Oktober'],
    year: new Date().getFullYear(),
    task: 'Kratta löv',
    description: 'Kratta löv i Ellagården (Lövsug/blås inköpt. Förvaring i källare.)',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['November'],
    year: new Date().getFullYear(),
    task: 'Kratta löv',
    description: 'Kratta löv i Ellagården (Lövsug/blås inköpt. Förvaring i källare.)',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  ...allaMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Sopning',
    description: 'Sopning i Ellagården',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  ...allaMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Byta lampor till fasadbelysning',
    description: 'Byta lampor till fasadbelysning i Ellagården vid behov',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  ...allaMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Städa trapporna',
    description: 'Städa trapporna i Ellagården',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Ellagården',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  
  // UTOMHUS - Bilparkering + Bilväg ICA
  ...sommarMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Klippa häcken',
    description: 'Klippa häcken vid bilparkering + bilväg ICA',
    responsible: 'Kommunen',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Bilparkering + Bilväg ICA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  ...vinterMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Sandning',
    description: 'Sandning vid bilparkering + bilväg ICA',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Bilparkering + Bilväg ICA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  ...vinterMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Snöröjning',
    description: 'Snöröjning vid bilparkering + bilväg ICA + Inhyrd snöröjning',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Bilparkering + Bilväg ICA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  ...allaMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Sopning',
    description: 'Sopning vid bilparkering + bilväg ICA',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Bilparkering + Bilväg ICA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  ...allaMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Rensa rabatter',
    description: 'Rensa rabatter vid bilparkering + bilväg ICA',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'UTOMHUS - Bilparkering + Bilväg ICA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  
  // INOMHUS - Soprum
  ...allaMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Städning golv',
    description: 'Städning golv i soprum',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Soprum',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  ...allaMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Städning sopkärl',
    description: 'Städning sopkärl i soprum',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Soprum',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  {
    id: uuidv4(),
    months: ['Mars'],
    year: new Date().getFullYear(),
    task: 'Smörja lås',
    description: 'Smörja lås i soprum',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Soprum',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['September'],
    year: new Date().getFullYear(),
    task: 'Smörja lås',
    description: 'Smörja lås i soprum',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Soprum',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['April'],
    year: new Date().getFullYear(),
    task: 'Underhålla verktyg',
    description: 'Underhålla verktyg i soprum',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Soprum',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Oktober'],
    year: new Date().getFullYear(),
    task: 'Underhålla verktyg',
    description: 'Underhålla verktyg i soprum',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Soprum',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // INOMHUS - Lägenheter
  {
    id: uuidv4(),
    months: ['Mars'],
    year: new Date().getFullYear(),
    task: 'Köpa filter ventilation',
    description: 'Köpa filter till ventilation i lägenheter',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Lägenheter',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['April'],
    year: new Date().getFullYear(),
    task: 'Byta filter till ventilation',
    description: 'Byta filter till ventilation i lägenheter',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Lägenheter',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  ...sommarMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Klippa gräs uteplats framsida',
    description: 'Klippa gräs uteplats framsida',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Lägenheter',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  ...sommarMånader.map(månad => ({
    id: uuidv4(),
    months: [månad],
    year: new Date().getFullYear(),
    task: 'Klippa gräs uteplats baksida',
    description: 'Klippa gräs uteplats baksida',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Lägenheter',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })),
  
  // INOMHUS - Korridor Plan 2
  {
    id: uuidv4(),
    months: ['November'],
    year: new Date().getFullYear(),
    task: 'Städa golv (varje vecka)',
    description: 'Städa golv i korridor (varje vecka nov-jan)',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['December'],
    year: new Date().getFullYear(),
    task: 'Städa golv (varje vecka)',
    description: 'Städa golv i korridor (varje vecka nov-jan)',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Januari'],
    year: new Date().getFullYear(),
    task: 'Städa golv (varje vecka)',
    description: 'Städa golv i korridor (varje vecka nov-jan)',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Mars'],
    year: new Date().getFullYear(),
    task: 'Städa golv (varannan vecka)',
    description: 'Städa golv i korridor (varannan vecka övrig tid)',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Maj'],
    year: new Date().getFullYear(),
    task: 'Putsa fönster',
    description: 'Putsa fönster i korridor',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Juni'],
    year: new Date().getFullYear(),
    task: 'Damma runt fönster, belysning och fönstersmyg',
    description: 'Damma runt fönster, belysning och fönstersmyg i korridor',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Mars'],
    year: new Date().getFullYear(),
    task: 'Smörja lås ytterdörr',
    description: 'Smörja lås ytterdörr i korridor',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Februari'],
    year: new Date().getFullYear(),
    task: 'Kontroll och underhåll dörrstängare',
    description: 'Kontroll och underhåll dörrstängare i korridor',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['April'],
    year: new Date().getFullYear(),
    task: 'Byta lampor',
    description: 'Byta lampor i korridor vid behov',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['November'],
    year: new Date().getFullYear(),
    task: 'Byta dörrmattor',
    description: 'Byta dörrmattor i korridor',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'INOMHUS - Korridor Plan 2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Fasad/Tak
  {
    id: uuidv4(),
    months: ['Maj'],
    year: new Date().getFullYear(),
    task: 'Kontroll av tak',
    description: 'Kontroll av tak',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Oktober'],
    year: new Date().getFullYear(),
    task: 'Rengöra stuprör',
    description: 'Rengöra stuprör',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['April'],
    year: new Date().getFullYear(),
    task: 'Kontrollera utvändig brunn till källare',
    description: 'Kontrollera utvändig brunn till källare',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Oktober'],
    year: new Date().getFullYear(),
    task: 'Kontrollera utvändig brunn till källare',
    description: 'Kontrollera utvändig brunn till källare',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Maj'],
    year: new Date().getFullYear(),
    task: 'Kontroll yttre fönster',
    description: 'Kontroll yttre fönster',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Oktober'],
    year: new Date().getFullYear(),
    task: 'Kontroll yttre fönster',
    description: 'Kontroll yttre fönster',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Maj'],
    year: new Date().getFullYear(),
    task: 'Kontroll ytterdörrar',
    description: 'Kontroll ytterdörrar',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Oktober'],
    year: new Date().getFullYear(),
    task: 'Kontroll ytterdörrar',
    description: 'Kontroll ytterdörrar',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Maj'],
    year: new Date().getFullYear(),
    task: 'Kontroll balkonger',
    description: 'Kontroll balkonger',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Oktober'],
    year: new Date().getFullYear(),
    task: 'Kontroll balkonger',
    description: 'Kontroll balkonger',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Maj'],
    year: new Date().getFullYear(),
    task: 'Kontroll stuprör',
    description: 'Kontroll stuprör',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Oktober'],
    year: new Date().getFullYear(),
    task: 'Kontroll stuprör',
    description: 'Kontroll stuprör',
    responsible: 'Boende',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Juni'],
    year: new Date().getFullYear(),
    task: 'Kontroll målning',
    description: 'Kontroll målning',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Juli'],
    year: new Date().getFullYear(),
    task: 'Kontroll fasad',
    description: 'Kontroll fasad',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['April'],
    year: new Date().getFullYear(),
    task: 'Kontroll staket framsida',
    description: 'Kontroll av staket på framsida',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['April'],
    year: new Date().getFullYear(),
    task: 'Kontroll staket mot parkering',
    description: 'Kontroll av staket mot parkering',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Fasad/Tak m.m.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Övriga uppgifter
  {
    id: uuidv4(),
    months: ['Mars'],
    year: new Date().getFullYear(),
    task: 'Brandskyddsrond',
    description: 'Genomför brandskyddsrond i fastigheten',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Övrigt',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['September'],
    year: new Date().getFullYear(),
    task: 'Brandskyddsrond',
    description: 'Genomför brandskyddsrond i fastigheten',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Övrigt',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Mars'],
    year: new Date().getFullYear(),
    task: 'Kontroll parkering',
    description: 'Kontroll av parkering',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Övrigt',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['September'],
    year: new Date().getFullYear(),
    task: 'Kontroll parkering',
    description: 'Kontroll av parkering',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Övrigt',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 