# Normalizer & Validering — Underhållsplan

**Datum:** 2026-02-21
**Status:** IMPLEMENTERAD

## Bakgrund

Efter namnsättningsstädningen (se `2026-02-21-naming-cleanup.md`) finns en ren seed-data,
men samma inkonsekvensproblem återkommer när användare redigerar rader i UI:t eller
importerar via Excel. En normalizer och valideringslager behövs.

## Beslut

| Fråga | Svar |
|-------|------|
| Var körs normaliseringen? | Både inline (onBlur) och vid sparning (säkerhetsnät) |
| Tom byggdel — blockera eller varna? | Mjuk varning i UI, hård blockering vid manuell sparning och export |
| Separator-standardisering? | Whitespace runt `&` och `/`, men ingen ersättning. Slash normaliseras **inte** i `utredningspunkter` |
| Severity-eskalering? | Context-parameter: `'edit'` → warning, `'save'`/`'export'` → error |
| Autosave vs manuell sparning? | Autosave normaliserar men blockerar aldrig. Manuell "Spara version" validerar hårt |

## Design

### 1. `normalizeRowText(value, opts?)`

**Fil:** `src/components/maintenance/maintenancePlanHelpers.ts`

Ren funktion utan sidoeffekter. Appliceras på `byggdel`, `atgard` och `utredningspunkter`.
Inte på `tek_livslangd` eller `info_url`.

```typescript
interface NormalizeOpts {
  /** Normalisera whitespace runt /. Standard: true. Sätts till false för utredningspunkter. */
  normalizeSlash?: boolean;
}

export function normalizeRowText(value: string, opts?: NormalizeOpts): string {
  let v = value.trim();
  if (!v) return v;

  // Versal i början
  v = v.charAt(0).toUpperCase() + v.slice(1);

  // Whitespace runt &: "Besiktning&status" → "Besiktning & status"
  v = v.replace(/\s*&\s*/g, ' & ');

  // Whitespace runt /: "Byte / service" → "Byte/service"
  // Hoppas över i utredningspunkter (kr/m², datum, referenser)
  if (opts?.normalizeSlash !== false) {
    v = v.replace(/\s*\/\s*/g, '/');
  }

  // Kollapsa multipla mellanslag
  v = v.replace(/\s{2,}/g, ' ');

  return v;
}
```

Anropskonvention:
- `byggdel`, `atgard`: `normalizeRowText(value)` — full normalisering
- `utredningspunkter`: `normalizeRowText(value, { normalizeSlash: false })` — slash ifred

### 2. Validering — typer och funktioner

**Fil:** `src/components/maintenance/maintenancePlanHelpers.ts`

```typescript
export type ValidationContext = 'edit' | 'save' | 'export';
export type ValidationSeverity = 'warning' | 'error';

export interface RowValidation {
  rowId: string;
  field: string;
  severity: ValidationSeverity;
  message: string;
}

export function validatePlanRow(
  row: PlanRow,
  context: ValidationContext
): RowValidation[] {
  const issues: RowValidation[] = [];
  const severity: ValidationSeverity = context === 'edit' ? 'warning' : 'error';

  if (row.rowType !== 'item') return issues;

  if (!row.byggdel.trim()) {
    issues.push({
      rowId: row.id,
      field: 'byggdel',
      severity,
      message: 'Byggdel saknas',
    });
  }

  if (!row.atgard.trim()) {
    issues.push({
      rowId: row.id,
      field: 'atgard',
      severity,
      message: 'Åtgärd saknas',
    });
  }

  return issues;
}

export function validatePlanData(
  rows: PlanRow[],
  context: ValidationContext
): RowValidation[] {
  return rows.flatMap(r => validatePlanRow(r, context));
}
```

Två regler: tom `byggdel` och tom `atgard` på item-rader. `'edit'` → warning,
`'save'`/`'export'` → error.

### 3. Injection point A — Inline (onBlur)

**Fil:** `src/components/maintenance/MaintenancePlanReport.tsx`

Ändra `commitEditText`, efter trim men före `setRows`:

```typescript
if (field === 'byggdel' || field === 'atgard') {
  newValue = normalizeRowText(newValue);
} else if (field === 'utredningspunkter') {
  newValue = normalizeRowText(newValue, { normalizeSlash: false });
}
```

Ny state för valideringsvarningar (Record istället för Map):

```typescript
const [validationMap, setValidationMap] = useState<Record<string, RowValidation[]>>({});
```

Efter `setRows`, validera den ändrade raden:

```typescript
const updatedRow = newRows.find(r => r.id === rowId);
if (updatedRow) {
  const issues = validatePlanRow(updatedRow, 'edit');
  setValidationMap(prev => {
    const next = { ...prev };
    if (issues.length > 0) next[rowId] = issues;
    else delete next[rowId];
    return next;
  });
}
```

### 4. Injection point B — Save-time

**Fil:** `src/pages/admin/MaintenancePlanPage.tsx`

Nuvarande läge: `handleSave()` anropas av **både** autosave (2 sek debounce)
och manuell "Spara"-knapp. Båda skapar en ny version i `maintenance_plan_versions`.

Ändring — splitta till två flöden:

```typescript
// Normalisera alla rader (oavsett rowType — fångar blank→item-konverteringar)
function normalizeRows(rows: PlanRow[]): PlanRow[] {
  return rows.map(r => ({
    ...r,
    byggdel: normalizeRowText(r.byggdel ?? ''),
    atgard: normalizeRowText(r.atgard ?? ''),
    utredningspunkter: normalizeRowText(r.utredningspunkter ?? '', { normalizeSlash: false }),
  }));
}

// Autosave: normalisera, spara alltid (inga valideringsblock)
const handleAutoSave = useCallback(async () => {
  if (!isDirty || isSaving) return;
  const normalized = normalizeRows(rows);
  await doSave(normalized);  // intern hjälpfunktion
}, [isDirty, isSaving, rows, version, currentUser]);

// Manuell sparning: normalisera + validera (hård blockering)
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
}, [isDirty, isSaving, rows, version, currentUser]);
```

- Autosave-effekten anropar `handleAutoSave()`
- "Spara version"-knappen anropar `handleManualSave()`
- Båda normaliserar, men bara manuell blockerar

### 5. Injection point C — Export-blockering

**Fil:** `src/components/maintenance/MaintenancePlanReport.tsx`

Före export:

```typescript
const issues = validatePlanData(rows, 'export');
const blocking = issues.filter(i => i.severity === 'error');
if (blocking.length > 0) {
  setSnackbar({
    open: true,
    message: `${blocking.length} rad(er) saknar byggdel/åtgärd — åtgärda innan export.`,
    severity: 'error',
  });
  return;
}
handleExportExcel(rows, columns, ...);
```

Filtrerar på `severity === 'error'` (inte `issues.length`) så att framtida
warning-regler inte blockerar export.

### 6. UI-indikering

Minimalt ingrepp — inga nya komponenter:

| Element | Stil |
|---------|------|
| Cell med `warning` | `borderLeft: '3px solid #f9a825'` (gul) |
| Tooltip | MUI `Tooltip` med `validation.message` |
| Sparning/export-blockering | MUI `Snackbar` med `severity: 'error'`, listar antal problem |

Varningar visas bara på item-rader. Section/subsection-rader valideras inte.

---

## Berörda filer

| Fil | Ändring |
|-----|---------|
| `maintenancePlanHelpers.ts` | Ny: `normalizeRowText`, `validatePlanRow`, `validatePlanData`, typer |
| `MaintenancePlanReport.tsx` | Ändra: `commitEditText`, ny state `validationMap`, gul markör, export-guard |
| `MaintenancePlanPage.tsx` | Splitta: `handleAutoSave` + `handleManualSave`, normalisering i båda |

## Framtida utökningar (ej i scope nu)

- Validering av negativa belopp
- Varning om `a_pris * antal` inte matchar årsbelopp
- URL-formatvalidering på `info_url`
- Autocomplete/dropdown på `byggdel` baserat på befintliga värden
