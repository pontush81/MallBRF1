import { safeGetSession } from './supabaseClient';

const SUPABASE_URL = 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk';

// --- Types ---

export type RowType = 'section' | 'subsection' | 'item' | 'blank' | 'summary';
export type PlanRowStatus = 'planned' | 'in_progress' | 'completed' | 'postponed';

export interface PlanRow {
  id: string;
  rowType: RowType;
  nr: string;
  byggdel: string;
  atgard: string;
  tek_livslangd: string;
  a_pris: number | null;
  antal: number | null;
  year_2026: number | null;
  year_2027: number | null;
  year_2028: number | null;
  year_2029: number | null;
  year_2030: number | null;
  year_2031: number | null;
  year_2032: number | null;
  year_2033: number | null;
  year_2034: number | null;
  year_2035: number | null;
  utredningspunkter: string;
  info_url?: string;
  sortIndex: number;
  indentLevel: number;
  isLocked: boolean;
  status: PlanRowStatus;
}

export interface PlanData {
  columns: string[];
  rows: PlanRow[];
}

export interface PlanVersion {
  id: string;
  version: number;
  plan_data: PlanData;
  metadata: {
    saved_by?: string;
    comment?: string;
  };
  created_at: string;
  created_by: string | null;
}

export const YEAR_COLUMNS = [
  'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
  'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035'
] as const;

export const VISIBLE_COLUMNS = [
  'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
  ...YEAR_COLUMNS,
  'utredningspunkter'
] as const;

// --- REST helper ---

async function directRestCall(method: string, endpoint: string, body?: any, timeout: number = 30000) {
  let authToken: string | null = null;
  try {
    const { data: { session } } = await safeGetSession();
    if (session?.access_token) {
      authToken = session.access_token;
    }
  } catch (error) {
    console.error('Failed to get session:', error);
  }

  if (!authToken && method !== 'GET') {
    throw new Error('Authentication required for write operations');
  }
  if (!authToken) {
    authToken = SUPABASE_ANON_KEY;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const text = await response.text();
    return text.trim() ? JSON.parse(text) : {};
  }
  return {};
}

// --- API functions ---

export async function getLatestPlan(): Promise<PlanVersion | null> {
  try {
    const params = new URLSearchParams();
    params.append('select', '*');
    params.append('order', 'version.desc');
    params.append('limit', '1');

    const data = await directRestCall('GET', `maintenance_plan_versions?${params.toString()}`);
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching latest plan:', error);
    return null;
  }
}

export async function getAllVersions(): Promise<Pick<PlanVersion, 'id' | 'version' | 'created_at' | 'created_by' | 'metadata'>[]> {
  try {
    const params = new URLSearchParams();
    params.append('select', 'id,version,created_at,created_by,metadata');
    params.append('order', 'version.desc');

    const data = await directRestCall('GET', `maintenance_plan_versions?${params.toString()}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching versions:', error);
    return [];
  }
}

export async function getPlanVersion(versionId: string): Promise<PlanVersion | null> {
  try {
    const params = new URLSearchParams();
    params.append('select', '*');
    params.append('id', `eq.${versionId}`);

    const data = await directRestCall('GET', `maintenance_plan_versions?${params.toString()}`);
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching plan version:', error);
    return null;
  }
}

export async function savePlanVersion(
  planData: PlanData,
  currentVersion: number,
  userId?: string,
  comment?: string
): Promise<PlanVersion | null> {
  try {
    const body = {
      version: currentVersion + 1,
      plan_data: planData,
      metadata: {
        saved_by: userId || 'unknown',
        comment: comment || ''
      },
      created_by: userId || null
    };

    const data = await directRestCall('POST', 'maintenance_plan_versions', body);
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return data as PlanVersion;
  } catch (error) {
    console.error('Error saving plan version:', error);
    return null;
  }
}
