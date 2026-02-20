import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';

import {
  PlanRow,
  PlanData,
  YEAR_COLUMNS,
  getLatestPlan,
  getPlanVersion,
  savePlanVersion,
} from '../../services/maintenancePlanService';
import { recalcSummaryRows } from '../../components/maintenance/maintenancePlanHelpers';
import { createDefaultPlanData } from '../../data/maintenancePlanSeedData';
import { useAuth } from '../../context/AuthContextNew';
import MaintenancePlanSummary from '../../components/maintenance/MaintenancePlanSummary';
import MaintenancePlanReport from '../../components/maintenance/MaintenancePlanReport';
import ExcelImportDialog from '../../components/maintenance/ExcelImportDialog';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const MaintenancePlanPage: React.FC = () => {
  const { currentUser } = useAuth();

  // Shared state
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [version, setVersion] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ---------------------------------------------------------------------------
  // Load data on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    /** Migrate section numbering: 3-6 → 1-4 (one-time for old data) */
    function migrateNumbering(rows: PlanRow[]): PlanRow[] {
      const firstSection = rows.find(r => r.rowType === 'section');
      if (!firstSection || firstSection.nr !== '3') return rows; // Already migrated or different structure
      const map: Record<string, string> = { '3': '1', '4': '2', '5': '3', '6': '4' };
      return rows.map(r => {
        if (r.rowType !== 'section' && r.rowType !== 'subsection') return r;
        for (const [old, nw] of Object.entries(map)) {
          if (r.nr === old || r.nr.startsWith(old + '.')) {
            return { ...r, nr: nw + r.nr.slice(old.length) };
          }
        }
        return r;
      });
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const plan = await getLatestPlan();
        if (cancelled) return;

        if (plan && plan.plan_data && plan.plan_data.rows.length > 0) {
          let migrated = migrateNumbering([...plan.plan_data.rows]);
          const recalculated = recalcSummaryRows(migrated);
          // Migrate: add status field to rows from older versions
          for (const r of recalculated) {
            if (!r.status) r.status = 'planned';
          }
          setRows(recalculated);
          setVersion(plan.version);
        } else {
          // First time: use seed data
          const seed = createDefaultPlanData();
          const recalculated = recalcSummaryRows([...seed.rows]);
          setRows(recalculated);
          setVersion(0);
        }
      } catch (err) {
        console.error('Error loading maintenance plan:', err);
        const seed = createDefaultPlanData();
        const fallbackRows = recalcSummaryRows([...seed.rows]);
        for (const r of fallbackRows) { if (!r.status) r.status = 'planned'; }
        setRows(fallbackRows);
        setVersion(0);
        setSnackbar({ open: true, message: 'Kunde inte ladda plan, visar standarddata', severity: 'error' });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    try {
      const planData: PlanData = {
        columns: [
          'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
          ...YEAR_COLUMNS,
          'utredningspunkter',
        ],
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
    } catch (err) {
      console.error('Save error:', err);
      setSnackbar({ open: true, message: 'Fel vid sparning', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, rows, version, currentUser]);

  // ---------------------------------------------------------------------------
  // Restore version
  // ---------------------------------------------------------------------------

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    try {
      const plan = await getPlanVersion(versionId);
      if (plan && plan.plan_data) {
        const recalculated = recalcSummaryRows([...plan.plan_data.rows]);
        for (const r of recalculated) { if (!r.status) r.status = 'planned'; }
        setRows(recalculated);
        setVersion(plan.version);
        setIsDirty(true); // Needs re-save after restore
        setSnackbar({ open: true, message: `Version ${plan.version} återställd (spara för att bekräfta)`, severity: 'info' });
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      setSnackbar({ open: true, message: 'Kunde inte återställa version', severity: 'error' });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Snackbar close
  // ---------------------------------------------------------------------------

  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // ---------------------------------------------------------------------------
  // Import from Excel
  // ---------------------------------------------------------------------------

  const handleImportRows = useCallback((importedRows: PlanRow[]) => {
    const recalculated = recalcSummaryRows([...importedRows]);
    setRows(recalculated);
    setIsDirty(true);
    setSnackbar({
      open: true,
      message: `${importedRows.filter(r => r.rowType === 'item').length} poster importerade — spara för att bekräfta`,
      severity: 'info',
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
          {isDirty && (
            <Chip label="Osparade ändringar" color="warning" size="small" />
          )}
        </Box>
      </Box>

      {/* Summary (collapsible) */}
      <MaintenancePlanSummary rows={rows} />

      {/* Report (section list + toolbar) */}
      <MaintenancePlanReport
        rows={rows}
        setRows={setRows}
        version={version}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onRestoreVersion={handleRestoreVersion}
        onOpenImport={() => setImportDialogOpen(true)}
      />

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportRows}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
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
