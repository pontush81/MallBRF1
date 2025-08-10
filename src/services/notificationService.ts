import supabase from './supabaseClient';

// Direct REST API helper for notifications (non-critical, can fail gracefully)
async function directNotificationCall(method: string, endpoint: string, body?: any): Promise<any> {
  try {
    const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/${endpoint}`, {
      method,
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(3000)
    });
    
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.log('⚠️ Notification API failed (non-critical):', error.message);
    return null;
  }
}
import { MaintenanceTask, User, UserNotificationPreferences, NotificationLog } from './maintenanceService';

export interface NotificationRequest {
  type: 'TASK_ASSIGNED' | 'TASK_DUE_REMINDER' | 'TASK_OVERDUE' | 'TASK_COMPLETED';
  taskId: string;
  assigneeId?: string;
  assignedBy?: string;
  taskName?: string;
  dueDate?: string;
  description?: string;
}

/**
 * Skicka notifiering via Supabase Edge Function
 */
export async function sendTaskNotification(request: NotificationRequest): Promise<boolean> {
  try {
    console.log('📧 Sending notification:', request.type, 'for task', request.taskId);

    const { data, error } = await supabase.functions.invoke('task-notifications', {
      body: request
    });

    if (error) {
      console.error('❌ Notification function error:', error);
      return false;
    }

    console.log('✅ Notification sent successfully:', data);
    return data?.success || false;

  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    return false;
  }
}

/**
 * Hämta alla användare för tilldelning
 */
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Failed to fetch users:', error);
      return [];
    }

    return data.users.map(user => ({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Okänd användare',
      avatar_url: user.user_metadata?.avatar_url
    }));

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
}

/**
 * Hämta användarens notifieringsinställningar
 */
export async function getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Failed to fetch notification preferences:', error);
      return null;
    }

    // Returnera standardinställningar om inga finns
    if (!data) {
      return {
        user_id: userId,
        task_assigned: true,
        task_due_reminder: true,
        task_overdue: true,
        task_completed: false,
        email_notifications: true,
        in_app_notifications: true
      };
    }

    return data;

  } catch (error) {
    console.error('❌ Error fetching notification preferences:', error);
    return null;
  }
}

/**
 * Uppdatera användarens notifieringsinställningar
 */
export async function updateUserNotificationPreferences(preferences: UserNotificationPreferences): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert(preferences, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Failed to update notification preferences:', error);
      return false;
    }

    console.log('✅ Notification preferences updated successfully');
    return true;

  } catch (error) {
    console.error('❌ Error updating notification preferences:', error);
    return false;
  }
}

/**
 * Hämta notifieringslogg för en uppgift
 */
export async function getNotificationLog(taskId: string): Promise<NotificationLog[]> {
  try {
    const { data, error } = await supabase
      .from('notification_log')
      .select('*')
      .eq('task_id', taskId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch notification log:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('❌ Error fetching notification log:', error);
    return [];
  }
}

/**
 * Tilldela uppgift till användare och skicka notifiering
 */
export async function assignTaskToUser(
  task: MaintenanceTask, 
  assigneeId: string, 
  assignedBy: string
): Promise<boolean> {
  try {
    console.log('👤 Assigning task', task.id, 'to user', assigneeId);

    // Uppdatera uppgiften med tilldelningsinformation
    const updatedTask = {
      ...task,
      assignee_id: assigneeId,
      assigned_at: new Date().toISOString(),
      assigned_by: assignedBy
    };

    // Spara i databasen (denna funktion behöver implementeras i maintenanceService)
    // För nu, logga bara
    console.log('📝 Task assignment data:', updatedTask);

    // Skicka notifiering
    const notificationSent = await sendTaskNotification({
      type: 'TASK_ASSIGNED',
      taskId: task.id,
      assigneeId,
      assignedBy,
      taskName: task.name,
      dueDate: task.due_date,
      description: task.description
    });

    if (!notificationSent) {
      console.warn('⚠️ Task assigned but notification failed');
    }

    return true;

  } catch (error) {
    console.error('❌ Failed to assign task:', error);
    return false;
  }
}

/**
 * Skicka påminnelse för förfallande uppgifter
 */
export async function sendDueReminders(): Promise<void> {
  try {
    console.log('⏰ Checking for tasks that need due reminders...');
    
    // Denna funktion skulle köras som en scheduled job
    // Implementera logik för att hitta uppgifter som förfaller inom X dagar
    // och skicka påminnelser till tilldelade användare

  } catch (error) {
    console.error('❌ Error sending due reminders:', error);
  }
}

/**
 * Skicka notifiering när uppgift markeras som slutförd
 */
export async function notifyTaskCompleted(task: MaintenanceTask): Promise<void> {
  if (!task.assignee_id) return;

  await sendTaskNotification({
    type: 'TASK_COMPLETED',
    taskId: task.id,
    assigneeId: task.assignee_id,
    taskName: task.name,
    description: task.description
  });
}