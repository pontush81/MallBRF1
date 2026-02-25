import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';
import { v4 as uuidv4 } from 'uuid';
import AddActionDialog from './AddActionDialog';

import { PlanRow, PlanRowStatus, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  groupItemsByYear,
  YearGroup,
  computeRowTotal,
  recalcSummaryRows,
  buildByggdelMap,
} from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface YearViewProps {
  rows: PlanRow[];
  setRows: React.Dispatch<React.SetStateAction<PlanRow[]>>;
  setIsDirty: (dirty: boolean) => void;
}

// ---------------------------------------------------------------------------
// Status helpers (same pattern as MaintenancePlanReport)
// ---------------------------------------------------------------------------

type ChipColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const STATUS_OPTIONS: { value: PlanRowStatus; label: string; color: ChipColor; variant: 'filled' | 'outlined' }[] = [
  { value: '', label: '\u2013', color: 'default', variant: 'outlined' },
  { value: 'planned', label: 'Planerad', color: 'info', variant: 'filled' },
  { value: 'in_progress', label: 'P\u00e5g\u00e5r', color: 'warning', variant: 'filled' },
  { value: 'completed', label: 'Utf\u00f6rd', color: 'success', variant: 'filled' },
  { value: 'postponed', label: 'F\u00f6rsenad', color: 'error', variant: 'filled' },
];

function statusLabel(status: PlanRowStatus): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.label ?? '\u2013';
}

function statusColor(status: PlanRowStatus): ChipColor {
  return STATUS_OPTIONS.find(s => s.value === status)?.color ?? 'default';
}

function statusVariant(status: PlanRowStatus): 'filled' | 'outlined' {
  return STATUS_OPTIONS.find(s => s.value === status)?.variant ?? 'outlined';
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtKr(amount: number | null): string {
  if (amount === null || amount === undefined || amount === 0) return '\u2013';
  return amount.toLocaleString('sv-SE') + ' kr';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanYearView: React.FC<YearViewProps> = ({ rows, setRows, setIsDirty }) => {
  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------

  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ rowId: string; yearCol: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Add action dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogYear, setAddDialogYear] = useState<string>('');

  // Fill empty years
  const [fillAllValue, setFillAllValue] = useState('');

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const yearGroups = useMemo(() => groupItemsByYear(rows), [rows]);
  const byggdelMap = useMemo(() => buildByggdelMap(rows), [rows]);
  const maxTotal = useMemo(
    () => Math.max(...yearGroups.map(yg => yg.total), 1),
    [yearGroups],
  );

  // ---------------------------------------------------------------------------
  // Year toggle
  // ---------------------------------------------------------------------------

  const toggleYear = useCallback((yearCol: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(yearCol)) {
        next.delete(yearCol);
      } else {
        next.add(yearCol);
      }
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Item toggle (composite key: rowId:yearCol)
  // ---------------------------------------------------------------------------

  const toggleItem = useCallback((compositeKey: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(compositeKey)) {
        next.delete(compositeKey);
      } else {
        next.add(compositeKey);
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

    // Only update if value actually changed
    const currentRow = rows.find(r => r.id === rowId);
    const currentVal = currentRow ? (currentRow as unknown as Record<string, number | null>)[yearCol] : undefined;
    if (currentVal === numVal || (currentVal == null && numVal == null)) {
      setEditingCell(null);
      setEditValue('');
      return;
    }

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
  }, [editingCell, editValue, rows, setRows, setIsDirty]);

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
  // Add action dialog handlers
  // ---------------------------------------------------------------------------

  const handleOpenAddDialog = useCallback((yearCol: string) => {
    setAddDialogYear(yearCol);
    setAddDialogOpen(true);
  }, []);

  const handleAddAction = useCallback((parentRowId: string, fields: Partial<PlanRow>, yearCol: string) => {
    const newId = uuidv4();
    setRows(prevRows => {
      const parentIndex = prevRows.findIndex(r => r.id === parentRowId);
      if (parentIndex === -1) return prevRows;

      // Insert after last child of this subsection
      let insertIndex = parentIndex + 1;
      while (
        insertIndex < prevRows.length &&
        prevRows[insertIndex].rowType !== 'subsection' &&
        prevRows[insertIndex].rowType !== 'section' &&
        prevRows[insertIndex].rowType !== 'summary'
      ) {
        insertIndex++;
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
        status: '',
        ...fields,
      };

      const newRows = [...prevRows];
      newRows.splice(insertIndex, 0, newRow);
      setIsDirty(true);
      return recalcSummaryRows(newRows);
    });
  }, [setRows, setIsDirty]);

  // ---------------------------------------------------------------------------
  // Fill empty years with a uniform value
  // ---------------------------------------------------------------------------

  const handleFillEmptyYears = useCallback(
    (rowId: string) => {
      const parsed = fillAllValue.trim() === ''
        ? null
        : parseFloat(fillAllValue.replace(/\s/g, '').replace(',', '.'));
      const numVal = parsed !== null && !isNaN(parsed) ? Math.round(parsed) : null;
      if (numVal === null) return;

      setRows(prevRows => {
        const newRows = prevRows.map(r => {
          if (r.id !== rowId) return r;
          const updated = { ...r };
          for (const yc of YEAR_COLUMNS) {
            const current = updated[yc] as number | null;
            if (current === null || current === undefined || current === 0) {
              (updated as unknown as Record<string, number | null>)[yc] = numVal;
            }
          }
          return updated;
        });
        setIsDirty(true);
        return recalcSummaryRows(newRows);
      });
      setFillAllValue('');
    },
    [fillAllValue, setRows, setIsDirty],
  );

  // ---------------------------------------------------------------------------
  // Render: year box in expanded item detail
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Render: item row within a year accordion
  // ---------------------------------------------------------------------------

  const renderItemRow = (
    item: { row: PlanRow; amount: number; byggdel: string },
    yearCol: typeof YEAR_COLUMNS[number],
  ) => {
    const compositeKey = item.row.id + ':' + yearCol;
    const isExpanded = expandedItems.has(compositeKey);
    const parentByggdel = item.byggdel || byggdelMap.get(item.row.id) || '\u2013';
    const total = computeRowTotal(item.row);

    return (
      <React.Fragment key={compositeKey}>
        <TableRow
          hover
          sx={{
            '& td': { py: 0.75, borderBottom: '1px solid', borderColor: 'divider' },
          }}
        >
          {/* Expand icon */}
          <TableCell sx={{ width: 40, px: 0.5 }}>
            <IconButton size="small" onClick={() => toggleItem(compositeKey)}>
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          </TableCell>

          {/* Atgard + byggdel caption */}
          <TableCell>
            <Typography variant="body2" fontWeight={500}>
              {item.row.atgard || '\u2013'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {parentByggdel}
            </Typography>
          </TableCell>

          {/* Amount for this year */}
          <TableCell sx={{ width: 120, textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {fmtKr(item.amount)}
            </Typography>
          </TableCell>

          {/* Status chip with dropdown */}
          <TableCell sx={{ width: 130 }}>
            <Select
              value={item.row.status ?? ''}
              onChange={e => handleStatusChange(item.row.id, e.target.value as PlanRowStatus)}
              variant="standard"
              disableUnderline
              size="small"
              sx={{ fontSize: '0.8125rem' }}
              renderValue={(value) => (
                <Chip
                  label={statusLabel(value as PlanRowStatus)}
                  color={statusColor(value as PlanRowStatus)}
                  size="small"
                  variant={statusVariant(value as PlanRowStatus)}
                  sx={{ height: 26, fontWeight: 600, fontSize: '0.75rem' }}
                />
              )}
            >
              {STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Chip
                    label={opt.label}
                    color={opt.color}
                    size="small"
                    variant={opt.variant}
                    sx={{ height: 26, fontWeight: 600, fontSize: '0.75rem' }}
                  />
                </MenuItem>
              ))}
            </Select>
          </TableCell>
        </TableRow>

        {/* Expanded item detail */}
        <TableRow>
          <TableCell colSpan={4} sx={{ py: 0, px: 0, borderBottom: isExpanded ? undefined : 'none' }}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ px: 3, py: 2, bgcolor: '#fafafa' }}>
                {/* Year boxes for ALL 10 years */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {YEAR_COLUMNS.map(yc => renderYearBox(item.row, yc))}
                </Box>

                {/* Fill empty years */}
                {YEAR_COLUMNS.some(yc => {
                  const v = item.row[yc] as number | null;
                  return v === null || v === undefined || v === 0;
                }) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Belopp"
                      value={fillAllValue}
                      onChange={e => setFillAllValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFillEmptyYears(item.row.id);
                        }
                      }}
                      inputProps={{ style: { fontSize: '0.8125rem' } }}
                      sx={{ width: 120 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleFillEmptyYears(item.row.id)}
                      disabled={fillAllValue.trim() === ''}
                      sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
                    >
                      Fyll tomma år
                    </Button>
                  </Box>
                )}

                {/* Meta info */}
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {/* Tek livslangd */}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tek livslängd
                    </Typography>
                    <Typography variant="body2">
                      {item.row.tek_livslangd || '\u2013'}
                    </Typography>
                  </Box>

                  {/* Totalt (all years) */}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Totalt
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {fmtKr(total || null)}
                    </Typography>
                  </Box>

                  {/* Kommentar */}
                  {item.row.utredningspunkter && (
                    <Box sx={{ flexBasis: '100%' }}>
                      <Typography variant="caption" color="text.secondary">
                        Kommentar
                      </Typography>
                      <Typography variant="body2">
                        {item.row.utredningspunkter}
                      </Typography>
                    </Box>
                  )}

                  {/* Mer information link */}
                  {item.row.info_url && (
                    <Box sx={{ flexBasis: '100%' }}>
                      <Typography variant="caption" color="text.secondary">
                        Mer information
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          component="a"
                          href={item.row.info_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {(() => {
                            try {
                              return new URL(item.row.info_url).hostname;
                            } catch {
                              return item.row.info_url;
                            }
                          })()}
                        </Typography>
                        <OpenInNewIcon sx={{ fontSize: 14, color: 'primary.main', opacity: 0.7 }} />
                      </Box>
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

  // ---------------------------------------------------------------------------
  // Render: year accordion row
  // ---------------------------------------------------------------------------

  const renderYearAccordion = (yg: YearGroup) => {
    const isExpanded = expandedYears.has(yg.yearCol);
    const isEmpty = yg.items.length === 0;
    const progressValue = maxTotal > 0 ? (yg.total / maxTotal) * 100 : 0;

    return (
      <Box key={yg.yearCol} sx={{ mb: 1 }}>
        {/* Year header row */}
        <Box
          onClick={() => toggleYear(yg.yearCol)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            bgcolor: isExpanded ? '#e3f2fd' : 'background.paper',
            borderRadius: isExpanded ? '4px 4px 0 0' : 1,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: isExpanded ? 'primary.light' : 'divider',
            borderBottom: isExpanded ? 'none' : undefined,
            '&:hover': { bgcolor: isExpanded ? '#bbdefb' : 'action.hover' },
            transition: 'background-color 0.15s',
          }}
        >
          {/* Expand icon */}
          <IconButton size="small" sx={{ mr: 1 }}>
            {isExpanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>

          {/* Year label */}
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              minWidth: 50,
              color: isEmpty ? 'text.disabled' : 'text.primary',
            }}
          >
            {yg.year}
          </Typography>

          {/* Progress bar */}
          <Box sx={{ flex: 1, mx: 2, display: { xs: 'none', sm: 'block' } }}>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: isEmpty ? 'grey.300' : 'primary.main',
                },
              }}
            />
          </Box>

          {/* Total amount */}
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              minWidth: 100,
              textAlign: 'right',
              color: isEmpty ? 'text.disabled' : 'text.primary',
              mr: 1,
            }}
            noWrap
          >
            {isEmpty ? '\u2013' : fmtKr(yg.total)}
          </Typography>

          {/* Count badge */}
          <Chip
            label={isEmpty ? '0 st' : `${yg.items.length} st`}
            size="small"
            variant="outlined"
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isEmpty ? 'text.disabled' : 'text.secondary',
              borderColor: isEmpty ? 'grey.300' : 'grey.400',
            }}
          />
        </Box>

        {/* Year content (expanded) */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'primary.light',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              overflow: 'hidden',
            }}
          >
            {isEmpty ? (
              <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Inga planerade åtgärder detta år.
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={(e) => { e.stopPropagation(); handleOpenAddDialog(yg.yearCol); }}
                  sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
                >
                  Lägg till
                </Button>
              </Box>
            ) : (
              <>
                <Table size="small">
                  <TableBody>
                    {yg.items.map(item => renderItemRow(item, yg.yearCol))}
                  </TableBody>
                </Table>
                <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={(e) => { e.stopPropagation(); handleOpenAddDialog(yg.yearCol); }}
                    sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.8125rem' }}
                  >
                    Lägg till åtgärd i {yg.year}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Collapse>
      </Box>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {yearGroups.map(yg => renderYearAccordion(yg))}

      <AddActionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddAction}
        rows={rows}
        targetYear={addDialogYear}
      />
    </Box>
  );
};

export default MaintenancePlanYearView;
