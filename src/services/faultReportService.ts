/**
 * Fault Report Service
 * Handles all database operations for fault reports (felanmälningar)
 * Public form - no authentication required for submissions
 */

import { safeGetSession } from './supabaseClient';

const SUPABASE_URL = 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
const SUPABASE_ANON_KEY_LOCAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk';

async function directRestCall(method: string, endpoint: string, body?: any, timeout: number = 10000) {
  let authToken: string | null = null;
  try {
    const { data: { session } } = await safeGetSession();
    if (session?.access_token) {
      authToken = session.access_token;
    }
  } catch { /* fall through to anon key */ }

  if (!authToken) authToken = SUPABASE_ANON_KEY_LOCAL;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY_LOCAL,
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : method === 'PATCH' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  if (method === 'DELETE') return null;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const text = await response.text();
    return text.trim() ? JSON.parse(text) : null;
  }
  return null;
}

// Types
export interface FaultReport {
  id: string;
  reference_number: string;
  apartment_number: string;
  contact_email: string | null;
  contact_phone: string | null;
  category: FaultCategory;
  location: FaultLocation;
  description: string;
  photo_url: string | null;
  status: FaultStatus;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
}

export type FaultCategory = 
  | 'belysning'
  | 'vatten'
  | 'el'
  | 'dorrar'
  | 'hiss'
  | 'ventilation'
  | 'utemiljo'
  | 'skadedjur'
  | 'ovrigt';

export type FaultLocation =
  | 'lagenhet'
  | 'gastlagenhet'
  | 'trappuppgang'
  | 'tvattstuga'
  | 'kallare'
  | 'parkering'
  | 'ellagarden'
  | 'ovrigt';

export type FaultStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface CreateFaultReportInput {
  apartment_number: string;
  contact_email?: string;
  contact_phone?: string;
  category?: FaultCategory;
  location: FaultLocation;
  description: string;
  photo_url?: string;
  turnstileToken?: string;
  honeypot?: string;
}

export interface UpdateFaultReportInput {
  status?: FaultStatus;
  admin_notes?: string;
  resolved_by?: string;
}

// Category labels in Swedish
export const CATEGORY_LABELS: Record<FaultCategory, string> = {
  belysning: 'Belysning',
  vatten: 'Vatten & VVS',
  el: 'El & Eluttag',
  dorrar: 'Dörrar & Lås',
  hiss: 'Hiss',
  ventilation: 'Ventilation',
  utemiljo: 'Utemiljö',
  skadedjur: 'Skadedjur',
  ovrigt: 'Övrigt',
};

// Location labels in Swedish
export const LOCATION_LABELS: Record<FaultLocation, string> = {
  lagenhet: 'I lägenheten',
  gastlagenhet: 'Gästlägenhet',
  trappuppgang: 'Trappuppgång',
  tvattstuga: 'Tvättstuga',
  kallare: 'Källare',
  parkering: 'Parkering',
  ellagarden: 'Ellagården',
  ovrigt: 'Övrigt',
};

// Status labels in Swedish
export const STATUS_LABELS: Record<FaultStatus, string> = {
  new: 'Ny',
  in_progress: 'Pågår',
  waiting: 'Väntar',
  resolved: 'Åtgärdad',
  closed: 'Stängd',
};

// Status colors for UI
export const STATUS_COLORS: Record<FaultStatus, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
  new: 'error',
  in_progress: 'primary',
  waiting: 'warning',
  resolved: 'success',
  closed: 'default',
};

/**
 * Create a new fault report via server-side Edge Function
 * All spam protection (Turnstile, rate limit, honeypot) is verified server-side
 */
export async function createFaultReport(
  input: CreateFaultReportInput
): Promise<{ success: boolean; data?: FaultReport; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
    const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk';

    const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-fault-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        apartment_number: input.apartment_number,
        contact_email: input.contact_email || undefined,
        contact_phone: input.contact_phone || undefined,
        category: input.category,
        location: input.location,
        description: input.description,
        turnstileToken: input.turnstileToken || undefined,
        honeypot: input.honeypot || '',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Kunde inte skicka felanmälan. Försök igen.' };
    }

    return { success: true, data: result.data as FaultReport };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Create fault report exception:', err);
    if (err.name === 'AbortError') {
      return { success: false, error: 'Anslutningen tog för lång tid. Försök igen.' };
    }
    return { success: false, error: 'Ett oväntat fel uppstod.' };
  }
}

/**
 * Get all fault reports (admin view)
 */
export async function getAllFaultReports(
  statusFilter?: FaultStatus
): Promise<{ success: boolean; data?: FaultReport[]; error?: string }> {
  try {
    let endpoint = 'fault_reports?select=*&order=created_at.desc';
    if (statusFilter) {
      endpoint += `&status=eq.${statusFilter}`;
    }
    const data = await directRestCall('GET', endpoint);
    return { success: true, data: (Array.isArray(data) ? data : []) as FaultReport[] };
  } catch (err) {
    console.error('Get fault reports exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod.' };
  }
}

/**
 * Get a single fault report by ID
 */
export async function getFaultReportById(
  id: string
): Promise<{ success: boolean; data?: FaultReport; error?: string }> {
  try {
    const data = await directRestCall('GET', `fault_reports?id=eq.${id}&select=*`);
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, data: data[0] as FaultReport };
    }
    return { success: false, error: 'Kunde inte hämta felanmälan.' };
  } catch (err) {
    console.error('Get fault report exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod.' };
  }
}

/**
 * Update a fault report (admin only)
 */
export async function updateFaultReport(
  id: string,
  input: UpdateFaultReportInput
): Promise<{ success: boolean; data?: FaultReport; error?: string }> {
  try {
    const updateData: Record<string, unknown> = { ...input };

    // If status is being set to resolved, add resolved_at timestamp
    if (input.status === 'resolved' && !input.resolved_by) {
      updateData.resolved_at = new Date().toISOString();
    }

    const data = await directRestCall('PATCH', `fault_reports?id=eq.${id}&select=*`, updateData);
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, data: data[0] as FaultReport };
    }
    return { success: false, error: 'Kunde inte uppdatera felanmälan.' };
  } catch (err) {
    console.error('Update fault report exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod.' };
  }
}

/**
 * Delete a fault report (admin only)
 */
export async function deleteFaultReport(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await directRestCall('DELETE', `fault_reports?id=eq.${id}`);
    return { success: true };
  } catch (err) {
    console.error('Delete fault report exception:', err);
    return { success: false, error: 'Kunde inte ta bort felanmälan.' };
  }
}

/**
 * Get statistics for fault reports
 */
export async function getFaultReportStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    byStatus: Record<FaultStatus, number>;
    byCategory: Record<FaultCategory, number>;
    recentCount: number;
  };
  error?: string;
}> {
  try {
    const data = await directRestCall('GET', 'fault_reports?select=status,category,created_at');
    const reports = (Array.isArray(data) ? data : []) as Pick<FaultReport, 'status' | 'category' | 'created_at'>[];
    
    // Count by status
    const byStatus: Record<FaultStatus, number> = {
      new: 0,
      in_progress: 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
    };
    
    // Count by category
    const byCategory: Record<FaultCategory, number> = {
      belysning: 0,
      vatten: 0,
      el: 0,
      dorrar: 0,
      hiss: 0,
      ventilation: 0,
      utemiljo: 0,
      skadedjur: 0,
      ovrigt: 0,
    };
    
    // Recent (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let recentCount = 0;
    
    reports.forEach(report => {
      byStatus[report.status]++;
      byCategory[report.category]++;
      if (new Date(report.created_at) > sevenDaysAgo) {
        recentCount++;
      }
    });
    
    return {
      success: true,
      data: {
        total: reports.length,
        byStatus,
        byCategory,
        recentCount,
      },
    };
  } catch (err) {
    console.error('Get fault report stats exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod.' };
  }
}

/**
 * Get a fault report by reference number (public - for status tracking)
 */
export async function getFaultReportByReference(
  referenceNumber: string
): Promise<{ success: boolean; data?: FaultReport; error?: string }> {
  try {
    const ref = encodeURIComponent(referenceNumber.toUpperCase());
    const data = await directRestCall('GET', `fault_reports?reference_number=eq.${ref}&select=id,reference_number,apartment_number,category,location,description,status,created_at,updated_at,resolved_at`, undefined, 30000);
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, data: data[0] as FaultReport };
    }
    return { success: false, error: 'Kunde inte hitta felanmälan med det referensnumret.' };
  } catch (err: any) {
    console.error('Get fault report by reference exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod.' };
  }
}

/**
 * Get notification settings from database
 */
async function getNotificationSettings(): Promise<{
  email_notifications: boolean;
  fault_report_notifications: boolean;
  admin_email: string;
} | null> {
  try {
    const data = await directRestCall('GET', 'notification_settings?select=email_notifications,fault_report_notifications,admin_email&limit=1');
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (err) {
    console.error('Get notification settings exception:', err);
    return null;
  }
}

/**
 * Send notification to admin for new fault report (checks settings first)
 */
export async function notifyAdminOfNewReport(report: FaultReport): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    
    if (!settings) {
      console.log('No notification settings found, skipping admin notification');
      return;
    }
    
    if (!settings.email_notifications || !settings.fault_report_notifications) {
      console.log('Fault report notifications disabled');
      return;
    }
    
    if (!settings.admin_email) {
      console.log('No admin email configured');
      return;
    }
    
    await sendFaultReportNotification(report, settings.admin_email);
  } catch (err) {
    console.error('Failed to notify admin:', err);
  }
}

/**
 * Send email notification for new fault report
 */
export async function sendFaultReportNotification(
  report: FaultReport,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: adminEmail,
        subject: `Ny felanmälan: ${report.reference_number} - ${CATEGORY_LABELS[report.category]}`,
        text: `En ny felanmälan har inkommit.\n\nReferensnummer: ${report.reference_number}\nLägenhet: ${report.apartment_number}\nKategori: ${CATEGORY_LABELS[report.category]}\nPlats: ${LOCATION_LABELS[report.location]}\nBeskrivning: ${report.description}\n\nLogga in för att hantera ärendet.`,
        html: `
          <h2>Ny felanmälan</h2>
          <p><strong>Referensnummer:</strong> ${report.reference_number}</p>
          <p><strong>Lägenhet:</strong> ${report.apartment_number}</p>
          <p><strong>Kategori:</strong> ${CATEGORY_LABELS[report.category]}</p>
          <p><strong>Plats:</strong> ${LOCATION_LABELS[report.location]}</p>
          <p><strong>Beskrivning:</strong><br/>${report.description}</p>
          <p><a href="https://www.gulmaran.com/admin/fault-reports">Logga in för att hantera ärendet</a></p>
        `,
        type: 'user-notification',
      }),
    });
    
    if (!response.ok) {
      console.error('Email notification failed:', await response.text());
      return { success: false, error: 'Kunde inte skicka e-postnotifikation.' };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Email notification exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod vid e-postutskick.' };
  }
}

/**
 * Send status update email to reporter
 */
export async function sendStatusUpdateEmail(
  report: FaultReport,
  newStatus: FaultStatus,
  reporterEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    // Status-specific messages
    const statusMessages: Record<FaultStatus, { subject: string; message: string; emoji: string }> = {
      new: { subject: 'Mottagen', message: 'Din felanmälan har mottagits.', emoji: '📥' },
      in_progress: { subject: 'Under arbete', message: 'Vi arbetar nu med att åtgärda felet du rapporterat.', emoji: '🔧' },
      waiting: { subject: 'Väntar på åtgärd', message: 'Vi väntar på leverantör eller material för att kunna åtgärda felet.', emoji: '⏳' },
      resolved: { subject: 'Åtgärdat', message: 'Felet du rapporterade har nu åtgärdats!', emoji: '✅' },
      closed: { subject: 'Avslutat', message: 'Ditt ärende har avslutats.', emoji: '📁' },
    };
    
    const statusInfo = statusMessages[newStatus];
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: reporterEmail,
        subject: `${statusInfo.emoji} Felanmälan ${report.reference_number}: ${statusInfo.subject}`,
        text: `Hej!\n\n${statusInfo.message}\n\nReferensnummer: ${report.reference_number}\nKategori: ${CATEGORY_LABELS[report.category]}\nPlats: ${LOCATION_LABELS[report.location]}\n\nFölj statusen här:\nhttps://www.gulmaran.com/felanmalan/status?ref=${report.reference_number}\n\nMed vänlig hälsning,\nBRF Gulmåran`,
        html: `
          <h2>${statusInfo.emoji} ${statusInfo.subject}</h2>
          <p>${statusInfo.message}</p>
          <hr/>
          <p><strong>Referensnummer:</strong> ${report.reference_number}</p>
          <p><strong>Kategori:</strong> ${CATEGORY_LABELS[report.category]}</p>
          <p><strong>Plats:</strong> ${LOCATION_LABELS[report.location]}</p>
          <hr/>
          <p><a href="https://www.gulmaran.com/felanmalan/status?ref=${report.reference_number}">Följ statusen på din anmälan</a></p>
          <p>Med vänlig hälsning,<br/>BRF Gulmåran</p>
        `,
        type: 'user-notification',
      }),
    });
    
    if (!response.ok) {
      console.error('Status update email failed:', await response.text());
      return { success: false, error: 'Kunde inte skicka statusuppdatering.' };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Status update email exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod.' };
  }
}

/**
 * Send confirmation email to reporter
 */
export async function sendReporterConfirmation(
  report: FaultReport,
  reporterEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: reporterEmail,
        subject: `Bekräftelse felanmälan ${report.reference_number}`,
        text: `Tack för din felanmälan!\n\nDitt referensnummer är: ${report.reference_number}\n\nDu kan följa statusen på din anmälan här:\nhttps://www.gulmaran.com/felanmalan/status?ref=${report.reference_number}\n\nVi återkommer så snart vi har åtgärdat felet.\n\nMed vänlig hälsning,\nBRF Gulmåran`,
        html: `
          <h2>Tack för din felanmälan!</h2>
          <p><strong>Ditt referensnummer är:</strong> ${report.reference_number}</p>
          <p><strong>Kategori:</strong> ${CATEGORY_LABELS[report.category]}</p>
          <p><strong>Plats:</strong> ${LOCATION_LABELS[report.location]}</p>
          <p><strong>Beskrivning:</strong><br/>${report.description}</p>
          <hr/>
          <p><a href="https://www.gulmaran.com/felanmalan/status?ref=${report.reference_number}">Följ statusen på din anmälan</a></p>
          <p>Vi återkommer så snart vi har åtgärdat felet.</p>
          <p>Med vänlig hälsning,<br/>BRF Gulmåran</p>
        `,
        type: 'user-notification',
      }),
    });
    
    if (!response.ok) {
      console.error('Reporter confirmation email failed:', await response.text());
      return { success: false, error: 'Kunde inte skicka bekräftelse.' };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Reporter confirmation exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod.' };
  }
}

export default {
  createFaultReport,
  getAllFaultReports,
  getFaultReportById,
  getFaultReportByReference,
  updateFaultReport,
  deleteFaultReport,
  getFaultReportStats,
  sendFaultReportNotification,
  sendReporterConfirmation,
  sendStatusUpdateEmail,
  notifyAdminOfNewReport,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
};

