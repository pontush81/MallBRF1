# Maintenance Plan UX Improvements

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the maintenance plan from a raw spreadsheet into a board-member-friendly interface with a dashboard overview, collapsible sections, and a dedicated legal compliance (Lagkrav) tab.

**Architecture:** Add a MUI Tabs wrapper around three views: Dashboard (default), Detaljerad (spreadsheet), and Lagkrav. Lift shared state (rows, version, dirty) to the page component. Dashboard and Lagkrav are read-only presentational components; editing stays in Handsontable.

**Tech Stack:** React 18, TypeScript, MUI v5, Handsontable (existing), bastadTheme (existing design system)

---

## Context for implementer

### Current file structure
- `src/pages/admin/MaintenancePlanPage.tsx` — Page wrapper (currently just renders spreadsheet)
- `src/components/maintenance/MaintenancePlanSpreadsheet.tsx` — 797-line component with ALL state, data loading, save, export, Handsontable grid
- `src/services/maintenancePlanService.ts` — Types (`PlanRow`, `PlanData`, `PlanVersion`, `YEAR_COLUMNS`) + REST API functions
- `src/data/maintenancePlanSeedData.ts` — Default plan rows
- `src/theme/bastadTheme.ts` — Design tokens (colors, typography, spacing)

### Data model (PlanRow)
Each row has: `id`, `rowType` ('section'|'subsection'|'item'|'blank'|'summary'), `nr`, `byggdel`, `atgard`, `tek_livslangd`, `a_pris`, `antal`, `year_2026`..`year_2035`, `utredningspunkter`, `sortIndex`, `indentLevel`, `isLocked`.

Sections are: 3=Utvändigt, 4=Invändigt, 5=Installationer, 6=Säkerhet & myndighetskrav.

### Key patterns
- Direct Supabase REST (NOT the SDK) via `directRestCall()`
- bastadTheme tokens for all styling (ocean, sand, terracotta, seagreen)
- DM Sans body font, Fraunces heading font

---

### Task 1: Extract shared helpers and lift state to page

**Goal:** Move data loading, save logic, and helper functions out of MaintenancePlanSpreadsheet so Dashboard and Lagkrav tabs can share the same data without duplication.

**Files:**
- Create: `src/components/maintenance/maintenancePlanHelpers.ts`
- Modify: `src/pages/admin/MaintenancePlanPage.tsx`
- Modify: `src/components/maintenance/MaintenancePlanSpreadsheet.tsx`

**Step 1: Create helpers file**

Extract the pure functions from `MaintenancePlanSpreadsheet.tsx` (lines 54–201) into a new helpers file:

```typescript
// src/components/maintenance/maintenancePlanHelpers.ts
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';

// --- Constants ---
export const COLUMN_HEADERS = [
  'Nr', 'Byggdel', 'Åtgärd', 'Tek livslängd', 'a-pris', 'Antal',
  '2026', '2027', '2028', '2029', '2030',
  '2031', '2032', '2033', '2034', '2035',
  'Utredningspunkter', 'Totalt kr inkl moms',
];

export const COLUMN_WIDTHS = [
  50, 130, 200, 90, 80, 50,
  90, 90, 90, 90, 90,
  90, 90, 90, 90, 90,
  120, 120,
];

export const FIELD_KEYS: (keyof PlanRow | 'total')[] = [
  'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
  'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
  'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035',
  'utredningspunkter', 'total',
];

export const YEAR_COL_START = 6;
export const YEAR_COL_END = 15;
export const TOTAL_COL = 17;
export const A_PRIS_COL = 4;
export const ANTAL_COL = 5;

// --- Helper functions ---
export function computeRowTotal(row: PlanRow): number { /* existing code */ }
export function setYearValue(row: PlanRow, yearCol: typeof YEAR_COLUMNS[number], value: number): void { /* existing code */ }
export function recalcSummaryRows(rows: PlanRow[]): PlanRow[] { /* existing code */ }
export function rowsToData(rows: PlanRow[]): (string | number | null)[][] { /* existing code */ }
export function cssClassForRowType(rowType: string): string { /* existing code */ }

// --- NEW: Section-level computations ---

export interface SectionSummary {
  nr: string;
  name: string;
  totalPerYear: Record<string, number>;
  grandTotal: number;
  itemCount: number;
}

/** Group items by their parent section and compute subtotals per year. */
export function computeSectionSummaries(rows: PlanRow[]): SectionSummary[] {
  const summaries: SectionSummary[] = [];
  let currentSection: SectionSummary | null = null;

  for (const r of rows) {
    if (r.rowType === 'section') {
      if (currentSection) summaries.push(currentSection);
      currentSection = {
        nr: r.nr,
        name: r.byggdel,
        totalPerYear: {},
        grandTotal: 0,
        itemCount: 0,
      };
      for (const yc of YEAR_COLUMNS) {
        currentSection.totalPerYear[yc] = 0;
      }
    } else if (r.rowType === 'item' && currentSection) {
      currentSection.itemCount++;
      for (const yc of YEAR_COLUMNS) {
        const val = r[yc];
        if (typeof val === 'number') {
          currentSection.totalPerYear[yc] += val;
          currentSection.grandTotal += val;
        }
      }
    }
  }
  if (currentSection) summaries.push(currentSection);
  return summaries;
}

/** Get the top N most expensive individual items across the plan. */
export function getTopExpenses(rows: PlanRow[], limit: number = 5): { row: PlanRow; total: number; year: string }[] {
  const items: { row: PlanRow; total: number; year: string }[] = [];
  for (const r of rows) {
    if (r.rowType !== 'item') continue;
    for (const yc of YEAR_COLUMNS) {
      const val = r[yc];
      if (typeof val === 'number' && val > 0) {
        items.push({ row: r, total: val, year: yc.replace('year_', '') });
      }
    }
  }
  items.sort((a, b) => b.total - a.total);
  return items.slice(0, limit);
}

/** Get legally required items (section 6 items + items with 'Lagkrav' in tek_livslangd). */
export function getLagkravItems(rows: PlanRow[]): PlanRow[] {
  let inSection6 = false;
  const result: PlanRow[] = [];
  for (const r of rows) {
    if (r.rowType === 'section') {
      inSection6 = r.nr === '6';
    }
    if (r.rowType === 'item') {
      const isLegal = inSection6 ||
        r.tek_livslangd.toLowerCase().includes('lagkrav') ||
        r.atgard.toLowerCase().includes('ovk') ||
        r.atgard.toLowerCase().includes('obligatorisk') ||
        r.atgard.toLowerCase().includes('energideklaration') ||
        r.atgard.toLowerCase().includes('radon') ||
        r.atgard.toLowerCase().includes('brandskydd');
      if (isLegal) result.push(r);
    }
  }
  return result;
}

/** Compute total cost per year across all item rows. */
export function computeYearlyTotals(rows: PlanRow[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const yc of YEAR_COLUMNS) {
    totals[yc] = 0;
  }
  for (const r of rows) {
    if (r.rowType !== 'item') continue;
    for (const yc of YEAR_COLUMNS) {
      const val = r[yc];
      if (typeof val === 'number') {
        totals[yc] += val;
      }
    }
  }
  return totals;
}
```

**Step 2: Lift state to MaintenancePlanPage**

Rewrite `src/pages/admin/MaintenancePlanPage.tsx` to own all shared state:

```tsx
// src/pages/admin/MaintenancePlanPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Tabs, Tab, Typography, Chip, CircularProgress,
  Snackbar, Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TableChart as TableIcon,
  Gavel as LagkravIcon,
} from '@mui/icons-material';
import {
  PlanRow, PlanData, PlanVersion,
  getLatestPlan, getAllVersions, getPlanVersion, savePlanVersion,
} from '../../services/maintenancePlanService';
import { recalcSummaryRows } from '../../components/maintenance/maintenancePlanHelpers';
import { createDefaultPlanData } from '../../data/maintenancePlanSeedData';
import { useAuth } from '../../context/AuthContextNew';
import MaintenancePlanSpreadsheet from '../../components/maintenance/MaintenancePlanSpreadsheet';
import MaintenancePlanDashboard from '../../components/maintenance/MaintenancePlanDashboard';
import MaintenancePlanLagkrav from '../../components/maintenance/MaintenancePlanLagkrav';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

const MaintenancePlanPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState(0);

  // Shared state
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [version, setVersion] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; severity: 'success' | 'error' | 'info'
  }>({ open: false, message: '', severity: 'success' });

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setIsLoading(true);
      try {
        const plan = await getLatestPlan();
        if (cancelled) return;
        if (plan && plan.plan_data && plan.plan_data.rows.length > 0) {
          setRows(recalcSummaryRows([...plan.plan_data.rows]));
          setVersion(plan.version);
        } else {
          const seed = createDefaultPlanData();
          setRows(recalcSummaryRows([...seed.rows]));
          setVersion(0);
        }
      } catch {
        const seed = createDefaultPlanData();
        setRows(recalcSummaryRows([...seed.rows]));
        setVersion(0);
        setSnackbar({ open: true, message: 'Kunde inte ladda plan', severity: 'error' });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // Save handler (passed to spreadsheet)
  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    try {
      const planData: PlanData = {
        columns: ['nr','byggdel','atgard','tek_livslangd','a_pris','antal',
          'year_2026','year_2027','year_2028','year_2029','year_2030',
          'year_2031','year_2032','year_2033','year_2034','year_2035',
          'utredningspunkter'],
        rows,
      };
      const saved = await savePlanVersion(planData, version, currentUser?.email);
      if (saved) {
        setVersion(saved.version);
        setIsDirty(false);
        setSnackbar({ open: true, message: `Sparad som version ${saved.version}`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Kunde inte spara', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Fel vid sparning', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, rows, version, currentUser]);

  // Restore version handler (passed to spreadsheet)
  const handleRestoreVersion = useCallback(async (versionId: string) => {
    try {
      const plan = await getPlanVersion(versionId);
      if (plan && plan.plan_data) {
        setRows(recalcSummaryRows([...plan.plan_data.rows]));
        setVersion(plan.version);
        setIsDirty(true);
        setSnackbar({ open: true, message: `Version ${plan.version} återställd`, severity: 'info' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Kunde inte återställa version', severity: 'error' });
    }
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Underhållsplan 2026–2035
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">
            Brf Gulmåran &middot; Version {version}
          </Typography>
          {isDirty && <Chip label="Osparade ändringar" color="warning" size="small" />}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}
      >
        <Tab icon={<DashboardIcon />} iconPosition="start" label="Översikt" />
        <Tab icon={<TableIcon />} iconPosition="start" label="Detaljerad plan" />
        <Tab icon={<LagkravIcon />} iconPosition="start" label="Lagkrav" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <MaintenancePlanDashboard rows={rows} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <MaintenancePlanSpreadsheet
          rows={rows}
          setRows={setRows}
          version={version}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
          isSaving={isSaving}
          onSave={handleSave}
          onRestoreVersion={handleRestoreVersion}
        />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <MaintenancePlanLagkrav rows={rows} />
      </TabPanel>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaintenancePlanPage;
```

**Step 3: Refactor MaintenancePlanSpreadsheet to receive state via props**

Change MaintenancePlanSpreadsheet from owning state to receiving it:

```tsx
// New props interface (top of file)
interface SpreadsheetProps {
  rows: PlanRow[];
  setRows: React.Dispatch<React.SetStateAction<PlanRow[]>>;
  version: number;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  onRestoreVersion: (versionId: string) => void;
}

const MaintenancePlanSpreadsheet: React.FC<SpreadsheetProps> = ({
  rows, setRows, version, isDirty, setIsDirty, isSaving, onSave, onRestoreVersion,
}) => {
  // Remove: rows/version/isDirty/isSaving/isLoading state declarations
  // Remove: loadData useEffect
  // Remove: handleSave (use onSave prop)
  // Remove: handleRestoreVersion (use onRestoreVersion prop)
  // Remove: header (moved to page)
  // Remove: snackbar (moved to page)
  // Keep: selectedRow, deleteDialog, historyDialog, hotRef
  // Keep: data memo, columns memo, cellCallback, handleAfterChange
  // Keep: handleAddRow, handleDeleteRowConfirm, handleExportExcel
  // Keep: handleOpenHistory (but use onRestoreVersion for actual restore)
  // Keep: HotTable grid + toolbar + dialogs
};
```

Remove the header `<Typography>Underhållsplan 2026–2035</Typography>` section (lines 622-635) — it's now in the page. Remove the Snackbar (lines 777-793) — it's now in the page. Remove the loading spinner (lines 609-615) — it's now in the page.

**Step 4: Verify build**

Run: `npx craco build 2>&1 | tail -5`
Expected: "The build folder is ready to be deployed."

**Step 5: Commit**

```bash
git add src/components/maintenance/maintenancePlanHelpers.ts src/pages/admin/MaintenancePlanPage.tsx src/components/maintenance/MaintenancePlanSpreadsheet.tsx
git commit -m "refactor: lift state to page, extract helpers, add tab structure"
```

---

### Task 2: Build the Dashboard component

**Goal:** Create a read-only overview that a board member can glance at to understand the financial plan without scrolling through 80+ rows.

**Files:**
- Create: `src/components/maintenance/MaintenancePlanDashboard.tsx`

**Step 1: Implement the Dashboard**

```tsx
// src/components/maintenance/MaintenancePlanDashboard.tsx
import React, { useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  computeYearlyTotals, computeSectionSummaries, getTopExpenses, getLagkravItems, SectionSummary,
} from './maintenancePlanHelpers';
import { bastadTheme } from '../../theme/bastadTheme';

interface DashboardProps {
  rows: PlanRow[];
}

// --- Yearly summary cards row ---
function YearlySummary({ totals }: { totals: Record<string, number> }) {
  const maxVal = Math.max(...Object.values(totals), 1);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontWeight: 600,
          mb: 2,
          color: bastadTheme.colors.ocean[900],
        }}
      >
        Beräknad kostnad per år
      </Typography>
      <Grid container spacing={1.5}>
        {YEAR_COLUMNS.map((yc) => {
          const year = yc.replace('year_', '');
          const amount = totals[yc] || 0;
          const pct = (amount / maxVal) * 100;
          const isHigh = amount > 200000;
          return (
            <Grid item xs={6} sm={4} md={2.4} key={yc}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${isHigh ? bastadTheme.colors.terracotta[200] : bastadTheme.colors.sand[300]}`,
                  bgcolor: isHigh ? bastadTheme.colors.terracotta[50] : bastadTheme.colors.sand[50],
                  borderRadius: bastadTheme.borderRadius?.lg || '12px',
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.body,
                      color: bastadTheme.colors.ocean[600],
                      fontWeight: 600,
                    }}
                  >
                    {year}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.heading,
                      fontWeight: 700,
                      color: isHigh ? bastadTheme.colors.terracotta[700] : bastadTheme.colors.ocean[900],
                      fontSize: '1.1rem',
                      lineHeight: 1.2,
                      mt: 0.5,
                    }}
                  >
                    {amount > 0 ? `${(amount / 1000).toFixed(0)}k` : '–'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      mt: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: bastadTheme.colors.sand[200],
                      '& .MuiLinearProgress-bar': {
                        bgcolor: isHigh ? bastadTheme.colors.terracotta[500] : bastadTheme.colors.ocean[600],
                        borderRadius: 2,
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// --- Section breakdown cards ---
function SectionBreakdown({ sections }: { sections: SectionSummary[] }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontWeight: 600,
          mb: 2,
          color: bastadTheme.colors.ocean[900],
        }}
      >
        Kostnad per sektion
      </Typography>
      <Grid container spacing={2}>
        {sections.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.nr}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${bastadTheme.colors.sand[300]}`,
                borderRadius: bastadTheme.borderRadius?.lg || '12px',
                height: '100%',
              }}
            >
              <CardContent>
                <Typography
                  variant="overline"
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    color: bastadTheme.colors.ocean[500],
                  }}
                >
                  Sektion {s.nr}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.heading,
                    fontWeight: 600,
                    color: bastadTheme.colors.ocean[900],
                    mb: 1,
                  }}
                >
                  {s.name}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.heading,
                    fontWeight: 700,
                    color: bastadTheme.colors.ocean[800],
                  }}
                >
                  {s.grandTotal > 0
                    ? `${(s.grandTotal / 1000).toFixed(0)} tkr`
                    : 'Ej budgeterat'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: bastadTheme.colors.ocean[500] }}
                >
                  {s.itemCount} poster
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// --- Top upcoming expenses ---
function TopExpenses({ expenses }: { expenses: ReturnType<typeof getTopExpenses> }) {
  if (expenses.length === 0) return null;
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontWeight: 600,
          mb: 2,
          color: bastadTheme.colors.ocean[900],
        }}
      >
        Största kommande utgifter
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${bastadTheme.colors.sand[300]}` }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: bastadTheme.colors.sand[100] }}>
              <TableCell sx={{ fontWeight: 600 }}>Åtgärd</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Byggdel</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">År</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Belopp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((e, i) => (
              <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell>{e.row.atgard || '–'}</TableCell>
                <TableCell>{e.row.byggdel || '–'}</TableCell>
                <TableCell align="right">{e.year}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {e.total.toLocaleString('sv-SE')} kr
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// --- Lagkrav status panel ---
function LagkravStatus({ items }: { items: PlanRow[] }) {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontWeight: 600,
          mb: 2,
          color: bastadTheme.colors.ocean[900],
        }}
      >
        Lagkrav & myndighetskrav
      </Typography>
      <Grid container spacing={1.5}>
        {items.map((item) => {
          const hasScheduledCost = YEAR_COLUMNS.some(yc => typeof item[yc] === 'number' && (item[yc] as number) > 0);
          return (
            <Grid item xs={12} sm={6} key={item.id}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${hasScheduledCost ? bastadTheme.colors.seagreen[200] : bastadTheme.colors.terracotta[200]}`,
                  bgcolor: hasScheduledCost ? bastadTheme.colors.seagreen[50] : bastadTheme.colors.terracotta[50],
                  borderRadius: bastadTheme.borderRadius?.lg || '12px',
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, '&:last-child': { pb: 2 } }}>
                  {hasScheduledCost
                    ? <CheckIcon sx={{ color: bastadTheme.colors.success }} />
                    : <WarningIcon sx={{ color: bastadTheme.colors.warning }} />
                  }
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.atgard}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.tek_livslangd}
                    </Typography>
                  </Box>
                  <Chip
                    label={hasScheduledCost ? 'Planerad' : 'Ej schemalagd'}
                    size="small"
                    color={hasScheduledCost ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// --- Main Dashboard ---
const MaintenancePlanDashboard: React.FC<DashboardProps> = ({ rows }) => {
  const yearlyTotals = useMemo(() => computeYearlyTotals(rows), [rows]);
  const sectionSummaries = useMemo(() => computeSectionSummaries(rows), [rows]);
  const topExpenses = useMemo(() => getTopExpenses(rows, 5), [rows]);
  const lagkravItems = useMemo(() => getLagkravItems(rows), [rows]);

  const totalAllYears = Object.values(yearlyTotals).reduce((a, b) => a + b, 0);

  return (
    <Box>
      {/* Grand total banner */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${bastadTheme.colors.ocean[800]} 0%, ${bastadTheme.colors.ocean[900]} 100%)`,
          color: bastadTheme.colors.sand[100],
          borderRadius: bastadTheme.borderRadius?.lg || '12px',
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>
              Total planerad kostnad 2026–2035
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.heading,
                fontWeight: 700,
              }}
            >
              {(totalAllYears / 1000).toFixed(0)} tkr
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon />
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {sectionSummaries.length} sektioner &middot; {rows.filter(r => r.rowType === 'item').length} poster
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <YearlySummary totals={yearlyTotals} />
      <SectionBreakdown sections={sectionSummaries} />
      <TopExpenses expenses={topExpenses} />
      <LagkravStatus items={lagkravItems} />
    </Box>
  );
};

export default MaintenancePlanDashboard;
```

**Step 2: Verify build**

Run: `npx craco build 2>&1 | tail -5`
Expected: "The build folder is ready to be deployed."

**Step 3: Commit**

```bash
git add src/components/maintenance/MaintenancePlanDashboard.tsx
git commit -m "feat: add dashboard overview for maintenance plan"
```

---

### Task 3: Build the Lagkrav tab

**Goal:** A dedicated compliance view showing all legally required maintenance items with their schedule status, frequency, and notes.

**Files:**
- Create: `src/components/maintenance/MaintenancePlanLagkrav.tsx`

**Step 1: Implement Lagkrav component**

```tsx
// src/components/maintenance/MaintenancePlanLagkrav.tsx
import React, { useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Divider, Avatar,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import { getLagkravItems } from './maintenancePlanHelpers';
import { bastadTheme } from '../../theme/bastadTheme';

interface LagkravProps {
  rows: PlanRow[];
}

interface LagkravDetail {
  row: PlanRow;
  scheduledYears: { year: string; amount: number }[];
  nextScheduled: string | null;
  status: 'ok' | 'warning' | 'unknown';
}

function analyzeLagkrav(items: PlanRow[]): LagkravDetail[] {
  return items.map(row => {
    const scheduledYears: { year: string; amount: number }[] = [];
    for (const yc of YEAR_COLUMNS) {
      const val = row[yc];
      if (typeof val === 'number' && val > 0) {
        scheduledYears.push({ year: yc.replace('year_', ''), amount: val });
      }
    }
    const nextScheduled = scheduledYears.length > 0 ? scheduledYears[0].year : null;
    const status: 'ok' | 'warning' | 'unknown' = scheduledYears.length > 0
      ? 'ok'
      : row.utredningspunkter ? 'warning' : 'unknown';

    return { row, scheduledYears, nextScheduled, status };
  });
}

const statusConfig = {
  ok: {
    icon: CheckIcon,
    label: 'Planerad',
    color: bastadTheme.colors.success,
    bgColor: bastadTheme.colors.seagreen[50],
    borderColor: bastadTheme.colors.seagreen[200],
  },
  warning: {
    icon: WarningIcon,
    label: 'Behöver åtgärd',
    color: bastadTheme.colors.warning,
    bgColor: bastadTheme.colors.terracotta[50],
    borderColor: bastadTheme.colors.terracotta[200],
  },
  unknown: {
    icon: ScheduleIcon,
    label: 'Ej schemalagd',
    color: bastadTheme.colors.ocean[500],
    bgColor: bastadTheme.colors.sand[50],
    borderColor: bastadTheme.colors.sand[300],
  },
};

const MaintenancePlanLagkrav: React.FC<LagkravProps> = ({ rows }) => {
  const lagkravItems = useMemo(() => getLagkravItems(rows), [rows]);
  const details = useMemo(() => analyzeLagkrav(lagkravItems), [lagkravItems]);

  const okCount = details.filter(d => d.status === 'ok').length;
  const warningCount = details.filter(d => d.status !== 'ok').length;

  return (
    <Box>
      {/* Summary banner */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          border: `1px solid ${bastadTheme.colors.sand[300]}`,
          borderRadius: bastadTheme.borderRadius?.lg || '12px',
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Avatar sx={{ bgcolor: bastadTheme.colors.ocean[800], width: 48, height: 48 }}>
            <GavelIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.heading,
                fontWeight: 700,
                color: bastadTheme.colors.ocean[900],
              }}
            >
              Lagkrav & obligatoriska kontroller
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dessa åtgärder krävs enligt lag eller branschstandard för BRF:er.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Chip
              icon={<CheckIcon />}
              label={`${okCount} planerade`}
              color="success"
              variant="outlined"
            />
            {warningCount > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${warningCount} behöver åtgärd`}
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Individual cards */}
      <Grid container spacing={2}>
        {details.map((d) => {
          const cfg = statusConfig[d.status];
          const StatusIcon = cfg.icon;
          return (
            <Grid item xs={12} sm={6} key={d.row.id}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${cfg.borderColor}`,
                  bgcolor: cfg.bgColor,
                  borderRadius: bastadTheme.borderRadius?.lg || '12px',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                    <StatusIcon sx={{ color: cfg.color, mt: 0.3 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: bastadTheme.typography.fontFamily.heading,
                          fontWeight: 600,
                          color: bastadTheme.colors.ocean[900],
                        }}
                      >
                        {d.row.atgard}
                      </Typography>
                      {d.row.byggdel && (
                        <Typography variant="caption" color="text.secondary">
                          {d.row.byggdel}
                        </Typography>
                      )}
                    </Box>
                    <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.color, color: '#fff', fontWeight: 600, fontSize: '0.7rem' }} />
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Frekvens:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{d.row.tek_livslangd || '–'}</Typography>
                    </Box>
                    {d.nextScheduled && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Nästa planerad:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{d.nextScheduled}</Typography>
                      </Box>
                    )}
                    {d.scheduledYears.length > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Budget:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {d.scheduledYears.map(s => `${s.amount.toLocaleString('sv-SE')} kr (${s.year})`).join(', ')}
                        </Typography>
                      </Box>
                    )}
                    {d.row.utredningspunkter && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Notering:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{d.row.utredningspunkter}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default MaintenancePlanLagkrav;
```

**Step 2: Verify build**

Run: `npx craco build 2>&1 | tail -5`
Expected: "The build folder is ready to be deployed."

**Step 3: Commit**

```bash
git add src/components/maintenance/MaintenancePlanLagkrav.tsx
git commit -m "feat: add Lagkrav compliance tab for maintenance plan"
```

---

### Task 4: Wire everything together and verify

**Goal:** Ensure all three tabs work, state flows correctly, and the dashboard renders with real data.

**Files:**
- Verify: `src/pages/admin/MaintenancePlanPage.tsx` (imports resolve)
- Verify: `src/components/maintenance/MaintenancePlanSpreadsheet.tsx` (props work)

**Step 1: Final build check**

Run: `npx craco build 2>&1 | tail -5`
Expected: "The build folder is ready to be deployed."

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete maintenance plan UX with dashboard, tabs, and lagkrav view"
```

---

## Summary of changes

| File | Action | Purpose |
|------|--------|---------|
| `src/components/maintenance/maintenancePlanHelpers.ts` | Create | Shared helper functions + section/year computations |
| `src/components/maintenance/MaintenancePlanDashboard.tsx` | Create | Dashboard overview (yearly costs, section breakdown, top expenses, lagkrav status) |
| `src/components/maintenance/MaintenancePlanLagkrav.tsx` | Create | Dedicated legal compliance tab |
| `src/pages/admin/MaintenancePlanPage.tsx` | Modify | Add tabs, lift shared state |
| `src/components/maintenance/MaintenancePlanSpreadsheet.tsx` | Modify | Receive state via props instead of owning it |

## Design tokens used (bastadTheme)

- **Ocean** (900/800/600) — headings, dark cards
- **Sand** (50/100/200/300) — card backgrounds, borders
- **Terracotta** (50/200/500/700) — warning/high-cost highlights
- **Seagreen** (50/200) — success/compliance indicators
- **Fraunces** — headings/numbers
- **DM Sans** — body text
