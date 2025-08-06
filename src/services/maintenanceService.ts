import { executeWithRLS } from './supabaseClient';

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completed_date?: string;
  due_date?: string;
  notes?: string;
  category: 'spring' | 'summer' | 'autumn' | 'winter' | 'ongoing';
  year: number;
  // Återkommande funktionalitet
  is_recurring?: boolean;
  recurrence_pattern?: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  is_template?: boolean;
  parent_template_id?: string;
  next_due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  filename: string;
  original_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  document_type: 'contract' | 'permit' | 'invoice' | 'photo' | 'plan' | 'other';
  uploaded_at: string;
  uploaded_by?: string;
}

export interface MajorProject {
  id: string;
  name: string;
  description: string;
  estimated_year: number;
  estimated_cost?: number;
  status: 'planned' | 'approved' | 'tendering' | 'in_progress' | 'completed';
  completed_year?: number;
  actual_cost?: number;
  contractor?: string;
  approval_status?: 'pending' | 'board_approved' | 'agm_approved';
  approval_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'structure' | 'heating' | 'plumbing' | 'electrical' | 'exterior' | 'interior';
  notes?: string;
  documents?: ProjectDocument[];
  created_at?: string;
  updated_at?: string;
}

// Underhållsuppgifter
export const getMaintenanceTasksByYear = async (year: number): Promise<MaintenanceTask[]> => {
  try {
    return await executeWithRLS(async (supabase) => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('year', year)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    }, []);
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    return [];
  }
};

export const saveMaintenanceTask = async (task: Partial<MaintenanceTask>): Promise<MaintenanceTask | null> => {
  try {
    console.log('🔍 saveMaintenanceTask called with:', task);
    
    return await executeWithRLS(async (supabase) => {
      const taskData = {
        ...task,
        updated_at: new Date().toISOString()
      };
      
      console.log('🔍 Upserting task data:', taskData);
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .upsert([taskData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Supabase response:', data);
      return data;
    }, null);
  } catch (error) {
    console.error('❌ Error saving maintenance task:', error);
    return null;
  }
};

export const createMaintenanceTasksForYear = async (tasks: Omit<MaintenanceTask, 'created_at' | 'updated_at'>[]): Promise<MaintenanceTask[]> => {
  try {
    return await executeWithRLS(async (supabase) => {
      const tasksWithTimestamps = tasks.map(task => ({
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert(tasksWithTimestamps)
        .select();

      if (error) throw error;
      return data || [];
    }, []);
  } catch (error) {
    console.error('Error creating maintenance tasks:', error);
    return [];
  }
};

// Större projekt
export const getMajorProjects = async (): Promise<MajorProject[]> => {
  try {
    return await executeWithRLS(async (supabase) => {
      const { data, error } = await supabase
        .from('major_projects')
        .select('*')
        .order('estimated_year', { ascending: true });

      if (error) throw error;
      return data || [];
    }, []);
  } catch (error) {
    console.error('Error fetching major projects:', error);
    return [];
  }
};

export const saveMajorProject = async (project: Partial<MajorProject>): Promise<MajorProject | null> => {
  try {
    return await executeWithRLS(async (supabase) => {
      const { data, error } = await supabase
        .from('major_projects')
        .upsert([{
          ...project,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }, null);
  } catch (error) {
    console.error('Error saving major project:', error);
    return null;
  }
};

export const deleteMajorProject = async (projectId: string): Promise<boolean> => {
  try {
    return await executeWithRLS(async (supabase) => {
      const { error } = await supabase
        .from('major_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      return true;
    }, false);
  } catch (error) {
    console.error('Error deleting major project:', error);
    return false;
  }
};

// Mallfunktioner för att skapa årliga uppgifter
export const ANNUAL_MAINTENANCE_TEMPLATE = [
  // Vinter
  { name: 'Snöröjning', description: 'Hålla gångar och ingångar fria från snö', category: 'winter' as const },
  { name: 'Sandning/Halkbekämpning', description: 'Sand på halka ytor', category: 'winter' as const },
  { name: 'Kontroll av värme/ventilation', description: 'Se till att värme och ventilation fungerar', category: 'winter' as const },
  
  // Vår
  { name: 'Rensa stuprör och hängrännor', description: 'Rensa från löv och skräp', category: 'spring' as const },
  { name: 'Kontroll av tak', description: 'Kontrollera takpannor, plåt och tätningar', category: 'spring' as const },
  { name: 'Kontroll av fasad', description: 'Leta efter sprickor, fuktskador', category: 'spring' as const },
  { name: 'Brandskyddsrond', description: 'Kontrollera brandskydd och utrymningsvägar', category: 'spring' as const },
  
  // Sommar
  { name: 'Målning/Underhåll utomhus', description: 'Måla dörrar, fönster, staket', category: 'summer' as const },
  { name: 'Trädgårdsarbete', description: 'Klippa häckar, gräs, sköta rabatter', category: 'summer' as const },
  { name: 'Rengöring av gemensamma utrymmen', description: 'Städa trapphus, källare, soprum', category: 'summer' as const },
  { name: 'Kontroll av lekplatser/uteplatser', description: 'Säkerhetskontroll av gemensamma ytor', category: 'summer' as const },
  
  // Höst
  { name: 'Rensa löv', description: 'Kratta löv från gångar och gräsytor', category: 'autumn' as const },
  { name: 'Kontroll innan vinter', description: 'Vattenavstängningar, frostskydd', category: 'autumn' as const },
  { name: 'Rengöring stuprör', description: 'Slutrengöring av stuprör inför vintern', category: 'autumn' as const },
  
  // Löpande
  { name: 'Växla dörrfilter ventilation', description: 'Byt ventilationsfilter 2 gånger/år', category: 'ongoing' as const },
  { name: 'Kontroll av gemensamma lås', description: 'Smörj och kontrollera lås', category: 'ongoing' as const },
  { name: 'Kontroll av belysning', description: 'Byt glödlampor i gemensamma utrymmen', category: 'ongoing' as const }
];

export const createAnnualMaintenancePlan = async (year: number): Promise<MaintenanceTask[]> => {
  const tasks: Omit<MaintenanceTask, 'created_at' | 'updated_at'>[] = ANNUAL_MAINTENANCE_TEMPLATE.map((template, index) => ({
    id: `maintenance_${year}_${index}`,
    ...template,
    year,
    completed: false
  }));

  return await createMaintenanceTasksForYear(tasks);
};

// Ta bort underhållsuppgift
export const deleteMaintenanceTask = async (taskId: string): Promise<boolean> => {
  try {
    return await executeWithRLS(async (supabase) => {
      const { error } = await supabase
        .from('maintenance_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return true;
    }, false);
  } catch (error) {
    console.error('Error deleting maintenance task:', error);
    return false;
  }
};

// ENKLA DOKUMENTFUNKTIONER - återanvänder befintlig storage!
export const uploadProjectDocument = async (projectId: string, file: File, documentType: string = 'other') => {
  try {
    // Använd befintlig supabaseStorage - samma som för pages!
    const { default: supabaseStorage } = await import('./supabaseStorage');
    const uploadedFile = await supabaseStorage.uploadFile(file, `projects/${projectId}`);
    
    return {
      ...uploadedFile,
      document_type: documentType,
      project_id: projectId
    };
  } catch (error) {
    console.error('Error uploading project document:', error);
    throw error;
  }
};

export const getProjectDocuments = async (projectId: string) => {
  try {
    const { default: supabaseStorage } = await import('./supabaseStorage');
    return await supabaseStorage.listFiles(`projects/${projectId}`);
  } catch (error) {
    console.error('Error fetching project documents:', error);
    return [];
  }
};

export const deleteProjectDocument = async (filePath: string) => {
  try {
    const { default: supabaseStorage } = await import('./supabaseStorage');
    return await supabaseStorage.deleteFile(filePath);
  } catch (error) {
    console.error('Error deleting project document:', error);
    return false;
  }
};