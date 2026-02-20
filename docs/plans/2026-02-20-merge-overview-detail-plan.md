# Merge Overview + Detail Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the Översikt/Detaljerad plan tabs and merge the dashboard summary into a collapsible header above the existing report/section list.

**Architecture:** Extract the useful parts of MaintenancePlanDashboard (grand total, year cards with expand, lagkrav warnings) into a new MaintenancePlanSummary component. Remove tabs from MaintenancePlanPage and render Summary + Report sequentially. Delete the old Dashboard component.

**Tech Stack:** React, TypeScript, MUI (Material UI v5)

---

### Task 1: Create MaintenancePlanSummary component

**Files:**
- Create: `src/components/maintenance/MaintenancePlanSummary.tsx`

**Step 1: Create the summary component**

This component extracts the useful parts from `MaintenancePlanDashboard.tsx`:
- Grand total line
- Clickable year cards with mini progress bars
- Expandable year detail panel (items for a clicked year)
- Lagkrav warnings (only items needing attention, not "ok" items)
- Collapsible via chevron toggle

Props: `{ rows: PlanRow[]; onNavigateToRow?: (rowId: string) => void; }`

Extract from `MaintenancePlanDashboard.tsx` (lines 40-87 for helpers, lines 111-253 for year cards + detail):
- `fmtKr`, `fmtCompact` formatting helpers
- `LagkravStatus`, `LagkravItem` types and `analyzeLagkrav` function
- `getItemsForYear` function
- Year cards row (lines 155-213)
- Year detail collapse (lines 216-251)
- Grand total display (lines 142-149)

**Remove** from Dashboard (do NOT include):
- "Per sektion" table (lines 255-276) — redundant
- "Största kommande utgifter" table (lines 278-310) — redundant
- Lagkrav "ok" items (lines 362-390) — only show warning/unknown items

**Add** collapse toggle:
- State: `const [isCollapsed, setIsCollapsed] = useState(false);`
- Wrap the summary content in `<Collapse in={!isCollapsed}>` from MUI
- Add a clickable header row with chevron icon (`ExpandMore`/`ExpandLess`) and the grand total text

```tsx
// Structure of the component:
//
// <Box>
//   <Box onClick={toggle} sx={{display:'flex', cursor:'pointer'}}>
//     <IconButton>{isCollapsed ? <ExpandMore/> : <ExpandLess/>}</IconButton>
//     <Typography variant="h5">{fmtKr(grandTotal)}</Typography>
//     <Typography variant="body2">total planerad kostnad 2026–2035</Typography>
//   </Box>
//   <Collapse in={!isCollapsed}>
//     {/* Year cards row */}
//     {/* Year detail expand */}
//     {/* Lagkrav warnings (only warning/unknown) */}
//   </Collapse>
// </Box>
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to MaintenancePlanSummary

**Step 3: Commit**

```bash
git add src/components/maintenance/MaintenancePlanSummary.tsx
git commit -m "feat: add MaintenancePlanSummary component (extracted from Dashboard)"
```

---

### Task 2: Update MaintenancePlanPage to remove tabs

**Files:**
- Modify: `src/pages/admin/MaintenancePlanPage.tsx`

**Step 1: Remove tabs and compose Summary + Report**

Changes to `MaintenancePlanPage.tsx`:
1. Remove imports: `Tabs`, `Tab`, `DashboardIcon`, `TableChartIcon`, `MaintenancePlanDashboard`
2. Add import: `MaintenancePlanSummary`
3. Remove state: `activeTab`, `handleTabChange`
4. Remove the `TabPanel` component and `a11yProps` helper
5. Remove `handleNavigateToRow` (no longer needed for tab switching — but keep onNavigateToRow prop passing if Summary needs it)
6. Replace the tabs + TabPanel JSX with sequential rendering:

```tsx
{/* Summary (collapsible) */}
<MaintenancePlanSummary rows={rows} />

{/* Report (section list + toolbar) */}
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
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/admin/MaintenancePlanPage.tsx
git commit -m "refactor: remove tabs, compose Summary + Report in single view"
```

---

### Task 3: Delete MaintenancePlanDashboard

**Files:**
- Delete: `src/components/maintenance/MaintenancePlanDashboard.tsx`

**Step 1: Verify no other files import it**

Search for `MaintenancePlanDashboard` across the codebase. After Task 2, `MaintenancePlanPage.tsx` should no longer import it.

**Step 2: Delete the file**

```bash
rm src/components/maintenance/MaintenancePlanDashboard.tsx
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -u src/components/maintenance/MaintenancePlanDashboard.tsx
git commit -m "chore: delete redundant MaintenancePlanDashboard component"
```

---

### Task 4: Verify helpers are still used

**Files:**
- Check: `src/components/maintenance/maintenancePlanHelpers.ts`

**Step 1: Verify no dead exports**

Check that these helpers (used by old Dashboard) are still imported by the new Summary:
- `computeYearlyTotals` — used by Summary for year cards
- `getLagkravItems` — used by Summary for warnings
- `buildByggdelMap` — used by Summary for year detail items

Check that these are no longer imported anywhere and can be removed if unused:
- `computeSectionSummaries` — was used by Dashboard "Per sektion" table (removed)
- `getTopExpenses` — was used by Dashboard "Största utgifter" table (removed)

If `computeSectionSummaries` and `getTopExpenses` are only used by the deleted Dashboard, remove them from helpers.

**Step 2: Clean up if needed**

Remove dead exports from `maintenancePlanHelpers.ts`.

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Run existing tests**

Run: `npx craco test --watchAll=false`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/maintenance/maintenancePlanHelpers.ts
git commit -m "chore: remove unused helper exports (computeSectionSummaries, getTopExpenses)"
```

---

### Task 5: Visual verification

**Step 1: Start dev server and verify**

Run: `npm start`

Check:
- Page loads without tabs
- Collapsible summary shows grand total, year cards, lagkrav warnings
- Clicking a year card expands item detail
- Collapsing the summary hides year cards and lagkrav
- Report section list works as before (expand sections, edit items, etc.)
- Toolbar (import/export/history/save) works
- No console errors

**Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: polish merged view layout"
```
