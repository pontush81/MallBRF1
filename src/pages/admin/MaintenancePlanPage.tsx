import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewListIcon from '@mui/icons-material/ViewList';

import {
  PlanRow,
  PlanData,
  YEAR_COLUMNS,
  getLatestPlan,
  getPlanVersion,
  savePlanVersion,
} from '../../services/maintenancePlanService';
import { recalcSummaryRows, getLagkravItems, enrichWithInfoUrls, normalizeRows, validatePlanData } from '../../components/maintenance/maintenancePlanHelpers';
import { createDefaultPlanData } from '../../data/maintenancePlanSeedData';
import { useAuth } from '../../context/AuthContextNew';
import MaintenancePlanSummary from '../../components/maintenance/MaintenancePlanSummary';
import MaintenancePlanReport from '../../components/maintenance/MaintenancePlanReport';
import MaintenancePlanYearView from '../../components/maintenance/MaintenancePlanYearView';
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

  // View toggle
  type ViewMode = 'byggdel' | 'year';
  const [viewMode, setViewMode] = useState<ViewMode>('byggdel');

  // Import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Lagkrav
  const [lagkravExpanded, setLagkravExpanded] = useState(false);

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

    /** Migrate old data on load */
    function migrateRows(rows: PlanRow[]): PlanRow[] {
      return rows.map(r => {
        let updated = r;
        // Migrate section numbering: 3-6 → 1-4
        if (r.rowType === 'section' || r.rowType === 'subsection') {
          const map: Record<string, string> = { '3': '1', '4': '2', '5': '3', '6': '4' };
          const firstSection = rows.find(row => row.rowType === 'section');
          if (firstSection?.nr === '3') {
            for (const [old, nw] of Object.entries(map)) {
              if (r.nr === old || r.nr.startsWith(old + '.')) {
                updated = { ...updated, nr: nw + r.nr.slice(old.length) };
                break;
              }
            }
          }
        }
        // Rename "Totalt inkl moms" → "Totalt inkl osäkerhet"
        if (r.rowType === 'summary' && r.byggdel === 'Totalt inkl moms') {
          updated = { ...updated, byggdel: 'Totalt inkl osäkerhet' };
        }
        return updated;
      });
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const plan = await getLatestPlan();
        if (cancelled) return;

        if (plan && plan.plan_data && plan.plan_data.rows.length > 0) {
          let migrated = migrateRows([...plan.plan_data.rows]);
          const recalculated = recalcSummaryRows(migrated);
          // Migrate: add status field to rows from older versions
          for (const r of recalculated) {
            if (r.status === undefined || r.status === null) r.status = '';
          }
          enrichWithInfoUrls(recalculated);
          setRows(recalculated);
          setVersion(plan.version);
        } else {
          // First time: use seed data
          const seed = createDefaultPlanData();
          const recalculated = recalcSummaryRows([...seed.rows]);
          enrichWithInfoUrls(recalculated);
          setRows(recalculated);
          setVersion(0);
        }
      } catch (err) {
        console.error('Error loading maintenance plan:', err);
        const seed = createDefaultPlanData();
        const fallbackRows = recalcSummaryRows([...seed.rows]);
        for (const r of fallbackRows) { if (r.status === undefined || r.status === null) r.status = ''; }
        enrichWithInfoUrls(fallbackRows);
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

  /** Internal save — normalises rows, persists to Supabase */
  const doSave = useCallback(async (rowsToSave: PlanRow[]) => {
    setIsSaving(true);
    try {
      const planData: PlanData = {
        columns: [
          'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
          ...YEAR_COLUMNS,
          'utredningspunkter',
        ],
        rows: rowsToSave,
      };
      const saved = await savePlanVersion(planData, version, currentUser?.email);
      if (saved) {
        setVersion(saved.version);
        setIsDirty(false);
        setSnackbar({ open: true, message: 'Sparad', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Kunde inte spara', severity: 'error' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setSnackbar({ open: true, message: 'Fel vid sparning', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [version, currentUser]);

  /** Auto-save: normalise rows, save always (no validation blocking) */
  const handleAutoSave = useCallback(async () => {
    if (!isDirty || isSaving) return;
    await doSave(normalizeRows(rows));
  }, [isDirty, isSaving, rows, doSave]);

  /** Manual save: normalise + validate, block on errors */
  const handleManualSave = useCallback(async () => {
    if (!isDirty || isSaving) return;
    const normalized = normalizeRows(rows);

    const issues = validatePlanData(normalized, 'save');
    const blocking = issues.filter(i => i.severity === 'error');
    if (blocking.length > 0) {
      setSnackbar({
        open: true,
        message: `${blocking.length} rad(er) saknar byggdel/åtgärd — åtgärda innan sparning.`,
        severity: 'error',
      });
      return;
    }

    await doSave(normalized);
  }, [isDirty, isSaving, rows, doSave]);

  // ---------------------------------------------------------------------------
  // Auto-save (debounced 2s after last change)
  // ---------------------------------------------------------------------------

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty || isSaving || isLoading) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [isDirty, rows]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Restore version
  // ---------------------------------------------------------------------------

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    try {
      const plan = await getPlanVersion(versionId);
      if (plan && plan.plan_data) {
        const recalculated = recalcSummaryRows([...plan.plan_data.rows]);
        for (const r of recalculated) { if (r.status === undefined || r.status === null) r.status = ''; }
        enrichWithInfoUrls(recalculated);
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

  const handleNotify = useCallback((message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // ---------------------------------------------------------------------------
  // Import from Excel
  // ---------------------------------------------------------------------------

  const handleImportRows = useCallback((importedRows: PlanRow[]) => {
    const recalculated = recalcSummaryRows([...importedRows]);
    enrichWithInfoUrls(recalculated);
    setRows(recalculated);
    setIsDirty(true);
    setSnackbar({
      open: true,
      message: `${importedRows.filter(r => r.rowType === 'item').length} poster importerade — spara för att bekräfta`,
      severity: 'info',
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Lagkrav warnings (items without budget)
  // ---------------------------------------------------------------------------

  const lagkravWarnings = useMemo(() => {
    return getLagkravItems(rows).filter((r) => {
      const hasCost = YEAR_COLUMNS.some((yc) => {
        const val = r[yc];
        return typeof val === 'number' && val > 0;
      });
      return !hasCost;
    });
  }, [rows]);

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
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Underhållsplan 2026–2035
        </Typography>
        {isDirty && (
          <Chip label="Osparade ändringar" color="warning" size="small" />
        )}
      </Box>

      {/* Summary (collapsible) */}
      <MaintenancePlanSummary rows={rows} />

      {/* View toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, val) => { if (val) setViewMode(val); }}
          size="small"
        >
          <ToggleButton value="byggdel" sx={{ textTransform: 'none', px: 2, gap: 0.5 }}>
            <ViewListIcon fontSize="small" />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Byggdel</Box>
          </ToggleButton>
          <ToggleButton value="year" sx={{ textTransform: 'none', px: 2, gap: 0.5 }}>
            <CalendarMonthIcon fontSize="small" />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>År för år</Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Report / Year view */}
      {viewMode === 'byggdel' ? (
        <MaintenancePlanReport
          rows={rows}
          setRows={setRows}
          version={version}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
          isSaving={isSaving}
          onSave={handleManualSave}
          onRestoreVersion={handleRestoreVersion}
          onOpenImport={() => setImportDialogOpen(true)}
          onNotify={handleNotify}
        />
      ) : (
        <MaintenancePlanYearView
          rows={rows}
          setRows={setRows}
          setIsDirty={setIsDirty}
        />
      )}

      {/* Lagkrav warnings — bottom of page */}
      {lagkravWarnings.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box
            onClick={() => setLagkravExpanded((prev) => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              py: 0.5,
            }}
          >
            <IconButton size="small" sx={{ p: 0 }}>
              {lagkravExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <WarningIcon fontSize="small" color="warning" />
            <Typography variant="body2" color="text.secondary">
              {lagkravWarnings.length} lagkrav behöver åtgärd
            </Typography>
          </Box>
          <Collapse in={lagkravExpanded}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {lagkravWarnings.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'warning.50',
                    border: '1px solid',
                    borderColor: 'warning.200',
                  }}
                >
                  <WarningIcon fontSize="small" color="warning" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.atgard}
                    </Typography>
                    {item.utredningspunkter?.trim() && (
                      <Typography variant="caption" color="text.secondary">
                        {item.utredningspunkter}
                      </Typography>
                    )}
                  </Box>
                  <Chip label="Behöver åtgärd" color="warning" size="small" variant="outlined" />
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

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
