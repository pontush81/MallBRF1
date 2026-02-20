import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Select,
  MenuItem,
  Chip,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

import {
  PlanRow,
  PlanRowStatus,
  PlanVersion,
  YEAR_COLUMNS,
  getAllVersions,
} from '../../services/maintenancePlanService';
import {
  COLUMN_HEADERS,
  COLUMN_WIDTHS,
  FIELD_KEYS,
  computeRowTotal,
  recalcSummaryRows,
  buildByggdelMap,
} from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReportProps {
  rows: PlanRow[];
  setRows: React.Dispatch<React.SetStateAction<PlanRow[]>>;
  version: number;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  onRestoreVersion: (versionId: string) => void;
  onOpenImport: () => void;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: PlanRowStatus; label: string; color: 'default' | 'primary' | 'success' | 'warning' }[] = [
  { value: 'planned', label: '\u2013', color: 'default' },
  { value: 'in_progress', label: 'P\u00e5g\u00e5r', color: 'primary' },
  { value: 'completed', label: 'Utf\u00f6rd', color: 'success' },
  { value: 'postponed', label: 'Uppskjuten', color: 'warning' },
];

function statusLabel(status: PlanRowStatus): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.label ?? '\u2013';
}

function statusColor(status: PlanRowStatus): 'default' | 'primary' | 'success' | 'warning' {
  return STATUS_OPTIONS.find(s => s.value === status)?.color ?? 'default';
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtTkr(amount: number): string {
  if (!amount) return '\u2013';
  return Math.round(amount / 1000).toLocaleString('sv-SE') + ' tkr';
}

function fmtKr(amount: number | null): string {
  if (amount === null || amount === undefined || amount === 0) return '\u2013';
  return amount.toLocaleString('sv-SE');
}

// ---------------------------------------------------------------------------
// Structures used to group rows into sections
// ---------------------------------------------------------------------------

interface SectionGroup {
  sectionRow: PlanRow;
  subsections: SubsectionGroup[];
  /** Items that belong directly to the section (no subsection parent) */
  directItems: PlanRow[];
}

interface SubsectionGroup {
  subsectionRow: PlanRow;
  items: PlanRow[];
}

function groupRows(rows: PlanRow[]): { sections: SectionGroup[]; summaryRows: PlanRow[] } {
  const sections: SectionGroup[] = [];
  const summaryRows: PlanRow[] = [];
  let currentSection: SectionGroup | null = null;
  let currentSubsection: SubsectionGroup | null = null;

  for (const row of rows) {
    if (row.rowType === 'section') {
      // Finish previous subsection
      if (currentSubsection && currentSection) {
        currentSection.subsections.push(currentSubsection);
        currentSubsection = null;
      }
      // Finish previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { sectionRow: row, subsections: [], directItems: [] };
    } else if (row.rowType === 'subsection') {
      // Finish previous subsection
      if (currentSubsection && currentSection) {
        currentSection.subsections.push(currentSubsection);
      }
      currentSubsection = { subsectionRow: row, items: [] };
    } else if (row.rowType === 'item') {
      if (currentSubsection) {
        currentSubsection.items.push(row);
      } else if (currentSection) {
        currentSection.directItems.push(row);
      }
    } else if (row.rowType === 'summary') {
      summaryRows.push(row);
    }
    // Skip blank rows
  }

  // Push last groups
  if (currentSubsection && currentSection) {
    currentSection.subsections.push(currentSubsection);
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  return { sections, summaryRows };
}

// ---------------------------------------------------------------------------
// Compute section total across all year columns
// ---------------------------------------------------------------------------

function computeSectionTotal(section: SectionGroup): number {
  let sum = 0;
  for (const item of section.directItems) {
    sum += computeRowTotal(item);
  }
  for (const sub of section.subsections) {
    for (const item of sub.items) {
      sum += computeRowTotal(item);
    }
  }
  return sum;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanReport: React.FC<ReportProps> = ({
  rows,
  setRows,
  version,
  isDirty,
  setIsDirty,
  isSaving,
  onSave,
  onRestoreVersion,
  onOpenImport,
}) => {
  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ rowId: string; yearCol: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [versions, setVersions] = useState<Pick<PlanVersion, 'id' | 'version' | 'created_at' | 'created_by' | 'metadata'>[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [editingText, setEditingText] = useState<{ rowId: string; field: string } | null>(null);
  const [editTextValue, setEditTextValue] = useState('');

  // ---------------------------------------------------------------------------
  // Grouped data
  // ---------------------------------------------------------------------------

  const { sections, summaryRows } = useMemo(() => groupRows(rows), [rows]);
  const byggdelMap = useMemo(() => buildByggdelMap(rows), [rows]);

  // ---------------------------------------------------------------------------
  // Section collapse toggle
  // ---------------------------------------------------------------------------

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Item expand toggle
  // ---------------------------------------------------------------------------

  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Inline edit: start
  // ---------------------------------------------------------------------------

  const startEdit = useCallback((rowId: string, yearCol: string, currentValue: number | null) => {
    setEditingCell({ rowId, yearCol });
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  }, []);

  // ---------------------------------------------------------------------------
  // Inline edit: commit
  // ---------------------------------------------------------------------------

  const commitEdit = useCallback(() => {
    if (!editingCell) return;

    const { rowId, yearCol } = editingCell;
    const parsed = editValue.trim() === '' ? null : parseFloat(editValue.replace(/\s/g, '').replace(',', '.'));
    const numVal = parsed !== null && !isNaN(parsed) ? Math.round(parsed) : null;

    setRows(prevRows => {
      const newRows = prevRows.map(r => {
        if (r.id !== rowId) return r;
        const updated = { ...r };
        (updated as unknown as Record<string, number | null>)[yearCol] = numVal;
        return updated;
      });
      setIsDirty(true);
      return recalcSummaryRows(newRows);
    });

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, setRows, setIsDirty]);

  // ---------------------------------------------------------------------------
  // Inline edit: cancel
  // ---------------------------------------------------------------------------

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // ---------------------------------------------------------------------------
  // Inline edit: key handler
  // ---------------------------------------------------------------------------

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [commitEdit, cancelEdit],
  );

  // ---------------------------------------------------------------------------
  // Status change
  // ---------------------------------------------------------------------------

  const handleStatusChange = useCallback(
    (rowId: string, newStatus: PlanRowStatus) => {
      setRows(prevRows =>
        prevRows.map(r =>
          r.id === rowId ? { ...r, status: newStatus } : r,
        ),
      );
      setIsDirty(true);
    },
    [setRows, setIsDirty],
  );

  // ---------------------------------------------------------------------------
  // Text field editing (atgard, byggdel)
  // ---------------------------------------------------------------------------

  const startEditText = useCallback((rowId: string, field: string, currentValue: string) => {
    setEditingText({ rowId, field });
    setEditTextValue(currentValue);
  }, []);

  const commitEditText = useCallback(() => {
    if (!editingText) return;
    const { rowId, field } = editingText;
    setRows(prevRows =>
      prevRows.map(r =>
        r.id === rowId ? { ...r, [field]: editTextValue.trim() } : r,
      ),
    );
    setIsDirty(true);
    setEditingText(null);
    setEditTextValue('');
  }, [editingText, editTextValue, setRows, setIsDirty]);

  const cancelEditText = useCallback(() => {
    setEditingText(null);
    setEditTextValue('');
  }, []);

  const handleEditTextKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); commitEditText(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancelEditText(); }
    },
    [commitEditText, cancelEditText],
  );

  // ---------------------------------------------------------------------------
  // Row CRUD
  // ---------------------------------------------------------------------------

  const handleDeleteRow = useCallback((rowId: string) => {
    setRows(prevRows => {
      const newRows = prevRows.filter(r => r.id !== rowId);
      setIsDirty(true);
      return recalcSummaryRows(newRows);
    });
  }, [setRows, setIsDirty]);

  const handleAddItem = useCallback((parentRowId: string) => {
    const newId = uuidv4();
    setRows(prevRows => {
      const parentIndex = prevRows.findIndex(r => r.id === parentRowId);
      if (parentIndex === -1) return prevRows;

      const parentRow = prevRows[parentIndex];

      // Insert after last child of this parent
      let insertIndex = parentIndex + 1;
      if (parentRow.rowType === 'subsection') {
        // For subsections: stop at next subsection, section, or summary
        while (
          insertIndex < prevRows.length &&
          prevRows[insertIndex].rowType !== 'subsection' &&
          prevRows[insertIndex].rowType !== 'section' &&
          prevRows[insertIndex].rowType !== 'summary'
        ) {
          insertIndex++;
        }
      } else {
        // For sections: stop at next section or summary
        while (
          insertIndex < prevRows.length &&
          prevRows[insertIndex].rowType !== 'section' &&
          prevRows[insertIndex].rowType !== 'summary'
        ) {
          insertIndex++;
        }
      }

      const newRow: PlanRow = {
        id: newId,
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
        sortIndex: 0,
        indentLevel: 2,
        isLocked: false,
        status: 'planned',
      };

      const newRows = [...prevRows];
      newRows.splice(insertIndex, 0, newRow);
      setIsDirty(true);
      return recalcSummaryRows(newRows);
    });
    // Auto-expand, scroll into view, and start editing name
    setExpandedItems(prev => new Set(prev).add(newId));
    setTimeout(() => {
      const el = document.querySelector(`[data-row-id="${newId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      startEditText(newId, 'atgard', '');
    }, 150);
  }, [setRows, setIsDirty, startEditText]);

  const handleDeleteSection = useCallback((sectionRowId: string) => {
    setRows(prevRows => {
      const sectionIndex = prevRows.findIndex(r => r.id === sectionRowId);
      if (sectionIndex === -1) return prevRows;

      let endIndex = sectionIndex + 1;
      while (
        endIndex < prevRows.length &&
        prevRows[endIndex].rowType !== 'section' &&
        prevRows[endIndex].rowType !== 'summary'
      ) {
        endIndex++;
      }

      const newRows = [...prevRows];
      newRows.splice(sectionIndex, endIndex - sectionIndex);
      setIsDirty(true);
      return recalcSummaryRows(newRows);
    });
  }, [setRows, setIsDirty]);

  const handleAddSection = useCallback(() => {
    const newId = uuidv4();
    setRows(prevRows => {
      const summaryIndex = prevRows.findIndex(r => r.rowType === 'summary');
      const insertIndex = summaryIndex !== -1 ? summaryIndex : prevRows.length;

      const sectionNumbers = prevRows
        .filter(r => r.rowType === 'section')
        .map(r => parseInt(r.nr, 10))
        .filter(n => !isNaN(n));
      const nextNr = sectionNumbers.length > 0 ? Math.max(...sectionNumbers) + 1 : 1;

      const newSection: PlanRow = {
        id: newId,
        rowType: 'section',
        nr: String(nextNr),
        byggdel: '',
        atgard: '',
        tek_livslangd: '',
        a_pris: null,
        antal: null,
        year_2026: null, year_2027: null, year_2028: null, year_2029: null, year_2030: null,
        year_2031: null, year_2032: null, year_2033: null, year_2034: null, year_2035: null,
        utredningspunkter: '',
        sortIndex: 0,
        indentLevel: 0,
        isLocked: true,
        status: 'planned',
      };

      const newRows = [...prevRows];
      newRows.splice(insertIndex, 0, newSection);
      setIsDirty(true);
      return recalcSummaryRows(newRows);
    });
    setTimeout(() => startEditText(newId, 'byggdel', ''), 100);
  }, [setRows, setIsDirty, startEditText]);

  // ---------------------------------------------------------------------------
  // Excel export (same logic as existing spreadsheet)
  // ---------------------------------------------------------------------------

  const handleExportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const wsData: (string | number | null)[][] = [];

    wsData.push(['Underh\u00e5llsplan 2026\u20132035']);
    wsData.push(['Brf Gulm\u00e5ran']);
    wsData.push([`Exporterad: ${new Date().toISOString().slice(0, 10)}`]);
    wsData.push([]);
    wsData.push(COLUMN_HEADERS);

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
    ws['!cols'] = COLUMN_WIDTHS.map(w => ({ wch: Math.round(w / 7) }));
    XLSX.utils.book_append_sheet(wb, ws, 'Underh\u00e5llsplan');

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

  const handleRestoreVersion = useCallback(
    (versionId: string) => {
      onRestoreVersion(versionId);
      setHistoryDialogOpen(false);
    },
    [onRestoreVersion],
  );

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  /** Render a year cell as a clickable box in the expanded detail view */
  const renderYearBox = (row: PlanRow, yearCol: typeof YEAR_COLUMNS[number]) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.yearCol === yearCol;
    const val = row[yearCol] as number | null;
    const yearLabel = yearCol.replace('year_', '');
    const hasValue = val !== null && val !== undefined && val !== 0;

    if (isEditing) {
      return (
        <Box
          key={yearCol}
          sx={{
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 1,
            p: 1,
            minWidth: 80,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            {yearLabel}
          </Typography>
          <TextField
            size="small"
            variant="standard"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            autoFocus
            inputProps={{
              style: { textAlign: 'center', fontSize: '0.875rem' },
            }}
            sx={{ width: 70 }}
          />
        </Box>
      );
    }

    return (
      <Box
        key={yearCol}
        onClick={() => startEdit(row.id, yearCol, val)}
        sx={{
          border: '1px solid',
          borderColor: hasValue ? 'primary.light' : 'divider',
          borderRadius: 1,
          p: 1,
          minWidth: 80,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: hasValue ? 'primary.50' : 'transparent',
          '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
          transition: 'all 0.15s',
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">
          {yearLabel}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={hasValue ? 600 : 400}
          color={hasValue ? 'text.primary' : 'text.disabled'}
        >
          {hasValue ? fmtKr(val) : '\u2013'}
        </Typography>
      </Box>
    );
  };

  /** Render a single item row (collapsed) */
  const renderItemRow = (item: PlanRow) => {
    const isExpanded = expandedItems.has(item.id);
    const total = computeRowTotal(item);
    const parentByggdel = byggdelMap.get(item.id) || '';

    return (
      <React.Fragment key={item.id}>
        <TableRow
          hover
          data-row-id={item.id}
          sx={{
            '& td': { py: 0.75, borderBottom: '1px solid', borderColor: 'divider' },
          }}
        >
          {/* Expand icon */}
          <TableCell sx={{ width: 40, px: 0.5 }}>
            <IconButton size="small" onClick={() => toggleItem(item.id)}>
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          </TableCell>

          {/* Atgard + byggdel caption (click to edit) */}
          <TableCell
            onClick={(e) => { e.stopPropagation(); if (!editingText) startEditText(item.id, 'atgard', item.atgard); }}
            sx={{ cursor: 'pointer' }}
          >
            {editingText?.rowId === item.id && editingText.field === 'atgard' ? (
              <TextField
                size="small"
                variant="standard"
                value={editTextValue}
                onChange={e => setEditTextValue(e.target.value)}
                onBlur={commitEditText}
                onKeyDown={handleEditTextKeyDown}
                autoFocus
                fullWidth
                placeholder="Åtgärdsbeskrivning..."
                sx={{ '& input': { fontSize: '0.875rem', fontWeight: 500 } }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <Typography
                variant="body2"
                fontWeight={500}
                sx={item.atgard ? { '&:hover': { color: 'primary.main' } } : { color: 'text.disabled', fontStyle: 'italic' }}
              >
                {item.atgard || 'Namnge åtgärd...'}
              </Typography>
            )}
            {parentByggdel && !(editingText?.rowId === item.id && editingText.field === 'atgard') && (
              <Typography variant="caption" color="text.secondary">
                {parentByggdel}
              </Typography>
            )}
          </TableCell>

          {/* Years with costs */}
          <TableCell sx={{ width: 80, textAlign: 'center' }}>
            {(() => {
              const years = YEAR_COLUMNS
                .filter(yc => { const v = item[yc]; return typeof v === 'number' && v > 0; })
                .map(yc => yc.replace('year_', ''));
              if (years.length === 0) return <Typography variant="body2">{'\u2013'}</Typography>;
              return (
                <>
                  <Typography variant="body2">{years[0]}</Typography>
                  {years.length > 1 && (
                    <Typography variant="caption" color="primary.main">
                      +{years.length - 1} år
                    </Typography>
                  )}
                </>
              );
            })()}
          </TableCell>

          {/* Amount (total) */}
          <TableCell sx={{ width: 100, textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={500}>
              {fmtKr(total || null)}
            </Typography>
          </TableCell>

          {/* Status */}
          <TableCell sx={{ width: 130 }}>
            <Select
              value={item.status || 'planned'}
              onChange={e => handleStatusChange(item.id, e.target.value as PlanRowStatus)}
              variant="standard"
              disableUnderline
              size="small"
              sx={{ fontSize: '0.8125rem' }}
              renderValue={(value) => (
                <Chip
                  label={statusLabel(value as PlanRowStatus)}
                  color={statusColor(value as PlanRowStatus)}
                  size="small"
                  variant="outlined"
                  sx={{ height: 24 }}
                />
              )}
            >
              {STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Chip
                    label={opt.label}
                    color={opt.color}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                </MenuItem>
              ))}
            </Select>
          </TableCell>

          {/* Delete */}
          <TableCell sx={{ width: 40, px: 0 }}>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleDeleteRow(item.id); }}
              sx={{ opacity: 0.3, '&:hover': { opacity: 1, color: 'error.main' } }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>

        {/* Expanded detail row */}
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0, px: 0, borderBottom: isExpanded ? undefined : 'none' }}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ px: 3, py: 2, bgcolor: '#fafafa' }}>
                {/* Year boxes */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {YEAR_COLUMNS.map(yc => renderYearBox(item, yc))}
                </Box>

                {/* Meta info */}
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tek livslängd
                    </Typography>
                    <Typography variant="body2">
                      {item.tek_livslangd || '\u2013'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      a-pris
                    </Typography>
                    <Typography variant="body2">
                      {item.a_pris !== null ? fmtKr(item.a_pris) : '\u2013'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Antal
                    </Typography>
                    <Typography variant="body2">
                      {item.antal !== null ? item.antal : '\u2013'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Totalt
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {fmtKr(total || null)}
                    </Typography>
                  </Box>
                  {item.utredningspunkter && (
                    <Box sx={{ flexBasis: '100%' }}>
                      <Typography variant="caption" color="text.secondary">
                        Utredningspunkter
                      </Typography>
                      <Typography variant="body2">
                        {item.utredningspunkter}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  };

  /** Render items table for a list of items */
  const renderItemsTable = (items: PlanRow[]) => {
    if (items.length === 0) return null;
    return (
      <Table size="small">
        <TableBody>
          {items.map(item => renderItemRow(item))}
        </TableBody>
      </Table>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {/* Toolbar */}
      <Paper sx={{ mb: 2 }} elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Button
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={onOpenImport}
          >
            Importera Excel
          </Button>

          <Button
            size="small"
            startIcon={<FileUploadIcon />}
            onClick={handleExportExcel}
          >
            Exportera Excel
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
            sx={{
              minWidth: 110,
              ...(!isDirty || isSaving ? { cursor: 'default', pointerEvents: 'none' } : {}),
            }}
          >
            {isSaving ? 'Sparar...' : isDirty ? 'Spara' : 'Sparad'}
          </Button>
        </Toolbar>
      </Paper>

      {/* Sections */}
      {sections.map(section => {
        const sectionId = section.sectionRow.id;
        const isCollapsed = collapsedSections.has(sectionId);
        const sectionTotal = computeSectionTotal(section);

        return (
          <Paper key={sectionId} sx={{ mb: 2 }} elevation={1}>
            {/* Section header */}
            <Box
              onClick={() => toggleSection(sectionId)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1.5,
                bgcolor: '#e3f2fd',
                cursor: 'pointer',
                borderRadius: isCollapsed ? 1 : undefined,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                '&:hover': { bgcolor: '#bbdefb' },
                transition: 'background-color 0.15s',
              }}
            >
              <IconButton size="small" sx={{ mr: 1 }}>
                {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {section.sectionRow.nr && `${section.sectionRow.nr}. `}
                </Typography>
                {editingText?.rowId === sectionId && editingText.field === 'byggdel' ? (
                  <TextField
                    size="small"
                    variant="standard"
                    value={editTextValue}
                    onChange={e => setEditTextValue(e.target.value)}
                    onBlur={commitEditText}
                    onKeyDown={handleEditTextKeyDown}
                    autoFocus
                    placeholder="Sektionsnamn..."
                    onClick={e => e.stopPropagation()}
                    sx={{ flex: 1, '& input': { fontSize: '1rem', fontWeight: 700 } }}
                  />
                ) : (
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    onClick={(e) => { e.stopPropagation(); startEditText(sectionId, 'byggdel', section.sectionRow.byggdel); }}
                    sx={section.sectionRow.byggdel
                      ? { '&:hover': { color: 'primary.main' }, cursor: 'text' }
                      : { color: 'text.disabled', fontStyle: 'italic', cursor: 'text' }}
                  >
                    {section.sectionRow.byggdel || 'Namnge sektion...'}
                  </Typography>
                )}
              </Box>
              <Tooltip title="Sektionens totalkostnad">
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mr: 1 }}>
                  {fmtTkr(sectionTotal)}
                </Typography>
              </Tooltip>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleDeleteSection(sectionId); }}
                sx={{ opacity: 0.3, '&:hover': { opacity: 1, color: 'error.main' } }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Section content (collapsible) */}
            <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
              <Box>
                {/* Direct items (no subsection parent) */}
                {section.directItems.length > 0 && (
                  <Box sx={{ px: 1 }}>
                    {renderItemsTable(section.directItems)}
                  </Box>
                )}

                {/* Subsections */}
                {section.subsections.map(sub => (
                  <Box key={sub.subsectionRow.id}>
                    {/* Subsection header */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 3,
                        py: 1,
                        bgcolor: '#f5f5f5',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {sub.subsectionRow.byggdel}
                      </Typography>
                    </Box>

                    {/* Subsection items */}
                    <Box sx={{ px: 1 }}>
                      {renderItemsTable(sub.items)}
                    </Box>

                    {/* Add item to this subsection */}
                    <Box sx={{ px: 3, py: 0.5 }}>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddItem(sub.subsectionRow.id)}
                        sx={{ textTransform: 'none', color: 'text.disabled', fontSize: '0.75rem', '&:hover': { color: 'text.secondary' } }}
                      >
                        Lägg till
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Paper>
        );
      })}

      {/* Summary rows */}
      {summaryRows.length > 0 && (
        <Paper sx={{ mb: 2 }} elevation={1}>
          <Table size="small">
            <TableBody>
              {summaryRows.map(summaryRow => {
                const total = computeRowTotal(summaryRow);
                return (
                  <TableRow
                    key={summaryRow.id}
                    sx={{
                      bgcolor: '#fff3e0',
                      '& td': {
                        py: 1,
                        fontWeight: 700,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      },
                    }}
                  >
                    <TableCell sx={{ width: 40 }} />
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {summaryRow.byggdel}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ width: 70 }} />
                    <TableCell sx={{ width: 100, textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {fmtKr(total || null)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ width: 130 }} />
                    <TableCell sx={{ width: 40 }} />
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Expanded summary: show per-year breakdown */}
          <Box sx={{ px: 3, py: 2, bgcolor: '#fff8e1' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Kostnad per år
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {YEAR_COLUMNS.map(yc => {
                const totaltRow = summaryRows.find(r => r.byggdel === 'Totalt inkl moms');
                const val = totaltRow ? (totaltRow[yc] as number | null) : null;
                return (
                  <Box
                    key={yc}
                    sx={{
                      border: '1px solid',
                      borderColor: 'warning.light',
                      borderRadius: 1,
                      p: 1,
                      minWidth: 80,
                      textAlign: 'center',
                      bgcolor: '#fffde7',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      {yc.replace('year_', '')}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {val ? fmtTkr(val) : '\u2013'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Add section button */}
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddSection}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Lägg till sektion
        </Button>
      </Box>

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
                    secondary={`${new Date(v.created_at).toLocaleString('sv-SE')} \u2014 ${v.metadata?.saved_by || v.created_by || 'ok\u00e4nd'}`}
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

export default MaintenancePlanReport;
