# 🚨 KRITISK MIGRATION CHECKLIST - Firebase → Supabase

**BASERAT PÅ PERPLEXITY ANALYS - MÅSTE GÖRAS FÖRE PRODUKTION**

## ✅ **BRIST #1: User ID Compatibility - LÖST**
**Status:** ✅ **INGA PROBLEM** 
- Vi behöll Firebase User IDs (strings) i Supabase
- `id: "95KSBbQtfyVansVXrEY7Sg65bT43"` fungerar perfekt
- Alla befintliga foreign keys fungerar

## 🚨 **BRIST #2: Password Migration - KRITISKT**
**Status:** ❌ **MÅSTE LÖSAS**

**Problem:** Firebase och Supabase använder olika password hashing
**Lösning:** Alla användare MÅSTE resetta lösenord första gången

### Implementera Password Reset Flow:
```typescript
// Lägg till i supabaseAuthNew.ts
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  
  if (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
}
```

## 🚨 **BRIST #3: Row Level Security Policies - KRITISKT** 
**Status:** ❌ **MÅSTE VERIFIERAS**

**Kolla RLS policies för alla tabeller:**
- `maintenance_tasks` 
- `major_projects`
- `users`
- `bookings`

### Test RLS Commands:
```sql
-- Testa att användare bara ser sin egen data
SELECT * FROM maintenance_tasks WHERE assignee_id = auth.uid();
```

## 🚨 **BRIST #4: OAuth Callback URL - KRITISKT**
**Status:** ❌ **MÅSTE KONFIGURERAS**

**Supabase Dashboard → Authentication → URL Configuration:**
```
Site URL: https://gulmaran.com
Redirect URLs:
- https://gulmaran.com/auth/callback  
- http://localhost:3000/auth/callback
```

**Google OAuth Console:**
```
Authorized redirect URIs:
- https://qhdgqevdmvkrwnzpwikz.supabase.co/auth/v1/callback
```

## 🚨 **BRIST #5: Session Management - VIKTIGT**
**Status:** ⚠️ **BEHÖVER TESTAS**

**Supabase Dashboard → Authentication → Settings:**
```
JWT expiry: 3600 seconds (1 hour)
Refresh token rotation: Enabled  
Refresh token lifetime: 604800 seconds (1 week)
```

## 📋 **PRE-DEPLOYMENT TEST CHECKLIST**

### A. Konfiguration (MÅSTE göras först):
- [ ] Aktivera Google OAuth i Supabase Dashboard
- [ ] Konfigurera redirect URLs  
- [ ] Verifiera RLS policies
- [ ] Testa JWT token expiry

### B. Manual Testing (varje användare):
- [ ] **pontus.hberg@gmail.com** (admin) - Google OAuth ✅
- [ ] **tinautas@hotmail.com** (admin) - Password reset ❌
- [ ] **tinautas@gmail.com** (admin) - Google OAuth ✅  
- [ ] **pontus_81@hotmail.com** (user) - Password reset ❌
- [ ] **abytorp1969@gmail.com** (user) - Password reset ❌
- [ ] **pontusaiagent@gmail.com** (user) - Password reset ❌
- [ ] **klara.malmgren@gmail.com** (user) - Password reset ❌

### C. Funktionalitetstest:
- [ ] Login med Google OAuth
- [ ] Login med email/password (efter reset)
- [ ] Logout 
- [ ] Session persistence  
- [ ] Admin access till underhållsplan
- [ ] User access restrictions
- [ ] Skapa underhållsuppgift (admin only)
- [ ] Se tilldelade uppgifter (user)

## 🚨 **SÄKERHETSRISKER SOM PERPLEXITY IDENTIFIERADE:**

### 1. **Gamla Firebase Tokens**
```typescript
// Lägg till i AuthContextNew.tsx - tvinga logout av gamla tokens
useEffect(() => {
  // Clear any old Firebase tokens on app start
  localStorage.removeItem('firebase:authUser:...');
  sessionStorage.clear();
}, []);
```

### 2. **Atomic Migration** 
- Sätt system i maintenance mode under migration
- Stäng av alla Firebase Auth endpoints OMEDELBART efter switch

### 3. **User Kommunikation**
```
Subject: 🔐 VIKTIGT: Uppdaterat inloggningssystem

Hej!

Vi har uppgraderat vårt inloggningssystem för bättre säkerhet och prestanda.

VIKTIGT - Första inloggningen:
- Använd "Login with Google" (rekommenderat) ELLER
- Klicka "Forgot Password" för att sätta nytt lösenord

Kontakta oss vid problem: [admin email]

/ BRF Gulmåran IT
```

## ⚡ **GO-LIVE PROCESS:**

### 1. Pre-Deploy (staging):
```bash
# Test all new auth components
npm run build
npm start
# Full manual testing checklist
```

### 2. Production Deploy:
```bash
# 1. Sätt maintenance mode
# 2. Deploy new auth code  
# 3. Stäng av Firebase Auth
# 4. Skicka email till alla användare
# 5. Monitor logs i 24h
```

### 3. Post-Deploy Monitoring:
- Övervaka Supabase Auth logs
- Övervaka failed login attempts
- Support för användare första dagen

---
**⚠️ STOPPA INTE DEPLOYN OM NÅGOT FRÅN DENNA LISTA INTE ÄR KLART**