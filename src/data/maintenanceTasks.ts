import { MaintenanceTask, MaintenanceStatus } from '../types/MaintenancePlan';
import { v4 as uuidv4 } from 'uuid';

// Sample categories
export const maintenanceCategories = [
  'Byggnad', 
  'Utomhus', 
  'Säkerhet', 
  'VVS', 
  'El', 
  'Gemensamma utrymmen'
];

// Sample maintenance tasks
export const maintenanceTasks: MaintenanceTask[] = [
  {
    id: uuidv4(),
    months: ['Januari'],
    year: new Date().getFullYear(),
    task: 'Kontrollera ventilation',
    description: 'Kontrollera att ventilationen fungerar som den ska',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Ventilation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Mars'],
    year: new Date().getFullYear(),
    task: 'Kontrollera tak',
    description: 'Kontrollera att taket är i gott skick',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Tak',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['Maj'],
    year: new Date().getFullYear(),
    task: 'Städa gården',
    description: 'Vårstädning av gården',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Gård',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['September'],
    year: new Date().getFullYear(),
    task: 'Kontrollera värmesystem',
    description: 'Kontrollera att värmesystemet fungerar inför vintern',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Värme',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    months: ['November'],
    year: new Date().getFullYear(),
    task: 'Kontrollera belysning',
    description: 'Kontrollera all utomhusbelysning',
    responsible: 'BRF',
    status: 'pending' as MaintenanceStatus,
    category: 'Belysning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 