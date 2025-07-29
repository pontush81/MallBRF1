# Data Protection Impact Assessment (DPIA)
**BRF Gulmåran - GDPR Artikel 35**

*Genomförd: 2025-01-28*  
*Ansvarig: Pontus Hörberg*  
*Status: Godkänd*  
*Nästa granskning: 2025-07-28*

---

## 1. SAMMANFATTNING

**Behandlingsaktivitet:** BRF Gulmåran digitala medlemshanteringssystem  
**DPIA-trigger:** Systematisk övervakning, högriskbehandling av personuppgifter  
**Riskbedömning:** Medel-hög risk  
**Slutsats:** Behandlingen kan genomföras med implementerade skyddsåtgärder  

---

## 2. BESKRIVNING AV BEHANDLINGEN

### 2.1 SYFTE OCH SAMMANHANG

**Övergripande syfte:**
Digitalt system för hantering av medlemskap, bokningar och kommunikation inom BRF Gulmåran.

**Specifika ändamål:**
1. Medlemsregister enligt bostadsrättslagen
2. Bokning av gemensamma utrymmen (gästlägenhet, tvättstuga)
3. Information och kommunikation till medlemmar
4. Ekonomisk administration (avgifter, fakturering)
5. HSB-rapportering för månadsdebitering

**Organisatoriskt sammanhang:**
- Bostadsrättsförening med ca 20 medlemmar
- Digital transformation från pappersbased administration
- Integration med HSB för förvaltningsrapportering

### 2.2 TEKNISK BESKRIVNING

**Systemarkitektur:**
- **Frontend:** React-applikation (Vercel hosting)
- **Backend:** Supabase PostgreSQL databas
- **Autentisering:** Firebase Authentication
- **Edge Functions:** Supabase för GDPR-hantering och rapportering

**Dataflöde:**
1. Användare loggar in via Firebase Auth
2. Data lagras i Supabase med Row Level Security
3. Rapporter genereras via Edge Functions
4. Audit logging för all dataåtkomst

---

## 3. NÖDVÄNDIGHET OCH PROPORTIONALITET

### 3.1 NÖDVÄNDIGHETSANALYS

**Rättslig nödvändighet:**
✅ **Medlemsregister:** Obligatoriskt enligt bostadsrättslagen  
✅ **Ekonomisk administration:** Krävs för föreningsdrift  
✅ **Kommunikation:** Nödvändigt för medlemsinformation  

**Proportionalitetsanalys:**
- **Dataminimering:** Endast nödvändiga uppgifter samlas in
- **Ändamålsbegränsning:** Klar koppling mellan syfte och behandling
- **Lagringstid:** Begränsad enligt bokföringslag och föreningsbehov

### 3.2 ALTERNATIVA LÖSNINGAR UTVÄRDERADE

1. **Pappersbased administration** 
   - ❌ Ineffektiv, höga administrativa kostnader
   - ❌ Svårare att säkerställa säkerhet och åtkomst

2. **Extern förvaltningslösning**
   - ❌ Högre kostnader, mindre kontroll över data
   - ❌ Begränsad anpassning till specifika behov

3. **Egen serverinfrastruktur**
   - ❌ Höga säkerhetskrav, teknisk komplexitet
   - ❌ Oproportionerliga kostnader för liten förening

**Slutsats:** Nuvarande molnbaserade lösning är mest proportionerlig.

---

## 4. RISKANALYS

### 4.1 IDENTIFIERADE RISKER

#### RISK 1: OBEHÖRIG ÅTKOMST TILL MEDLEMSDATA
**Sannolikhet:** Medel  
**Konsekvens:** Hög  
**Riskbedömning:** Hög  

**Beskrivning:** Risk för att obehöriga får åtkomst till känsliga medlemsuppgifter  
**Berörda rättigheter:** Rätt till privatliv, dataskydd  

**Skyddsåtgärder:**
- ✅ Multifaktorautentisering för administratörer
- ✅ Rollbaserad åtkomstkontroll (RBAC)
- ✅ Regular audit logging och övervakning
- ✅ Krypterad datalagring (AES-256)

**Resterande risk:** Låg

#### RISK 2: DATAINTRÅNG HOS TREDJEPARTSLEVERANTÖR
**Sannolikhet:** Låg  
**Konsekvens:** Hög  
**Riskbedömning:** Medel  

**Beskrivning:** Risk för säkerhetsincident hos Supabase, Firebase eller Vercel  
**Berörda rättigheter:** Dataskydd, informationssäkerhet  

**Skyddsåtgärder:**
- ✅ Val av leverantörer med höga säkerhetsstandarder (SOC 2, ISO 27001)
- ✅ Databehandlingsavtal (DPA) med alla leverantörer
- ✅ Regelbunden backup med geografisk separation
- ✅ Incident response plan etablerad

**Resterande risk:** Låg

#### RISK 3: OTILLRÄCKLIG INFORMATION TILL REGISTRERADE
**Sannolikhet:** Medel  
**Konsekvens:** Medel  
**Riskbedömning:** Medel  

**Beskrivning:** Risk för bristfällig transparens om databehandling  
**Berörda rättigheter:** Rätt till information  

**Skyddsåtgärder:**
- ✅ Detaljerad privacy policy på webbplatsen
- ✅ Cookie consent banner med granulära val
- ✅ Tydlig information vid datainsamling
- ✅ GDPR request form för utövande av rättigheter

**Resterande risk:** Mycket låg

#### RISK 4: ÖVERDRIVEN DATALAGRING
**Sannolikhet:** Medel  
**Konsekvens:** Medel  
**Riskbedömning:** Medel  

**Beskrivning:** Risk för att data lagras längre än nödvändigt  
**Berörda rättigheter:** Dataminimering, lagringstid  

**Skyddsåtgärder:**
- ✅ Definierade lagringsperioder för varje datatyp
- ✅ Automatisk anonymisering/radering efter lagringsperiod
- ✅ Regelbunden granskning av datamängder
- ✅ GDPR request hantering för förtida radering

**Resterande risk:** Låg

### 4.2 RISKER FÖR SPECIFIKA GRUPPER

**Äldre medlemmar:**
- **Risk:** Svårighet att förstå digitala rättigheter och consent
- **Åtgärd:** Fysisk hjälp och utbildning erbjuds

**Barn/ungdomar i familjer:**
- **Risk:** Indirekt behandling via föräldrarnas medlemskap
- **Åtgärd:** Särskild uppmärksamhet på dataminimering

---

## 5. KONSULTATION

### 5.1 INTERNA KONSULTATIONER

**Styrelsen BRF Gulmåran:**
- Datum: 2025-01-15
- Deltagare: Styrelsemedlemmar
- Resultat: Godkännande av DPIA och skyddsåtgärder

**IT-ansvarig:**
- Datum: 2025-01-20
- Resultat: Tekniska skyddsåtgärder verifierade

### 5.2 EXTERNA KONSULTATIONER

**Dataskyddsombud (DPO):**
- Status: Inte obligatoriskt för BRF av denna storlek
- Planerat: Konsultation med extern DPO vid behov

**Tillsynsmyndighet (IMY):**
- Status: Ingen konsultation krävs baserat på riskbedömning
- Beredskap: DPIA skickas till IMY vid förfrågan

---

## 6. SLUTSATSER OCH REKOMMENDATIONER

### 6.1 ÖVERGRIPANDE BEDÖMNING

**Risknivå före skyddsåtgärder:** Hög  
**Risknivå efter skyddsåtgärder:** Låg-Medel  
**Rekommendation:** ✅ Behandlingen kan genomföras

### 6.2 KRITISKA FRAMGÅNGSFAKTORER

1. **Kontinuerlig säkerhetsövervakning**
2. **Regelbunden uppdatering av säkerhetspolicies**
3. **Löpande utbildning av administratörer**
4. **Snabb incident response vid säkerhetsincidenter**

### 6.3 UPPFÖLJNINGSPLAN

**Kvartalsgranskning:**
- Audit logging analys
- Säkerhetsincident review
- Uppdatering av riskbedömning

**Årlig översyn:**
- Fullständig DPIA-uppdatering
- Leverantörssäkerhet evaluation
- Ny teknik och hot assessment

---

## 7. GODKÄNNANDE

**DPIA godkänd av:**
- **Personuppgiftsansvarig:** BRF Gulmåran Styrelse
- **Datum:** 2025-01-28
- **Nästa obligatoriska granskning:** 2025-07-28

**Underskrift:**
_[Digital signatur eller fysisk underskrift]_

**Villkor för godkännande:**
1. Alla identifierade skyddsåtgärder måste implementeras före produktionssättning
2. Incident response plan måste vara operativ
3. DPA-avtal måste tecknas med alla tredjepartsleverantörer

---

## BILAGOR

**Bilaga A:** Teknisk säkerhetsanalys  
**Bilaga B:** Leverantörssäkerhetsbedömningar  
**Bilaga C:** Incident response plan  
**Bilaga D:** Rättslig analys av bostadsrättslagen  

---

**Dokumentklassificering:** Konfidentiell  
**Distribution:** Styrelsen, IT-ansvarig  
**Arkivering:** 3 år enligt GDPR compliance krav 