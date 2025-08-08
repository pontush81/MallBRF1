# 🚨 Google OAuth Firebase → Supabase Fix

## Problem
Google OAuth går fortfarande till Firebase istället för Supabase:
- **Nuvarande (fel):** `https://mallbrf.firebaseapp.com/__/auth/handler`  
- **Ska vara:** `https://qhdgqevdmvkrwnzpwikz.supabase.co/auth/v1/callback`

## 🔧 Lösning - Uppdatera Google Cloud Console

### Steg 1: Gå till Google Cloud Console
1. Öppna [Google Cloud Console](https://console.cloud.google.com/)
2. Välj ditt projekt (troligen "mallbrf" eller liknande)

### Steg 2: Hitta OAuth Credentials
1. Gå till **APIs & Services** → **Credentials**
2. Hitta din **OAuth 2.0 Client ID** (troligen för "Web application")
3. Klicka på den för att redigera

### Steg 3: Uppdatera Redirect URIs
**Ta bort dessa (gamla Firebase):**
```
https://mallbrf.firebaseapp.com/__/auth/handler
```

**Lägg till dessa (nya Supabase):**
```
https://qhdgqevdmvkrwnzpwikz.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
```

### Steg 4: Spara och vänta
- Klicka **Save**
- Vänta 5-10 minuter på att ändringarna propagerar

## 🎯 Resultat
Efter detta ska Google OAuth gå till Supabase istället för Firebase!

## 🧪 Testa
1. Gå till `http://localhost:3000/login`
2. Klicka "Sign in with Google"
3. URL:en ska nu vara: `https://qhdgqevdmvkrwnzpwikz.supabase.co/auth/v1/callback`

---
**OBS:** Du måste ha admin-rättigheter till Google Cloud-projektet för att göra denna ändring!
