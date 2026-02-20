# Design: Excel-import & Rapportvy för underhållsplan

**Datum:** 2026-02-19
**Status:** Godkänd design

## Koncept

**"Excel gör beräkningarna, appen gör upplevelsen"**

Styrelsen (eller konsult) gör alla beräkningar i Excel/Google Sheets. Resultatet importeras till appen som visar en snygg översikt och detaljerad rapport. Appen kan även exportera tillbaka till Excel.

## Vad som ändras

### Tas bort
- HotTable/Handsontable (kalkylbladsmotorn i detaljerad vy)
- `handsontable` och `@handsontable/react` beroenden (~500KB)
- `MaintenancePlanSpreadsheet.tsx`

### Behålls
- **Översiktssidan** (dashboarden) - exakt som idag
- **Supabase-lagring** med versionshistorik (append-only)
- **Excel-export** (xlsx-biblioteket)
- **Datamodellen** (`PlanRow`) - utökas med `status`-fält

### Byggs nytt
1. Excel-importfunktion
2. Rapporttabell (ersätter kalkylbladet)
3. Statushantering per rad

---

## 1. Rapporttabell (Detaljerad plan)

Ersätter HotTable med en ren MUI-tabell grupperad per sektion.

### Layout
- Sektioner (3 Utvändigt, 4 Invändigt, etc.) visas som kollapsibla grupper
- Varje sektion visar sin totalsumma i rubriken
- Undersektioner (3.1 Fasader, 3.2 Fönster) som undergrupper
- Åtgärdsposter som rader

### Kolumner per rad (komprimerat)
| Kolumn | Innehåll |
|--------|----------|
| Åtgärd | Namn på åtgärden |
| År | Närmaste planerade år |
| Belopp | Kostnad i kr |
| Status | Chip (─ / Pågår / Utförd / Uppskjuten) |

### Expanderad rad
Klick på en rad expanderar och visar:
- Alla 10 årskolumner (2026-2035)
- Teknisk livslängd
- A-pris × antal
- Utredningspunkter

### Redigering
- **Inline-edit:** Klick på belopp eller år → liten input, sparas med Enter/blur
- **Status-dropdown:** Klickbar chip per rad
- **Summor räknas om** automatiskt efter edit
- Ändringar skapar ny version i Supabase

### Visuell stil
- Samma designspråk som översiktssidan
- Sektionsrubriker: blå bakgrund, bold
- Summarader: orange bakgrund
- Statuschips med färgkodning

---

## 2. Excel-import

### Flöde
1. Klicka "Importera Excel" → filväljare
2. Appen läser filen med `xlsx`-biblioteket
3. Smart parsning identifierar struktur
4. Förhandsvisning: "Vi hittade X poster i Y sektioner"
5. Bekräfta → ny version skapas i Supabase

### Smart parsning
Identifierar automatiskt:
- **Sektionsrubriker:** Rader med bara text, ingen summa → `section`
- **Undersektioner:** Indenterade rubriker → `subsection`
- **Åtgärdsposter:** Rader med belopp i årskolumner → `item`
- **Summarader:** Rader med "Summa", "Totalt" → `summary`
- **Årskolumner:** Kolumnrubriker som matchar 2024-2040

### Kolumnmappning
| Excel-kolumn (vanliga namn) | → PlanRow-fält |
|---|---|
| "Nr", "Pos", "#" | `nr` |
| "Byggdel", "Komponent", "Del" | `byggdel` |
| "Åtgärd", "Aktivitet", "Beskrivning" | `atgard` |
| "Livslängd", "Tek livslängd" | `tek_livslangd` |
| "A-pris", "Styckpris", "à-pris" | `a_pris` |
| "Antal", "St", "Mängd" | `antal` |
| 2026, 2027, ... (årtal) | `year_XXXX` |

### Felhantering
- Inga årskolumner → tydligt felmeddelande
- Oväntat format → visa rådata, låt användaren bekräfta mappning

---

## 3. Statushantering

### Nytt fält i PlanRow
```typescript
status: 'planned' | 'in_progress' | 'completed' | 'postponed'
```

### Statusvärden
| Status | Chip-färg | Betydelse |
|---|---|---|
| ─ (planned) | Grå/tom | Planerad, ingen åtgärd ännu |
| Pågår (in_progress) | Blå | Arbete påbörjat |
| Utförd (completed) | Grön | Genomförd |
| Uppskjuten (postponed) | Orange | Framskjuten |

### Integration med översikt
- "Största kommande utgifter" filtrerar bort utförda poster
- Lagkrav-sektionen visar status per kontroll

---

## Dataflöde

```
Excel-fil
  ↓ [Importera]
Appen parsar → PlanRow[]
  ↓ [Spara]
Supabase (maintenance_plan_versions, ny version)
  ↓ [Läs]
Översikt (dashboard) + Detaljerad plan (rapporttabell)
  ↓ [Exportera]
Excel-fil (för att ta tillbaka till konsult)
```

---

## Påverkade filer

### Ta bort
- `src/components/maintenance/MaintenancePlanSpreadsheet.tsx`

### Skapa nya
- `src/components/maintenance/MaintenancePlanReport.tsx` - rapporttabellen
- `src/components/maintenance/ExcelImport.tsx` - importdialog
- `src/services/excelImportService.ts` - parsningslogik

### Ändra
- `src/components/maintenance/MaintenancePlanPage.tsx` - byt ut spreadsheet mot report
- `src/services/maintenancePlanService.ts` - lägg till `status` i PlanRow
- `src/data/maintenancePlanSeedData.ts` - lägg till status-fält
- `src/components/maintenance/MaintenancePlanDashboard.tsx` - filtrera på status
- `package.json` - ta bort handsontable-beroenden
