import { authenticatedRestCall } from './supabaseClient';

// --- Types ---

export type RowType = 'section' | 'subsection' | 'item' | 'blank' | 'summary';
export type PlanRowStatus = '' | 'planned' | 'in_progress' | 'completed' | 'postponed';

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

// --- REST helper (uses shared authenticatedRestCall) ---

// --- API functions ---

export async function getLatestPlan(): Promise<PlanVersion | null> {
  try {
    const params = new URLSearchParams();
    params.append('select', '*');
    params.append('order', 'version.desc');
    params.append('limit', '1');

    const data = await authenticatedRestCall('GET', `maintenance_plan_versions?${params.toString()}`, undefined, { timeout: 30000 });
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

    const data = await authenticatedRestCall('GET', `maintenance_plan_versions?${params.toString()}`, undefined, { timeout: 30000 });
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

    const data = await authenticatedRestCall('GET', `maintenance_plan_versions?${params.toString()}`, undefined, { timeout: 30000 });
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

    const data = await authenticatedRestCall('POST', 'maintenance_plan_versions', body, { timeout: 30000 });
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return data as PlanVersion;
  } catch (error) {
    console.error('Error saving plan version:', error);
    return null;
  }
}
