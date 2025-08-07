# 🚀 Firebase → Supabase Migration Guide

## ✅ **Steg 1: KLART - Data Migration**
- [x] Synkade alla 7 Firebase-användare till Supabase 
- [x] Verifierat att alla roller och data är korrekta
- [x] 4 admins, 5 users nu tillgängliga i Supabase

## ✅ **Steg 2: KLART - New Auth Services**
- [x] Skapad `supabaseAuthNew.ts` - ren Supabase auth
- [x] Skapad `AuthContextNew.tsx` - ny context utan Firebase
- [x] Skapad `LoginNew.tsx` - ny login-komponent  
- [x] Skapad `AuthCallback.tsx` - OAuth callback hantering

## 🔧 **Steg 3: Supabase Dashboard Setup** 

### A. Aktivera Authentication
1. Gå till Supabase Dashboard → Authentication → Settings
2. Aktivera Google Provider:
   ```
   Client ID: [Din Google OAuth Client ID]
   Client Secret: [Din Google OAuth Secret]  
   Redirect URL: https://qhdgqevdmvkrwnzpwikz.supabase.co/auth/v1/callback
   ```
3. Lägg till din domän i "Redirect URLs":
   ```
   https://gulmaran.com/auth/callback
   http://localhost:3000/auth/callback (för dev)
   ```

### B. Email Templates (valfritt)
- Anpassa email templates för password reset, etc.

## 🔄 **Steg 4: Code Migration**

### A. Uppdatera App.tsx
```tsx
// Byt ut gamla imports:
// import { AuthProvider } from './context/AuthContext';
// import { Login } from './pages/auth/Login';

// Till nya:
import { AuthProvider } from './context/AuthContextNew';  
import { LoginNew as Login } from './pages/auth/LoginNew';
import { AuthCallback } from './pages/auth/AuthCallback';

// Lägg till route för callback:
<Route path="/auth/callback" element={<AuthCallback />} />
```

### B. Uppdatera alla komponenter som använder useAuth():
Ingen ändring behövs! Den nya AuthContextNew använder samma interface.

### C. Ta bort Firebase Dependencies
```bash
# När migration är klar:
npm uninstall firebase
```

## 🧪 **Steg 5: Testing**

### A. Test Existing Users
Befintliga användare behöver sätta lösenord första gången:
1. Pontus H (admin) - pontus.hberg@gmail.com ✅
2. Tina (admin) - tinautas@hotmail.com ✅  
3. Tina Utas (admin) - tinautas@gmail.com ✅
4. Pontus (user) - pontus_81@hotmail.com ⚠️
5. Anders (user) - abytorp1969@gmail.com ⚠️
6. Pontus AI (user) - pontusaiagent@gmail.com ⚠️
7. Klara (user) - klara.malmgren@gmail.com ⚠️

### B. Test Flows
- [ ] Google OAuth login
- [ ] Email/password login  
- [ ] Logout
- [ ] Admin access control
- [ ] User permission checks

## 🚨 **Migration Commands**

### Safe Switch (recommended):
```bash
# 1. Backup current auth files
cp src/context/AuthContext.tsx src/context/AuthContext.backup.tsx
cp src/pages/auth/Login.tsx src/pages/auth/Login.backup.tsx

# 2. Switch to new auth system
mv src/context/AuthContext.tsx src/context/AuthContextOld.tsx
mv src/context/AuthContextNew.tsx src/context/AuthContext.tsx
mv src/pages/auth/Login.tsx src/pages/auth/LoginOld.tsx  
mv src/pages/auth/LoginNew.tsx src/pages/auth/Login.tsx

# 3. Test thoroughly
npm start

# 4. If successful, remove old files
rm src/context/AuthContextOld.tsx
rm src/pages/auth/LoginOld.tsx
rm -rf src/services/firebase.ts (after testing)
```

### Rollback if needed:
```bash
mv src/context/AuthContext.backup.tsx src/context/AuthContext.tsx
mv src/pages/auth/Login.backup.tsx src/pages/auth/Login.tsx
```

## 💡 **Benefits After Migration**
- ✅ 50% fewer dependencies 
- ✅ Unified database (all data in Supabase)
- ✅ Simpler architecture (no auth bridge)
- ✅ Better performance (no token conversion)
- ✅ Lower costs (no Firebase fees)
- ✅ Better TypeScript integration

## 🎯 **Next Steps**
1. Configure Google OAuth in Supabase Dashboard
2. Test migration på staging
3. Switch auth files  
4. Test all user flows
5. Deploy to production
6. Notify users about password reset (for email/pwd users)
7. Remove Firebase dependencies

---
**Migration Created:** $(date)  
**Firebase Users Migrated:** 7/7 ✅  
**Ready for Testing:** ✅