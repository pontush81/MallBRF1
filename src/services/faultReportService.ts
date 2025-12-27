/**
 * Fault Report Service
 * Handles all database operations for fault reports (felanmälningar)
 * Public form - no authentication required for submissions
 */

import { supabaseClient } from './supabaseClient';

// Types
export interface FaultReport {
  id: string;
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
  try {
    const ipHash = await hashIP();
    
    // Check rate limit
    const rateLimit = await checkRateLimit(ipHash);
    if (!rateLimit.allowed) {
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
      .single();
    
    if (error) {
      console.error('Create fault report error:', error);
      return { success: false, error: 'Kunde inte skicka felanmälan. Försök igen.' };
    }
    
    return {
      success: true,
      data: data as FaultReport,
      rateLimitRemaining: rateLimit.remaining - 1,
    };
  } catch (err) {
    console.error('Create fault report exception:', err);
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

export default {
  createFaultReport,
  getAllFaultReports,
  getFaultReportById,
  updateFaultReport,
  deleteFaultReport,
  getFaultReportStats,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
};

