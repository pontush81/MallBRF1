# Namnsättningsstädning — Underhållsplan seed-data

**Fil:** `src/data/maintenancePlanSeedData.ts`
**Datum:** 2026-02-21
**Status:** IMPLEMENTERAD

## Princip

Alla `item`-rader följer mönstret:

| Fält | Innehåll | Exempel |
|------|----------|---------|
| `byggdel` | Objektet/komponenten (substantiv) | `Takfönster`, `Avlopp`, `Fläktar` |
| `atgard` | Åtgärden (verb/handling) | `Byte`, `Rensning`, `Besiktning` |
| `utredningspunkter` | Specifikationer, lgh-info, noter | `Lgh E/F/G`, `Berör lgh Tina` |

### Konventioner

- **Separator:** `&` (inte `/`) för sammansatta beskrivningar: `Besiktning & statusbedömning`
- **Parentes:** för specifikation av variant: `Lägenhetsdörrar (bottenvån)`, `Fönster (övriga)`
- **Systemnamn på item-nivå:** när subsection redan anger systemet, behåll systemnamnet
  även på items för bättre filtrering (t.ex. `Takavvattning` / `Rensning` + `Takavvattning` / `Byte`)
- **Personnamn:** aldrig i `byggdel` eller `atgard` — lägg i `utredningspunkter`
- **Inga tomma `byggdel`:** alla item-rader ska ha ett värde i `byggdel`

---

## Strukturell ändring: OVK-dubblett borttagen

OVK under 3.2 Ventilation **borttagen**. OVK är en myndighetskontroll
och finns nu enbart i sektion 4.7. Kostnaden (20 000 kr, 2029) flyttad till 4.7-raden.

---

## Genomförda ändringar

### Sektion 1: Utvändigt

#### 1.1 Fasader — inga ändringar
Raderna hade redan korrekt `byggdel` + `atgard`-uppdelning.

#### 1.1.1 Fönster

| Före | Efter |
|------|-------|
| `byggdel: ''`, `atgard: 'Byte takfönster lägenhet E F G'` | `byggdel: 'Takfönster'`, `atgard: 'Byte'`, `utredningspunkter: 'Lgh E/F/G'` |
| `byggdel: ''`, `atgard: 'Övriga fönster'` | `byggdel: 'Fönster (övriga)'`, `atgard: 'Byte'` |

#### 1.1.2 Dörrar

| Före | Efter |
|------|-------|
| `byggdel: ''`, `atgard: 'Lägenhetsdörr bottenvån'` | `byggdel: 'Lägenhetsdörrar (bottenvån)'`, `atgard: 'Byte'` |

#### 1.1.3 Balkonger

| Före | Efter |
|------|-------|
| `byggdel: ''`, `atgard: 'Lagning'` | `byggdel: 'Balkonger'`, `atgard: 'Lagning'` |

#### 1.2 Yttertak

| Före | Efter |
|------|-------|
| `atgard: 'Målning plåt (ev ingår i takfönster)'` | `byggdel: 'Takplåt'`, `atgard: 'Målning'`, `utredningspunkter: 'Ev ingår i takfönsterbyte'` |
| `atgard: 'Takbesiktning / statusbedömning'` | `byggdel: 'Yttertak'`, `atgard: 'Besiktning & statusbedömning'` |

#### 1.3 Takavvattning

| Före | Efter |
|------|-------|
| `atgard: 'Rensning stuprännor'` | `byggdel: 'Takavvattning'`, `atgard: 'Rensning'`, `utredningspunkter: 'Stuprännor'` |
| `atgard: 'Byte hängrännor/stuprör'` | `byggdel: 'Takavvattning'`, `atgard: 'Byte'`, `utredningspunkter: 'Hängrännor/stuprör. Bedöm skick'` |

#### 1.4 Gård & mark

| Före | Efter |
|------|-------|
| `atgard: 'Avrining Tinas lägenhet'` | `byggdel: 'Avrinning'`, `atgard: 'Åtgärd'`, `utredningspunkter: 'Berör lgh Tina'` |

`Grind/Dörrar` / `Byte låssystem` och `Staket framsida` / `Byte` var redan korrekta.

#### 1.5 Mark & dränering

| Före | Efter |
|------|-------|
| `atgard: 'Dräneringsbesiktning'` | `byggdel: 'Dränering'`, `atgard: 'Besiktning'` |
| `atgard: 'Markarbeten / ytskikt gård'` | `byggdel: 'Markyta gård'`, `atgard: 'Underhåll'` |

---

### Sektion 2: Invändigt

| Subsection | Före | Efter |
|------------|------|-------|
| 2.1 Källare | `atgard: 'Översyn fuktsäkerhet'` | `byggdel: 'Källare'`, `atgard: 'Översyn fuktsäkerhet'` |
| 2.1.1 Tvättstuga | `atgard: 'Byte maskiner'` | `byggdel: 'Tvättmaskiner'`, `atgard: 'Byte'` |
| 2.1.2 Gästlägenhet | `atgard: 'Iordningställande'` | `byggdel: 'Gästlägenhet'`, `atgard: 'Iordningställande'` |
| 2.2 Trapphus | `atgard: 'Målning trapphus'` | `byggdel: 'Trapphus'`, `atgard: 'Målning'` |
| 2.4 Förråd | `atgard: 'Översyn/underhåll'` | `byggdel: 'Förråd'`, `atgard: 'Översyn'` |

---

### Sektion 3: Installationer

#### 3.1 El installationer

| Före | Efter |
|------|-------|
| `atgard: 'Översyn timer, jordfelsbrytare, byte av utebelysning'` | `byggdel: 'Elinstallationer'`, `atgard: 'Översyn (timer, jordfelsbrytare)'` |
| `atgard: 'Elcentral – besiktning/byte'` | `byggdel: 'Elcentral'`, `atgard: 'Besiktning/byte'` |
| `atgard: 'Utomhusbelysning'` | `byggdel: 'Utomhusbelysning'`, `atgard: 'Byte'` |

#### 3.2 Ventilation

| Före | Efter |
|------|-------|
| `atgard: 'OVK (obligatorisk ventilationskontroll)'` | **BORTTAGEN** (dubblett — se 4.7) |
| `atgard: 'Fläktar – byte/service'` | `byggdel: 'Fläktar'`, `atgard: 'Byte/service'` |
| `atgard: 'Ventilationskanaler – rensning'` | `byggdel: 'Ventilationskanaler'`, `atgard: 'Rensning'` |

#### 3.3 Värmesystem

| Före | Efter |
|------|-------|
| `atgard: 'Uppgradering värmesystem'` | `byggdel: 'Värmesystem'`, `atgard: 'Uppgradering'` |
| `atgard: 'Fjärrvärmeväxlare/panna – byte'` | `byggdel: 'Fjärrvärmeväxlare'`, `atgard: 'Byte'` |
| `atgard: 'Cirkulationspumpar'` | `byggdel: 'Cirkulationspumpar'`, `atgard: 'Byte'` |
| `atgard: 'Termostater/styrsystem'` | `byggdel: 'Styrsystem'`, `atgard: 'Uppgradering/byte'` |

#### 3.4 VA system

| Före | Efter |
|------|-------|
| `atgard: 'Stammar – relining/byte'` | `byggdel: 'Stammar'`, `atgard: 'Relining/byte'` |
| `atgard: 'Avloppsspolning (återkommande)'` | `byggdel: 'Avlopp'`, `atgard: 'Spolning'` |
| `atgard: 'Vattenledningar – översyn'` | `byggdel: 'Vattenledningar'`, `atgard: 'Översyn'` |

---

### Sektion 4: Säkerhet & myndighetskrav

Befintlig struktur behållen. Enda ändringen:

| Ändring | Detalj |
|---------|--------|
| 4.7 OVK | `year_2029: 20000` tillagd (flyttad från borttagen 3.2-rad) |

---

## Sammanfattning

| Typ av ändring | Antal |
|----------------|-------|
| `byggdel` + `atgard` uppdelad korrekt | 27 rader |
| Dubblett borttagen (OVK under 3.2) | 1 rad |
| Kostnad flyttad till 4.7 | 1 rad |
| **Totalt berörda rader** | **28** |

## Ej ändrat

- Sektions- och subsection-namn (1.1 Fasader, 2.1 Källare etc.)
- Alla belopp, livslängder (utom OVK-flytten)
- Summary-rader
- info_url-fält
