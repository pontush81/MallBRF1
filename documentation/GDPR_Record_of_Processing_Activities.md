# Record of Processing Activities (RoPA)
**BRF Gulmåran - GDPR Artikel 30**

*Skapad: 2025-01-28*  
*Senast uppdaterad: 2025-01-28*  
*Version: 1.0*

---

## 1. PERSONUPPGIFTSANSVARIG

**Personuppgiftsansvarig:** BRF Gulmåran  
**Organisationsnummer:** [Organisationsnummer]  
**Adress:** [Adress]  
**E-post:** gulmaranbrf@gmail.com  
**E-post (allmän):** gulmaranbrf@gmail.com  
**Adress:** Köpmansgatan 80, 269 31 Båstad  

**Kontaktperson för GDPR-frågor:** BRF Gulmåran  
**E-post:** gulmaranbrf@gmail.com  

---

## 2. BEHANDLINGSAKTIVITETER

### 2.1 MEDLEMSREGISTER OCH ANVÄNDARKONTON

**Ändamål:** Hantering av medlemskap i bostadsrättsföreningen  
**Rättslig grund:** Rättslig förpliktelse (GDPR Art. 6.1.c) - Bostadsrättslagen  
**Kategorier av personuppgifter:**
- Namn, personnummer, adress
- E-postadress, telefonnummer
- Lägenhetsnummer, andelstal
- Kontoinformation för avgifter

**Kategorier av registrerade:** Medlemmar i BRF Gulmåran  
**Kategorier av mottagare:** Styrelsen, revisorer, HSB (förvaltning)  
**Lagringsperiod:** Under medlemskapet + 7 år efter utträde (bokföringslag)  
**Säkerhetsåtgärder:** 
- Krypterad datalagring i Supabase
- Rollbaserad åtkomstkontroll
- Multifaktorautentisering för administratörer
- Regelbunden backup med kryptering

---

### 2.2 BOKNINGSYSTEM FÖR GEMENSAMMA UTRYMMEN

**Ändamål:** Administration av bokningar av gästlägenhet och gemensamma utrymmen  
**Rättslig grund:** Berättigat intresse (GDPR Art. 6.1.f) - Effektiv administration av gemensamma resurser  
**Kategorier av personuppgifter:**
- Namn, lägenhetsnummer
- E-postadress, telefonnummer
- Bokningsdatum och tider
- Betalningsinformation

**Kategorier av registrerade:** Medlemmar som bokar gemensamma utrymmen  
**Kategorier av mottagare:** Styrelsen, HSB (för fakturering)  
**Lagringsperiod:** 3 år efter bokningsdatum (bokföringslag)  
**Säkerhetsåtgärder:** 
- End-to-end kryptering av bokningsdata
- Automatisk anonymisering efter lagringsperiod
- Säker API-kommunikation (HTTPS/TLS)

---

### 2.3 KOMMUNIKATION OCH INFORMATION

**Ändamål:** Information till medlemmar om föreningsärenden  
**Rättslig grund:** Berättigat intresse (GDPR Art. 6.1.f) - Medlemsinformation  
**Kategorier av personuppgifter:**
- Namn, e-postadress
- Lägenhetsnummer
- Kommunikationshistorik

**Kategorier av registrerade:** Medlemmar i BRF Gulmåran  
**Kategorier av mottagare:** Styrelsen  
**Lagringsperiod:** Under medlemskapet + 1 år  
**Säkerhetsåtgärder:** 
- Säker e-posthantering
- Loggning av all kommunikation
- Opt-out möjligheter för icke-kritisk kommunikation

---

### 2.4 WEBBPLATSANVÄNDNING OCH AUTENTISERING

**Ändamål:** Säker inloggning och användarautentisering  
**Rättslig grund:** Samtycke (GDPR Art. 6.1.a) för social inloggning, Berättigat intresse för säkerhet  
**Kategorier av personuppgifter:**
- Inloggningsuppgifter (Firebase Authentication)
- IP-adresser, användaragens
- Session-cookies och tekniska identifierare
- Google/Facebook profil-ID (vid social inloggning)

**Kategorier av registrerade:** Alla användare av webbplatsen  
**Kategorier av mottagare:** Firebase (Google), Supabase  
**Lagringsperiod:** Under aktiv session + 30 dagar för säkerhetsloggar  
**Säkerhetsåtgärder:** 
- OAuth 2.0 autentisering
- Session-hantering med timeout
- Säkra cookies (HttpOnly, Secure, SameSite)
- IP-baserad åtkomstloggning

---

### 2.5 AUDIT OCH SÄKERHETSLOGGNING

**Ändamål:** Säkerhet, övervakning och GDPR-compliance  
**Rättslig grund:** Berättigat intresse (GDPR Art. 6.1.f) - IT-säkerhet och rättslig efterlevnad  
**Kategorier av personuppgifter:**
- Användar-ID och e-postadresser
- IP-adresser, tidsstämplar
- Databasoperationer och åtkomstloggar
- GDPR-förfrågningar och deras hantering

**Kategorier av registrerade:** Alla användare av systemet  
**Kategorier av mottagare:** Systemadministratörer, vid behov tillsynsmyndigheter  
**Lagringsperiod:** 3 år för säkerhetsloggar, 7 år för GDPR-förfrågningar  
**Säkerhetsåtgärder:** 
- Krypterad logglagring
- Åtkomstbegränsning till administratörer
- Automatisk anonymisering efter lagringsperiod
- Säker export för myndighetsförfrågningar

---

## 3. TREDJEPARTSBEHANDLARE

### 3.1 FIREBASE (GOOGLE LLC)

**Tjänst:** Autentisering och användarhantering  
**Behandlade data:** Användaridentiteter, inloggningsuppgifter  
**Plats:** USA (med lämpliga skyddsåtgärder)  
**DPA-status:** Google Cloud Data Processing Amendment  
**Säkerhetsåtgärder:** SOC 2 Type II, ISO 27001 certifiering  

### 3.2 SUPABASE

**Tjänst:** Databas och backend-tjänster  
**Behandlade data:** Alla applikationsdata  
**Plats:** EU (Frankfurt)  
**DPA-status:** Supabase DPA under tecknande  
**Säkerhetsåtgärder:** PostgreSQL kryptering, Row Level Security  

### 3.3 VERCEL INC.

**Tjänst:** Webbhosting och CDN  
**Behandlade data:** Webbplatsloggar, prestanda-metrics  
**Plats:** USA/EU  
**DPA-status:** Vercel DPA under tecknande  
**Säkerhetsåtgärder:** Edge-kryptering, DDoS-skydd  

### 3.4 GOOGLE OAUTH

**Tjänst:** Social inloggning  
**Behandlade data:** Profil-ID, namn, e-post (med samtycke)  
**Plats:** USA  
**DPA-status:** Google Workspace DPA  
**Säkerhetsåtgärder:** OAuth 2.0, begränsade scopes  

---

## 4. DATAÖVERFÖRINGAR UTANFÖR EU/EES

**Firebase/Google Services:**
- **Mottagare:** Google LLC, USA
- **Skyddsåtgärder:** Standard Contractual Clauses (SCC 2021)
- **Tilläggsåtgärder:** Data Processing Impact Assessment (DPIA) genomförd
- **Överföringsbas:** Adequacy Decision (om tillämpligt) + SCC

**Vercel:**
- **Mottagare:** Vercel Inc., USA
- **Skyddsåtgärder:** Standard Contractual Clauses
- **Tilläggsåtgärder:** Edge-lagring i EU när möjligt

---

## 5. SÄKERHETSÅTGÄRDER (GDPR ART. 32)

### 5.1 TEKNISKA ÅTGÄRDER
- **Kryptering:** AES-256 för data i vila, TLS 1.3 för överföring
- **Åtkomstkontroll:** Rollbaserad (RBAC) med multifaktor autentisering
- **Pseudonymisering:** Automatisk anonymisering av gamla loggar
- **Säkerhetskopiering:** Daglig krypterad backup med geografisk separation

### 5.2 ORGANISATORISKA ÅTGÄRDER
- **Personal:** Träning i GDPR för alla med dataåtkomst
- **Policies:** Dokumenterade säkerhetspolicyer och rutiner
- **Incidenthantering:** Etablerat breach response team
- **Regelbunden granskning:** Kvartalsvisa säkerhetsaudits

---

## 6. DATASUBJEKTS RÄTTIGHETER

**Implementerade rättigheter:**
- ✅ Rätt till information (Art. 13-14)
- ✅ Rätt till åtkomst (Art. 15)
- ✅ Rätt till rättelse (Art. 16)
- ✅ Rätt till radering (Art. 17)
- ✅ Rätt till dataportabilitet (Art. 20)
- ✅ Rätt att invända (Art. 21)
- ✅ Automatiserat hanteringssystem via webbplatsen

**Svarstider:** Inom 30 dagar enligt GDPR Art. 12.3

---

## 7. REGELBUNDEN GRANSKNING OCH UPPDATERING

**Granskningsfrekvens:** Kvartalsvis eller vid väsentliga ändringar  
**Ansvarig för uppdatering:** Pontus Hörberg  
**Nästa planerade granskning:** 2025-04-28  

**Ändringshistorik:**
- 2025-01-28: Första version skapad
- [Datum]: [Ändringar]

---

**Dokumentet är konfidentiellt och ska hanteras enligt BRF Gulmårans säkerhetspolicy.** 