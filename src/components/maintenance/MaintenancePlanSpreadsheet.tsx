import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Toolbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import { HotTable, HotTableClass } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import type Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

import {
  PlanRow,
  PlanData,
  PlanVersion,
  YEAR_COLUMNS,
  getLatestPlan,
  getAllVersions,
  getPlanVersion,
  savePlanVersion,
} from '../../services/maintenancePlanService';
import { createDefaultPlanData } from '../../data/maintenancePlanSeedData';
import { useAuth } from '../../context/AuthContextNew';

// Register all Handsontable modules
registerAllModules();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLUMN_HEADERS = [
  'Nr', 'Byggdel', 'Åtgärd', 'Tek livslängd', 'a-pris', 'Antal',
  '2026', '2027', '2028', '2029', '2030',
  '2031', '2032', '2033', '2034', '2035',
  'Utredningspunkter', 'Totalt kr inkl moms',
];

const COLUMN_WIDTHS = [
  50, 130, 200, 90, 80, 50,
  90, 90, 90, 90, 90,
  90, 90, 90, 90, 90,
  120, 120,
];

/** Field keys that map each Handsontable column index to a PlanRow property (or 'total'). */
const FIELD_KEYS: (keyof PlanRow | 'total')[] = [
  'nr', 'byggdel', 'atgard', 'tek_livslangd', 'a_pris', 'antal',
  'year_2026', 'year_2027', 'year_2028', 'year_2029', 'year_2030',
  'year_2031', 'year_2032', 'year_2033', 'year_2034', 'year_2035',
  'utredningspunkter', 'total',
];

/** Column indices for year columns (6..15) */
const YEAR_COL_START = 6;
const YEAR_COL_END = 15; // inclusive
const TOTAL_COL = 17; // index of "Totalt kr inkl moms" (0-based = 17)
const A_PRIS_COL = 4;
const ANTAL_COL = 5;

// ---------------------------------------------------------------------------
// Helper: compute row total (sum of year columns)
// ---------------------------------------------------------------------------

function computeRowTotal(row: PlanRow): number {
  let sum = 0;
  for (const yc of YEAR_COLUMNS) {
    const val = row[yc];
    if (typeof val === 'number') {
      sum += val;
    }
  }
  return sum;
}

// ---------------------------------------------------------------------------
// Helper: safely set a year column value on a PlanRow
// ---------------------------------------------------------------------------

function setYearValue(row: PlanRow, yearCol: typeof YEAR_COLUMNS[number], value: number): void {
  // Use an indexer approach that TypeScript accepts
  const rec = row as unknown as Record<string, number | null>;
  rec[yearCol] = value;
}

// ---------------------------------------------------------------------------
// Helper: recalculate summary rows in-place
// ---------------------------------------------------------------------------

function recalcSummaryRows(rows: PlanRow[]): PlanRow[] {
  const summaRow = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Summa beräknad kostnad');
  const osakerhetRow = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Osäkerhet');
  const totaltRow = rows.find(r => r.rowType === 'summary' && r.byggdel === 'Totalt inkl moms');

  if (!summaRow || !osakerhetRow || !totaltRow) return rows;

  // Zero out year values on summary rows
  for (const yc of YEAR_COLUMNS) {
    setYearValue(summaRow, yc, 0);
    setYearValue(osakerhetRow, yc, 0);
    setYearValue(totaltRow, yc, 0);
  }

  // Sum all item rows per year
  for (const r of rows) {
    if (r.rowType !== 'item') continue;
    for (const yc of YEAR_COLUMNS) {
      const val = r[yc];
      if (typeof val === 'number') {
        setYearValue(summaRow, yc, ((summaRow[yc] as number) || 0) + val);
      }
    }
  }

  // Osäkerhet = 10% of Summa, rounded
  for (const yc of YEAR_COLUMNS) {
    const sumVal = (summaRow[yc] as number) || 0;
    setYearValue(osakerhetRow, yc, Math.round(sumVal * 0.10));
  }

  // Totalt = Summa + Osäkerhet
  for (const yc of YEAR_COLUMNS) {
    const sumVal = (summaRow[yc] as number) || 0;
    const osakVal = (osakerhetRow[yc] as number) || 0;
    setYearValue(totaltRow, yc, sumVal + osakVal);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Helper: convert rows <-> 2D data array for Handsontable
// ---------------------------------------------------------------------------

function rowsToData(rows: PlanRow[]): (string | number | null)[][] {
  return rows.map(row => {
    const cells: (string | number | null)[] = [];
    for (const key of FIELD_KEYS) {
      if (key === 'total') {
        cells.push(computeRowTotal(row));
      } else {
        const val = row[key];
        if (val === null || val === undefined) {
          cells.push(null);
        } else if (typeof val === 'boolean') {
          cells.push(val ? 1 : 0);
        } else {
          cells.push(val as string | number);
        }
      }
    }
    return cells;
  });
}

// ---------------------------------------------------------------------------
// CSS class name per row type
// ---------------------------------------------------------------------------

function cssClassForRowType(rowType: string): string {
  switch (rowType) {
    case 'section': return 'mp-row-section';
    case 'subsection': return 'mp-row-subsection';
    case 'summary': return 'mp-row-summary';
    case 'blank': return 'mp-row-blank';
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// Inline style tag (injected once)
// ---------------------------------------------------------------------------

const SPREADSHEET_STYLES = `
  .mp-row-section td { background-color: #e3f2fd !important; font-weight: 700 !important; }
  .mp-row-subsection td { background-color: #f5f5f5 !important; font-weight: 600 !important; }
  .mp-row-summary td { background-color: #fff3e0 !important; font-weight: 700 !important; border-top: 2px solid #e65100 !important; }
  .mp-row-blank td { background-color: #fafafa !important; }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanSpreadsheet: React.FC = () => {
  const { currentUser } = useAuth();
  const hotRef = useRef<HotTableClass>(null);

  // State
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [version, setVersion] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [versions, setVersions] = useState<Pick<PlanVersion, 'id' | 'version' | 'created_at' | 'created_by' | 'metadata'>[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

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
  // Convert rows -> 2D array for HotTable
  // ---------------------------------------------------------------------------

  const data = useMemo(() => rowsToData(rows), [rows]);

  // ---------------------------------------------------------------------------
  // Column settings
  // ---------------------------------------------------------------------------

  const columns: Handsontable.ColumnSettings[] = useMemo(() => {
    return FIELD_KEYS.map((key, colIdx) => {
      const isYearCol = colIdx >= YEAR_COL_START && colIdx <= YEAR_COL_END;
      const isNumeric = isYearCol || colIdx === A_PRIS_COL || colIdx === ANTAL_COL;
      const isTotalCol = colIdx === TOTAL_COL;

      const col: Handsontable.ColumnSettings = {};

      if (isNumeric || isTotalCol) {
        col.type = 'numeric';
        col.numericFormat = { pattern: '0,0', culture: 'sv-SE' };
      }

      if (isTotalCol) {
        col.readOnly = true;
      }

      return col;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Cell-level readOnly for locked rows
  // ---------------------------------------------------------------------------

  const cellCallback = useCallback(
    (row: number, col: number): Handsontable.CellProperties => {
      const props: Handsontable.CellProperties = {} as Handsontable.CellProperties;
      const planRow = rows[row];
      if (!planRow) return props;

      // Apply CSS class for entire row
      const cls = cssClassForRowType(planRow.rowType);
      if (cls) {
        props.className = cls;
      }

      // Locked rows (section, subsection, summary, blank) are readOnly
      if (planRow.isLocked || planRow.rowType === 'summary' || planRow.rowType === 'section' || planRow.rowType === 'subsection') {
        props.readOnly = true;
      }

      // Total column is always readOnly
      if (col === TOTAL_COL) {
        props.readOnly = true;
      }

      return props;
    },
    [rows],
  );

  // ---------------------------------------------------------------------------
  // afterChange: sync edits back into rows state + recalc summaries
  // ---------------------------------------------------------------------------

  const handleAfterChange = useCallback(
    (changes: Handsontable.CellChange[] | null, source: string) => {
      if (!changes || source === 'loadData') return;

      setRows(prevRows => {
        const newRows = prevRows.map(r => ({ ...r }));
        let changed = false;

        for (const [rowIdx, colIdx, , newVal] of changes) {
          const numCol = typeof colIdx === 'number' ? colIdx : parseInt(colIdx as string, 10);
          if (isNaN(numCol) || numCol === TOTAL_COL) continue; // skip total col

          const fieldKey = FIELD_KEYS[numCol];
          if (!fieldKey || fieldKey === 'total') continue;

          const planRow = newRows[rowIdx];
          if (!planRow) continue;
          if (planRow.isLocked || planRow.rowType === 'summary') continue;

          const isNumericField =
            numCol >= YEAR_COL_START && numCol <= YEAR_COL_END ||
            numCol === A_PRIS_COL ||
            numCol === ANTAL_COL;

          if (isNumericField) {
            const parsed = newVal === null || newVal === '' || newVal === undefined
              ? null
              : typeof newVal === 'number' ? newVal : parseFloat(String(newVal));
            const rec = planRow as unknown as Record<string, unknown>;
            rec[fieldKey] = parsed !== null && isNaN(parsed) ? null : parsed;
          } else {
            const rec = planRow as unknown as Record<string, unknown>;
            rec[fieldKey] = newVal ?? '';
          }
          changed = true;
        }

        if (changed) {
          setIsDirty(true);
          return recalcSummaryRows(newRows);
        }
        return prevRows;
      });
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Selection tracking
  // ---------------------------------------------------------------------------

  const handleAfterSelectionEnd = useCallback(
    (row: number, _col: number, _row2: number, _col2: number) => {
      setSelectedRow(row);
    },
    [],
  );

  const handleAfterDeselect = useCallback(() => {
    setSelectedRow(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Add row
  // ---------------------------------------------------------------------------

  const insertRowAt = useCallback((atIndex: number) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      const firstSummaryIdx = newRows.findIndex(r => r.rowType === 'summary');
      const insertIdx = firstSummaryIdx >= 0 ? Math.min(atIndex, firstSummaryIdx) : Math.min(atIndex, newRows.length);

      const newRow: PlanRow = {
        id: uuidv4(),
        rowType: 'item',
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
        indentLevel: 2,
        isLocked: false,
      };

      newRows.splice(insertIdx, 0, newRow);
      newRows.forEach((r, i) => { r.sortIndex = i; });
      setIsDirty(true);
      return newRows;
    });
  }, []);

  const handleAddRow = useCallback(() => {
    if (selectedRow !== null && selectedRow >= 0) {
      insertRowAt(selectedRow + 1);
    } else {
      insertRowAt(9999); // Will be clamped to before summary rows
    }
  }, [selectedRow, insertRowAt]);

  // ---------------------------------------------------------------------------
  // Delete row
  // ---------------------------------------------------------------------------

  const deleteRowAt = useCallback((rowIdx: number) => {
    setRows(prevRows => {
      const target = prevRows[rowIdx];
      if (!target || target.isLocked || target.rowType === 'summary' || target.rowType === 'section' || target.rowType === 'subsection') return prevRows;

      const newRows = prevRows.filter((_, i) => i !== rowIdx);
      newRows.forEach((r, i) => { r.sortIndex = i; });
      setIsDirty(true);
      return recalcSummaryRows(newRows);
    });
  }, []);

  const handleDeleteRowConfirm = useCallback(() => {
    if (selectedRow === null) return;
    deleteRowAt(selectedRow);
    setDeleteDialogOpen(false);
    setSelectedRow(null);
  }, [selectedRow, deleteRowAt]);

  const canDeleteSelectedRow = useMemo(() => {
    if (selectedRow === null || selectedRow < 0 || selectedRow >= rows.length) return false;
    const row = rows[selectedRow];
    return row && !row.isLocked && row.rowType !== 'summary' && row.rowType !== 'section' && row.rowType !== 'subsection';
  }, [selectedRow, rows]);

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
  // Excel export
  // ---------------------------------------------------------------------------

  const handleExportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Build worksheet data
    const wsData: (string | number | null)[][] = [];

    // Header rows
    wsData.push(['Underhållsplan 2026\u20132035']);
    wsData.push(['Brf Gulmåran']);
    wsData.push([`Exporterad: ${new Date().toISOString().slice(0, 10)}`]);
    wsData.push([]); // blank line

    // Column headers
    wsData.push(COLUMN_HEADERS);

    // Data rows
    for (const row of rows) {
      const cells: (string | number | null)[] = [];
      for (const key of FIELD_KEYS) {
        if (key === 'total') {
          cells.push(computeRowTotal(row));
        } else {
          const val = row[key];
          if (val === null || val === undefined) {
            cells.push(null);
          } else if (typeof val === 'boolean') {
            cells.push(null);
          } else {
            cells.push(val as string | number);
          }
        }
      }
      wsData.push(cells);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = COLUMN_WIDTHS.map(w => ({ wch: Math.round(w / 7) }));

    XLSX.utils.book_append_sheet(wb, ws, 'Underhållsplan');

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `underhallsplan-gulmaran-${today}.xlsx`);
  }, [rows]);

  // ---------------------------------------------------------------------------
  // Version history
  // ---------------------------------------------------------------------------

  const handleOpenHistory = useCallback(async () => {
    setHistoryDialogOpen(true);
    setLoadingVersions(true);
    try {
      const v = await getAllVersions();
      setVersions(v);
    } catch (err) {
      console.error('Error loading versions:', err);
      setSnackbar({ open: true, message: 'Kunde inte ladda versionshistorik', severity: 'error' });
    } finally {
      setLoadingVersions(false);
    }
  }, []);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    try {
      const plan = await getPlanVersion(versionId);
      if (plan && plan.plan_data) {
        const recalculated = recalcSummaryRows([...plan.plan_data.rows]);
        setRows(recalculated);
        setVersion(plan.version);
        setIsDirty(true); // Needs re-save after restore
        setHistoryDialogOpen(false);
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
      {/* Inject custom CSS for row types */}
      <style>{SPREADSHEET_STYLES}</style>

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

      {/* Toolbar */}
      <Paper sx={{ mb: 2 }} elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
          >
            Lägg till rad
          </Button>

          <Button
            size="small"
            startIcon={<DeleteIcon />}
            color="error"
            disabled={!canDeleteSelectedRow}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Ta bort rad
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            size="small"
            startIcon={<HistoryIcon />}
            onClick={handleOpenHistory}
          >
            Historik
          </Button>

          <Button
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
          >
            Exportera Excel
          </Button>

          <Button
            size="small"
            variant={isDirty ? 'contained' : 'outlined'}
            color={isDirty ? 'primary' : 'success'}
            startIcon={
              isSaving
                ? <CircularProgress size={16} color="inherit" />
                : isDirty
                  ? <SaveIcon />
                  : <CheckIcon />
            }
            disabled={isSaving}
            onClick={isDirty ? handleSave : undefined}
            sx={!isDirty ? { cursor: 'default', pointerEvents: 'none' } : {}}
          >
            {isSaving ? 'Sparar...' : isDirty ? 'Spara' : 'Sparad'}
          </Button>
        </Toolbar>
      </Paper>

      {/* Handsontable Grid */}
      <Box sx={{ overflowX: 'auto' }}>
        <HotTable
          ref={hotRef}
          data={data}
          colHeaders={COLUMN_HEADERS}
          colWidths={COLUMN_WIDTHS}
          columns={columns}
          cells={cellCallback}
          fixedColumnsStart={3}
          stretchH="all"
          height="auto"
          undo={true}
          manualColumnResize={true}
          contextMenu={{
            items: {
              'row_above': {
                name: 'Lägg till rad ovanför',
                callback: (_key: string, selection: Array<{start: {row: number}}>) => {
                  const row = selection[0]?.start?.row;
                  if (row !== undefined) insertRowAt(row);
                },
              },
              'row_below': {
                name: 'Lägg till rad nedanför',
                callback: (_key: string, selection: Array<{start: {row: number}}>) => {
                  const row = selection[0]?.start?.row;
                  if (row !== undefined) insertRowAt(row + 1);
                },
              },
              'separator1': '---------' as any,
              'remove_row': {
                name: 'Ta bort rad',
                callback: (_key: string, selection: Array<{start: {row: number}}>) => {
                  const row = selection[0]?.start?.row;
                  if (row !== undefined) deleteRowAt(row);
                },
                disabled: () => {
                  const sel = hotRef.current?.hotInstance?.getSelected();
                  if (!sel || !sel[0]) return true;
                  const rowIdx = sel[0][0];
                  const planRow = rows[rowIdx];
                  return !planRow || planRow.isLocked || planRow.rowType === 'summary' || planRow.rowType === 'section' || planRow.rowType === 'subsection';
                },
              },
              'separator2': '---------' as any,
              'undo': { name: 'Ångra' },
              'redo': { name: 'Gör om' },
            },
          }}
          afterChange={handleAfterChange}
          afterSelectionEnd={handleAfterSelectionEnd}
          afterDeselect={handleAfterDeselect}
          licenseKey="non-commercial-and-evaluation"
          rowHeights={28}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Ta bort rad?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Är du säker på att du vill ta bort den markerade raden? Denna åtgärd kan inte ångras.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={handleDeleteRowConfirm} color="error">
            Ta bort
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Versionshistorik</DialogTitle>
        <DialogContent>
          {loadingVersions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : versions.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              Inga sparade versioner ännu.
            </Typography>
          ) : (
            <List>
              {versions.map(v => (
                <ListItem key={v.id} divider>
                  <ListItemText
                    primary={`Version ${v.version}`}
                    secondary={`${new Date(v.created_at).toLocaleString('sv-SE')} — ${v.metadata?.saved_by || v.created_by || 'okänd'}`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => handleRestoreVersion(v.id)}
                    >
                      Återställ
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Stäng
          </Button>
        </DialogActions>
      </Dialog>

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

export default MaintenancePlanSpreadsheet;
