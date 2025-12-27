/**
 * Fault Report Service
 * Handles all database operations for fault reports (felanmälningar)
 * Public form - no authentication required for submissions
 */

import { supabaseClient } from './supabaseClient';

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
  | 'trappuppgang'
  | 'tvattstuga'
  | 'kallare'
  | 'vind'
  | 'parkering'
  | 'gard'
  | 'entré'
  | 'garage'
  | 'ovrigt';

export type FaultStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface CreateFaultReportInput {
  apartment_number: string;
  contact_email?: string;
  contact_phone?: string;
  category: FaultCategory;
  location: FaultLocation;
  description: string;
  photo_url?: string;
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
  trappuppgang: 'Trappuppgång',
  tvattstuga: 'Tvättstuga',
  kallare: 'Källare',
  vind: 'Vind',
  parkering: 'Parkering',
  gard: 'Gård',
  entré: 'Entré',
  garage: 'Garage',
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
 * Generate a hash of the client IP for rate limiting (GDPR compliant)
 * We use a simple hash since we don't need to reverse it
 */
async function hashIP(): Promise<string> {
  try {
    // Use a timestamp-based identifier since we can't reliably get IP from client
    // This provides basic rate limiting while being GDPR compliant
    const identifier = `${navigator.userAgent}-${new Date().toDateString()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(identifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  } catch {
    return 'unknown';
  }
}

/**
 * Check rate limit - max 5 reports per day from same client
 */
async function checkRateLimit(ipHash: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count, error } = await supabaseClient
    .from('fault_reports')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', today.toISOString());
  
  if (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: 5 }; // Allow on error
  }
  
  const used = count || 0;
  const limit = 5;
  
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Create a new fault report (public - no auth required)
 */
export async function createFaultReport(
  input: CreateFaultReportInput
): Promise<{ success: boolean; data?: FaultReport; error?: string; rateLimitRemaining?: number }> {
  // Use AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const ipHash = await hashIP();
    
    // Check rate limit with timeout
    const rateLimit = await checkRateLimit(ipHash);
    if (!rateLimit.allowed) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: 'Du har nått maxgränsen för felanmälningar idag. Försök igen imorgon.',
        rateLimitRemaining: 0,
      };
    }
    
    const { data, error } = await supabaseClient
      .from('fault_reports')
      .insert({
        apartment_number: input.apartment_number,
        contact_email: input.contact_email || null,
        contact_phone: input.contact_phone || null,
        category: input.category,
        location: input.location,
        description: input.description,
        photo_url: input.photo_url || null,
        ip_hash: ipHash,
        status: 'new',
      })
      .select()
      .abortSignal(controller.signal)
      .single();
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('Create fault report error:', error);
      return { success: false, error: 'Kunde inte skicka felanmälan. Försök igen.' };
    }
    
    return {
      success: true,
      data: data as FaultReport,
      rateLimitRemaining: rateLimit.remaining - 1,
    };
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
    let query = supabaseClient
      .from('fault_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Get fault reports error:', error);
      return { success: false, error: 'Kunde inte hämta felanmälningar.' };
    }
    
    return { success: true, data: data as FaultReport[] };
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
    const { data, error } = await supabaseClient
      .from('fault_reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Get fault report error:', error);
      return { success: false, error: 'Kunde inte hämta felanmälan.' };
    }
    
    return { success: true, data: data as FaultReport };
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
    
    const { data, error } = await supabaseClient
      .from('fault_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Update fault report error:', error);
      return { success: false, error: 'Kunde inte uppdatera felanmälan.' };
    }
    
    return { success: true, data: data as FaultReport };
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
    const { error } = await supabaseClient
      .from('fault_reports')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete fault report error:', error);
      return { success: false, error: 'Kunde inte ta bort felanmälan.' };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Delete fault report exception:', err);
    return { success: false, error: 'Ett oväntat fel uppstod.' };
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
    const { data, error } = await supabaseClient
      .from('fault_reports')
      .select('status, category, created_at');
    
    if (error) {
      console.error('Get fault report stats error:', error);
      return { success: false, error: 'Kunde inte hämta statistik.' };
    }
    
    const reports = data as Pick<FaultReport, 'status' | 'category' | 'created_at'>[];
    
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
    const { data, error } = await supabaseClient
      .from('fault_reports')
      .select('id, reference_number, apartment_number, category, location, description, status, created_at, updated_at, resolved_at')
      .eq('reference_number', referenceNumber.toUpperCase())
      .single();
    
    if (error) {
      console.error('Get fault report by reference error:', error);
      return { success: false, error: 'Kunde inte hitta felanmälan med det referensnumret.' };
    }
    
    return { success: true, data: data as FaultReport };
  } catch (err) {
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
    const { data, error } = await supabaseClient
      .from('notification_settings')
      .select('email_notifications, fault_report_notifications, admin_email')
      .single();
    
    if (error) {
      console.error('Get notification settings error:', error);
      return null;
    }
    
    return data;
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
  notifyAdminOfNewReport,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
};

