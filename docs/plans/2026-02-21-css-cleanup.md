# CSS-arkitektur Uppstädning

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Konsolidera CSS-arkitekturen till ett rent system utan konflikter, bevara exakt nuvarande utseende.

**Architecture:** Behåll `gulmaranTheme.ts` + `designSystem.ts` som enda MUI-tema. Behåll `bastadTheme.ts` och `modernTheme.ts` som styling-objekt (de används aktivt av 21 komponenter). Ta bort all oanvänd global CSS som krockar med MUI. Fixa knapp-buggen (focus outline under loading state).

**Tech Stack:** MUI v5 (Emotion CSS-in-JS), TypeScript, React

---

## Bakgrund: Nuvarande problem

Tre lager global CSS (`index.css`, `designSystem.css`, `App.css`) innehåller regler som krockar med MUI:s CSS-in-JS. Specifikt:

1. **Dubbla focus-regler** — `index.css` och `designSystem.css` definierar `:focus-visible` med olika färger
2. **Global transition-regel med hög specificitet** — overridar MUI:s transitions (150ms vs 250ms)
3. **Global button-reset** — `button { border: none; background: none }` strider mot MUI
4. **Dubbla body-styles** — index.css och designSystem.css sätter olika font-family och line-height
5. **Oanvända CSS-variabler** — Båstad-tema och designSystem-variabler definierade men aldrig refererade
6. **designSystem.css klasser** — `.fade-in`, `.slide-in`, `.text-content`, `.no-print` etc. aldrig använda i komponenter

### Aktiva tema-filer (SKA INTE ÄNDRAS)

| Fil | Används av | Syfte |
|-----|-----------|-------|
| `gulmaranTheme.ts` | MUI ThemeProvider | Officiellt MUI-tema |
| `designSystem.ts` | gulmaranTheme.ts | Design tokens (TS) |
| `bastadTheme.ts` | 12 filer (650+ refs) | Styling-objekt via sx prop |
| `modernTheme.ts` | 9 filer | Styling-objekt via sx prop |
| `theme.ts` | ThemeContext (typer), ThemeDesignSelector, 3 tester | Typdefinitioner |

---

## Task 1: Ta bort App.css (helt oanvänd)

**Files:**
- Delete: `src/App.css`

**Step 1: Verifiera att filen inte importeras**

Sök efter `App.css` i alla filer. Förväntat: 0 importer.

**Step 2: Ta bort filen**

```bash
rm src/App.css
```

**Step 3: Bygg och verifiera**

```bash
npm run build
```

Expected: Build OK, inga fel.

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove unused App.css (legacy CRA template)"
```

---

## Task 2: Rensa index.css — behåll bara det nödvändiga

**Files:**
- Modify: `src/index.css`

Nuvarande `index.css` innehåller:
- `:root` CSS-variabler (Båstad-tema) — **OANVÄNDA** → ta bort
- `* { box-sizing }` — behåll
- `#root` overflow fix — behåll
- `body` styles — **KROCKAR** med designSystem.css → förenkla
- `html` scroll behavior — behåll
- `*:focus-visible` — **DUPLICERAT** i designSystem.css → ta bort härifrån
- `.MuiButtonBase-root:focus-visible` — **FIX FÖR KNAPP-BUG** → flytta till designSystem.css
- Global transition-regel — **KROCKAR MED MUI** → ta bort
- `button` reset — **ONÖDIG** med MUI → ta bort
- `a` styling — behåll (men flytta om enklare)

**Step 1: Skriv om index.css till bara det essentiella**

```css
/* Base resets */
* {
  box-sizing: border-box;
}

/* CRITICAL: Ensure root elements allow scrolling */
#root {
  height: auto !important;
  overflow: visible !important;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 70px;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
}

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  overflow-y: auto;
  height: auto;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}
```

Borttaget:
- `:root` CSS-variabler (Båstad-tema) — oanvända
- `body { font-family, background, color, line-height }` — hanteras av MUI-tema + designSystem.css
- `*:focus-visible` — hanteras av designSystem.css
- `.MuiButtonBase-root:focus-visible` — flyttas till designSystem.css
- Global transition-regel (`:not(...) { transition }`) — **KNAPP-BUG FIX** (krockar med MUI)
- `button { border: none; background: none }` — MUI hanterar detta
- `a` link styles — MUI hanterar detta via tema

**Step 2: Bygg och verifiera**

```bash
npm run build
```

**Step 3: Visuellt test**

Öppna appen i webbläsaren. Kontrollera:
- [ ] Startsidan ser likadan ut (BRF Gulmåran header, kort-layout)
- [ ] Scrollning fungerar
- [ ] Inga horisontella scrollbars

**Step 4: Commit**

```bash
git add src/index.css && git commit -m "fix: remove conflicting global CSS from index.css

Remove unused Båstad CSS variables, global transition rule (caused
button animation conflicts with MUI), button reset, and duplicate
focus styles. Styling now handled solely by MUI theme + designSystem.css."
```

---

## Task 3: Uppdatera designSystem.css — fixa focus + ta bort oanvända klasser

**Files:**
- Modify: `src/styles/designSystem.css`

**Step 1: Lägg till MUI-button focus fix**

I `:focus-visible`-sektionen, lägg till efter den befintliga regeln:

```css
/* MUI buttons handle focus via ripple — prevent oversized outline */
.MuiButtonBase-root:focus-visible {
  outline: none;
}
```

**Step 2: Ta bort oanvända CSS-klasser**

Ta bort dessa klasser som aldrig refereras i någon komponent:
- `.gulmaran-card-hover` (rad 149-156)
- `.gulmaran-button-hover` (rad 158-165)
- `.fade-in` (rad 200-202)
- `.slide-in` (rad 204-206)

Behåll:
- `.text-content` — kontrollera först om den används, ta bort om inte
- `.no-print` — kontrollera först om den används, ta bort om inte
- Alla `@keyframes` — behåll om någon komponent använder dem via JS
- Alla `@media`-regler (reduced-motion, print, high-contrast) — behåll (accessibility)

**Step 3: Ta bort dubbla `* { box-sizing }` och `html { scroll-behavior }`**

Dessa finns nu i index.css. Ta bort dubbletten från designSystem.css.

**Step 4: Bygg och verifiera**

```bash
npm run build
```

**Step 5: Testa knapp-buggen**

- [ ] Gå till underhållsplan
- [ ] Gör en ändring
- [ ] Klicka Spara — knappen ska INTE bli stor
- [ ] Gå till Login — klicka Logga in — knappen ska INTE bli stor

**Step 6: Commit**

```bash
git add src/styles/designSystem.css && git commit -m "fix: consolidate focus styles and remove unused CSS classes

Add MUI button focus override to prevent oversized outline during
loading states. Remove unused utility classes (fade-in, slide-in,
gulmaran-card-hover, gulmaran-button-hover)."
```

---

## Task 4: Rensa inline outline-fixes från tidigare försök

**Files:**
- Modify: `src/components/maintenance/MaintenancePlanReport.tsx`
- Modify: `src/pages/auth/LoginNew.tsx`

**Step 1: Ta bort `outline: 'none'` från spara-knappen**

I `MaintenancePlanReport.tsx`, ta bort den manuellt tillagda `outline: 'none'` från spara-knappens sx prop. Den globala CSS-fixen i designSystem.css hanterar detta nu.

**Step 2: Ta bort `outline: 'none'` från login-knappen**

I `LoginNew.tsx`, ta bort `outline: 'none'` från LoadingButton sx prop.

**Step 3: Testa att knapp-buggen fortfarande är fixad**

- [ ] Spara-knappen i underhållsplan
- [ ] Login-knappen

**Step 4: Commit**

```bash
git add src/components/maintenance/MaintenancePlanReport.tsx src/pages/auth/LoginNew.tsx
git commit -m "refactor: remove inline outline fixes, now handled by global CSS"
```

---

## Task 5: Förenkla ThemeContext.tsx (ta bort död kod)

**Files:**
- Modify: `src/context/ThemeContext.tsx`

**Step 1: Ta bort oanvända state och funktioner**

Nuvarande ThemeContext har:
- `design` state + `setDesign` — sparas i localStorage men ignoreras vid temabyte
- `font` state + `setFont` — sparas i localStorage men ignoreras vid temabyte
- `customColors` state + `setCustomColor` — aldrig använd
- `toggleThemeMode` — no-op funktion
- `toggleAutoMode` — no-op funktion
- `getPreviewColors` — returnerar alltid samma värden
- `useEffect` som sätter `gulmaranTheme` oavsett inställningar

**VARNING:** ThemeDesignSelector-komponenten refererar till dessa. Kontrollera om den används.

**Step 2: Verifiera ThemeDesignSelector-användning**

Sök om `ThemeDesignSelector` renderas någonstans. Om inte → kan tas bort.

Om den renderas → behåll men dokumentera att den är icke-funktionell.

**Step 3: Om säkert, förenkla till:**

```tsx
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <MuiThemeProvider theme={gulmaranTheme}>
      {children}
    </MuiThemeProvider>
  );
};
```

**OBS:** Detta steg kräver noggrann kontroll av vad som importeras från ThemeContext. Alla konsumenter av `useTheme()` måste granskas.

**Step 4: Commit**

```bash
git add src/context/ThemeContext.tsx && git commit -m "refactor: simplify ThemeContext, remove non-functional theme switching"
```

---

## Task 6: Verifiera allt fungerar

**Step 1: Full build**

```bash
npm run build
```

Expected: 0 errors, 0 warnings relaterade till styling.

**Step 2: Kör tester**

```bash
npm test -- --watchAll=false
```

Expected: Alla tester passerar.

**Step 3: Visuell verifiering**

Kontrollera dessa sidor:
- [ ] Startsida (BRF Gulmåran header, kort, sökfält)
- [ ] Underhållsplan (toolbar, spara-knapp under sparning)
- [ ] Login (knapp under inloggning)
- [ ] Admin dashboard
- [ ] Bokningssida
- [ ] Stadgar

**Step 4: Slutlig commit + push**

```bash
git push
```

---

## Sammanfattning av ändringar

| Åtgärd | Effekt |
|--------|--------|
| Ta bort App.css | -39 rader oanvänd CSS |
| Rensa index.css | -70 rader konflikterande CSS, fixar transition-krock |
| Rensa designSystem.css | -20 rader oanvända klasser, fixar focus-outline-bugg |
| Rensa inline fixes | -2 rader workarounds |
| Förenkla ThemeContext | -80 rader död kod |

**Total:** ~210 rader borttagen kod, 0 visuella ändringar, knapp-bugg fixad.

## Vad vi INTE ändrar (och varför)

| Fil | Anledning |
|-----|-----------|
| `gulmaranTheme.ts` | Aktivt MUI-tema, fungerar korrekt |
| `designSystem.ts` | Tokens som gulmaranTheme bygger på |
| `bastadTheme.ts` | Används av 12 komponenter, 650+ refs |
| `modernTheme.ts` | Används av 9 komponenter |
| `theme.ts` | Typdefinitioner importeras av ThemeContext + tester |
| `PageEditor.css` | Specifik för markdown-editor, ingen konflikt |
