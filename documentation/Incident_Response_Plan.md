# Incident Response Plan för Dataintrång
**BRF Gulmåran - GDPR Artikel 33 & 34**

*Version: 1.0*  
*Skapad: 2025-01-28*  
*Senast uppdaterad: 2025-01-28*  
*Ansvarig: Pontus Hörberg*

---

## 1. SYFTE OCH OMFATTNING

**Syfte:** Säkerställa snabb, strukturerad och korrekt hantering av dataintrång enligt GDPR-krav.

**Omfattning:** Alla behandlingar av personuppgifter inom BRF Gulmåran, inklusive:
- Medlemsdata i digital form
- Bokningssystem
- E-postkommunikation
- Webbaserade tjänster
- Tredjepartstjänster (Firebase, Supabase, Vercel)

**Tillämpningsområde:** Alla typer av säkerhetsincidenter som kan påverka personuppgifter.

---

## 2. DEFINITIONER

**Dataintrång (Personal Data Breach):** 
En säkerhetsincident som leder till oavsiktlig eller olaglig förstöring, förlust, ändring, obehörigt röjande av eller obehörig åtkomst till personuppgifter.

**Typer av dataintrång:**
- **Konfidentialitet (Confidentiality):** Obehörig åtkomst eller röjande
- **Integritet (Integrity):** Oavsiktlig ändring av data
- **Tillgänglighet (Availability):** Förlust av åtkomst till data

---

## 3. INCIDENT RESPONSE TEAM

### 3.1 ROLLER OCH ANSVAR

**Incident Commander (IC) - Pontus Hörberg**
- **Primärt ansvar:** Övergripande ledning av incident response
  - **E-post (allmän):** gulmaranbrf@gmail.com  
  - **Adress:** Köpmansgatan 80, 269 31 Båstad
- **E-post:** gulmaranbrf@gmail.com
- **Ansvar:**
  - Beslut om incidentklassificering
  - Aktivering av response team
  - Kommunikation med styrelsen
  - Beslut om myndighetskontakt

**Teknisk Ansvarig - [Namn]**
- **Ansvar:**
  - Teknisk undersökning och åtgärder
  - Logganalys och forensics
  - Systemåterställning
  - Dokumentation av tekniska åtgärder

**Kommunikationsansvarig - [Styrelseordförande]**
- **Ansvar:**
  - Extern kommunikation
  - Medlemsinformation
  - Myndighetskontakt (IMY)
  - Mediehantering vid behov

**Juridisk Rådgivare - [Extern konsult]**
- **Ansvar:**
  - Juridisk bedömning
  - GDPR-compliance verifiering
  - Stöd vid myndighetskontakt

### 3.2 ESKALERING

**Nivå 1:** Teknisk incident (ingen persondata påverkad)  
**Nivå 2:** Potentiellt dataintrång (persondata kan vara påverkad)  
**Nivå 3:** Bekräftat dataintrång (persondata definitivt påverkad)  
**Nivå 4:** Allvarligt dataintrång (hög risk för registrerade)  

---

## 4. INCIDENT RESPONSE PROCESS

### FAS 1: UPPTÄCKT OCH RAPPORTERING (0-1 timmar)

#### 4.1 UPPTÄCKT
**Möjliga upptäcktsätt:**
- Automatiska säkerhetsvarningar
- Användarrapporter
- Säkerhetsövervakning
- Leverantörsmeddelanden
- Revisorsobservationer

#### 4.2 INITIAL RAPPORTERING
**Intern rapportering:**
1. ✅ Upptäckaren kontaktar omedelbart Incident Commander
2. ✅ IC dokumenterar initial information i incident log
3. ✅ IC aktiverar response team inom 30 minuter

**Initial dokumentation ska innehålla:**
- Tidpunkt för upptäckt
- Vem som upptäckte incidenten
- Beskrivning av observerat problem
- Påverkade system/tjänster
- Misstänkt orsak

### FAS 2: VERIFIERING OCH KLASSIFICERING (1-4 timmar)

#### 4.3 VERIFIERING
**Verifieringsaktiviteter:**
1. ✅ Teknisk undersökning av påstådd incident
2. ✅ Logganalys för att bekräfta obehörig aktivitet
3. ✅ Kontakt med systemleverantörer vid behov
4. ✅ Bedömning av persondata-påverkan

#### 4.4 RISKBEDÖMNING
**Faktorer att utvärdera:**
- **Typ av personuppgifter:** Känsliga vs. icke-känsliga
- **Antal registrerade:** Omfattning av påverkan
- **Sannolikhet för missbruk:** Risk för identitetskapning etc.
- **Tekniska skyddsåtgärder:** Kryptering, pseudonymisering
- **Organisatoriska åtgärder:** Åtkomstbegränsningar

**Riskmatris:**
- **Låg risk:** Krypterad data, begränsad omfattning, tekniska fel
- **Medel risk:** Okrypterad data, större omfattning, mänskligt fel
- **Hög risk:** Känslig data, systematisk attack, stor påverkan

### FAS 3: INNESLUTNING OCH STABILISERING (4-8 timmar)

#### 4.5 INNESLUTNING
**Omedelbara åtgärder:**
1. ✅ Isolera påverkade system
2. ✅ Stoppa fortsatt dataläckage
3. ✅ Bevara forensisk bevisning
4. ✅ Dokumentera alla åtgärder

**Specifika åtgärder per system:**
- **Supabase:** Temporär blockering av användarkonton
- **Firebase:** Återkallning av access tokens
- **Vercel:** Tillfällig nedstängning av tjänsten
- **E-post:** Ändring av lösenord och åtkomstnycklar

#### 4.6 STABILISERING
1. ✅ Säkerställ att angreppsvektorn är stängd
2. ✅ Verifiera systemintegritet
3. ✅ Återställ säker drift
4. ✅ Implementera temporära extra säkerhetsåtgärder

### FAS 4: ANMÄLAN OCH KOMMUNIKATION (inom 72 timmar)

#### 4.7 MYNDIGHETSKONTAKT (IMY)
**Anmälningsplikt till IMY inom 72 timmar om:**
- Hög risk för registrerades rättigheter och friheter
- Omfattande dataintrång
- Känsliga personuppgifter påverkade

**Anmälan ska innehålla:**
1. ✅ Beskrivning av dataintrångets karaktär
2. ✅ Kategorier och ungefärligt antal registrerade
3. ✅ Kategorier av personuppgifter
4. ✅ Sannolika konsekvenser
5. ✅ Vidtagna eller planerade åtgärder

**Anmälningskanaler:**
- **Online:** IMYs anmälningsportal
- **E-post:** datainspektionen@imy.se
- **Telefon:** 08-657 61 00 (brådskande ärenden)

#### 4.8 KOMMUNIKATION MED REGISTRERADE
**Kommunikationsplikt när:**
- Hög risk för registrerades rättigheter och friheter
- Känsliga personuppgifter påverkade
- Risk för identitetsstöld eller ekonomisk skada

**Kommunikation ska innehålla:**
1. ✅ Vad som hänt (på ett begripligt sätt)
2. ✅ Vilka åtgärder som vidtagits
3. ✅ Rekommendationer för registrerade
4. ✅ Kontaktinformation för frågor

**Kommunikationskanaler:**
- E-post till alla medlemmar
- Brev vid behov (för de utan e-post)
- Information på föreningens webbplats
- Fysisk anslagstavla

### FAS 5: ÅTERSTÄLLNING OCH LÄRANDE (efter incident)

#### 4.9 SYSTEMÅTERSTÄLLNING
1. ✅ Fullständig säkerhetsgenomgång av påverkade system
2. ✅ Implementering av förbättrade säkerhetsåtgärder
3. ✅ Uppdatering av säkerhetspolicies
4. ✅ Test av återställda system

#### 4.10 POST-INCIDENT REVIEW
**Inom 30 dagar efter incident:**
1. ✅ Dokumentera fullständig incident timeline
2. ✅ Identifiera root cause
3. ✅ Utvärdera response-effektivitet
4. ✅ Identifiera förbättringsområden
5. ✅ Uppdatera incident response plan

---

## 5. KOMMUNIKATIONSMALLAR

### 5.1 INTERN VARNING (E-POSTMALL)

```
ÄMNE: SÄKERHETSINCIDENT - Omedelbar åtgärd krävs

Hej [Namn],

En potentiell säkerhetsincident har upptäckts i våra system.

INCIDENT: [Kort beskrivning]
TIDPUNKT: [Datum och tid]
PÅVERKAN: [Preliminär bedömning]

OMEDELBARA ÅTGÄRDER:
- Använd inte systemet förrän vidare besked
- Rapportera eventuella observationer till gulmaranbrf@gmail.com
- Vänta på ytterligare instruktioner

Mvh,
Incident Commander
```

### 5.2 ANMÄLAN TILL IMY (MALL)

```
PERSONUPPGIFTSINCIDENT - BRF GULMÅRAN

1. PERSONUPPGIFTSANSVARIG
Organisation: BRF Gulmåran
Kontaktperson: BRF Gulmåran
E-post: gulmaranbrf@gmail.com

2. INCIDENT
Tidpunkt: [Datum och tid]
Upptäckt: [Datum och tid]
Typ: [Konfidentialitet/Integritet/Tillgänglighet]

3. BESKRIVNING
[Detaljerad beskrivning av vad som hänt]

4. PÅVERKADE PERSONUPPGIFTER
Kategorier: [Medlemsdata/Bokningsdata/etc.]
Antal registrerade: [Uppskattning]

5. KONSEKVENSER
[Bedömning av risk för registrerade]

6. ÅTGÄRDER
[Vidtagna och planerade åtgärder]

Med vänliga hälsningar,
[Namn och titel]
```

### 5.3 INFORMATION TILL MEDLEMMAR (MALL)

```
ÄMNE: Viktig information om datasäkerhet

Kära medlemmar i BRF Gulmåran,

Vi informerar er om en säkerhetsincident som påverkat våra digitala system.

VAD HAR HÄNT:
[Förklaring i begripliga termer]

PÅVERKADE UPPGIFTER:
[Lista över vilka typer av data som kan ha påverkats]

ÅTGÄRDER VI HAR VIDTAGIT:
[Konkreta åtgärder för att lösa problemet]

VAD KAN DU GÖRA:
[Rekommendationer för medlemmarna]

Vi har anmält incidenten till Integritetsskyddsmyndigheten (IMY) och följer alla juridiska krav.

För frågor, kontakta oss på gulmaranbrf@gmail.com

Med vänliga hälsningar,
Styrelsen BRF Gulmåran
```

---

## 6. KONTAKTINFORMATION

### 6.1 INTERNT TEAM
- **Incident Commander:** gulmaranbrf@gmail.com, [telefon]
- **Styrelseordförande:** [namn], [e-post], [telefon]
- **Teknisk support:** [namn], [e-post], [telefon]

### 6.2 EXTERNA KONTAKTER
- **IMY:** 08-657 61 00, datainspektionen@imy.se
- **Supabase Support:** support@supabase.io
- **Firebase Support:** [Google Cloud Support]
- **Vercel Support:** support@vercel.com
- **Juridisk rådgivare:** [namn], [telefon]
- **IT-forensics:** [extern leverantör]

### 6.3 NÖDKONTAKTER
- **Polis:** 112 (vid misstanke om brott)
- **CERT-SE:** cert@cert.se (nationella säkerhetsincidenter)

---

## 7. UTBILDNING OCH TESTNING

### 7.1 UTBILDNINGSPLAN
**Årlig utbildning för:**
- Styrelsemedlemmar
- Administratörer med systemåtkomst
- Incident response team

**Utbildningsinnehåll:**
- GDPR-krav för incident response
- Tekniska säkerhetsaspekter
- Kommunikationsprocedurer
- Praktiska övningar

### 7.2 REGELBUNDEN TESTNING
**Scenario-baserade övningar:**
- Kvartal 1: Teknisk systemförlust
- Kvartal 2: Obehörig åtkomst
- Kvartal 3: Leverantörsincident
- Kvartal 4: Fullskalig tabletop exercise

---

## 8. DOKUMENTATION OCH ARKIVERING

### 8.1 INCIDENT LOG
Alla incidenter dokumenteras med:
- Unik incident-ID
- Tidslinje för alla händelser
- Beslut och motiveringar
- Kommunikation (intern och extern)
- Lessons learned

### 8.2 ARKIVERING
- **Incident-dokumentation:** 7 år
- **Kommunikation med IMY:** 7 år
- **Tekniska loggar:** 3 år
- **Utbildningsrecord:** 3 år

---

**Dokumentet revideras årligen eller vid väsentliga förändringar.**  
**Nästa översyn: 2026-01-28** 