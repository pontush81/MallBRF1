import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
  PlanVersion,
  getAllVersions,
} from '../../services/maintenancePlanService';
import {
  COLUMN_HEADERS,
  COLUMN_WIDTHS,
  FIELD_KEYS,
  YEAR_COL_START,
  YEAR_COL_END,
  TOTAL_COL,
  A_PRIS_COL,
  ANTAL_COL,
  SPREADSHEET_STYLES,
  computeRowTotal,
  recalcSummaryRows,
  rowsToData,
  cssClassForRowType,
} from './maintenancePlanHelpers';

// Register all Handsontable modules
registerAllModules();

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SpreadsheetProps {
  rows: PlanRow[];
  setRows: React.Dispatch<React.SetStateAction<PlanRow[]>>;
  version: number;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  onRestoreVersion: (versionId: string) => void;
  highlightRowId?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanSpreadsheet: React.FC<SpreadsheetProps> = ({
  rows,
  setRows,
  version,
  isDirty,
  setIsDirty,
  isSaving,
  onSave,
  onRestoreVersion,
  highlightRowId,
}) => {
  const hotRef = useRef<HotTableClass>(null);

  // Local state
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<{ sum: number; count: number; avg: number } | null>(null);

  // Scroll to and highlight a row when highlightRowId changes
  useEffect(() => {
    if (!highlightRowId) return;
    const rowIdx = rows.findIndex(r => r.id === highlightRowId);
    if (rowIdx < 0) return;
    // Small delay to let HotTable render after tab switch
    const timer = setTimeout(() => {
      const hot = hotRef.current?.hotInstance;
      if (!hot) return;
      hot.selectRows(rowIdx);
      hot.scrollViewportTo(rowIdx, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [highlightRowId, rows]);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [versions, setVersions] = useState<Pick<PlanVersion, 'id' | 'version' | 'created_at' | 'created_by' | 'metadata'>[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

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
  // Section index per row (for alternating section backgrounds)
  // ---------------------------------------------------------------------------

  const sectionIndexMap = useMemo(() => {
    const map: number[] = [];
    let sectionIdx = -1;
    for (const r of rows) {
      if (r.rowType === 'section') sectionIdx++;
      map.push(sectionIdx);
    }
    return map;
  }, [rows]);

  // ---------------------------------------------------------------------------
  // Cell-level styling
  // ---------------------------------------------------------------------------

  const cellCallback = useCallback(
    (row: number, col: number): Handsontable.CellProperties => {
      const props: Handsontable.CellProperties = {} as Handsontable.CellProperties;
      const planRow = rows[row];
      if (!planRow) return props;

      // Apply CSS class for entire row
      const cls = cssClassForRowType(planRow.rowType);
      const sectionCls = (planRow.rowType === 'item' || planRow.rowType === 'subsection') && sectionIndexMap[row] % 2 === 1 ? 'mp-section-odd' : '';
      if (cls || sectionCls) {
        props.className = [cls, sectionCls].filter(Boolean).join(' ');
      }

      // No rows are readOnly — the entire sheet is editable like Excel

      // Total column is always readOnly
      if (col === TOTAL_COL) {
        props.readOnly = true;
      }

      return props;
    },
    [rows, sectionIndexMap],
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
          if (isNaN(numCol) || numCol === TOTAL_COL) continue;

          const fieldKey = FIELD_KEYS[numCol];
          if (!fieldKey || fieldKey === 'total') continue;

          const planRow = newRows[rowIdx];
          if (!planRow) continue;

          const isNumericField =
            numCol >= YEAR_COL_START && numCol <= YEAR_COL_END ||
            numCol === A_PRIS_COL ||
            numCol === ANTAL_COL;

          if (isNumericField) {
            let parsed: number | null = null;
            if (newVal === null || newVal === '' || newVal === undefined) {
              parsed = null;
            } else if (typeof newVal === 'number') {
              parsed = newVal;
            } else {
              const num = parseFloat(String(newVal));
              parsed = isNaN(num) ? null : num;
            }
            (planRow as unknown as Record<string, unknown>)[fieldKey] = parsed;
          } else {
            (planRow as unknown as Record<string, unknown>)[fieldKey] = newVal ?? '';
          }
          changed = true;
        }

        if (changed) {
          setIsDirty(true);
          const editedSummaryOnly = changes.every(([rowIdx]) => newRows[rowIdx]?.rowType === 'summary');
          return editedSummaryOnly ? newRows : recalcSummaryRows(newRows);
        }
        return prevRows;
      });
    },
    [setRows, setIsDirty],
  );

  // ---------------------------------------------------------------------------
  // Selection tracking
  // ---------------------------------------------------------------------------

  const handleAfterSelectionEnd = useCallback(
    (row: number, col: number, row2: number, col2: number) => {
      setSelectedRow(row);

      // Compute sum/count/avg of selected numeric cells for status bar
      const hot = hotRef.current?.hotInstance;
      if (!hot) return;
      const minRow = Math.min(row, row2);
      const maxRow = Math.max(row, row2);
      const minCol = Math.min(col, col2);
      const maxCol = Math.max(col, col2);
      const isSingleCell = minRow === maxRow && minCol === maxCol;
      if (isSingleCell) { setSelectionInfo(null); return; }

      let sum = 0;
      let count = 0;
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const val = hot.getDataAtCell(r, c);
          if (typeof val === 'number' && !isNaN(val)) {
            sum += val;
            count++;
          }
        }
      }
      setSelectionInfo(count > 0 ? { sum, count, avg: sum / count } : null);
    },
    [],
  );

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
  }, [setRows, setIsDirty]);

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
  }, [setRows, setIsDirty]);

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
    } finally {
      setLoadingVersions(false);
    }
  }, []);

  const handleRestoreVersion = useCallback((versionId: string) => {
    onRestoreVersion(versionId);
    setHistoryDialogOpen(false);
  }, [onRestoreVersion]);

  // ---------------------------------------------------------------------------
  // Context menu (memoized to prevent infinite re-render loop)
  // ---------------------------------------------------------------------------

  const contextMenu = useMemo<Handsontable.GridSettings['contextMenu']>(() => ({
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
  }), [insertRowAt, deleteRowAt, rows]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {/* Inject custom CSS for row types */}
      <style>{SPREADSHEET_STYLES}</style>

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
            variant="outlined"
            color={isDirty ? 'primary' : 'success'}
            startIcon={
              isSaving
                ? <CircularProgress size={16} color="inherit" />
                : isDirty
                  ? <SaveIcon />
                  : <CheckIcon />
            }
            onClick={isDirty && !isSaving ? onSave : undefined}
            sx={{ minWidth: 110, ...(!isDirty || isSaving ? { cursor: 'default', pointerEvents: 'none' } : {}) }}
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
          contextMenu={contextMenu}
          afterChange={handleAfterChange}
          afterSelectionEnd={handleAfterSelectionEnd}
          fillHandle={true}
          licenseKey="non-commercial-and-evaluation"
          rowHeights={28}
        />
      </Box>

      {/* Status bar — sum/count/avg of selected cells */}
      {selectionInfo && (
        <Paper variant="outlined" sx={{ mt: 1, px: 2, py: 0.5, display: 'flex', gap: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Summa: <strong>{selectionInfo.sum.toLocaleString('sv-SE')}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Antal: <strong>{selectionInfo.count}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Medel: <strong>{Math.round(selectionInfo.avg).toLocaleString('sv-SE')}</strong>
          </Typography>
        </Paper>
      )}

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
    </Box>
  );
};

export default MaintenancePlanSpreadsheet;
