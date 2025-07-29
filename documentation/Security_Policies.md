# Säkerhetspolicies och Rutiner
**BRF Gulmåran - GDPR Artikel 32 Compliance**

*Version: 1.0*  
*Skapad: 2025-01-28*  
*Senast uppdaterad: 2025-01-28*  
*Godkänd av: Styrelsen BRF Gulmåran*

---

## 1. ÖVERGRIPANDE SÄKERHETSPOLICY

### 1.1 SYFTE OCH TILLÄMPNING

**Syfte:** Säkerställa lämpliga tekniska och organisatoriska åtgärder för att skydda personuppgifter enligt GDPR Artikel 32.

**Tillämpningsområde:**
- Alla digitala system som behandlar personuppgifter
- Alla användare med åtkomst till föreningens data
- Alla tredjepartstjänster och leverantörer
- Fysiska och digitala säkerhetsaspekter

### 1.2 SÄKERHETSMÅL

**Konfidentialitet:** Säkerställa att personuppgifter endast är tillgängliga för behöriga personer  
**Integritet:** Förhindra obehörig ändring av personuppgifter  
**Tillgänglighet:** Säkerställa att auktoriserade användare har åtkomst när de behöver det  
**Accountability:** Möjlighet att spåra och verifiera säkerhetsåtgärder  

---

## 2. TEKNISKA SÄKERHETSÅTGÄRDER

### 2.1 KRYPTERING OCH DATASKYDD

#### 2.1.1 Data i Vila (Data at Rest)
**Krav:**
- ✅ AES-256 kryptering för all persondata i Supabase PostgreSQL
- ✅ Separata krypteringsnycklar för olika datatyper
- ✅ Automatisk nyckelrotation enligt säkerhetsschema
- ✅ Säker nyckelhantering via Supabase Vault

**Implementering:**
```sql
-- Exempel på krypterad tabellkonfiguration
CREATE TABLE IF NOT EXISTS members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    encrypted_personal_data BYTEA, -- Krypterad persondata
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.1.2 Data i Transit (Data in Transit)
**Krav:**
- ✅ TLS 1.3 för all HTTP-kommunikation
- ✅ Certificate pinning för kritiska API-anrop
- ✅ HSTS (HTTP Strict Transport Security) headers
- ✅ Perfect Forward Secrecy (PFS)

**Implementering:**
- Vercel Edge Functions med automatisk TLS
- Supabase API med enforced HTTPS
- Firebase Authentication över säkra kanaler

#### 2.1.3 Pseudonymisering och Anonymisering
**Pseudonymisering:**
- Användning av UUID:er istället för personnummer som primärnycklar
- Separata tabeller för identifierbar och icke-identifierbar data
- Referensnycklar lagrade separat från huvuddata

**Automatisk anonymisering:**
```typescript
// Exempel på automatisk anonymisering efter lagringsperiod
const anonymizeOldData = async () => {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 7);
  
  await supabase
    .from('bookings')
    .update({ 
      resident_name: 'ANONYMIZED',
      email: 'ANONYMIZED',
      phone: 'ANONYMIZED'
    })
    .lt('created_at', cutoffDate.toISOString());
};
```

### 2.2 ÅTKOMSTKONTROLL OCH AUTENTISERING

#### 2.2.1 Rollbaserad Åtkomstkontroll (RBAC)
**Roller:**
```sql
-- Användarroller i systemet
CREATE TYPE user_role AS ENUM ('member', 'admin', 'readonly');

-- Behörighetsmatris
CREATE TABLE user_permissions (
    role user_role,
    resource VARCHAR(50),
    action VARCHAR(20),
    allowed BOOLEAN DEFAULT FALSE
);

-- Exempel: Admin kan läsa/skriva alla resurser
INSERT INTO user_permissions VALUES 
    ('admin', 'members', 'read', true),
    ('admin', 'members', 'write', true),
    ('admin', 'bookings', 'read', true),
    ('admin', 'bookings', 'write', true),
    ('member', 'bookings', 'read', true),
    ('member', 'own_bookings', 'write', true);
```

**Row Level Security (RLS):**
```sql
-- Exempel på RLS-policy för medlemsdata
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON members
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all data" ON members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);
```

#### 2.2.2 Multifaktor Autentisering (MFA)
**Obligatorisk för:**
- Alla administratörer
- Användare med åtkomst till känslig data
- Remote-åtkomst till system

**Implementering:**
- Firebase Authentication med MFA
- TOTP (Time-based One-Time Password)
- SMS-backup för användare utan smartphone
- Recovery codes för nödsituationer

#### 2.2.3 Session Management
**Säkra sessions:**
```typescript
// Session-konfiguration
const sessionConfig = {
  httpOnly: true,        // Förhindra XSS-attacker
  secure: true,          // Endast HTTPS
  sameSite: 'strict',    // CSRF-skydd
  maxAge: 2 * 60 * 60 * 1000, // 2 timmar
  rolling: true          // Förnya vid aktivitet
};

// Automatisk utloggning vid inaktivitet
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minuter
```

### 2.3 SÄKERHETSÖVERVAKNING OCH LOGGING

#### 2.3.1 Audit Logging
**Loggade händelser:**
- Alla inloggningar (lyckade och misslyckade)
- Dataåtkomst och ändringar
- Privilegieförändringar
- Systemkonfigurationsändringar
- GDPR-relaterade förfrågningar

**Loggformat:**
```json
{
  "timestamp": "2025-01-28T10:30:00Z",
  "event_type": "data_access",
  "user_id": "uuid-123",
  "user_email": "user@example.com",
  "resource": "members",
  "action": "read",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "result": "success",
  "details": {
    "records_accessed": 1,
    "query_type": "select"
  }
}
```

#### 2.3.2 Säkerhetsmonitoring
**Realtidsövervakning:**
- Onormala inloggningsmönster
- Stora datautvinningar
- Obehöriga åtkomstförsök
- Systemprestandaavvikelser

**Automatiska varningar:**
```typescript
// Exempel på säkerhetsvarning
const detectSuspiciousActivity = async (userId: string) => {
  const recentLogins = await getRecentLogins(userId, 24); // 24 timmar
  
  if (recentLogins.length > 10) {
    await sendSecurityAlert({
      type: 'suspicious_login_pattern',
      userId,
      details: `${recentLogins.length} logins in 24 hours`
    });
  }
};
```

### 2.4 SÄKERHETSKOPIERING OCH ÅTERSTÄLLNING

#### 2.4.1 Backup-strategi
**Automatiska säkerhetskopior:**
- Daglig fullständig backup av alla databaser
- Kontinuerlig transaktionsloggbackup
- Geografiskt separerad lagring (EU-regioner)
- Krypterade backuper med separata nycklar

**Retention-policy:**
- Dagliga backuper: 30 dagar
- Veckovisa backuper: 12 veckor  
- Månatliga backuper: 12 månader
- Årliga backuper: 7 år (bokföringslag)

#### 2.4.2 Disaster Recovery
**Recovery Time Objective (RTO):** 4 timmar  
**Recovery Point Objective (RPO):** 1 timme  

**Återställningsprocedur:**
1. ✅ Bedöm omfattning av dataförlust
2. ✅ Aktivera incident response team
3. ✅ Isolera påverkade system
4. ✅ Återställ från senaste säkerhetskopia
5. ✅ Verifiera dataintegriteten
6. ✅ Testa systemfunktionalitet
7. ✅ Dokumentera incident och lärdomar

---

## 3. ORGANISATORISKA SÄKERHETSÅTGÄRDER

### 3.1 PERSONALUTBILDNING OCH MEDVETENHET

#### 3.1.1 Obligatorisk Säkerhetsutbildning
**Alla användare:**
- GDPR-grundkurs (årlig)
- Lösenordssäkerhet och phishing-medvetenhet
- Incident reporting procedures
- Säker hantering av personuppgifter

**Administratörer:**
- Avancerad cybersäkerhet
- Teknisk GDPR-implementation
- Incident response training
- Forensik och logganalys

#### 3.1.2 Säkerhetsmedvetenhet
**Månadsvis säkerhetsinformation:**
- Aktuella hot och sårbarheter
- Best practices för säker datahantering
- Uppdateringar av säkerhetspolicyer
- Resultat från säkerhetstester

### 3.2 LEVERANTÖRSHANTERING

#### 3.2.1 Due Diligence Process
**Utvärdering av nya leverantörer:**
1. ✅ Säkerhetscertifieringar (ISO 27001, SOC 2)
2. ✅ GDPR-compliance verifiering
3. ✅ Penetrationstestrapporter
4. ✅ Incident history och transparens
5. ✅ Databehandlingsavtal (DPA) förhandling

#### 3.2.2 Kontinuerlig Övervakning
**Kvartalsvis leverantörsgranskning:**
- Säkerhetsincident reviews
- Compliance status updates
- Kontraktsefterlevnad
- Prestandametriker

### 3.3 FYSISK SÄKERHET

#### 3.3.1 Åtkomstkontroll
**Kontor och mötesrum:**
- Låsta skåp för känsliga dokument
- Clean desk policy
- Begränsad åtkomst till personuppgifter
- Säker destruktion av pappershandlingar

#### 3.3.2 Enhetshantering
**Tillåtna enheter:**
- Endast godkända enheter för systemåtkomst
- Automatisk skärmlåsning efter 5 minuter
- Krypterade hårddiskar
- Remote wipe-funktionalitet

---

## 4. SÅRBARHETSHANTERING

### 4.1 SÄKERHETSTESTNING

#### 4.1.1 Regelbunden Testning
**Kvartalsvis:**
- Automatiserade sårbarhetsscans
- Dependency checks för tredjepartsbibliotek
- Konfigurationsgranskning
- Access control verifiering

**Årlig:**
- Extern penetrationstestning
- Social engineering assessment
- Physical security audit
- Business continuity testing

#### 4.1.2 Patch Management
**Kritiska säkerhetsuppdateringar:** Inom 72 timmar  
**Viktiga uppdateringar:** Inom 2 veckor  
**Övriga uppdateringar:** Inom 1 månad  

**Process:**
1. ✅ Bevaka säkerhetsbulletiner
2. ✅ Riskbedömning av uppdateringar
3. ✅ Test i utvecklingsmiljö
4. ✅ Schemalagd produktionsuppdatering
5. ✅ Verifiering och rollback-plan

### 4.2 THREAT INTELLIGENCE

#### 4.2.1 Hot Information
**Källor:**
- CERT-SE säkerhetsbulletiner
- Leverantörssäkerhetsmeddelanden
- Branschspecifik threat intelligence
- Open source security feeds

#### 4.2.2 Risk Assessment
**Månatlig hotbedömning:**
- Nya attack vectors
- Sårbarheter i använda system
- Geopolitiska säkerhetsrisker
- Branschspecifika hot

---

## 5. SÄKERHETSMÅTT OCH KPI:ER

### 5.1 TEKNISKA METRIKER

**Säkerhetsövervakning:**
- Mean Time to Detection (MTTD): < 1 timme
- Mean Time to Response (MTTR): < 4 timmar
- Falska positiver: < 5% av säkerhetslarm
- Systemupptid: > 99.5%

**Sårbarhetshantering:**
- Kritiska sårbarheter oåtgärdade: 0
- Genomsnittlig patch-tid: < 7 dagar
- Säkerhetstest coverage: > 95%

### 5.2 ORGANISATORISKA METRIKER

**Utbildning och medvetenhet:**
- Personalutbildning completion rate: 100%
- Phishing simulation success rate: < 10%
- Security awareness quiz scores: > 85%

**Compliance:**
- GDPR audit findings: 0 kritiska
- Policy compliance rate: > 98%
- Incident response time adherence: > 95%

---

## 6. POLICY UNDERHÅLL OCH UPPDATERING

### 6.1 REGELBUNDEN GRANSKNING

**Kvartalsvis:**
- Policy effectiveness review
- Incident lessons learned integration
- Technology change impact assessment
- Regulatory update integration

**Årlig:**
- Fullständig policy revision
- Security architecture review
- Threat landscape assessment
- Business requirement alignment

### 6.2 ÄNDRINGSHANTERING

**Process för policyändringar:**
1. ✅ Identifiering av ändringsbehov
2. ✅ Riskbedömning av föreslagna ändringar
3. ✅ Stakeholder consultation
4. ✅ Styrelse godkännande
5. ✅ Implementation och kommunikation
6. ✅ Utbildning och verifiering

---

## 7. KONTAKTINFORMATION

**Säkerhetsansvarig:** Pontus Hörberg  
**E-post:** gulmaranbrf@gmail.com  
**E-post (allmän):** gulmaranbrf@gmail.com  
**Adress:** Köpmansgatan 80, 269 31 Båstad  

**Incident Reporting:** 
- **E-post:** security@brfgulmaran.se
- **Telefon:** [24/7 säkerhetslinje]

**Externa säkerhetskontakter:**
- **CERT-SE:** cert@cert.se
- **IMY:** datainspektionen@imy.se
- **Polis:** 112 (brådskande)

---

## 8. GODKÄNNANDE OCH VERSIONSHANTERING

**Godkänt av:** Styrelsen BRF Gulmåran  
**Godkännandedatum:** 2025-01-28  
**Nästa granskning:** 2025-04-28  

**Versionshistorik:**
- Version 1.0 (2025-01-28): Initial version
- [Framtida ändringar dokumenteras här]

---

**Dokumentklassificering:** Konfidentiellt  
**Distribution:** Styrelse, IT-administratörer, säkerhetsansvariga  
**Arkivering:** 7 år enligt compliance-krav** 