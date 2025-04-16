export interface MaintenanceTask {
  id: string;
  months: string[];
  year: number;
  task: string;
  description: string;
  responsible: string;
  status: 'pending' | 'in_progress' | 'completed';
  comments?: string;
  category?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceMonth = 
  'Januari' | 'Februari' | 'Mars' | 'April' | 'Maj' | 'Juni' | 
  'Juli' | 'Augusti' | 'September' | 'Oktober' | 'November' | 'December';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed';

export interface MaintenanceTaskFilter {
  month?: MaintenanceMonth | 'all';
  year?: number | 'all';
  category?: string | 'all';
  status?: MaintenanceStatus | 'all';
} 