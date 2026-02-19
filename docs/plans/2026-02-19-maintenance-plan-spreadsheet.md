# Underhållsplan Spreadsheet Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the admin maintenance page (`/admin/maintenance`) with a Handsontable-based spreadsheet that mirrors the BRF's existing Excel underhållsplan, supports inline editing, add/remove rows, auto-summation, Excel export, and Supabase persistence with versioning.

**Architecture:** New React component `MaintenancePlanSpreadsheet` using Handsontable Community for the grid, SheetJS (xlsx) for Excel export, and a new Supabase table `maintenance_plan_versions` storing the entire sheet as a JSON blob with append-only versioning. The component replaces `SimpleMaintenancePlan` in the admin route.

**Tech Stack:** Handsontable Community (MIT), @handsontable/react, xlsx (SheetJS), Supabase (existing directRestCall pattern), MUI (toolbar/dialogs), TypeScript

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Handsontable and SheetJS**

```bash
cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1
npm install handsontable @handsontable/react xlsx
```

**Step 2: Verify installation**

```bash
cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1
node -e "require('handsontable'); require('@handsontable/react'); require('xlsx'); console.log('All packages installed OK')"
```

Expected: "All packages installed OK"

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add handsontable and xlsx dependencies for maintenance plan spreadsheet"
```

---

### Task 2: Create Supabase Migration for maintenance_plan_versions

**Files:**
- Create: `supabase/migrations/20260219_create_maintenance_plan_versions.sql`

**Step 1: Write the migration SQL**

Create the file with this content:

```sql
-- Maintenance plan spreadsheet storage
-- Stores the entire plan as a JSON blob with append-only versioning
CREATE TABLE IF NOT EXISTS maintenance_plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL DEFAULT 1,
    plan_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Index for fast "get latest version" query
CREATE INDEX IF NOT EXISTS idx_maintenance_plan_versions_version
ON maintenance_plan_versions(version DESC);

-- Enable Row Level Security
ALTER TABLE maintenance_plan_versions ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read and write
CREATE POLICY "Enable read for authenticated users" ON maintenance_plan_versions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON maintenance_plan_versions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No UPDATE or DELETE - append-only versioning
```

The `plan_data` JSONB column stores the full spreadsheet as:
```json
{
  "columns": ["nr", "byggdel", "atgard", "tek_livslangd", "a_pris", "antal", "year_2026", ..., "year_2035", "utredningspunkter"],
  "rows": [
    {
      "id": "uuid",
      "rowType": "section",
      "nr": "3",
      "byggdel": "Utvändigt",
      "atgard": "",
      "tek_livslangd": "",
      "a_pris": null,
      "antal": null,
      "year_2026": null,
      ...
      "utredningspunkter": "",
      "sortIndex": 0,
      "indentLevel": 0,
      "isLocked": true
    },
    ...
  ]
}
```

**Step 2: Run the migration against Supabase**

This must be run manually in the Supabase SQL editor (Dashboard > SQL Editor) since the project uses hosted Supabase:

```
Copy the SQL above and run it in the Supabase Dashboard SQL editor.
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260219_create_maintenance_plan_versions.sql
git commit -m "feat: add maintenance_plan_versions table migration"
```

---

### Task 3: Create the Maintenance Plan Service

**Files:**
- Create: `src/services/maintenancePlanService.ts`

**Step 1: Write the service**

This service follows the existing `directRestCall` pattern from `maintenanceService.ts`. It re-uses the same helper.

```typescript
// src/services/maintenancePlanService.ts
import { supabaseClient } from './supabaseClient';

const SUPABASE_URL = 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk';

// --- Types ---

export type RowType = 'section' | 'subsection' | 'item' | 'blank' | 'summary';

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
  sortIndex: number;
  indentLevel: number;
  isLocked: boolean;
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

// --- Year columns helper ---
export const YEAR_COLUMNS = [
  'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
  'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035'
] as const;

export const VISIBLE_COLUMNS = [
  'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
  ...YEAR_COLUMNS,
  'utredningspunkter'
] as const;

// --- REST helper (same pattern as maintenanceService.ts) ---

async function directRestCall(method: string, endpoint: string, body?: any, timeout: number = 10000) {
  let authToken: string | null = null;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
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

/** Get the latest version of the maintenance plan */
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

/** Get all versions (for version history UI) */
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

/** Get a specific version by ID */
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

/** Save a new version (append-only) */
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
```

**Step 2: Commit**

```bash
git add src/services/maintenancePlanService.ts
git commit -m "feat: add maintenance plan service with versioned CRUD"
```

---

### Task 4: Create the Default Seed Data

**Files:**
- Create: `src/data/maintenancePlanSeedData.ts`

**Step 1: Write the seed data file**

This file contains all the rows from the existing Excel sheet (image) as the initial dataset. Every row from the original plan is preserved.

```typescript
// src/data/maintenancePlanSeedData.ts
import { PlanRow, PlanData } from '../services/maintenancePlanService';
import { v4 as uuidv4 } from 'uuid';

function row(
  overrides: Partial<PlanRow> & Pick<PlanRow, 'rowType'>
): PlanRow {
  return {
    id: uuidv4(),
    nr: '',
    byggdel: '',
    atgard: '',
    tek_livslangd: '',
    a_pris: null,
    antal: null,
    year_2026: null,
    year_2027: null,
    year_2028: null,
    year_2029: null,
    year_2030: null,
    year_2031: null,
    year_2032: null,
    year_2033: null,
    year_2034: null,
    year_2035: null,
    utredningspunkter: '',
    sortIndex: 0,
    indentLevel: 0,
    isLocked: false,
    ...overrides,
  };
}

export function createDefaultPlanData(): PlanData {
  const rows: PlanRow[] = [
    // === SECTION 3: Utvändigt ===
    row({ rowType: 'section', nr: '3', byggdel: 'Utvändigt', isLocked: true, sortIndex: 1 }),
    row({ rowType: 'subsection', nr: '3.1', byggdel: 'Fasader', isLocked: true, sortIndex: 2, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Träplank mot söder', atgard: 'Byte + avgränsningar', tek_livslangd: '25 år', sortIndex: 3, indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Träplank mot norr', atgard: 'Byte + avgränsningar', year_2031: 250000, sortIndex: 4, indentLevel: 2 }),
    row({ rowType: 'blank', sortIndex: 5 }),
    row({ rowType: 'item', byggdel: 'Sophus', atgard: 'Målning', year_2028: 25000, sortIndex: 6, indentLevel: 2 }),
    row({ rowType: 'item', byggdel: 'Ventilationsintag', atgard: 'Plåtarbeten', sortIndex: 7, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '3.1.1', byggdel: 'Fönster', isLocked: true, sortIndex: 8, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Byte takfönster', tek_livslangd: '25 år', sortIndex: 9, indentLevel: 2 }),
    row({ rowType: 'blank', sortIndex: 10 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Byte takfönster lägenhet E F G', a_pris: 27500, antal: 12, year_2028: 330000, sortIndex: 11, indentLevel: 2 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Övriga fönster', year_2028: 250000, year_2029: 250000, sortIndex: 12, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '3.1.2', byggdel: 'Dörrar', isLocked: true, sortIndex: 13, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Lägenhetsdörr bottenvån', tek_livslangd: '30 år', a_pris: 25000, antal: 4, sortIndex: 14, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '3.1.3', byggdel: 'Balkonger', isLocked: true, sortIndex: 15, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Lagning', year_2026: 60000, year_2027: 125000, sortIndex: 16, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '3.2', byggdel: 'Yttertak', isLocked: true, sortIndex: 17, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Målning plåt(ev ingår i takfönster)', sortIndex: 18, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '3.3', byggdel: 'Gård', isLocked: true, sortIndex: 19, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: 'Grind/Dörrar', atgard: 'Byte låssystem', tek_livslangd: '15 år', sortIndex: 20, indentLevel: 2 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Rensning stuprännor', year_2026: 10000, year_2029: 12000, sortIndex: 21, indentLevel: 2 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Avrining Tinas lägenhet', year_2026: 12000, sortIndex: 22, indentLevel: 2 }),

    // === SECTION 4: Invändigt ===
    row({ rowType: 'section', nr: '4', byggdel: 'Invändigt', isLocked: true, sortIndex: 23 }),
    row({ rowType: 'subsection', nr: '4.1', byggdel: 'Källare', isLocked: true, sortIndex: 24, indentLevel: 1 }),
    row({ rowType: 'subsection', nr: '4.1.1', byggdel: 'Tvättstuga', isLocked: true, sortIndex: 25, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Byte maskiner', antal: 10, year_2026: 60000, year_2028: 60000, sortIndex: 26, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '4.1.1', byggdel: 'Gästlägenhet', isLocked: true, sortIndex: 27, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Iordningställande', sortIndex: 28, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '4.2', byggdel: 'Loftgång', isLocked: true, sortIndex: 29, indentLevel: 1 }),
    row({ rowType: 'subsection', nr: '4.2.1', byggdel: 'Dörrar', isLocked: true, sortIndex: 30, indentLevel: 1 }),
    row({ rowType: 'subsection', nr: '4.3', byggdel: 'Vind', isLocked: true, sortIndex: 31, indentLevel: 1 }),
    row({ rowType: 'subsection', nr: '4.4', byggdel: 'Lägenheter', isLocked: true, sortIndex: 32, indentLevel: 1 }),

    // === SECTION 5: Installationer ===
    row({ rowType: 'section', nr: '5', byggdel: 'Installationer', isLocked: true, sortIndex: 33 }),
    row({ rowType: 'subsection', nr: '5.1', byggdel: 'El installationer', isLocked: true, sortIndex: 34, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: 'Översyn timer, jordfelsbrytare, byte av utebelysning', sortIndex: 35, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '5.2', byggdel: 'Ventilation', isLocked: true, sortIndex: 36, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: 'OVK', year_2029: 20000, sortIndex: 37, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '5.3', byggdel: 'Värmesystem', isLocked: true, sortIndex: 38, indentLevel: 1 }),
    row({ rowType: 'item', byggdel: '', atgard: '', year_2030: 150000, sortIndex: 39, indentLevel: 2 }),
    row({ rowType: 'subsection', nr: '5.4', byggdel: 'VA system', isLocked: true, sortIndex: 40, indentLevel: 1 }),

    // Empty rows for future use
    row({ rowType: 'blank', sortIndex: 41 }),
    row({ rowType: 'blank', sortIndex: 42 }),
    row({ rowType: 'blank', sortIndex: 43 }),
    row({ rowType: 'blank', sortIndex: 44 }),

    // === SUMMARY ROWS ===
    row({ rowType: 'summary', byggdel: 'Summa beräknad kostnad', isLocked: true, sortIndex: 100 }),
    row({ rowType: 'summary', byggdel: 'Osäkerhet', atgard: '10%', isLocked: true, sortIndex: 101 }),
    row({ rowType: 'summary', byggdel: 'Totalt inkl moms', isLocked: true, sortIndex: 102 }),
  ];

  return {
    columns: [
      'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
      'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
      'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035',
      'utredningspunkter'
    ],
    rows,
  };
}
```

**Step 2: Commit**

```bash
git add src/data/maintenancePlanSeedData.ts
git commit -m "feat: add default seed data matching existing BRF maintenance plan"
```

---

### Task 5: Build the MaintenancePlanSpreadsheet Component

**Files:**
- Create: `src/components/maintenance/MaintenancePlanSpreadsheet.tsx`

This is the main component. It's the largest task and contains:
- Handsontable grid with all columns
- Row type styling (section headers, subsections, items, summaries)
- Auto-summation logic
- Add/remove row buttons
- Save to Supabase
- Excel export
- Version history dialog

**Step 1: Create the component file**

```typescript
// src/components/maintenance/MaintenancePlanSpreadsheet.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HotTable, HotColumn } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable';
import * as XLSX from 'xlsx';
import {
  Box, Button, Typography, Paper, Toolbar, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemText, IconButton, Tooltip, Chip, CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  History as HistoryIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import {
  PlanRow, PlanData, PlanVersion, RowType,
  YEAR_COLUMNS, getLatestPlan, savePlanVersion,
  getAllVersions, getPlanVersion
} from '../../services/maintenancePlanService';
import { createDefaultPlanData } from '../../data/maintenancePlanSeedData';
import { useAuth } from '../../context/AuthContextNew';

import 'handsontable/dist/handsontable.full.min.css';

// Register all Handsontable modules
registerAllModules();

// --- Column definitions ---
const COLUMN_HEADERS = [
  'Nr', 'Byggdel', 'Åtgärd', 'Tek livslängd', 'a-pris', 'Antal',
  '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035',
  'Utredningspunkter', 'Totalt kr inkl moms'
];

// Column keys matching PlanRow fields (+ computed "total")
const COLUMN_KEYS = [
  'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
  'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
  'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035',
  'utredningspunkter', '_total'
];

// --- Helper: compute row total ---
function computeRowTotal(row: PlanRow): number {
  let sum = 0;
  for (const col of YEAR_COLUMNS) {
    const val = row[col];
    if (typeof val === 'number') sum += val;
  }
  return sum;
}

// --- Helper: compute summary rows ---
function recomputeSummaries(rows: PlanRow[]): PlanRow[] {
  const itemRows = rows.filter(r => r.rowType === 'item');
  const summarySum = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Summa beräknad kostnad');
  const summaryUncertainty = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Osäkerhet');
  const summaryTotal = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Totalt inkl moms');

  if (summarySum) {
    for (const col of YEAR_COLUMNS) {
      summarySum[col] = itemRows.reduce((acc, r) => acc + (typeof r[col] === 'number' ? r[col] as number : 0), 0) || null;
      if (summarySum[col] === 0) summarySum[col] = null;
    }
  }
  if (summaryUncertainty && summarySum) {
    for (const col of YEAR_COLUMNS) {
      const base = summarySum[col];
      summaryUncertainty[col] = typeof base === 'number' ? Math.round(base * 0.1) : null;
    }
  }
  if (summaryTotal && summarySum && summaryUncertainty) {
    for (const col of YEAR_COLUMNS) {
      const base = summarySum[col];
      const unc = summaryUncertainty[col];
      if (typeof base === 'number') {
        summaryTotal[col] = base + (typeof unc === 'number' ? unc : 0);
      } else {
        summaryTotal[col] = null;
      }
    }
  }

  return rows;
}

// --- Helper: convert rows to 2D array for Handsontable ---
function rowsToData(rows: PlanRow[]): (string | number | null)[][] {
  return rows.map(r => [
    r.nr,
    r.byggdel,
    r.atgard,
    r.tek_livslangd,
    r.a_pris,
    r.antal,
    r.year_2026,
    r.year_2027,
    r.year_2028,
    r.year_2029,
    r.year_2030,
    r.year_2031,
    r.year_2032,
    r.year_2033,
    r.year_2034,
    r.year_2035,
    r.utredningspunkter,
    computeRowTotal(r) || null
  ]);
}

// --- Main component ---
const MaintenancePlanSpreadsheet: React.FC = () => {
  const hotRef = useRef<any>(null);
  const { currentUser } = useAuth();

  // State
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'info'
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<Pick<PlanVersion, 'id' | 'version' | 'created_at' | 'created_by' | 'metadata'>[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const latest = await getLatestPlan();
      if (latest) {
        const loadedRows = recomputeSummaries(latest.plan_data.rows);
        setRows(loadedRows);
        setCurrentVersion(latest.version);
      } else {
        // No saved plan yet - use seed data
        const seed = createDefaultPlanData();
        const seededRows = recomputeSummaries(seed.rows);
        setRows(seededRows);
        setCurrentVersion(0);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      // Fallback to seed data
      const seed = createDefaultPlanData();
      setRows(recomputeSummaries(seed.rows));
      setCurrentVersion(0);
    }
    setLoading(false);
  };

  // Convert rows to Handsontable data
  const data = useMemo(() => rowsToData(rows), [rows]);

  // --- Cell meta: styling + read-only for locked rows ---
  const getCellMeta = useCallback((row: number, col: number): Handsontable.CellProperties => {
    const meta: Partial<Handsontable.CellProperties> = {};
    const r = rows[row];
    if (!r) return meta as Handsontable.CellProperties;

    // Read-only for locked rows (sections, subsections, summaries)
    if (r.isLocked) {
      // Allow editing only year columns on summary rows (they're auto-computed, but show values)
      meta.readOnly = true;
    }

    // Read-only for total column (always computed)
    if (col === COLUMN_KEYS.length - 1) {
      meta.readOnly = true;
    }

    // Numeric format for year columns, a-pris, antal, total
    if (col >= 4 && col <= 17) {
      meta.type = 'numeric';
      meta.numericFormat = { pattern: '0,0', culture: 'sv-SE' };
    }

    // Styling by row type
    if (r.rowType === 'section') {
      meta.className = 'htMiddle plan-section-row';
    } else if (r.rowType === 'subsection') {
      meta.className = 'htMiddle plan-subsection-row';
    } else if (r.rowType === 'summary') {
      meta.className = 'htMiddle plan-summary-row';
    } else if (r.rowType === 'blank') {
      meta.className = 'htMiddle plan-blank-row';
    }

    return meta as Handsontable.CellProperties;
  }, [rows]);

  // --- Handle cell change ---
  const handleAfterChange = useCallback((changes: Handsontable.CellChange[] | null, source: string) => {
    if (!changes || source === 'loadData') return;

    setRows(prev => {
      const updated = [...prev];
      for (const [rowIdx, colKey, _oldVal, newVal] of changes) {
        const key = COLUMN_KEYS[colKey as number];
        if (!key || key === '_total') continue;

        const row = { ...updated[rowIdx] };
        if (YEAR_COLUMNS.includes(key as any) || key === 'a_pris' || key === 'antal') {
          (row as any)[key] = newVal === '' || newVal === null ? null : Number(newVal);
        } else {
          (row as any)[key] = newVal ?? '';
        }
        updated[rowIdx] = row;
      }

      return recomputeSummaries(updated);
    });

    setHasChanges(true);
  }, []);

  // --- Add row ---
  const handleAddRow = useCallback(() => {
    setRows(prev => {
      const insertAt = selectedRow !== null ? selectedRow + 1 : prev.length;
      // Don't insert after summary rows
      const summaryStart = prev.findIndex(r => r.rowType === 'summary');
      const actualInsertAt = summaryStart >= 0 && insertAt > summaryStart ? summaryStart : insertAt;

      const newRow: PlanRow = {
        id: crypto.randomUUID(),
        rowType: 'item',
        nr: '',
        byggdel: '',
        atgard: '',
        tek_livslangd: '',
        a_pris: null,
        antal: null,
        year_2026: null, year_2027: null, year_2028: null, year_2029: null, year_2030: null,
        year_2031: null, year_2032: null, year_2033: null, year_2034: null, year_2035: null,
        utredningspunkter: '',
        sortIndex: actualInsertAt,
        indentLevel: 2,
        isLocked: false,
      };

      const result = [...prev];
      result.splice(actualInsertAt, 0, newRow);
      // Re-index sortIndex
      result.forEach((r, i) => r.sortIndex = i);
      return result;
    });
    setHasChanges(true);
  }, [selectedRow]);

  // --- Delete row ---
  const handleDeleteRow = useCallback(() => {
    if (selectedRow === null) return;
    const r = rows[selectedRow];
    if (r.isLocked) {
      setSnackbar({ open: true, message: 'Kan inte ta bort låsta rader (rubriker/summering)', severity: 'error' });
      return;
    }
    setDeleteConfirmOpen(true);
  }, [selectedRow, rows]);

  const confirmDelete = useCallback(() => {
    if (selectedRow === null) return;
    setRows(prev => {
      const result = prev.filter((_, i) => i !== selectedRow);
      result.forEach((r, i) => r.sortIndex = i);
      return recomputeSummaries(result);
    });
    setHasChanges(true);
    setSelectedRow(null);
    setDeleteConfirmOpen(false);
  }, [selectedRow]);

  // --- Save ---
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const planData: PlanData = {
        columns: COLUMN_KEYS.filter(k => k !== '_total'),
        rows,
      };

      const saved = await savePlanVersion(
        planData,
        currentVersion,
        currentUser?.email || 'admin'
      );

      if (saved) {
        setCurrentVersion(saved.version);
        setHasChanges(false);
        setSnackbar({ open: true, message: `Sparad som version ${saved.version}`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Kunde inte spara', severity: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setSnackbar({ open: true, message: 'Fel vid sparning', severity: 'error' });
    }
    setSaving(false);
  }, [rows, currentVersion, currentUser]);

  // --- Excel export ---
  const handleExport = useCallback(() => {
    const wsData: (string | number | null)[][] = [
      ['Underhållsplan 2026-2035 - Brf Gulmåran'],
      ['Datum: ' + new Date().toLocaleDateString('sv-SE')],
      [],
      COLUMN_HEADERS,
      ...data
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Underhållsplan');

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // Nr
      { wch: 20 }, // Byggdel
      { wch: 30 }, // Åtgärd
      { wch: 12 }, // Tek livslängd
      { wch: 10 }, // a-pris
      { wch: 6 },  // Antal
      ...YEAR_COLUMNS.map(() => ({ wch: 12 })),
      { wch: 18 }, // Utredningspunkter
      { wch: 18 }, // Totalt
    ];

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `underhallsplan-gulmaran-${date}.xlsx`);

    setSnackbar({ open: true, message: 'Excel-fil nedladdad', severity: 'success' });
  }, [data]);

  // --- Version history ---
  const handleOpenHistory = useCallback(async () => {
    const v = await getAllVersions();
    setVersions(v);
    setHistoryOpen(true);
  }, []);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    const version = await getPlanVersion(versionId);
    if (version) {
      setRows(recomputeSummaries(version.plan_data.rows));
      setCurrentVersion(version.version);
      setHasChanges(true); // Mark as changed since it's a restore (needs re-save)
      setHistoryOpen(false);
      setSnackbar({ open: true, message: `Version ${version.version} återställd (spara för att bekräfta)`, severity: 'info' });
    }
  }, []);

  // --- Row selection ---
  const handleAfterSelectionEnd = useCallback((row: number) => {
    setSelectedRow(row);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Laddar underhållsplan...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Underhållsplan 2026–2035
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Brf Gulmåran &middot; Version {currentVersion || 'ej sparad'}
            {hasChanges && <Chip label="Osparade ändringar" size="small" color="warning" sx={{ ml: 1 }} />}
          </Typography>
        </Box>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ mb: 1 }}>
        <Toolbar variant="dense" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button startIcon={<AddIcon />} size="small" onClick={handleAddRow}>
            Lägg till rad
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            size="small"
            color="error"
            disabled={selectedRow === null}
            onClick={handleDeleteRow}
          >
            Ta bort rad
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button startIcon={<HistoryIcon />} size="small" onClick={handleOpenHistory}>
            Historik
          </Button>
          <Button startIcon={<ExportIcon />} size="small" onClick={handleExport}>
            Exportera Excel
          </Button>
          <Button
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Sparar...' : 'Spara'}
          </Button>
        </Toolbar>
      </Paper>

      {/* Spreadsheet */}
      <Paper sx={{ overflow: 'auto' }}>
        <style>{`
          .plan-section-row { background-color: #e3f2fd !important; font-weight: bold !important; }
          .plan-subsection-row { background-color: #f5f5f5 !important; font-weight: 600 !important; }
          .plan-summary-row { background-color: #fff3e0 !important; font-weight: bold !important; border-top: 2px solid #333 !important; }
          .plan-blank-row { background-color: #fafafa !important; }
        `}</style>
        <HotTable
          ref={hotRef}
          data={data}
          colHeaders={COLUMN_HEADERS}
          rowHeaders={true}
          width="100%"
          height="auto"
          stretchH="all"
          licenseKey="non-commercial-and-evaluation"
          afterChange={handleAfterChange}
          afterSelectionEnd={handleAfterSelectionEnd}
          cells={getCellMeta}
          contextMenu={false}
          manualColumnResize={true}
          manualRowResize={false}
          undo={true}
          autoWrapRow={true}
          autoWrapCol={true}
          fixedColumnsStart={3}
          colWidths={[
            50,   // Nr
            130,  // Byggdel
            200,  // Åtgärd
            90,   // Tek livslängd
            80,   // a-pris
            50,   // Antal
            ...YEAR_COLUMNS.map(() => 90),
            120,  // Utredningspunkter
            120,  // Totalt
          ]}
        />
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Ta bort rad?</DialogTitle>
        <DialogContent>
          <Typography>Är du säker på att du vill ta bort denna rad? Åtgärden kan ångras genom att återställa en tidigare version.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Avbryt</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Ta bort</Button>
        </DialogActions>
      </Dialog>

      {/* Version history dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Versionshistorik</DialogTitle>
        <DialogContent>
          {versions.length === 0 ? (
            <Typography color="text.secondary">Inga sparade versioner ännu.</Typography>
          ) : (
            <List>
              {versions.map(v => (
                <ListItem
                  key={v.id}
                  secondaryAction={
                    <Tooltip title="Återställ denna version">
                      <IconButton edge="end" onClick={() => handleRestoreVersion(v.id)}>
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={`Version ${v.version}`}
                    secondary={`${new Date(v.created_at).toLocaleString('sv-SE')} — ${v.metadata?.saved_by || 'okänd'}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Stäng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaintenancePlanSpreadsheet;
```

**Step 2: Commit**

```bash
git add src/components/maintenance/MaintenancePlanSpreadsheet.tsx
git commit -m "feat: add Handsontable-based maintenance plan spreadsheet component"
```

---

### Task 6: Wire Up the New Component to the Admin Route

**Files:**
- Modify: `src/pages/admin/MaintenancePlanPage.tsx`
- Modify: `src/components/LazyComponents.tsx`

**Step 1: Update the admin page**

Replace the content of `src/pages/admin/MaintenancePlanPage.tsx`:

```typescript
import React from 'react';
import MaintenancePlanSpreadsheet from '../../components/maintenance/MaintenancePlanSpreadsheet';

const MaintenancePlanPage: React.FC = () => {
  return <MaintenancePlanSpreadsheet />;
};

export default MaintenancePlanPage;
```

**Step 2: Commit**

```bash
git add src/pages/admin/MaintenancePlanPage.tsx
git commit -m "feat: wire maintenance plan spreadsheet into admin route"
```

---

### Task 7: Run and Verify

**Step 1: Start the dev server**

```bash
cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1
npm start
```

**Step 2: Verify in browser**

Navigate to `http://localhost:3000/admin/maintenance` and verify:
- [ ] Spreadsheet renders with all rows from the seed data
- [ ] Section headers (blue background) are read-only
- [ ] Subsection headers (grey background) are read-only
- [ ] Item rows are editable (click a cell)
- [ ] Summary rows (orange background) show auto-computed values
- [ ] "Lägg till rad" inserts a new row
- [ ] "Ta bort rad" removes selected row (with confirmation)
- [ ] "Spara" saves to Supabase (requires migration to be applied first)
- [ ] "Exportera Excel" downloads .xlsx file
- [ ] "Historik" shows version history
- [ ] Totals update when changing year values

**Step 3: Run the Supabase migration**

Before "Spara" works, the migration from Task 2 must be applied. Go to Supabase Dashboard > SQL Editor and run the SQL from Task 2.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```

---

### Task 8: Apply the Database Migration

**This is a manual step.**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Paste and run the SQL from Task 2
4. Verify the table exists: `SELECT * FROM maintenance_plan_versions LIMIT 1;`

---

## Summary of Files

| Action | File |
|--------|------|
| Modify | `package.json` (new deps) |
| Create | `supabase/migrations/20260219_create_maintenance_plan_versions.sql` |
| Create | `src/services/maintenancePlanService.ts` |
| Create | `src/data/maintenancePlanSeedData.ts` |
| Create | `src/components/maintenance/MaintenancePlanSpreadsheet.tsx` |
| Modify | `src/pages/admin/MaintenancePlanPage.tsx` |

## Existing Files NOT Modified (preserved)

- `src/components/maintenance/SimpleMaintenancePlan.tsx` — kept as-is (no longer imported by route)
- `src/pages/MaintenancePlan.tsx` — public page, untouched
- `src/services/maintenanceService.ts` — existing service, untouched
- All other maintenance components — untouched
