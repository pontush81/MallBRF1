# GDPR Article 30 - Record of Processing Activities
## BRF Gulmåran

**Dokument uppdaterat:** {current_date}  
**Personuppgiftsansvarig:** Bostadsrättsförening Gulmåran  
**Organisationsnummer:** 769639-5420  
**Kontaktperson:** BRF Gulmåran  
**E-post:** gulmaranbrf@gmail.com  

---

## 1. MEDLEMSADMINISTRATION

**Ändamål:** Administration av medlemskap enligt Bostadsrättslagen  
**Kategorier av registrerade:** Medlemmar i BRF Gulmåran  
**Kategorier av personuppgifter:**
- Namn, personnummer, adress
- Telefonnummer, e-postadress
- Lägenhetsnummer, andelstal
- Ekonomisk information (avgifter, skulder)

**Kategorier av mottagare:**
- Styrelseledamöter
- Extern redovisningskonsult
- HSB (vid rapportering)
- Supabase (databas)

**Överföringar till tredje land:**
- Google/Firebase (USA) - DPF + SCCs
- Vercel hosting (USA) - SCCs

**Lagringsperioder:**
- Under medlemskap + 2 år (Bostadsrättslagen)

**Rättslig grund:**
- Avtal (medlemskap)
- Rättslig förpliktelse (Bostadsrättslagen)

**Säkerhetsåtgärder:**
- Kryptering vid transport och lagring
- Åtkomstkontroll med autentisering
- Säkerhetskopior med kryptering
- Regelbundna säkerhetsuppdateringar

---

## 2. BOKNINGSHANTERING

**Ändamål:** Administration av gemensamma faciliteter  
**Kategorier av registrerade:** Medlemmar som gör bokningar  
**Kategorier av personuppgifter:**
- Namn, lägenhetsnummer
- Bokningsdatum och typ
- E-postadress för bekräftelser

**Kategorier av mottagare:**
- Styrelseledamöter
- Andra medlemmar (vid konflikter)
- Supabase (databas)

**Överföringar till tredje land:**
- Google/Firebase (USA) - DPF + SCCs
- Vercel hosting (USA) - SCCs

**Lagringsperioder:**
- 3 år efter bokning (ekonomisk redovisning)

**Rättslig grund:**
- Berättigat intresse (effektiv administration)

**Säkerhetsåtgärder:**
- Kryptering vid transport och lagring
- Åtkomstkontroll med autentisering
- Auditlogg för ändringar

---

## 3. AUTENTISERING OCH INLOGGNING

**Ändamål:** Säker åtkomst till medlemsportalen  
**Kategorier av registrerade:** Registrerade användare  
**Kategorier av personuppgifter:**
- E-postadress
- Krypterat lösenord/hash
- Inloggningsloggar (IP, tidpunkt)
- Sessionsinformation

**Kategorier av mottagare:**
- Google/Firebase (autentiseringstjänst)
- Supabase (sessionhantering)

**Överföringar till tredje land:**
- Google/Firebase (USA) - DPF + SCCs

**Lagringsperioder:**
- Konto: under medlemskap + 6 månader
- Sessionsdata: 30 dagar
- Säkerhetsloggar: 1 år

**Rättslig grund:**
- Avtal (tillhandahålla tjänst)
- Berättigat intresse (IT-säkerhet)

**Säkerhetsåtgärder:**
- Lösenordshashning med bcrypt
- HTTPS/TLS-kryptering
- Sessionstimeout
- Försöksräkning för inloggning

---

## 4. KOMMUNIKATION

**Ändamål:** Information till medlemmar  
**Kategorier av registrerade:** Medlemmar  
**Kategorier av personuppgifter:**
- E-postadress
- Namn
- Kommunikationshistorik

**Kategorier av mottagare:**
- E-postleverantör (Supabase/Google)
- Styrelseledamöter

**Överföringar till tredje land:**
- Google/Firebase (USA) - DPF + SCCs

**Lagringsperioder:**
- 2 år (dokumentation av föreningskommunikation)

**Rättslig grund:**
- Berättigat intresse (medlemsinformation)
- Avtal (medlemskap)

**Säkerhetsåtgärder:**
- Kryptering av e-posttrafik
- Åtkomstkontroll till system

---

## 5. WEBSITEANALYS OCH COOKIES

**Ändamål:** Webbplatsens funktion och användarupplevelse  
**Kategorier av registrerade:** Besökare på webbplatsen  
**Kategorier av personuppgifter:**
- IP-adress (pseudonymiserad)
- Webbläsarinformation
- Cookie-preferenser

**Kategorier av mottagare:**
- Vercel (hosting)
- Lokalt lagrat (cookies)

**Överföringar till tredje land:**
- Vercel (USA) - SCCs

**Lagringsperioder:**
- Tekniska cookies: 30 dagar
- Funktionella cookies: 1 år
- IP-loggar: 30 dagar

**Rättslig grund:**
- Nödvändiga cookies: Berättigat intresse
- Funktionella cookies: Samtycke

**Säkerhetsåtgärder:**
- IP-anonymisering
- Cookie-samtycke banner
- Minimal datainsamling

---

## SÄKERHETSÅTGÄRDER (ÖVERGRIPANDE)

### Tekniska åtgärder:
- End-to-end kryptering (TLS 1.3)
- Databaskryptering i vila (AES-256)
- Säker autentisering (OAuth 2.0, JWT)
- Regelbundna säkerhetsuppdateringar
- Brandvägg och intrångsskydd
- Säkerhetskopior med kryptering

### Organisatoriska åtgärder:
- Åtkomstkontroll baserat på behov
- Regelbunden utbildning av styrelse
- Incidenthanteringsplan
- GDPR-rättighethantering via formulär
- Regelbunden översyn av processer
- Säkerhetsrevision minst årligen

---

## RÄTTIGHETSHANTERING

**Process för datasubjects rättigheter:**
1. Begäran via GDPR-formulär eller e-post
2. Identitetsverifiering inom 72 timmar
3. Behandling och svar inom 30 dagar
4. Dokumentation av alla begäranden

**Ansvarig för rättighetshantering:** BRF Gulmåran  
**Backup-ansvarig:** Styrelseordförande

---

## INCIDENTHANTERING

**Process vid dataintrång:**
1. Upptäckt och initial bedömning (inom 1 timme)
2. Säkerhetsåtgärder för att stoppa intrång (inom 4 timmar)
3. Riskbedömning för registrerade (inom 24 timmar)
4. Rapportering till IMY vid hög risk (inom 72 timmar)
5. Information till registrerade vid hög risk (utan onödigt dröjsmål)

**Kontaktuppgifter för incidenter:**
- Primär: gulmaranbrf@gmail.com
- IMY: imy@imy.se, 08-657 61 00

---

**Senast granskad av:** BRF Gulmåran  
**Nästa granskning:** {next_review_date}  
**Version:** 1.0 