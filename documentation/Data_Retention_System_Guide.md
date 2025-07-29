# Data Retention System - Användarguide
**BRF Gulmåran - Säker automatisk datahantering**

*Version: 1.0*  
*Skapad: 2025-01-28*  
*För: Administratörer och styrelseledamöter*

---

## 🎯 **ÖVERSIKT**

Vårt Data Retention System säkerställer att BRF Gulmåran följer GDPR-krav för datalagring samtidigt som vi **aldrig** raderar viktig data av misstag. Systemet har flera säkerhetslager och kör alltid test-simuleringar innan någon data raderas.

---

## 🔐 **SÄKERHETSFILOSOFI**

### **"Safety First" - Principles**
1. **Aldrig radera utan kontroller** - Multipla säkerhetskontroller innan radering
2. **Soft delete först** - Användardata anonymiseras innan permanent radering  
3. **Juridiska undantag** - Data som krävs enligt lag skyddas automatiskt
4. **Fullständig loggning** - Alla raderingar dokumenteras för efterlevnad
5. **Test-läge standard** - Dry-run är alltid aktiverat som standard

---

## 📋 **RETENTION-REGLER**

### **Medlemsdata (Users)**
- **Lagringstid:** 2 år EFTER att medlemskapet avslutas
- **Säkerhetskontroller:**
  - ✅ Inga aktiva/framtida bokningar
  - ✅ Ingen inloggning senaste 6 månader  
  - ✅ Medlemskap formellt avslutat
- **Undantag:** Styrelseledamöter, ekonomiskt ansvar
- **Metod:** Soft delete (anonymisering) + permanent radering efter 2 år

### **Bokningsdata (Bookings)**
- **Lagringstid:** 3 år efter bokningsdatum
- **Säkerhetskontroller:**
  - ✅ Bokning avslutad och genomförd
  - ✅ Betalning reglerad
- **Undantag:** Pågående tvister, bokföringsspärr
- **Metod:** Hard delete efter säkerhetskontroll

### **Säkerhetsloggar (Audit Logs)**
- **Lagringstid:** 1 år efter händelse
- **Säkerhetskontroller:**
  - ✅ Inte säkerhetskritisk händelse
  - ✅ Ingen pågående utredning
- **Undantag:** Säkerhetsincidenter, rättsliga krav
- **Metod:** Hard delete

### **GDPR-loggar**
- **Lagringstid:** 5 år (myndighetskrav)
- **Säkerhetskontroller:** Inga (krävs enligt lag)
- **Undantag:** Aktiva rättsprocesser
- **Metod:** Hard delete efter 5 år

---

## 🛠️ **HUR MAN ANVÄNDER SYSTEMET**

### **Steg 1: Kör Analys**
```
Admin Dashboard → Data Retention → "Analysera Retention"
```
- Visar alla kandidater för radering
- Säkerhetskontroller utförs automatiskt  
- Inga ändringar görs i detta steg

### **Steg 2: Granska Resultat**
Kontrollera tabellen för varje datatyp:
- **Kandidater:** Poster äldre än retention-tid
- **Säkra att radera:** Poster som klarat alla säkerhetskontroller
- **Status:** Visar om radering är säker eller blockerad

### **Steg 3: Test-körning (REKOMMENDERAT)**
```
Säkerställ att "🧪 Test-läge (Dry Run)" är AKTIVT
Klicka "Kör Test-rensning"
```
- Simulerar hela processen
- Visar exakt vad som skulle raderas
- **INGEN data raderas faktiskt**

### **Steg 4: Live-körning (VAR FÖRSIKTIG)**
```
Stäng av "Test-läge" (växla till "⚠️ Live-läge")
Klicka "Kör LIVE Rensning"
Bekräfta i dialog med dubbel-kontroll
```
- **DATA RADERAS PERMANENT**
- Säkerhetskontroller körs även här
- Fullständig loggning av alla ändringar

---

## ⚠️ **VARNINGAR OCH SÄKERHET**

### **När DATA INTE raderas:**
- Användare med aktiva framtida bokningar
- Aktiva medlemmar (membership_status = 'active')
- Styrelseledamöter eller speciella roller
- Data under juridisk spärr
- Säkerhetsloggar från kritiska händelser
- Bokningar med pågående betalningstvister

### **Säkerhetsfunktioner:**
- **Dry-run som standard** - Måste aktivt välja live-läge
- **Begränsad batch-size** - Max 100 poster per körning
- **Dubbelkonfirmation** - Måste bekräfta live-radering
- **Snapshot-backup** - Original data sparas i deletion_log
- **Rollback-möjlighet** - Kan återställas från loggar vid behov

---

## 📊 **STATUS OCH ÖVERVAKNING**

### **Dashboard-kort visar:**
- **Säkerhetsläge:** Alltid "AKTIVT" när systemet fungerar
- **Hanterade tabeller:** Antal databastabeller under övervakning
- **Kandidater:** Poster över retention-tid (gul siffra)
- **Säkra att radera:** Godkända för radering (blå siffra)

### **Status-indikatorer:**
- 🟢 **Inga kandidater:** Allt är inom retention-tid
- 🟡 **Ej säkert:** Kandidater finns men säkerhetskontroller blockerar
- 🔵 **Säkert:** Kandidater redo för radering

---

## 🔍 **FELSÖKNING**

### **"Inga kandidater visas"**
- **Normal situation** - all data är inom retention-perioder
- Kontrollera att migration har körts: `create_data_retention_system.sql`

### **"Säkerhetskontroller blockerar"**  
- **Normalt beteende** - systemet skyddar viktig data
- Granska varför: aktiva bokningar, medlemskap, juridiska skäl
- Vänta tills förhållandena ändras

### **"Edge Function fel"**
- Kontrollera Supabase Edge Function deployment
- Verifiera att `data-retention-cleanup` funktionen är aktiv
- Kolla loggarna i Supabase Dashboard

### **"Rättighetsfel"**
- Säkerställ admin-behörigheter i systemet
- Kontrollera Supabase Service Role Key

---

## 📈 **REKOMMENDERADE RUTINER**

### **Månadsvis:**
1. Kör retention-analys för att se status
2. Granska eventuella kandidater för radering
3. Kör test-simulering för att förstå impact

### **Kvartalsvis:**
1. Utför faktisk data cleanup (live-körning)
2. Granska deletion_log för revision
3. Uppdatera retention-regler vid behov

### **Årligen:**
1. Fullständig genomgång av alla retention-policyer
2. Juridisk granskning av compliance
3. Uppdatering av säkerhetskontroller

---

## 📞 **SUPPORT OCH KONTAKT**

### **Teknisk support:**
- **E-post:** gulmaranbrf@gmail.com
- **Ämnesrad:** "Data Retention System - Support"

### **Juridiska frågor:**
- Kontakta styrelsen för policy-ändringar
- IMY (Integritetsskyddsmyndigheten) för GDPR-vägledning

### **Akut incident:**
- Vid misstag: Stoppa systemet omedelbart
- Kontakta teknisk support för rollback
- Deletion-loggar innehåller backup-data

---

## 📚 **RELATERAD DOKUMENTATION**

- **Privacy Policy** - `/privacy-policy` - Vad vi lovar användarna
- **GDPR Article 30 Record** - `documentation/GDPR_Article_30_Record.md`
- **Security Policies** - `documentation/Security_Policies.md` 
- **Incident Response Plan** - `documentation/Incident_Response_Plan.md`

---

*Systemet är designat för att vara säkert som standard. Vid tvivel, kör alltid test-simulering först.* 