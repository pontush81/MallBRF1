# Merge Overview + Detail into Single View

**Date:** 2026-02-20
**Status:** Design

## Problem

The "Översikt" (dashboard) and "Detaljerad plan" (report) tabs show redundant information: both display sections with totals, cost per year, and item lists. The tab separation adds friction without enough differentiation.

## Solution

Remove tabs. Merge the dashboard summary into a collapsible header block above the existing section list.

## Layout (top to bottom)

### 1. Page header
- Title: "Underhållsplan 2026–2035"
- Subtitle: "Brf Gulmåran · Version {n}" + dirty chip

### 2. Summary block (collapsible)
A compact block that can be collapsed via a chevron toggle.

Contains:
- **Grand total**: "1 764 000 kr total planerad kostnad 2026–2035"
- **Year cards row**: 10 clickable mini-cards (year + compact amount + progress bar). Click expands a detail panel showing items for that year (existing `getItemsForYear` logic).
- **Lagkrav warnings**: Only items with status `warning` or `unknown` (needing attention). Green "ok" items are omitted — they're visible as regular items in the section list.

### 3. Toolbar
Import Excel, Export Excel, Historik, Spara — same as today in MaintenancePlanReport.

### 4. Section list
Unchanged from current MaintenancePlanReport: collapsible sections, inline editing, status, CRUD, expandable item detail with year boxes, summary rows.

## What gets removed
- **Tabs component** (no more tab switching)
- **"Per sektion" table** from dashboard (redundant with section list)
- **"Största kommande utgifter" table** from dashboard (redundant with year detail and section list)
- **Lagkrav "ok" items** from summary (visible in section list)
- **MaintenancePlanDashboard.tsx** can be deleted (its logic moves into a new `MaintenancePlanSummary` component or inline)

## Technical approach

1. Create `MaintenancePlanSummary.tsx` — extracts grand total, year cards (with expand), and lagkrav warnings from current Dashboard component
2. Remove tabs from `MaintenancePlanPage.tsx` — render Summary + Report sequentially
3. Add collapse toggle (chevron) around the summary block
4. Delete `MaintenancePlanDashboard.tsx`
5. Clean up unused imports/helpers

## Files affected
- `src/pages/admin/MaintenancePlanPage.tsx` — remove tabs, compose Summary + Report
- `src/components/maintenance/MaintenancePlanSummary.tsx` — new (extracted from Dashboard)
- `src/components/maintenance/MaintenancePlanDashboard.tsx` — delete
- `src/components/maintenance/maintenancePlanHelpers.ts` — no changes (helpers still used by Summary)
