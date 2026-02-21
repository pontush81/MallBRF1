# "Lägg till åtgärd i [år]" Dialog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dialog in the year-by-year view that lets board members quickly add maintenance actions to a specific year, with smart suggestions from existing items.

**Architecture:** New `AddActionDialog` component with 3-block single-view form (sektion → byggdel → åtgärd+belopp). Two new helper functions: `getSectionsAndSubsections` to extract the section/subsection tree, and `getActionSuggestions` to build template suggestions from existing items. The dialog integrates into `MaintenancePlanYearView` via a "+" button in each year accordion.

**Tech Stack:** React 18 + TypeScript, MUI v5 (Dialog, Autocomplete, Chip), localStorage for "senast använda", uuid for new row IDs

---

### Task 1: Add helper functions for dialog data

**Files:**
- Modify: `src/components/maintenance/maintenancePlanHelpers.ts` (append)
- Test: `src/__tests__/maintenance/maintenancePlanHelpers.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/__tests__/maintenance/maintenancePlanHelpers.test.ts`:

```typescript
import {
  // ... add to existing import:
  getSectionsAndSubsections,
  getActionSuggestions,
} from '../../components/maintenance/maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// getSectionsAndSubsections
// ---------------------------------------------------------------------------

describe('getSectionsAndSubsections', () => {
  it('extracts sections with their subsections', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub1a', rowType: 'subsection', byggdel: 'Fasader' }),
      makeRow({ id: 'item1', atgard: 'Målning', year_2026: 25000 }),
      makeRow({ id: 'sub1b', rowType: 'subsection', byggdel: 'Fönster' }),
      makeRow({ id: 'sec2', rowType: 'section', nr: '2', byggdel: 'Invändigt' }),
      makeRow({ id: 'sub2a', rowType: 'subsection', byggdel: 'Tvättstuga' }),
      ...makeSummaryRows(),
    ];

    const result = getSectionsAndSubsections(rows);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('sec1');
    expect(result[0].label).toBe('1. Utvändigt');
    expect(result[0].subsections).toHaveLength(2);
    expect(result[0].subsections[0]).toEqual({ id: 'sub1a', label: 'Fasader' });
    expect(result[0].subsections[1]).toEqual({ id: 'sub1b', label: 'Fönster' });
    expect(result[1].subsections).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getActionSuggestions
// ---------------------------------------------------------------------------

describe('getActionSuggestions', () => {
  it('returns unique suggestions from existing items', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub1', rowType: 'subsection', byggdel: 'Fasader' }),
      makeRow({ id: 'a', atgard: 'Målning', byggdel: 'Sophus', year_2026: 25000, tek_livslangd: '10 år' }),
      makeRow({ id: 'b', atgard: 'Plåtarbeten', byggdel: 'Ventilationsintag', year_2028: 88000 }),
      ...makeSummaryRows(),
    ];

    const result = getActionSuggestions(rows);
    expect(result).toHaveLength(2);
    expect(result[0].atgard).toBe('Målning');
    expect(result[0].byggdel).toBe('Sophus');
    expect(result[0].sectionId).toBe('sec1');
    expect(result[0].subsectionId).toBe('sub1');
    expect(result[0].amount).toBe(25000);
    expect(result[0].latestYear).toBe('2026');
    expect(result[0].tek_livslangd).toBe('10 år');
  });

  it('deduplicates by atgard+byggdel keeping latest year', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub1', rowType: 'subsection', byggdel: 'Fasader' }),
      makeRow({ id: 'a', atgard: 'Målning', byggdel: 'Sophus', year_2026: 20000, year_2028: 25000 }),
      ...makeSummaryRows(),
    ];

    const result = getActionSuggestions(rows);
    expect(result).toHaveLength(1);
    expect(result[0].latestYear).toBe('2028');
    expect(result[0].amount).toBe(25000); // amount from latest year
  });

  it('filters by subsectionId when provided', () => {
    const rows: PlanRow[] = [
      makeRow({ id: 'sec1', rowType: 'section', nr: '1', byggdel: 'Utvändigt' }),
      makeRow({ id: 'sub1', rowType: 'subsection', byggdel: 'Fasader' }),
      makeRow({ id: 'a', atgard: 'Målning', byggdel: 'Sophus', year_2026: 25000 }),
      makeRow({ id: 'sub2', rowType: 'subsection', byggdel: 'Fönster' }),
      makeRow({ id: 'b', atgard: 'Byte fönster', byggdel: 'Fönster', year_2028: 330000 }),
      ...makeSummaryRows(),
    ];

    const filtered = getActionSuggestions(rows, 'sub1');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].atgard).toBe('Målning');

    const all = getActionSuggestions(rows);
    expect(all).toHaveLength(2);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx react-scripts test --watchAll=false --testPathPattern maintenancePlanHelpers`
Expected: FAIL — functions not exported

**Step 3: Write minimal implementation**

Append to `src/components/maintenance/maintenancePlanHelpers.ts`:

```typescript
// ---------------------------------------------------------------------------
// Add-action dialog helpers
// ---------------------------------------------------------------------------

export interface SectionInfo {
  id: string;
  label: string;  // e.g. "1. Utvändigt"
  subsections: { id: string; label: string }[];
}

/** Extract sections and their subsections from plan rows. */
export function getSectionsAndSubsections(rows: PlanRow[]): SectionInfo[] {
  const sections: SectionInfo[] = [];
  let current: SectionInfo | null = null;

  for (const r of rows) {
    if (r.rowType === 'section') {
      if (current) sections.push(current);
      current = {
        id: r.id,
        label: r.nr ? `${r.nr}. ${r.byggdel}` : r.byggdel,
        subsections: [],
      };
    } else if (r.rowType === 'subsection' && current) {
      current.subsections.push({ id: r.id, label: r.byggdel });
    }
  }
  if (current) sections.push(current);

  return sections;
}

export interface ActionSuggestion {
  atgard: string;
  byggdel: string;
  sectionId: string;
  subsectionId: string;
  amount: number;
  latestYear: string;
  tek_livslangd: string;
  utredningspunkter: string;
}

/** Build template suggestions from existing item rows. Optionally filter by subsectionId. */
export function getActionSuggestions(rows: PlanRow[], subsectionId?: string): ActionSuggestion[] {
  let currentSectionId = '';
  let currentSubsectionId = '';

  // First pass: build context map (sectionId, subsectionId per item)
  const items: { row: PlanRow; sectionId: string; subsectionId: string }[] = [];
  for (const r of rows) {
    if (r.rowType === 'section') currentSectionId = r.id;
    else if (r.rowType === 'subsection') currentSubsectionId = r.id;
    else if (r.rowType === 'item') {
      items.push({ row: r, sectionId: currentSectionId, subsectionId: currentSubsectionId });
    }
  }

  // Filter by subsectionId if provided
  const filtered = subsectionId ? items.filter(i => i.subsectionId === subsectionId) : items;

  // Deduplicate by atgard+byggdel, keep latest year info
  const map = new Map<string, ActionSuggestion>();
  for (const { row, sectionId, subsectionId: subId } of filtered) {
    const key = `${row.atgard}|${row.byggdel}`;

    // Find latest year with a cost
    let latestYear = '';
    let latestAmount = 0;
    for (const yc of YEAR_COLUMNS) {
      const val = row[yc];
      if (typeof val === 'number' && val > 0) {
        latestYear = yc.replace('year_', '');
        latestAmount = val;
      }
    }

    const existing = map.get(key);
    if (!existing || (latestYear && latestYear > (existing.latestYear || ''))) {
      map.set(key, {
        atgard: row.atgard,
        byggdel: row.byggdel,
        sectionId,
        subsectionId: subId,
        amount: latestAmount,
        latestYear,
        tek_livslangd: row.tek_livslangd,
        utredningspunkter: row.utredningspunkter,
      });
    }
  }

  return Array.from(map.values());
}
```

**Step 4: Run tests to verify they pass**

Run: `npx react-scripts test --watchAll=false --testPathPattern maintenancePlanHelpers`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/maintenance/maintenancePlanHelpers.ts src/__tests__/maintenance/maintenancePlanHelpers.test.ts
git commit -m "feat: add getSectionsAndSubsections and getActionSuggestions helpers

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create AddActionDialog component

**Files:**
- Create: `src/components/maintenance/AddActionDialog.tsx`

**Step 1: Create the component**

The dialog has 3 blocks in a single view:
1. **Sektion** — chips (with "Senast använda" first from localStorage)
2. **Byggdel** — chip list (disabled until sektion chosen, with "Senast använda" first)
3. **Åtgärd + Belopp** — Autocomplete with rich suggestions + amount field (disabled until byggdel chosen)

Key behaviors:
- localStorage key `'mp_recent_section'` stores last used section id
- localStorage key `'mp_recent_subsection'` stores last used subsection id
- When user types in Autocomplete and selects an existing suggestion → auto-fills sektion+byggdel (Genväg B), plus amount, tek_livslangd, utredningspunkter
- Shows "Skapar ny åtgärd baserad på: [name] ([year])" when using a template
- "Lägg till" button creates the row and calls `onAdd` callback

```tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  TextField,
  Autocomplete,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  getSectionsAndSubsections,
  getActionSuggestions,
  SectionInfo,
  ActionSuggestion,
} from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddActionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with: subsectionId to insert after, the new PlanRow fields, and the target yearCol */
  onAdd: (parentRowId: string, fields: Partial<PlanRow>, yearCol: string) => void;
  rows: PlanRow[];
  targetYear: string; // e.g. 'year_2027'
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const LS_SECTION = 'mp_recent_section';
const LS_SUBSECTION = 'mp_recent_subsection';

function getRecent(key: string): string {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}

function setRecent(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function fmtKr(amount: number): string {
  if (!amount) return '';
  return amount.toLocaleString('sv-SE') + ' kr';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddActionDialog: React.FC<AddActionDialogProps> = ({
  open,
  onClose,
  onAdd,
  rows,
  targetYear,
}) => {
  const yearLabel = targetYear.replace('year_', '');

  // Block 1: Sektion
  const [selectedSection, setSelectedSection] = useState<string>('');
  // Block 2: Byggdel (subsection)
  const [selectedSubsection, setSelectedSubsection] = useState<string>('');
  // Block 3: Åtgärd
  const [atgardValue, setAtgardValue] = useState<string>('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<ActionSuggestion | null>(null);
  const [amount, setAmount] = useState<string>('');

  // Derived data
  const sections = useMemo(() => getSectionsAndSubsections(rows), [rows]);
  const allSuggestions = useMemo(() => getActionSuggestions(rows), [rows]);
  const filteredSuggestions = useMemo(
    () => selectedSubsection ? getActionSuggestions(rows, selectedSubsection) : allSuggestions,
    [rows, selectedSubsection, allSuggestions],
  );

  // Current section's subsections
  const currentSubsections = useMemo(
    () => sections.find(s => s.id === selectedSection)?.subsections || [],
    [sections, selectedSection],
  );

  // Recent IDs
  const recentSectionId = getRecent(LS_SECTION);
  const recentSubsectionId = getRecent(LS_SUBSECTION);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const recentSec = getRecent(LS_SECTION);
      const recentSub = getRecent(LS_SUBSECTION);
      // Pre-select recent section if it exists
      if (recentSec && sections.some(s => s.id === recentSec)) {
        setSelectedSection(recentSec);
        // Pre-select recent subsection if it belongs to this section
        const sec = sections.find(s => s.id === recentSec);
        if (sec && recentSub && sec.subsections.some(sub => sub.id === recentSub)) {
          setSelectedSubsection(recentSub);
        } else {
          setSelectedSubsection('');
        }
      } else {
        setSelectedSection('');
        setSelectedSubsection('');
      }
      setAtgardValue('');
      setSelectedSuggestion(null);
      setAmount('');
    }
  }, [open, sections]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedSubsection('');
    setRecent(LS_SECTION, sectionId);
  };

  const handleSelectSubsection = (subsectionId: string) => {
    setSelectedSubsection(subsectionId);
    setRecent(LS_SUBSECTION, subsectionId);
  };

  const handleSuggestionSelect = (suggestion: ActionSuggestion | null) => {
    setSelectedSuggestion(suggestion);
    if (suggestion) {
      setAtgardValue(suggestion.atgard);
      setAmount(suggestion.amount ? String(suggestion.amount) : '');
      // Genväg B: auto-fill section + subsection
      if (suggestion.sectionId) {
        setSelectedSection(suggestion.sectionId);
        setRecent(LS_SECTION, suggestion.sectionId);
      }
      if (suggestion.subsectionId) {
        setSelectedSubsection(suggestion.subsectionId);
        setRecent(LS_SUBSECTION, suggestion.subsectionId);
      }
    }
  };

  const handleAdd = () => {
    if (!selectedSubsection || !atgardValue.trim()) return;

    const parsedAmount = amount.trim()
      ? Math.round(parseFloat(amount.replace(/\s/g, '').replace(',', '.')))
      : null;

    const fields: Partial<PlanRow> = {
      atgard: atgardValue.trim(),
      byggdel: selectedSuggestion?.byggdel || '',
      tek_livslangd: selectedSuggestion?.tek_livslangd || '',
      utredningspunkter: selectedSuggestion?.utredningspunkter || '',
    };

    onAdd(selectedSubsection, fields, targetYear);

    // If we have an amount, it gets set via the yearCol in onAdd
    // The parent handler will use parsedAmount from the fields
    // Actually — we need to pass amount separately. Let's put it in the year field.
    // Modify: pass the amount as part of fields using the yearCol key
    const fieldsWithYear: Partial<PlanRow> = {
      ...fields,
      [targetYear]: parsedAmount,
    };

    onAdd(selectedSubsection, fieldsWithYear, targetYear);
    onClose();
  };

  // Validation
  const canAdd = selectedSection && selectedSubsection && atgardValue.trim();

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  /** Sort items with recent first */
  const sortWithRecent = <T extends { id: string }>(items: T[], recentId: string): T[] => {
    if (!recentId) return items;
    const recent = items.find(i => i.id === recentId);
    if (!recent) return items;
    return [recent, ...items.filter(i => i.id !== recentId)];
  };

  const sortedSections = sortWithRecent(sections, recentSectionId);
  const sortedSubsections = sortWithRecent(currentSubsections, recentSubsectionId);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Lägg till åtgärd i {yearLabel}
      </DialogTitle>

      <DialogContent>
        {/* Block 1: Sektion */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            1. Sektion
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {sortedSections.map((sec, i) => (
              <Chip
                key={sec.id}
                label={sec.label}
                onClick={() => handleSelectSection(sec.id)}
                color={selectedSection === sec.id ? 'primary' : 'default'}
                variant={selectedSection === sec.id ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: selectedSection === sec.id ? 700 : 400,
                  ...(i === 0 && sec.id === recentSectionId && selectedSection !== sec.id
                    ? { borderColor: 'primary.light' }
                    : {}),
                }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Block 2: Byggdel */}
        <Box sx={{ mb: 3, opacity: selectedSection ? 1 : 0.4, pointerEvents: selectedSection ? 'auto' : 'none' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            2. Byggdel
          </Typography>
          {currentSubsections.length === 0 ? (
            <Typography variant="body2" color="text.disabled">
              {selectedSection ? 'Ingen byggdel i denna sektion' : 'Välj sektion först'}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {sortedSubsections.map((sub, i) => (
                <Chip
                  key={sub.id}
                  label={sub.label}
                  onClick={() => handleSelectSubsection(sub.id)}
                  color={selectedSubsection === sub.id ? 'primary' : 'default'}
                  variant={selectedSubsection === sub.id ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: selectedSubsection === sub.id ? 700 : 400,
                    ...(i === 0 && sub.id === recentSubsectionId && selectedSubsection !== sub.id
                      ? { borderColor: 'primary.light' }
                      : {}),
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Block 3: Åtgärd + Belopp */}
        <Box sx={{ opacity: selectedSubsection ? 1 : 0.4, pointerEvents: selectedSubsection ? 'auto' : 'none' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            3. Åtgärd &amp; belopp
          </Typography>

          {/* Autocomplete for åtgärd */}
          <Autocomplete
            freeSolo
            options={filteredSuggestions}
            getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.atgard}
            inputValue={atgardValue}
            onInputChange={(_, val) => setAtgardValue(val)}
            onChange={(_, val) => {
              if (val && typeof val !== 'string') {
                handleSuggestionSelect(val);
              } else {
                setSelectedSuggestion(null);
              }
            }}
            renderOption={(props, opt) => (
              <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  {opt.atgard}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {opt.byggdel}
                  </Typography>
                  {opt.latestYear && (
                    <Typography variant="caption" color="text.secondary">
                      Senast: {opt.latestYear}
                    </Typography>
                  )}
                  {opt.amount > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {fmtKr(opt.amount)}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Sök eller skriv ny åtgärd..."
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />

          {/* Template info */}
          {selectedSuggestion && (
            <Typography variant="caption" color="primary.main" sx={{ mb: 2, display: 'block' }}>
              Skapar ny åtgärd baserad på: {selectedSuggestion.atgard}
              {selectedSuggestion.byggdel ? ` – ${selectedSuggestion.byggdel}` : ''}
              {selectedSuggestion.latestYear ? ` (${selectedSuggestion.latestYear})` : ''}
            </Typography>
          )}

          {/* Belopp */}
          <TextField
            label={`Belopp ${yearLabel} (kr)`}
            size="small"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="t.ex. 60000"
            fullWidth
            inputProps={{ inputMode: 'numeric' }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!canAdd}
          startIcon={<AddIcon />}
        >
          Lägg till i {yearLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddActionDialog;
```

**Important fix:** The `handleAdd` function above has a bug — it calls `onAdd` twice. The correct version should be:

```typescript
const handleAdd = () => {
  if (!selectedSubsection || !atgardValue.trim()) return;

  const parsedAmount = amount.trim()
    ? Math.round(parseFloat(amount.replace(/\s/g, '').replace(',', '.')))
    : null;

  const fields: Partial<PlanRow> = {
    atgard: atgardValue.trim(),
    byggdel: selectedSuggestion?.byggdel || '',
    tek_livslangd: selectedSuggestion?.tek_livslangd || '',
    utredningspunkter: selectedSuggestion?.utredningspunkter || '',
    [targetYear]: parsedAmount,
  };

  onAdd(selectedSubsection, fields, targetYear);
  onClose();
};
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/maintenance/AddActionDialog.tsx
git commit -m "feat: add AddActionDialog component with smart suggestions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Integrate dialog into MaintenancePlanYearView

**Files:**
- Modify: `src/components/maintenance/MaintenancePlanYearView.tsx`

**Step 1: Add imports**

```typescript
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material'; // add Button to existing MUI import
import { v4 as uuidv4 } from 'uuid';
import AddActionDialog from './AddActionDialog';
```

**Step 2: Add state and handler**

Inside the component, after existing state declarations:

```typescript
// Add action dialog
const [addDialogOpen, setAddDialogOpen] = useState(false);
const [addDialogYear, setAddDialogYear] = useState<string>('');

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
```

**Step 3: Add "Lägg till" button inside each year accordion**

In the `renderYearAccordion` function, inside the expanded content, add a button after the items table. Find the `<Collapse>` section and add:

```tsx
{/* Inside Collapse, after the Table */}
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
```

Also add the button for empty years (when `isEmpty` is true), replacing the "Inga planerade åtgärder" text:

```tsx
{group.items.length === 0 ? (
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
  // existing table + add button
)}
```

**Step 4: Render dialog at end of component**

Before the closing `</Box>` in the return:

```tsx
{/* Add action dialog */}
<AddActionDialog
  open={addDialogOpen}
  onClose={() => setAddDialogOpen(false)}
  onAdd={handleAddAction}
  rows={rows}
  targetYear={addDialogYear}
/>
```

**Step 5: Enable clicking on empty years**

Currently empty years have `cursor: 'default'` and don't toggle. Update `renderYearAccordion`: remove the `!isEmpty &&` guard on `onClick` so empty years can also expand (to show the "Lägg till" button):

Change: `onClick={() => !isEmpty && toggleYear(yg.yearCol)}`
To: `onClick={() => toggleYear(yg.yearCol)}`

And update cursor: `cursor: 'pointer'` (remove the isEmpty check).

**Step 6: Verify it compiles**

Run: `npx tsc --noEmit --skipLibCheck 2>&1 | head -20`

**Step 7: Commit**

```bash
git add src/components/maintenance/MaintenancePlanYearView.tsx
git commit -m "feat: integrate AddActionDialog into year view with add buttons

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Run all tests and verify

**Step 1: Run the full test suite**

Run: `npx react-scripts test --watchAll=false --testPathPattern maintenance`
Expected: All maintenance tests pass.

**Step 2: Manual verification**

Run: `npm start`
Verify:
1. Switch to "År för år" view
2. Expand a year → see "Lägg till åtgärd i [år]" button at bottom
3. Click it → dialog opens with 3 blocks
4. Section chips: recent shown with highlighted border
5. Pick section → byggdel list populates
6. Pick byggdel → åtgärd autocomplete enables
7. Type → suggestions appear with name, byggdel, year, amount
8. Select suggestion → auto-fills section+byggdel+amount+name
9. Click "Lägg till" → item appears in the year list
10. Expand an empty year → shows "Lägg till" button

**Step 3: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve issues found during manual testing

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Helper functions + tests | `maintenancePlanHelpers.ts`, test file |
| 2 | `AddActionDialog` component | New component |
| 3 | Integration into year view | `MaintenancePlanYearView.tsx` |
| 4 | Tests + manual verification | Verification |

**Total new code:** ~350 lines (dialog) + ~100 lines (helpers) + ~80 lines (tests) + ~60 lines (integration)

**No changes to:** data model, database, services, MaintenancePlanReport, MaintenancePlanPage
