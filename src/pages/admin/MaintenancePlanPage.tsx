import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import GavelIcon from '@mui/icons-material/Gavel';

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
import MaintenancePlanSpreadsheet from '../../components/maintenance/MaintenancePlanSpreadsheet';

// ---------------------------------------------------------------------------
// TabPanel helper
// ---------------------------------------------------------------------------

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`mp-tabpanel-${index}`} aria-labelledby={`mp-tab-${index}`}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return { id: `mp-tab-${index}`, 'aria-controls': `mp-tabpanel-${index}` };
}

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

  // Tab state
  const [activeTab, setActiveTab] = useState(1); // Default to "Detaljerad plan"

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

    async function loadData() {
      setIsLoading(true);
      try {
        const plan = await getLatestPlan();
        if (cancelled) return;

        if (plan && plan.plan_data && plan.plan_data.rows.length > 0) {
          const recalculated = recalcSummaryRows([...plan.plan_data.rows]);
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
        setRows(recalcSummaryRows([...seed.rows]));
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
  // Tab change
  // ---------------------------------------------------------------------------

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<DashboardIcon />} iconPosition="start" label="Översikt" {...a11yProps(0)} />
        <Tab icon={<TableChartIcon />} iconPosition="start" label="Detaljerad plan" {...a11yProps(1)} />
        <Tab icon={<GavelIcon />} iconPosition="start" label="Lagkrav" {...a11yProps(2)} />
      </Tabs>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <Typography>Kommer snart</Typography>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
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

      <TabPanel value={activeTab} index={2}>
        <Typography>Kommer snart</Typography>
      </TabPanel>

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
