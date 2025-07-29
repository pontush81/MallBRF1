# Data Processing Agreement (DPA) Mallar
**BRF Gulmåran - GDPR Artikel 28 Compliance**

*Version: 1.0*  
*Skapad: 2025-01-28*  
*Senast uppdaterad: 2025-01-28*  
*Ansvarig: Pontus Hörberg*

---

## 1. INTRODUKTION

Detta dokument innehåller standardmallar för databehandlingsavtal (DPA) med tredjepartsleverantörer enligt GDPR Artikel 28. Avtalen säkerställer att all behandling av personuppgifter av externa leverantörer sker i enlighet med GDPR-kraven.

### 1.1 TILLÄMPNING

Dessa mallar ska användas för:
- Molntjänstleverantörer (SaaS, PaaS, IaaS)
- IT-tjänsteleverantörer
- Konsulter som behandlar personuppgifter
- Underhållsleverantörer med systemåtkomst

---

## 2. STANDARD DPA-MALL

### 2.1 GRUNDLÄGGANDE AVTALSSTRUKTUR

```
DATABEHANDLINGSAVTAL (DPA)
enligt Dataskyddsförordningen (GDPR)

Mellan:
BRF Gulmåran (Personuppgiftsansvarig)
Organisationsnummer: [Nummer]
Adress: [Adress]

Och:
[Leverantörsnamn] (Personuppgiftsbiträde)
Organisationsnummer: [Nummer]  
Adress: [Adress]

Detta avtal reglerar behandlingen av personuppgifter enligt GDPR
och kompletterar huvudavtalet daterat [Datum].
```

### 2.2 ARTIKEL 1: DEFINITIONER

**Personuppgifter:** All information som avser en identifierad eller identifierbar fysisk person enligt GDPR Artikel 4.1.

**Behandling:** Varje åtgärd eller serie av åtgärder enligt GDPR Artikel 4.2.

**Personuppgiftsansvarig:** BRF Gulmåran som bestämmer ändamål och medel för behandling.

**Personuppgiftsbiträde:** [Leverantörsnamn] som behandlar personuppgifter för den personuppgiftsansvarigas räkning.

**Säkerhetsincident:** Varje incident som kan påverka säkerheten för personuppgifter.

### 2.3 ARTIKEL 2: BEHANDLINGENS OMFATTNING

**Ändamål med behandlingen:**
- [Specificera exakt syfte]
- [Exempel: Användarautentisering och session management]
- [Exempel: Datalagring och backup-tjänster]

**Kategorier av registrerade:**
- Medlemmar i BRF Gulmåran
- Användare av föreningens digitala tjänster
- [Andra relevanta kategorier]

**Kategorier av personuppgifter:**
- Identitetsuppgifter (namn, e-post, telefon)
- Tekniska identifierare (IP-adresser, cookies)
- [Andra relevanta kategorier - specificera]

**Känsliga personuppgifter:** [Ja/Nej - specificera vilka om ja]

### 2.4 ARTIKEL 3: BITRÄDETS SKYLDIGHETER

#### 3.1 GRUNDLÄGGANDE FÖRPLIKTELSER
Personuppgiftsbiträdet åtar sig att:

a) **Behandla personuppgifter endast enligt dokumenterade instruktioner** från den personuppgiftsansvarige, inklusive överföringar till tredje land

b) **Säkerställa konfidentialitet** genom att all personal som behandlar personuppgifter har åtagit sig tystnadsplikt

c) **Implementera lämpliga tekniska och organisatoriska åtgärder** enligt GDPR Artikel 32

d) **Respektera villkoren** för att anlita annat personuppgiftsbiträde enligt Artikel 4

e) **Bistå den personuppgiftsansvarige** med att tillgodose begäran om utövande av den registrerades rättigheter

f) **Bistå den personuppgiftsansvarige** med att säkerställa efterlevnad av skyldigheterna enligt GDPR Artikel 32-36

g) **Radera eller returnera personuppgifter** vid avtalsupphörande

h) **Tillhandahålla information** och tillåta och bidra till revisioner

#### 3.2 TEKNISKA SÄKERHETSÅTGÄRDER
Personuppgiftsbiträdet ska implementera:

**Kryptering:**
- Data i vila: AES-256 minimum
- Data i transit: TLS 1.3 minimum
- Nyckelhantering: Säker nyckelrotation

**Åtkomstkontroll:**
- Multifaktor autentisering för administrativ åtkomst
- Rollbaserad åtkomstkontroll (RBAC)
- Regelbunden åtkomstgranskning

**Övervakning:**
- Kontinuerlig säkerhetsövervakning
- Automatiska säkerhetsvarningar
- Detaljerad audit logging

**Backup och återställning:**
- Automatiska, krypterade säkerhetskopior
- Testade återställningsprocedurer
- Geografiskt separerad lagring

#### 3.3 ORGANISATORISKA SÄKERHETSÅTGÄRDER

**Personal:**
- Bakgrundskontroller för personal med dataåtkomst
- Regelbunden säkerhetsutbildning
- Dokumenterade säkerhetspolicyer

**Processer:**
- Etablerade incident response procedurer
- Regelbunden sårbarhetshantering
- Change management processer

### 2.5 ARTIKEL 4: UNDERBITRÄDEN

#### 4.1 GODKÄNNANDE AV UNDERBITRÄDEN
**Generellt godkännande:** Den personuppgiftsansvarige godkänner att personuppgiftsbiträdet anlitar underbiträden enligt följande villkor:

a) **Skriftligt meddelande:** Minimum 30 dagar före ändringar av underbiträden
b) **Motsvarande skyldigheter:** Underbiträden ska ha samma GDPR-skyldigheter
c) **Fullständigt ansvar:** Personuppgiftsbiträdet är fullt ansvarigt för underbiträdets prestanda

#### 4.2 AKTUELLA UNDERBITRÄDEN
```
[Lista över godkända underbiträden vid avtalstecknande]

Namn: [Underbiträdesnamn]
Tjänst: [Beskrivning av tjänst]
Plats: [Geografisk plats]
Säkerhetsåtgärder: [Sammanfattning av säkerhetsåtgärder]
```

### 2.6 ARTIKEL 5: ÖVERFÖRINGAR TILL TREDJE LAND

#### 5.1 TILLÅTNA ÖVERFÖRINGAR
Överföringar till länder utanför EU/EES är endast tillåtna med:

a) **Adequacy Decision** från Europeiska kommissionen, ELLER
b) **Lämpliga skyddsåtgärder** enligt GDPR Artikel 46:
   - Standard Contractual Clauses (SCC 2021)
   - Bindande företagsregler
   - Godkända uppförandekoder med bindande garantier

#### 5.2 YTTERLIGARE SKYDDSÅTGÄRDER
För överföringar till USA eller andra högriskländer krävs:
- **Data Transfer Impact Assessment (DPIA)**
- **Tekniska skyddsåtgärder:** End-to-end kryptering
- **Organisatoriska åtgärder:** Begränsad åtkomst, transparens
- **Juridiska åtgärder:** Förstärkta avtalsklausuler

### 2.7 ARTIKEL 6: SÄKERHETSINCIDENTER

#### 6.1 ANMÄLNINGSPLIKT
Personuppgiftsbiträdet ska:

a) **Omedelbart anmäla** säkerhetsincidenter till den personuppgiftsansvarige
b) **Inom 24 timmar** tillhandahålla skriftlig rapport
c) **Kontinuerligt uppdatera** med ny information
d) **Fullständigt samarbeta** med incidenthantering

#### 6.2 INCIDENTRAPPORT SKA INNEHÅLLA
- Beskrivning av incidentens karaktär
- Kategorier och uppskattade antal registrerade
- Kategorier av påverkade personuppgifter
- Sannolika konsekvenser
- Vidtagna eller planerade åtgärder

### 2.8 ARTIKEL 7: REGISTRERADES RÄTTIGHETER

#### 7.1 STÖD FÖR UTÖVANDE AV RÄTTIGHETER
Personuppgiftsbiträdet ska bistå med:

**Teknisk support för:**
- Rätt till åtkomst (Artikel 15)
- Rätt till rättelse (Artikel 16)
- Rätt till radering (Artikel 17)
- Rätt till begränsning (Artikel 18)
- Rätt till dataportabilitet (Artikel 20)

**Svarstid:** Inom 10 arbetsdagar från begäran

#### 7.2 AVGIFTER
Rimliga kostnader för omfattande förfrågningar kan debiteras efter överenskommelse.

### 2.9 ARTIKEL 8: REVISION OCH GRANSKNING

#### 8.1 REVISIONSRÄTTIGHETER
Den personuppgiftsansvarige har rätt att:
- Genomföra revisioner av säkerhetsåtgärder
- Begära dokumentation av compliance
- Anlita externa revisorer
- Få tillgång till relevanta säkerhetsrapporter

#### 8.2 CERTIFIERINGAR OCH STANDARDER
Personuppgiftsbiträdet ska upprätthålla:
- ISO 27001 certifiering (eller motsvarande)
- SOC 2 Type II rapporter
- Regelbundna penetrationstester
- Säkerhetsaudits av tredje part

### 2.10 ARTIKEL 9: AVTALSPERIOD OCH UPPSÄGNING

#### 9.1 GILTIGHETSTID
Detta DPA gäller under hela huvudavtalets löptid.

#### 9.2 DATABEHANDLING VID UPPSÄGNING
Vid avtalsupphörande ska personuppgiftsbiträdet:
- **Inom 30 dagar** radera eller returnera all persondata
- **Certifiera skriftligt** att all data har raderats
- **Radera backup-kopior** enligt överenskommen tidsplan
- **Bevara data** endast för att uppfylla rättsliga krav

---

## 3. LEVERANTÖRSSPECIFIKA DPA-TILLÄGG

### 3.1 FIREBASE/GOOGLE CLOUD

```
TILLÄGG FÖR GOOGLE CLOUD/FIREBASE SERVICES

Specifika villkor:
- Omfattas av Google Cloud Data Processing Amendment
- Datalagring: Primärt EU-regioner (europe-west1)
- Kryptering: Google-managed encryption keys
- Överföringar: USA med Standard Contractual Clauses
- Support: 24/7 enterprise support för säkerhetsincidenter

Särskilda åtgärder:
- DPIA genomförd för USA-överföringar
- Begränsade scopes för OAuth-åtkomst
- Regelbunden access token rotation
- Audit logging aktiverat
```

### 3.2 SUPABASE

```
TILLÄGG FÖR SUPABASE SERVICES

Specifika villkor:
- Datalagring: EU-regioner (Frankfurt, Tyskland)
- Kryptering: AES-256 encryption at rest
- Åtkomst: Row Level Security (RLS) enforced
- Backup: Automatiska dagliga backuper
- Övervakning: Real-time database monitoring

Särskilda åtgärder:
- Dedikerad Supabase DPA tecknande
- Custom backup retention policies
- Dedicated instance för känslig data
- Extended audit logging
```

### 3.3 VERCEL

```
TILLÄGG FÖR VERCEL HOSTING

Specifika villkor:
- CDN: Global distribution med EU-fokus
- Säkerhet: Automatiska DDoS-skydd
- Certifikat: Automatiska SSL/TLS certifikat
- Logging: Edge function execution logs
- Överföringar: USA/EU med lämpliga skyddsåtgärder

Särskilda åtgärder:
- Environment-specific deployment
- Säkra environment variables
- Audit trail för deployments
- Geographic restrictions för känslig data
```

---

## 4. DPA FÖRHANDLINGS-CHECKLISTA

### 4.1 FÖRE FÖRHANDLING

**Förberedelser:**
- [ ] Identifiera alla dataflöden till leverantören
- [ ] Klassificera personuppgifter efter känslighet
- [ ] Genomför leverantörssäkerhetsbedömning
- [ ] Granska leverantörens standard-DPA
- [ ] Identifiera gap mot GDPR-krav
- [ ] Förbered förhandlingsposition

### 4.2 KRITISKA FÖRHANDLINGSPUNKTER

**Måste-ha krav:**
- [ ] GDPR Artikel 28 compliance
- [ ] Tydliga data retention policies
- [ ] Incident notification inom 24 timmar
- [ ] Rätt till revision och audit
- [ ] Data return/deletion vid uppsägning
- [ ] Begränsning av underbiträden
- [ ] Standard Contractual Clauses för tredje lands-överföringar

**Önskvärda förbättringar:**
- [ ] Kortare incident notification tider
- [ ] Starkare krypteringskrav
- [ ] Mer restriktiva underbiträdes-policies
- [ ] Utökade revisionsrättigheter
- [ ] Prestanda-garantier för säkerhet

### 4.3 EFTER AVTALSTECKNANDE

**Implementation:**
- [ ] Dokumentera avtal i leverantörsregister
- [ ] Konfigurera säkerhetsövervakning
- [ ] Etablera kommunikationskanaler
- [ ] Genomför initial säkerhetsreview
- [ ] Planera regelbundna granskningar

---

## 5. LEVERANTÖRSREGISTER

### 5.1 AKTUELLA LEVERANTÖRER

| Leverantör | Tjänst | DPA Status | Granskning | Förfallodatum |
|------------|--------|------------|------------|---------------|
| Firebase | Autentisering | ✅ Aktivt | 2025-01-15 | 2026-01-15 |
| Supabase | Databas | 🔄 Under tecknande | - | - |
| Vercel | Hosting | 🔄 Under tecknande | - | - |
| Google OAuth | Social login | ✅ Aktivt | 2025-01-15 | 2026-01-15 |

### 5.2 UPPFÖLJNINGSSCHEMA

**Kvartalsvis granskning:**
- Compliance status review
- Säkerhetsincident analys
- Avtalsefterlevnad
- Prestandametriker

**Årlig förhandling:**
- Avtalsförnyelse
- Uppdaterade säkerhetskrav
- Kostnadsnegotiering
- Tekniska förbättringar

---

## 6. KONTAKTINFORMATION

**DPA-ansvarig:** Pontus Hörberg  
**E-post:** gulmaranbrf@gmail.com  
**E-post (allmän):** gulmaranbrf@gmail.com  
**Adress:** Köpmansgatan 80, 269 31 Båstad  

**Juridisk rådgivare:**  
**Firma:** [Advokatfirma]  
**Kontakt:** [Namn och kontaktuppgifter]  

**Leverantörskontakter:**
- **Firebase/Google:** [Kontaktinformation]
- **Supabase:** [Kontaktinformation]  
- **Vercel:** [Kontaktinformation]

---

## 7. VERSIONSHANTERING

**Godkänt av:** Styrelsen BRF Gulmåran  
**Godkännandedatum:** 2025-01-28  
**Nästa granskning:** 2025-04-28  

**Versionshistorik:**
- Version 1.0 (2025-01-28): Initial version med standardmallar
- [Framtida ändringar dokumenteras här]

---

**Dokumentklassificering:** Konfidentiellt - Juridiskt dokument  
**Distribution:** Styrelse, Jurister, Kontraktsansvariga  
**Arkivering:** Under avtalstid + 7 år 