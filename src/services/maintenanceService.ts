import { executeWithRLS } from './supabaseClient';

// Direct REST API helper to bypass hanging Supabase SDK
const SUPABASE_URL = 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE';

async function directRestCall(method: string, endpoint: string, body?: any, timeout: number = 5000) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout)
  });

  if (!response.ok) {
    throw new Error(`Direct REST API error: ${response.status} ${response.statusText}`);
  }

  if (method === 'DELETE') {
    return null;
  }

  return await response.json();
}

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
  end_date?: string; // Slutdatum för återkommande uppgifter
  // Tilldelning och notifieringar
  assignee_id?: string;
  assigned_at?: string;
  assigned_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserNotificationPreferences {
  id?: string;
  user_id: string;
  task_assigned: boolean;
  task_due_reminder: boolean;
  task_overdue: boolean;
  task_completed: boolean;
  email_notifications: boolean;
  in_app_notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationLog {
  id?: string;
  task_id: string;
  recipient_id: string;
  notification_type: 'TASK_ASSIGNED' | 'TASK_DUE_REMINDER' | 'TASK_OVERDUE' | 'TASK_COMPLETED';
  channel: 'EMAIL' | 'IN_APP';
  sent_at?: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  error_message?: string;
  metadata?: any;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
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
    console.log('🚀 Fetching maintenance tasks by year via direct REST API...', year);
    
    const params = new URLSearchParams();
    params.append('year', `eq.${year}`);
    params.append('select', '*');
    params.append('order', 'category.asc');
    
    const endpoint = `maintenance_tasks?${params.toString()}`;
    const data = await directRestCall('GET', endpoint);
    
    console.log(`✅ Found ${data?.length || 0} maintenance tasks for year ${year} via direct API (FAST!)`);
    return data || [];
    
  } catch (error) {
    console.error('❌ Error fetching maintenance tasks via direct API:', error);
    return [];
  }
};

// Hämta ALLA underhållsuppgifter från alla år
export const getAllMaintenanceTasks = async (): Promise<MaintenanceTask[]> => {
  try {
    console.log('🚀 Fetching all maintenance tasks via direct REST API...');
    
    const params = new URLSearchParams();
    params.append('select', '*');
    params.append('order', 'year.asc,category.asc');
    
    const endpoint = `maintenance_tasks?${params.toString()}`;
    const data = await directRestCall('GET', endpoint);
    
    console.log(`✅ Found ${data?.length || 0} maintenance tasks via direct API (FAST!)`);
    return data || [];
    
  } catch (error) {
    console.error('❌ Error fetching all maintenance tasks via direct API:', error);
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

// 🚫 PERMANENTLY DISABLED TEMPLATE - No automatic task creation
// Users must manually create tasks when needed
// 
// Previously this would auto-create 17 tasks for every year
// which was filling up the maintenance plan against user wishes
//
// OLD TEMPLATE MOVED TO COMMENTS FOR REFERENCE:
// Winter: Snöröjning, Sandning, Kontroll värme/ventilation  
// Spring: Rensa stuprör, Kontroll tak/fasad, Brandskyddsrond
// Summer: Målning, Trädgård, Rengöring, Kontroll lekplatser
// Autumn: Rensa löv, Kontroll före vinter, Rengöring stuprör
// Ongoing: Ventilationsfilter, Lås, Belysning

// 🚫 DISABLED - This function is no longer used
export const createAnnualMaintenancePlan = async (year: number): Promise<MaintenanceTask[]> => {
  console.warn('⚠️ createAnnualMaintenancePlan is DISABLED - no tasks will be created automatically');
  return []; // Return empty array instead of creating tasks
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

// =============================================
// TILLDELNING OCH NOTIFIERINGAR
// =============================================

// Hämta alla användare för tilldelning
export const getUsers = async (): Promise<User[]> => {
  try {
    return await executeWithRLS(async (supabase) => {
      // Hämta användare från users tabell (Supabase migration)
      const { data, error } = await supabase
        .from('users') // Använd users tabell från Supabase migration
        .select('id, email, name');

      if (error) {
        console.log('⚠️ Users table query failed, using mock data:', error);
        // Returnera mock-data för utveckling
        return [
          {
            id: '1',
            email: 'admin@gulmaran.se',
            full_name: 'Administratör',
            avatar_url: undefined
          },
          {
            id: '2', 
            email: 'styrelse@gulmaran.se',
            full_name: 'Styrelsen',
            avatar_url: undefined
          }
        ];
      }

      return data.map(user => ({
        id: user.id,
        email: user.email || '',
        full_name: user.name || user.email?.split('@')[0] || 'Okänd användare',
        avatar_url: null // Avatar inte implementerat än i Supabase users tabell
      }));
    }, []);

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
};

// Tilldela uppgift till användare
export const assignTask = async (taskId: string, assigneeId: string, assignedBy: string): Promise<boolean> => {
  try {
    return await executeWithRLS(async (supabase) => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .update({
          assignee_id: assigneeId,
          assigned_at: new Date().toISOString(),
          assigned_by: assignedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error assigning task:', error);
        throw error;
      }

      console.log('✅ Task assigned successfully:', data);
      return true;
    }, false);

  } catch (error) {
    console.error('❌ Error in assignTask:', error);
    return false;
  }
};

// Hämta uppgifter tilldelade till en specifik användare
export const getTasksAssignedToUser = async (userId: string): Promise<MaintenanceTask[]> => {
  try {
    return await executeWithRLS(async (supabase) => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('assignee_id', userId)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching assigned tasks:', error);
        throw error;
      }

      return data || [];
    }, []);

  } catch (error) {
    console.error('❌ Error in getTasksAssignedToUser:', error);
    return [];
  }
};