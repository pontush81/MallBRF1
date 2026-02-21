# År-för-år-vy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "År-för-år" toggle view to the maintenance plan that groups all items by year, enabling board members to go through the plan year-by-year during meetings.

**Architecture:** New `MaintenancePlanYearView` component that takes the same `rows`/`setRows` props as `MaintenancePlanReport`. A toggle in `MaintenancePlanPage` switches between the existing "Byggdel" view and the new "År-för-år" view. A new pure helper function `groupItemsByYear` in `maintenancePlanHelpers.ts` provides the data transformation.

**Tech Stack:** React 18 + TypeScript, MUI v5, bastadTheme design system, Jest for unit tests

---

### Task 1: Add `groupItemsByYear` helper function

**Files:**
- Modify: `src/components/maintenance/maintenancePlanHelpers.ts` (append at end)
- Test: `src/__tests__/maintenance/maintenancePlanHelpers.test.ts` (append)

**Step 1: Write the failing test**

Add to the end of `src/__tests__/maintenance/maintenancePlanHelpers.test.ts`:

```typescript
import {
  // ... existing imports ...
  groupItemsByYear,
} from '../../components/maintenance/maintenancePlanHelpers';

// ... (existing tests above) ...

// ---------------------------------------------------------------------------
// groupItemsByYear
// ---------------------------------------------------------------------------

describe('groupItemsByYear', () => {
  it('groups items by the years they have costs in', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub1', rowType: 'subsection', byggdel: 'Fasader' }),
      makeRow({ id: 'a', atgard: 'Plåtarbeten', byggdel: 'Ventilationsintag', year_2026: 88000 }),
      makeRow({ id: 'b', atgard: 'Målning', byggdel: 'Sophus', year_2028: 25000 }),
      makeRow({ id: 'sec2', rowType: 'section', nr: '2', byggdel: 'Invändigt' }),
      makeRow({ id: 'sub2', rowType: 'subsection', byggdel: 'Tvättstuga' }),
      makeRow({ id: 'c', atgard: 'Byte maskiner', byggdel: 'Tvättstuga', year_2026: 60000, year_2028: 60000 }),
      ...makeSummaryRows(),
    ];

    const result = groupItemsByYear(rows);

    // 2026 should have 2 items
    const y2026 = result.find(y => y.yearCol === 'year_2026');
    expect(y2026).toBeDefined();
    expect(y2026!.items).toHaveLength(2);
    expect(y2026!.total).toBe(148000);

    // 2028 should have 2 items
    const y2028 = result.find(y => y.yearCol === 'year_2028');
    expect(y2028).toBeDefined();
    expect(y2028!.items).toHaveLength(2);
    expect(y2028!.total).toBe(85000);

    // 2027 should have 0 items (but still appear in result)
    const y2027 = result.find(y => y.yearCol === 'year_2027');
    expect(y2027).toBeDefined();
    expect(y2027!.items).toHaveLength(0);
    expect(y2027!.total).toBe(0);
  });

  it('sorts items within each year by amount descending', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'a', atgard: 'Liten', byggdel: 'A', year_2026: 10000 }),
      makeRow({ id: 'b', atgard: 'Stor', byggdel: 'B', year_2026: 90000 }),
      makeRow({ id: 'c', atgard: 'Mellan', byggdel: 'C', year_2026: 50000 }),
      ...makeSummaryRows(),
    ];

    const result = groupItemsByYear(rows);
    const y2026 = result.find(y => y.yearCol === 'year_2026')!;
    expect(y2026.items[0].row.id).toBe('b');
    expect(y2026.items[1].row.id).toBe('c');
    expect(y2026.items[2].row.id).toBe('a');
  });

  it('excludes completed items', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'a', atgard: 'Klar', year_2026: 50000, status: 'completed' }),
      makeRow({ id: 'b', atgard: 'Pågår', year_2026: 30000, status: 'planned' }),
      ...makeSummaryRows(),
    ];

    const result = groupItemsByYear(rows);
    const y2026 = result.find(y => y.yearCol === 'year_2026')!;
    expect(y2026.items).toHaveLength(1);
    expect(y2026.items[0].row.id).toBe('b');
  });

  it('includes byggdel from byggdelMap', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'sec', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub', rowType: 'subsection', byggdel: 'Fasader' }),
      makeRow({ id: 'a', atgard: 'Arbete', byggdel: '', year_2026: 10000 }),
      ...makeSummaryRows(),
    ];

    const result = groupItemsByYear(rows);
    const y2026 = result.find(y => y.yearCol === 'year_2026')!;
    expect(y2026.items[0].byggdel).toBe('Fasader');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx react-scripts test --watchAll=false --testPathPattern maintenancePlanHelpers`
Expected: FAIL — `groupItemsByYear` is not exported

**Step 3: Write minimal implementation**

Add to the end of `src/components/maintenance/maintenancePlanHelpers.ts`:

```typescript
// ---------------------------------------------------------------------------
// Year-by-year view helpers
// ---------------------------------------------------------------------------

export interface YearGroup {
  yearCol: typeof YEAR_COLUMNS[number];
  year: string;           // e.g. "2026"
  items: { row: PlanRow; amount: number; byggdel: string }[];
  total: number;
}

/** Group all item rows by the years they have costs in. Returns one entry per year column, sorted chronologically. */
export function groupItemsByYear(rows: PlanRow[]): YearGroup[] {
  const byggdelMap = buildByggdelMap(rows);

  return YEAR_COLUMNS.map(yc => {
    const items: { row: PlanRow; amount: number; byggdel: string }[] = [];

    for (const r of rows) {
      if (r.rowType !== 'item') continue;
      if (r.status === 'completed') continue;
      const val = r[yc];
      if (typeof val === 'number' && val > 0) {
        items.push({
          row: r,
          amount: val,
          byggdel: r.byggdel || byggdelMap.get(r.id) || '–',
        });
      }
    }

    items.sort((a, b) => b.amount - a.amount);

    return {
      yearCol: yc,
      year: yc.replace('year_', ''),
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0),
    };
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx react-scripts test --watchAll=false --testPathPattern maintenancePlanHelpers`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/maintenance/maintenancePlanHelpers.ts src/__tests__/maintenance/maintenancePlanHelpers.test.ts
git commit -m "feat: add groupItemsByYear helper for year-by-year view"
```

---

### Task 2: Create `MaintenancePlanYearView` component

**Files:**
- Create: `src/components/maintenance/MaintenancePlanYearView.tsx`

This is a read+edit component that renders year-by-year accordions. It reuses existing patterns from `MaintenancePlanReport.tsx` for item rendering and inline editing.

**Step 1: Create the component**

```tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
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
  Tooltip,
  LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import {
  PlanRow,
  PlanRowStatus,
  YEAR_COLUMNS,
} from '../../services/maintenancePlanService';
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
// Status helpers (same as MaintenancePlanReport)
// ---------------------------------------------------------------------------

type ChipColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const STATUS_OPTIONS: { value: PlanRowStatus; label: string; color: ChipColor; variant: 'filled' | 'outlined' }[] = [
  { value: '', label: '\u2013', color: 'default', variant: 'outlined' },
  { value: 'planned', label: 'Planerad', color: 'info', variant: 'filled' },
  { value: 'in_progress', label: 'Pågår', color: 'warning', variant: 'filled' },
  { value: 'completed', label: 'Utförd', color: 'success', variant: 'filled' },
  { value: 'postponed', label: 'Försenad', color: 'error', variant: 'filled' },
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
// Formatting
// ---------------------------------------------------------------------------

function fmtKr(amount: number | null): string {
  if (amount === null || amount === undefined || amount === 0) return '\u2013';
  return amount.toLocaleString('sv-SE') + ' kr';
}

function fmtTkr(amount: number): string {
  if (!amount) return '\u2013';
  return Math.round(amount / 1000).toLocaleString('sv-SE') + ' tkr';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanYearView: React.FC<YearViewProps> = ({
  rows,
  setRows,
  setIsDirty,
}) => {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ rowId: string; yearCol: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // ---------------------------------------------------------------------------
  // Grouped data
  // ---------------------------------------------------------------------------

  const yearGroups = useMemo(() => groupItemsByYear(rows), [rows]);
  const maxTotal = useMemo(() => Math.max(...yearGroups.map(g => g.total), 1), [yearGroups]);
  const byggdelMap = useMemo(() => buildByggdelMap(rows), [rows]);

  // ---------------------------------------------------------------------------
  // Toggle handlers
  // ---------------------------------------------------------------------------

  const toggleYear = useCallback((yearCol: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(yearCol)) next.delete(yearCol);
      else next.add(yearCol);
      return next;
    });
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Inline year-cost editing
  // ---------------------------------------------------------------------------

  const startEdit = useCallback((rowId: string, yearCol: string, currentValue: number | null) => {
    setEditingCell({ rowId, yearCol });
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { rowId, yearCol } = editingCell;
    const parsed = editValue.trim() === '' ? null : parseFloat(editValue.replace(/\s/g, '').replace(',', '.'));
    const numVal = parsed !== null && !isNaN(parsed) ? Math.round(parsed) : null;

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

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
    },
    [commitEdit, cancelEdit],
  );

  // ---------------------------------------------------------------------------
  // Status change
  // ---------------------------------------------------------------------------

  const handleStatusChange = useCallback(
    (rowId: string, newStatus: PlanRowStatus) => {
      setRows(prevRows =>
        prevRows.map(r => r.id === rowId ? { ...r, status: newStatus } : r),
      );
      setIsDirty(true);
    },
    [setRows, setIsDirty],
  );

  // ---------------------------------------------------------------------------
  // Render: year-cost box (for expanded item detail)
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
            minWidth: 70,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">{yearLabel}</Typography>
          <TextField
            size="small"
            variant="standard"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            autoFocus
            inputProps={{ style: { textAlign: 'center', fontSize: '0.875rem' } }}
            sx={{ width: 60 }}
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
          minWidth: 70,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: hasValue ? 'primary.50' : 'transparent',
          '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
          transition: 'all 0.15s',
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">{yearLabel}</Typography>
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
  // Render: single item row within a year accordion
  // ---------------------------------------------------------------------------

  const renderItemInYear = (
    item: { row: PlanRow; amount: number; byggdel: string },
    yearCol: string,
  ) => {
    const isExpanded = expandedItems.has(item.row.id + ':' + yearCol);
    const itemKey = item.row.id + ':' + yearCol;
    const total = computeRowTotal(item.row);

    return (
      <React.Fragment key={itemKey}>
        <TableRow
          hover
          sx={{ '& td': { py: 0.75, borderBottom: '1px solid', borderColor: 'divider' } }}
        >
          {/* Expand */}
          <TableCell sx={{ width: 40, px: 0.5 }}>
            <IconButton size="small" onClick={() => toggleItem(itemKey)}>
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          </TableCell>

          {/* Åtgärd + Byggdel */}
          <TableCell>
            <Typography variant="body2" fontWeight={500}>
              {item.row.atgard || '\u2013'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.byggdel}
            </Typography>
          </TableCell>

          {/* Belopp detta år */}
          <TableCell sx={{ width: 110, textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={600}>
              {fmtKr(item.amount)}
            </Typography>
          </TableCell>

          {/* Status */}
          <TableCell sx={{ width: 130, display: { xs: 'none', sm: 'table-cell' } }}>
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

        {/* Expanded detail */}
        <TableRow>
          <TableCell colSpan={4} sx={{ py: 0, px: 0, borderBottom: isExpanded ? undefined : 'none' }}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ px: { xs: 1.5, sm: 3 }, py: 2, bgcolor: '#fafafa' }}>
                {/* Year boxes */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {YEAR_COLUMNS.map(yc => renderYearBox(item.row, yc))}
                </Box>

                {/* Meta info */}
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Tek livslängd</Typography>
                    <Typography variant="body2">
                      {item.row.tek_livslangd || '\u2013'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Totalt (alla år)</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {fmtKr(total || null)}
                    </Typography>
                  </Box>
                  {item.row.utredningspunkter && (
                    <Box sx={{ flexBasis: '100%' }}>
                      <Typography variant="caption" color="text.secondary">Kommentar</Typography>
                      <Typography variant="body2">{item.row.utredningspunkter}</Typography>
                    </Box>
                  )}
                  {item.row.info_url && (
                    <Box sx={{ flexBasis: '100%' }}>
                      <Typography variant="caption" color="text.secondary">Mer information</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          component="a"
                          href={item.row.info_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {(() => { try { return new URL(item.row.info_url).hostname; } catch { return item.row.info_url; } })()}
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
  // Render: year accordion
  // ---------------------------------------------------------------------------

  const renderYearAccordion = (group: YearGroup) => {
    const isExpanded = expandedYears.has(group.yearCol);
    const costBarPct = (group.total / maxTotal) * 100;
    const hasItems = group.items.length > 0;

    return (
      <Box
        key={group.yearCol}
        sx={{
          mb: 1,
          border: '1px solid',
          borderColor: isExpanded ? 'primary.light' : 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          transition: 'border-color 0.15s',
        }}
      >
        {/* Year header */}
        <Box
          onClick={() => toggleYear(group.yearCol)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            cursor: 'pointer',
            bgcolor: isExpanded ? '#e3f2fd' : (hasItems ? 'background.paper' : 'grey.50'),
            '&:hover': { bgcolor: isExpanded ? '#bbdefb' : 'action.hover' },
            transition: 'background-color 0.15s',
          }}
        >
          <IconButton size="small" sx={{ mr: 1 }}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>

          {/* Year label */}
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ minWidth: 50, color: hasItems ? 'text.primary' : 'text.disabled' }}
          >
            {group.year}
          </Typography>

          {/* Cost bar + amount */}
          <Box sx={{ flex: 1, mx: 2, display: { xs: 'none', sm: 'block' } }}>
            <LinearProgress
              variant="determinate"
              value={costBarPct}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.100',
                '& .MuiLinearProgress-bar': {
                  bgcolor: hasItems ? 'primary.main' : 'grey.300',
                  borderRadius: 3,
                },
              }}
            />
          </Box>

          <Typography
            variant="subtitle2"
            fontWeight={600}
            noWrap
            sx={{
              color: hasItems ? 'text.primary' : 'text.disabled',
              minWidth: 90,
              textAlign: 'right',
            }}
          >
            {hasItems ? fmtKr(group.total) : '\u2013'}
          </Typography>

          {/* Item count badge */}
          {hasItems && (
            <Chip
              label={`${group.items.length} st`}
              size="small"
              variant="outlined"
              sx={{ ml: 1, height: 24, fontSize: '0.75rem', display: { xs: 'none', sm: 'flex' } }}
            />
          )}
        </Box>

        {/* Year content */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          {group.items.length === 0 ? (
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Inga planerade åtgärder detta år.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableBody>
                {group.items.map(item => renderItemInYear(item, group.yearCol))}
              </TableBody>
            </Table>
          )}
        </Collapse>
      </Box>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {yearGroups.map(group => renderYearAccordion(group))}
    </Box>
  );
};

export default MaintenancePlanYearView;
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`
Expected: No errors related to `MaintenancePlanYearView`

**Step 3: Commit**

```bash
git add src/components/maintenance/MaintenancePlanYearView.tsx
git commit -m "feat: add MaintenancePlanYearView component with year accordions"
```

---

### Task 3: Add view toggle to `MaintenancePlanPage`

**Files:**
- Modify: `src/pages/admin/MaintenancePlanPage.tsx`

**Step 1: Add import and state for view toggle**

At top of file, add import:

```typescript
import MaintenancePlanYearView from '../../components/maintenance/MaintenancePlanYearView';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
```

Inside the component, add state:

```typescript
type ViewMode = 'byggdel' | 'year';
const [viewMode, setViewMode] = useState<ViewMode>('byggdel');
```

**Step 2: Add toggle UI between the Summary and Report**

Insert between `<MaintenancePlanSummary>` and `<MaintenancePlanReport>` (around line 303):

```tsx
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
```

**Step 3: Conditionally render the views**

Replace the existing `<MaintenancePlanReport ... />` block (line ~305-316) with:

```tsx
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
```

Note: the toolbar (import/export/history/save) lives inside `MaintenancePlanReport`. When in year view, the toolbar is hidden. This is intentional — the year view is for reviewing/presenting. Editing and data management belongs in the byggdel view. If you want the toolbar visible in both views, extract it from MaintenancePlanReport into MaintenancePlanPage. That's a follow-up task.

**Step 4: Verify it compiles and renders**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`
Run: `npm start` (manual check — open admin, go to maintenance plan, verify toggle works)

**Step 5: Commit**

```bash
git add src/pages/admin/MaintenancePlanPage.tsx
git commit -m "feat: add view toggle between Byggdel and År-för-år views"
```

---

### Task 4: Run all tests and verify

**Step 1: Run the full test suite**

Run: `npx react-scripts test --watchAll=false`
Expected: All tests pass, no regressions.

**Step 2: If any test fails, fix it**

**Step 3: Final commit if anything was fixed**

```bash
git add -A
git commit -m "fix: resolve test regressions from year view feature"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | `groupItemsByYear` helper + tests | `maintenancePlanHelpers.ts`, test file |
| 2 | `MaintenancePlanYearView` component | New component file |
| 3 | View toggle in page | `MaintenancePlanPage.tsx` |
| 4 | Full test run | Verification only |

**Total new code:** ~300 lines (component) + ~50 lines (helper) + ~60 lines (tests) + ~20 lines (page changes)

**No changes to:** data model, database, services, existing components
