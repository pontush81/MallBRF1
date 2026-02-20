# Excel-import & Rapportvy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Handsontable spreadsheet with a read-only MUI report table with inline-edit and status chips, add Excel import, and remove Handsontable dependencies.

**Architecture:** The app keeps the same Supabase-backed `PlanRow[]` data model, extended with a `status` field. The "Detaljerad plan" tab replaces HotTable with a grouped MUI table. A new Excel import service parses uploaded `.xlsx` files into `PlanRow[]`. The dashboard filters out completed items.

**Tech Stack:** React 18, MUI v5, TypeScript, xlsx library (already installed), Supabase.

---

### Task 1: Add `status` field to PlanRow

**Files:**
- Modify: `src/services/maintenancePlanService.ts:8-33`
- Modify: `src/data/maintenancePlanSeedData.ts:7-30`

**Step 1: Add status type and field to PlanRow**

In `src/services/maintenancePlanService.ts`, add the status type and field:

```typescript
// After line 8 (export type RowType = ...)
export type PlanRowStatus = 'planned' | 'in_progress' | 'completed' | 'postponed';
```

Add to the `PlanRow` interface after `isLocked: boolean;`:

```typescript
  status: PlanRowStatus;
```

**Step 2: Update seed data default row factory**

In `src/data/maintenancePlanSeedData.ts`, add `status: 'planned'` to the default row factory (the `row()` function, after `isLocked: false`):

```typescript
    status: 'planned',
```

**Step 3: Verify build compiles**

Run: `cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1 && npx craco build 2>&1 | tail -20`

This will show type errors for existing code that doesn't handle the new field — that's expected and gets fixed in later tasks.

**Step 4: Commit**

```bash
git add src/services/maintenancePlanService.ts src/data/maintenancePlanSeedData.ts
git commit -m "feat: add status field to PlanRow data model"
```

---

### Task 2: Build Excel import service

**Files:**
- Create: `src/services/excelImportService.ts`

**Step 1: Create the import service**

Create `src/services/excelImportService.ts`:

```typescript
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { PlanRow, PlanRowStatus, RowType, YEAR_COLUMNS } from './maintenancePlanService';

// Common column name variants that map to PlanRow fields
const COLUMN_ALIASES: Record<string, keyof PlanRow> = {};
const NR_ALIASES = ['nr', 'pos', '#', 'nummer', 'position'];
const BYGGDEL_ALIASES = ['byggdel', 'komponent', 'del', 'byggnadsdel', 'objekt'];
const ATGARD_ALIASES = ['åtgärd', 'atgard', 'aktivitet', 'beskrivning', 'åtgärdsbeskrivning'];
const LIVSLANGD_ALIASES = ['livslängd', 'tek livslängd', 'teknisk livslängd', 'tek_livslangd'];
const APRIS_ALIASES = ['a-pris', 'apris', 'à-pris', 'styckpris', 'enhetspris'];
const ANTAL_ALIASES = ['antal', 'st', 'mängd', 'kvantitet'];
const UTREDN_ALIASES = ['utredningspunkter', 'notering', 'anmärkning', 'kommentar', 'not'];

// Populate the alias map
for (const alias of NR_ALIASES) COLUMN_ALIASES[alias] = 'nr';
for (const alias of BYGGDEL_ALIASES) COLUMN_ALIASES[alias] = 'byggdel';
for (const alias of ATGARD_ALIASES) COLUMN_ALIASES[alias] = 'atgard';
for (const alias of LIVSLANGD_ALIASES) COLUMN_ALIASES[alias] = 'tek_livslangd';
for (const alias of APRIS_ALIASES) COLUMN_ALIASES[alias] = 'a_pris';
for (const alias of ANTAL_ALIASES) COLUMN_ALIASES[alias] = 'antal';
for (const alias of UTREDN_ALIASES) COLUMN_ALIASES[alias] = 'utredningspunkter';

export interface ImportResult {
  rows: PlanRow[];
  sectionCount: number;
  itemCount: number;
  yearRange: [number, number] | null;
  warnings: string[];
}

/**
 * Parse an Excel file (ArrayBuffer) into PlanRow[].
 * Returns an ImportResult with parsed rows and metadata.
 */
export function parseExcelFile(buffer: ArrayBuffer): ImportResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], sectionCount: 0, itemCount: 0, yearRange: null, warnings: ['Ingen flik hittades i filen'] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Find the header row (the one with year columns)
  const { headerRowIdx, columnMap, yearColumns } = findHeaderRow(rawData);

  const warnings: string[] = [];
  if (headerRowIdx < 0) {
    warnings.push('Kunde inte hitta kolumnrubriker med årtal i filen');
    return { rows: [], sectionCount: 0, itemCount: 0, yearRange: null, warnings };
  }

  // Parse data rows (everything after header)
  const rows: PlanRow[] = [];
  let sectionCount = 0;
  let itemCount = 0;
  let sortIdx = 0;

  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const rawRow = rawData[i];
    if (!rawRow || rawRow.every(cell => cell === null || cell === '' || cell === undefined)) continue;

    const parsed = parseRow(rawRow, columnMap, yearColumns);
    if (!parsed) continue;

    parsed.sortIndex = sortIdx++;

    if (parsed.rowType === 'section') sectionCount++;
    if (parsed.rowType === 'item') itemCount++;

    rows.push(parsed);
  }

  // Add summary rows if not present
  const hasSummary = rows.some(r => r.rowType === 'summary');
  if (!hasSummary) {
    rows.push(makeSummaryRow('Summa beräknad kostnad', '', sortIdx++));
    rows.push(makeSummaryRow('Osäkerhet', '10%', sortIdx++));
    rows.push(makeSummaryRow('Totalt inkl moms', '', sortIdx++));
  }

  // Determine year range from yearColumns
  const years = yearColumns.map(yc => parseInt(yc.replace('year_', '')));
  const yearRange: [number, number] | null = years.length > 0
    ? [Math.min(...years), Math.max(...years)]
    : null;

  return { rows, sectionCount, itemCount, yearRange, warnings };
}

// --- Internal helpers ---

interface HeaderInfo {
  headerRowIdx: number;
  columnMap: Map<keyof PlanRow, number>;
  yearColumns: { colIdx: number; yearKey: string }[];
}

function findHeaderRow(data: unknown[][]): HeaderInfo {
  const empty: HeaderInfo = { headerRowIdx: -1, columnMap: new Map(), yearColumns: [] };

  for (let rowIdx = 0; rowIdx < Math.min(data.length, 15); rowIdx++) {
    const row = data[rowIdx];
    if (!row) continue;

    const yearCols: { colIdx: number; yearKey: string }[] = [];
    const colMap = new Map<keyof PlanRow, number>();

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = row[colIdx];
      if (cell === null || cell === undefined) continue;

      const cellStr = String(cell).trim();

      // Check for year columns (2020-2045)
      const yearMatch = cellStr.match(/^(20[2-4]\d)$/);
      if (yearMatch) {
        const yearNum = parseInt(yearMatch[1]);
        const yearKey = `year_${yearNum}`;
        // Only include years that exist in our YEAR_COLUMNS constant
        if (YEAR_COLUMNS.includes(yearKey as any)) {
          yearCols.push({ colIdx, yearKey });
        }
      }

      // Check for named columns
      const normalized = cellStr.toLowerCase().replace(/[_\-]/g, ' ').trim();
      const mapped = COLUMN_ALIASES[normalized];
      if (mapped) {
        colMap.set(mapped, colIdx);
      }
    }

    // We found the header row if it has at least 2 year columns
    if (yearCols.length >= 2) {
      return { headerRowIdx: rowIdx, columnMap: colMap, yearColumns: yearCols };
    }
  }

  return empty;
}

function parseRow(
  rawRow: unknown[],
  columnMap: Map<keyof PlanRow, number>,
  yearColumns: { colIdx: number; yearKey: string }[],
): PlanRow | null {
  // Determine row type by looking at content
  const nrCol = columnMap.get('nr');
  const byggdelCol = columnMap.get('byggdel');
  const atgardCol = columnMap.get('atgard');

  const nr = nrCol !== undefined ? String(rawRow[nrCol] ?? '').trim() : '';
  const byggdel = byggdelCol !== undefined ? String(rawRow[byggdelCol] ?? '').trim() : '';
  const atgard = atgardCol !== undefined ? String(rawRow[atgardCol] ?? '').trim() : '';

  // Check if any year columns have values
  let hasYearValues = false;
  for (const { colIdx } of yearColumns) {
    const val = rawRow[colIdx];
    if (typeof val === 'number' && val > 0) { hasYearValues = true; break; }
  }

  // Check for summary row keywords
  const combinedText = `${byggdel} ${atgard}`.toLowerCase();
  if (combinedText.includes('summa') || combinedText.includes('totalt') || combinedText.includes('osäkerhet')) {
    return makeSummaryRow(byggdel || atgard, atgard, 0);
  }

  // Determine row type
  let rowType: RowType;
  let indentLevel: number;
  let isLocked: boolean;

  if (!nr && !atgard && !hasYearValues && byggdel) {
    // Only has byggdel text = likely a section header
    rowType = 'section';
    indentLevel = 0;
    isLocked = true;
  } else if (nr && !atgard && !hasYearValues) {
    // Has nr but no action/costs = likely a section or subsection
    const dotCount = (nr.match(/\./g) || []).length;
    if (dotCount === 0) {
      rowType = 'section';
      indentLevel = 0;
    } else {
      rowType = 'subsection';
      indentLevel = 1;
    }
    isLocked = true;
  } else if (nr) {
    const dotCount = (nr.match(/\./g) || []).length;
    if (dotCount === 0 && !hasYearValues && !atgard) {
      rowType = 'section';
      indentLevel = 0;
      isLocked = true;
    } else if (dotCount >= 1 && !hasYearValues && !atgard) {
      rowType = 'subsection';
      indentLevel = 1;
      isLocked = true;
    } else {
      rowType = 'item';
      indentLevel = 2;
      isLocked = false;
    }
  } else if (hasYearValues || atgard) {
    rowType = 'item';
    indentLevel = 2;
    isLocked = false;
  } else {
    // Blank or unrecognized
    return null;
  }

  // Build PlanRow
  const row: PlanRow = {
    id: uuidv4(),
    rowType,
    nr,
    byggdel,
    atgard,
    tek_livslangd: getStringField(rawRow, columnMap, 'tek_livslangd'),
    a_pris: getNumericField(rawRow, columnMap, 'a_pris'),
    antal: getNumericField(rawRow, columnMap, 'antal'),
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
    utredningspunkter: getStringField(rawRow, columnMap, 'utredningspunkter'),
    sortIndex: 0,
    indentLevel,
    isLocked,
    status: 'planned' as PlanRowStatus,
  };

  // Set year values
  for (const { colIdx, yearKey } of yearColumns) {
    const val = rawRow[colIdx];
    if (typeof val === 'number' && val > 0) {
      (row as any)[yearKey] = val;
    }
  }

  return row;
}

function getStringField(rawRow: unknown[], columnMap: Map<keyof PlanRow, number>, field: keyof PlanRow): string {
  const colIdx = columnMap.get(field);
  if (colIdx === undefined) return '';
  const val = rawRow[colIdx];
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function getNumericField(rawRow: unknown[], columnMap: Map<keyof PlanRow, number>, field: keyof PlanRow): number | null {
  const colIdx = columnMap.get(field);
  if (colIdx === undefined) return null;
  const val = rawRow[colIdx];
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/\s/g, '').replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function makeSummaryRow(byggdel: string, atgard: string, sortIndex: number): PlanRow {
  return {
    id: uuidv4(),
    rowType: 'summary',
    nr: '',
    byggdel,
    atgard,
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
    sortIndex,
    indentLevel: 0,
    isLocked: true,
    status: 'planned' as PlanRowStatus,
  };
}
```

**Step 2: Verify the file compiles**

Run: `cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1 && npx tsc --noEmit src/services/excelImportService.ts 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/services/excelImportService.ts
git commit -m "feat: add Excel import service with smart column mapping"
```

---

### Task 3: Build the ExcelImportDialog component

**Files:**
- Create: `src/components/maintenance/ExcelImportDialog.tsx`

**Step 1: Create the dialog component**

Create `src/components/maintenance/ExcelImportDialog.tsx`:

```typescript
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { parseExcelFile, ImportResult } from '../../services/excelImportService';
import { PlanRow } from '../../services/maintenancePlanService';

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: PlanRow[]) => void;
}

const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({ open, onClose, onImport }) => {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelFile(buffer);

      if (parsed.rows.length === 0) {
        setError(parsed.warnings.join('. ') || 'Kunde inte parsa filen. Kontrollera att den har rätt format.');
      } else {
        setResult(parsed);
      }
    } catch (err) {
      setError('Kunde inte läsa filen. Kontrollera att det är en giltig Excel-fil (.xlsx).');
      console.error('Excel import error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = useCallback(() => {
    if (result) {
      onImport(result.rows);
      setResult(null);
      onClose();
    }
  }, [result, onImport, onClose]);

  const handleClose = useCallback(() => {
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Importera underhållsplan från Excel</DialogTitle>
      <DialogContent>
        {!result && !loading && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Välj en Excel-fil (.xlsx) med din underhållsplan. Filen bör innehålla kolumner för
              byggdel, åtgärd och årskostnader (2026–2035).
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUploadIcon />}
            >
              Välj Excel-fil
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ py: 1 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Filen parsades framgångsrikt!
            </Alert>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{result.sectionCount}</strong> sektioner, <strong>{result.itemCount}</strong> åtgärdsposter
            </Typography>
            {result.yearRange && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                Årsperiod: <strong>{result.yearRange[0]}–{result.yearRange[1]}</strong>
              </Typography>
            )}
            {result.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {result.warnings.join('. ')}
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Importen skapar en ny version. Den befintliga planen finns kvar i versionshistoriken.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Avbryt</Button>
        {result && (
          <Button variant="contained" onClick={handleImport}>
            Importera {result.itemCount} poster
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExcelImportDialog;
```

**Step 2: Commit**

```bash
git add src/components/maintenance/ExcelImportDialog.tsx
git commit -m "feat: add Excel import dialog with preview"
```

---

### Task 4: Build the MaintenancePlanReport component

This is the main component that replaces HotTable with a grouped MUI table.

**Files:**
- Create: `src/components/maintenance/MaintenancePlanReport.tsx`

**Step 1: Create the report table component**

Create `src/components/maintenance/MaintenancePlanReport.tsx`:

```typescript
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
  TableContainer,
  TableRow,
  Collapse,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import * as XLSX from 'xlsx';

import {
  PlanRow,
  PlanVersion,
  PlanRowStatus,
  YEAR_COLUMNS,
  getAllVersions,
} from '../../services/maintenancePlanService';
import {
  COLUMN_HEADERS,
  FIELD_KEYS,
  computeRowTotal,
  recalcSummaryRows,
  buildByggdelMap,
} from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Types
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

// Status display config
const STATUS_CONFIG: Record<PlanRowStatus, { label: string; color: 'default' | 'info' | 'success' | 'warning' }> = {
  planned: { label: '–', color: 'default' },
  in_progress: { label: 'Pågår', color: 'info' },
  completed: { label: 'Utförd', color: 'success' },
  postponed: { label: 'Uppskjuten', color: 'warning' },
};

// ---------------------------------------------------------------------------
// Helper: format kr
// ---------------------------------------------------------------------------

function fmtKr(amount: number | null): string {
  if (!amount) return '–';
  return amount.toLocaleString('sv-SE') + ' kr';
}

function fmtTkr(amount: number): string {
  if (!amount) return '–';
  return Math.round(amount / 1000).toLocaleString('sv-SE') + ' tkr';
}

// ---------------------------------------------------------------------------
// Helper: get the primary year and amount for an item row
// ---------------------------------------------------------------------------

function getPrimaryYearCost(row: PlanRow): { year: string; amount: number } | null {
  for (const yc of YEAR_COLUMNS) {
    const val = row[yc];
    if (typeof val === 'number' && val > 0) {
      return { year: yc.replace('year_', ''), amount: val };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helper: group rows by section
// ---------------------------------------------------------------------------

interface SectionGroup {
  section: PlanRow;
  subsections: { subsection: PlanRow | null; items: PlanRow[] }[];
  total: number;
}

function groupRowsBySections(rows: PlanRow[]): { sections: SectionGroup[]; summaryRows: PlanRow[] } {
  const sections: SectionGroup[] = [];
  const summaryRows: PlanRow[] = [];
  let currentSection: SectionGroup | null = null;
  let currentSubItems: PlanRow[] = [];
  let currentSub: PlanRow | null = null;

  for (const r of rows) {
    if (r.rowType === 'summary') {
      summaryRows.push(r);
      continue;
    }
    if (r.rowType === 'blank') continue;

    if (r.rowType === 'section') {
      // Flush current subsection
      if (currentSection) {
        currentSection.subsections.push({ subsection: currentSub, items: currentSubItems });
        sections.push(currentSection);
      }
      currentSection = { section: r, subsections: [], total: 0 };
      currentSub = null;
      currentSubItems = [];
    } else if (r.rowType === 'subsection') {
      if (currentSection) {
        if (currentSub || currentSubItems.length > 0) {
          currentSection.subsections.push({ subsection: currentSub, items: currentSubItems });
        }
        currentSub = r;
        currentSubItems = [];
      }
    } else if (r.rowType === 'item') {
      if (!currentSection) continue;
      currentSubItems.push(r);
      currentSection.total += computeRowTotal(r);
    }
  }

  // Flush final
  if (currentSection) {
    currentSection.subsections.push({ subsection: currentSub, items: currentSubItems });
    sections.push(currentSection);
  }

  return { sections, summaryRows };
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
  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  // Expanded item (shows year details)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [versions, setVersions] = useState<Pick<PlanVersion, 'id' | 'version' | 'created_at' | 'created_by' | 'metadata'>[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const byggdelMap = useMemo(() => buildByggdelMap(rows), [rows]);
  const { sections, summaryRows } = useMemo(() => groupRowsBySections(rows), [rows]);

  // Grand total from summary
  const totaltRow = summaryRows.find(r => r.byggdel === 'Totalt inkl moms');
  const grandTotal = totaltRow ? computeRowTotal(totaltRow) : 0;

  // ---------------------------------------------------------------------------
  // Toggle section collapse
  // ---------------------------------------------------------------------------

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Toggle item expansion (show year details)
  // ---------------------------------------------------------------------------

  const toggleItemExpand = useCallback((itemId: string) => {
    setExpandedItemId(prev => prev === itemId ? null : itemId);
  }, []);

  // ---------------------------------------------------------------------------
  // Inline edit
  // ---------------------------------------------------------------------------

  const startEdit = useCallback((rowId: string, field: string, currentValue: string | number | null) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue !== null ? String(currentValue) : '');
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { rowId, field } = editingCell;

    setRows(prevRows => {
      const newRows = prevRows.map(r => {
        if (r.id !== rowId) return r;
        const updated = { ...r };
        const isNumeric = field.startsWith('year_') || field === 'a_pris' || field === 'antal';

        if (isNumeric) {
          const parsed = parseFloat(editValue.replace(/\s/g, '').replace(',', '.'));
          (updated as any)[field] = isNaN(parsed) ? null : parsed;
        } else {
          (updated as any)[field] = editValue;
        }
        return updated;
      });
      setIsDirty(true);
      return recalcSummaryRows(newRows);
    });

    setEditingCell(null);
  }, [editingCell, editValue, setRows, setIsDirty]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditingCell(null);
  }, [commitEdit]);

  // ---------------------------------------------------------------------------
  // Status change
  // ---------------------------------------------------------------------------

  const handleStatusChange = useCallback((rowId: string, newStatus: PlanRowStatus) => {
    setRows(prevRows => {
      const newRows = prevRows.map(r =>
        r.id === rowId ? { ...r, status: newStatus } : r
      );
      setIsDirty(true);
      return newRows;
    });
  }, [setRows, setIsDirty]);

  // ---------------------------------------------------------------------------
  // Excel export
  // ---------------------------------------------------------------------------

  const handleExportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const wsData: (string | number | null)[][] = [];

    wsData.push(['Underhållsplan 2026\u20132035']);
    wsData.push(['Brf Gulmåran']);
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
          if (val === null || val === undefined) cells.push(null);
          else if (typeof val === 'boolean') cells.push(null);
          else cells.push(val as string | number);
        }
      }
      wsData.push(cells);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
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
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {/* Toolbar */}
      <Paper sx={{ mb: 2 }} elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Button size="small" startIcon={<FileUploadIcon />} onClick={onOpenImport}>
            Importera Excel
          </Button>
          <Button size="small" startIcon={<FileDownloadIcon />} onClick={handleExportExcel}>
            Exportera Excel
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<HistoryIcon />} onClick={handleOpenHistory}>
            Historik
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={isDirty ? 'primary' : 'success'}
            startIcon={
              isSaving
                ? <CircularProgress size={16} color="inherit" />
                : isDirty ? <SaveIcon /> : <CheckIcon />
            }
            onClick={isDirty && !isSaving ? onSave : undefined}
            sx={{ minWidth: 110, ...(!isDirty || isSaving ? { cursor: 'default', pointerEvents: 'none' } : {}) }}
          >
            {isSaving ? 'Sparar...' : isDirty ? 'Spara' : 'Sparad'}
          </Button>
        </Toolbar>
      </Paper>

      {/* Report Table */}
      {sections.map((sg) => (
        <Paper key={sg.section.id} variant="outlined" sx={{ mb: 2 }}>
          {/* Section header */}
          <Box
            onClick={() => toggleSection(sg.section.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              bgcolor: '#e3f2fd',
              cursor: 'pointer',
              borderBottom: collapsedSections.has(sg.section.id) ? 'none' : '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: '#bbdefb' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" sx={{ p: 0 }}>
                {collapsedSections.has(sg.section.id) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {sg.section.nr} {sg.section.byggdel}
              </Typography>
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {fmtTkr(sg.total)}
            </Typography>
          </Box>

          {/* Section content */}
          <Collapse in={!collapsedSections.has(sg.section.id)}>
            {sg.subsections.map((sub, subIdx) => (
              <Box key={sub.subsection?.id || `sub-${subIdx}`}>
                {/* Subsection header */}
                {sub.subsection && (
                  <Box sx={{ px: 2, py: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {sub.subsection.nr} {sub.subsection.byggdel}
                    </Typography>
                  </Box>
                )}

                {/* Items */}
                {sub.items.length > 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {sub.items.map((item) => {
                          const primary = getPrimaryYearCost(item);
                          const isExpanded = expandedItemId === item.id;
                          const status = item.status || 'planned';

                          return (
                            <React.Fragment key={item.id}>
                              {/* Main row */}
                              <TableRow
                                hover
                                sx={{ cursor: 'pointer', '& td': { borderBottom: isExpanded ? 'none' : undefined } }}
                                onClick={() => toggleItemExpand(item.id)}
                              >
                                <TableCell sx={{ width: 40, color: 'text.secondary' }}>
                                  <IconButton size="small" sx={{ p: 0 }}>
                                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                  </IconButton>
                                </TableCell>
                                <TableCell sx={{ maxWidth: 300 }}>
                                  <Typography variant="body2">
                                    {item.atgard || item.byggdel || '–'}
                                  </Typography>
                                  {item.byggdel && item.atgard && (
                                    <Typography variant="caption" color="text.secondary">
                                      {byggdelMap.get(item.id) || item.byggdel}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right" sx={{ width: 60 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {primary?.year || '–'}
                                  </Typography>
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ width: 130, fontWeight: 600, cursor: 'text' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (primary) {
                                      startEdit(item.id, `year_${primary.year}`, primary.amount);
                                    }
                                  }}
                                >
                                  {editingCell?.rowId === item.id && editingCell?.field === `year_${primary?.year}` ? (
                                    <TextField
                                      size="small"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={commitEdit}
                                      onKeyDown={handleEditKeyDown}
                                      autoFocus
                                      sx={{ width: 120 }}
                                      inputProps={{ style: { textAlign: 'right' } }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                      {fmtKr(primary?.amount || null)}
                                      {primary && (
                                        <EditIcon sx={{ fontSize: 14, color: 'text.disabled', opacity: 0 , '.MuiTableRow-root:hover &': { opacity: 1 } }} />
                                      )}
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell align="right" sx={{ width: 120 }} onClick={(e) => e.stopPropagation()}>
                                  <Select
                                    size="small"
                                    value={status}
                                    onChange={(e) => handleStatusChange(item.id, e.target.value as PlanRowStatus)}
                                    variant="standard"
                                    disableUnderline
                                    sx={{ fontSize: '0.75rem' }}
                                  >
                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                      <MenuItem key={key} value={key} sx={{ fontSize: '0.75rem' }}>
                                        <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" sx={{ height: 22 }} />
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </TableCell>
                              </TableRow>

                              {/* Expanded detail */}
                              <TableRow>
                                <TableCell colSpan={5} sx={{ p: 0 }}>
                                  <Collapse in={isExpanded}>
                                    <Box sx={{ px: 4, py: 2, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'divider' }}>
                                      {/* Year grid */}
                                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                        Kostnader per år
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                        {YEAR_COLUMNS.map((yc) => {
                                          const yearLabel = yc.replace('year_', '');
                                          const val = item[yc] as number | null;
                                          const isEditing = editingCell?.rowId === item.id && editingCell?.field === yc;

                                          return (
                                            <Box
                                              key={yc}
                                              onClick={(e) => { e.stopPropagation(); startEdit(item.id, yc, val); }}
                                              sx={{
                                                textAlign: 'center',
                                                p: 0.5,
                                                minWidth: 70,
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: val ? 'primary.200' : 'divider',
                                                bgcolor: val ? 'primary.50' : 'background.paper',
                                                cursor: 'pointer',
                                                '&:hover': { borderColor: 'primary.main' },
                                              }}
                                            >
                                              <Typography variant="caption" color="text.secondary" display="block">
                                                {yearLabel}
                                              </Typography>
                                              {isEditing ? (
                                                <TextField
                                                  size="small"
                                                  value={editValue}
                                                  onChange={(e) => setEditValue(e.target.value)}
                                                  onBlur={commitEdit}
                                                  onKeyDown={handleEditKeyDown}
                                                  autoFocus
                                                  sx={{ width: 65 }}
                                                  inputProps={{ style: { textAlign: 'center', fontSize: '0.75rem', padding: '2px' } }}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              ) : (
                                                <Typography variant="caption" sx={{ fontWeight: val ? 600 : 400 }}>
                                                  {val ? val.toLocaleString('sv-SE') : '–'}
                                                </Typography>
                                              )}
                                            </Box>
                                          );
                                        })}
                                      </Box>

                                      {/* Meta info */}
                                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                        {item.tek_livslangd && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Tek livslängd</Typography>
                                            <Typography variant="body2">{item.tek_livslangd}</Typography>
                                          </Box>
                                        )}
                                        {item.a_pris !== null && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">A-pris</Typography>
                                            <Typography variant="body2">{item.a_pris?.toLocaleString('sv-SE')} kr</Typography>
                                          </Box>
                                        )}
                                        {item.antal !== null && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Antal</Typography>
                                            <Typography variant="body2">{item.antal}</Typography>
                                          </Box>
                                        )}
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">Totalt</Typography>
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {fmtKr(computeRowTotal(item))}
                                          </Typography>
                                        </Box>
                                      </Box>

                                      {item.utredningspunkter && (
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="caption" color="text.secondary">Utredningspunkter</Typography>
                                          <Typography variant="body2">{item.utredningspunkter}</Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ))}
          </Collapse>
        </Paper>
      ))}

      {/* Summary */}
      {summaryRows.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 1 }}>
          <Table size="small">
            <TableBody>
              {summaryRows.map((sr) => (
                <TableRow key={sr.id} sx={{ bgcolor: '#fff3e0' }}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {sr.byggdel} {sr.atgard && sr.atgard !== sr.byggdel ? `(${sr.atgard})` : ''}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {fmtKr(computeRowTotal(sr))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Version History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Versionshistorik</DialogTitle>
        <DialogContent>
          {loadingVersions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : versions.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>Inga sparade versioner ännu.</Typography>
          ) : (
            <List>
              {versions.map(v => (
                <ListItem key={v.id} divider>
                  <ListItemText
                    primary={`Version ${v.version}`}
                    secondary={`${new Date(v.created_at).toLocaleString('sv-SE')} — ${v.metadata?.saved_by || v.created_by || 'okänd'}`}
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" onClick={() => handleRestoreVersion(v.id)}>Återställ</Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Stäng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaintenancePlanReport;
```

**Step 2: Commit**

```bash
git add src/components/maintenance/MaintenancePlanReport.tsx
git commit -m "feat: add report table component with inline edit and status chips"
```

---

### Task 5: Wire up the page — replace spreadsheet with report

**Files:**
- Modify: `src/pages/admin/MaintenancePlanPage.tsx`

**Step 1: Replace the spreadsheet import and usage**

In `src/pages/admin/MaintenancePlanPage.tsx`:

1. Replace import of `MaintenancePlanSpreadsheet` with `MaintenancePlanReport` and `ExcelImportDialog`
2. Add import dialog state
3. Add import handler
4. Replace the `<MaintenancePlanSpreadsheet>` with `<MaintenancePlanReport>`
5. Remove the `highlightRowId` state (no longer needed for spreadsheet scrolling)
6. Update the `handleNavigateToRow` — now it can simply switch to the detail tab (the report component doesn't need highlighting)

Specific changes:

Replace the import line:
```typescript
// Remove:
import MaintenancePlanSpreadsheet from '../../components/maintenance/MaintenancePlanSpreadsheet';
// Add:
import MaintenancePlanReport from '../../components/maintenance/MaintenancePlanReport';
import ExcelImportDialog from '../../components/maintenance/ExcelImportDialog';
```

Add state for import dialog after the `snackbar` state:
```typescript
  const [importDialogOpen, setImportDialogOpen] = useState(false);
```

Add import handler after `handleRestoreVersion`:
```typescript
  const handleImportRows = useCallback((importedRows: PlanRow[]) => {
    const recalculated = recalcSummaryRows([...importedRows]);
    setRows(recalculated);
    setIsDirty(true);
    setSnackbar({ open: true, message: `${importedRows.filter(r => r.rowType === 'item').length} poster importerade — spara för att bekräfta`, severity: 'info' });
  }, []);
```

Remove the `highlightRowId` state and simplify `handleNavigateToRow`:
```typescript
  const handleNavigateToRow = useCallback((_rowId: string) => {
    setActiveTab(1); // Switch to "Detaljerad plan"
  }, []);
```

Replace the tab 1 panel content:
```tsx
      <TabPanel value={activeTab} index={1}>
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
      </TabPanel>
```

Add import dialog before the closing `</Box>`:
```tsx
      <ExcelImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportRows}
      />
```

**Step 2: Verify the app compiles**

Run: `cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1 && npm run build 2>&1 | tail -20`

**Step 3: Commit**

```bash
git add src/pages/admin/MaintenancePlanPage.tsx
git commit -m "feat: replace spreadsheet with report table and add Excel import"
```

---

### Task 6: Update dashboard to respect status

**Files:**
- Modify: `src/components/maintenance/MaintenancePlanDashboard.tsx`

**Step 1: Filter completed items from top expenses**

In `MaintenancePlanDashboard.tsx`, update the `topExpenses` memo to filter out completed items:

```typescript
  const topExpenses = useMemo(
    () => getTopExpenses(rows.filter(r => r.status !== 'completed'), 5),
    [rows],
  );
```

Note: `getTopExpenses` already filters for `item` rowType, so we pre-filter rows before passing them in.

**Step 2: Commit**

```bash
git add src/components/maintenance/MaintenancePlanDashboard.tsx
git commit -m "feat: filter completed items from dashboard top expenses"
```

---

### Task 7: Remove Handsontable dependencies and clean up

**Files:**
- Delete: `src/components/maintenance/MaintenancePlanSpreadsheet.tsx`
- Modify: `package.json` (remove handsontable deps)
- Modify: `src/components/maintenance/maintenancePlanHelpers.ts` (remove HotTable-specific exports)

**Step 1: Delete the spreadsheet component**

```bash
rm src/components/maintenance/MaintenancePlanSpreadsheet.tsx
```

**Step 2: Remove Handsontable packages**

```bash
cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1 && npm uninstall handsontable @handsontable/react hyperformula
```

**Step 3: Clean up helpers**

In `src/components/maintenance/maintenancePlanHelpers.ts`, remove HotTable-specific exports that are no longer used:
- Remove `COLUMN_WIDTHS`
- Remove `FIELD_KEYS`
- Remove `YEAR_COL_START`, `YEAR_COL_END`, `TOTAL_COL`, `A_PRIS_COL`, `ANTAL_COL`
- Remove `SPREADSHEET_STYLES`
- Remove `rowsToData`
- Remove `cssClassForRowType`

Keep: `COLUMN_HEADERS`, `computeRowTotal`, `setYearValue`, `recalcSummaryRows`, `computeSectionSummaries`, `buildByggdelMap`, `getTopExpenses`, `getLagkravItems`, `computeYearlyTotals`.

Note: `MaintenancePlanReport.tsx` imports `COLUMN_HEADERS`, `FIELD_KEYS`, `computeRowTotal`, `recalcSummaryRows`, and `buildByggdelMap`. Check imports and update `MaintenancePlanReport.tsx` if `FIELD_KEYS` was removed — it's still used in the Excel export within the report component. **Keep `FIELD_KEYS` and `COLUMN_HEADERS`** since the Excel export uses them.

Final list to remove: `COLUMN_WIDTHS`, `YEAR_COL_START`, `YEAR_COL_END`, `TOTAL_COL`, `A_PRIS_COL`, `ANTAL_COL`, `SPREADSHEET_STYLES`, `rowsToData`, `cssClassForRowType`.

**Step 4: Verify build**

```bash
cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1 && npm run build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove Handsontable, clean up unused helpers"
```

---

### Task 8: Handle status field backwards-compatibility

Existing saved plans in Supabase don't have `status` on their rows. We need to handle this gracefully.

**Files:**
- Modify: `src/pages/admin/MaintenancePlanPage.tsx`

**Step 1: Add migration on load**

In `MaintenancePlanPage.tsx`, after loading rows from Supabase (in the `loadData` function), add a migration step that sets `status: 'planned'` on any row that doesn't have it:

After `const recalculated = recalcSummaryRows([...plan.plan_data.rows]);`, add:

```typescript
          // Migrate: add status field to rows from older versions
          for (const r of recalculated) {
            if (!r.status) r.status = 'planned';
          }
```

Do the same for the fallback/seed path and the error catch path.

**Step 2: Verify the app starts correctly with existing data**

Run: `cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1 && npm start`

Manually verify: open the app, navigate to the maintenance plan page, verify both tabs load correctly.

**Step 3: Commit**

```bash
git add src/pages/admin/MaintenancePlanPage.tsx
git commit -m "fix: add backwards-compatible status migration for existing plan data"
```

---

### Task 9: Final verification and manual testing

**Step 1: Run the dev server**

```bash
cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1 && npm start
```

**Step 2: Manual test checklist**

- [ ] Översikt tab loads with correct totals
- [ ] Detaljerad plan shows sections grouped, collapsible
- [ ] Click on item row expands year details
- [ ] Click on year cell in expanded view allows inline editing
- [ ] Status dropdown changes and persists after save
- [ ] Save button works
- [ ] Excel export produces a valid .xlsx file
- [ ] Import dialog opens, accepts an .xlsx file, shows preview
- [ ] Import replaces data, save creates new version
- [ ] Version history dialog loads and restore works
- [ ] Completed items are filtered from "Största kommande utgifter" in dashboard

**Step 3: Run build to check for production issues**

```bash
cd /Users/pontus.horberg-Local/Sourcecode/BRF_Tool/MallBRF1 && npm run build
```

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
