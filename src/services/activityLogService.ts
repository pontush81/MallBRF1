import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { authenticatedRestCall } from './supabaseClient';

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'booking_created'
  | 'booking_updated'
  | 'booking_cancelled'
  | 'fault_report_created'
  | 'fault_report_status_changed'
  | 'page_created'
  | 'page_updated'
  | 'user_created'
  | 'user_updated'
  | 'hsb_report_sent';

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('mallbrf-supabase-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || parsed?.currentSession?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Log a user activity. Fire-and-forget — never blocks the caller.
 */
export function logActivity(
  action: ActivityAction,
  description: string,
  metadata?: Record<string, unknown>
): void {
  try {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return;
    const user = JSON.parse(stored);
    const token = getAuthToken();
    if (!token) return;

    const body = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.name || user.email,
      action,
      description,
      metadata: metadata || {},
    };

    fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch {
    // Silently ignore
  }
}

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Fetch activity log entries for admin view.
 */
export async function getActivityLog(params: {
  limit?: number;
  offset?: number;
  action?: string;
}): Promise<{ data: ActivityLogEntry[]; count: number }> {
  const { limit = 25, offset = 0, action } = params;

  let endpoint = `activity_log?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
  if (action) {
    endpoint += `&action=eq.${action}`;
  }

  const data = await authenticatedRestCall('GET', endpoint, undefined, { timeout: 10000 });

  // Get count with a separate HEAD request
  const token = getAuthToken() || SUPABASE_ANON_KEY;
  let countEndpoint = `${SUPABASE_URL}/rest/v1/activity_log?select=id`;
  if (action) {
    countEndpoint += `&action=eq.${action}`;
  }

  const countRes = await fetch(countEndpoint, {
    method: 'HEAD',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      Prefer: 'count=exact',
    },
  });

  const contentRange = countRes.headers.get('content-range');
  const count = contentRange ? parseInt(contentRange.split('/')[1] || '0', 10) : (data?.length || 0);

  return { data: data || [], count };
}
