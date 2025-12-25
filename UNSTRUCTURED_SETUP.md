# 🚀 Unstructured.io Setup Guide

## Vad är Unstructured.io?

Unstructured.io är en professionell dokumentprocessing-tjänst som kan hantera alla typer av dokument med hög precision:

- **PDF-dokument** (inklusive skannade med OCR)
- **Office-dokument** (DOCX, XLSX, PPTX)
- **Webbsidor** (HTML)
- **E-böcker** (EPUB)
- **Och mycket mer!**

## 💰 Kostnad

- **Gratis tier:** 1000 sidor per månad
- **Betald:** $1 per 1000 sidor (Fast Pipeline) eller $10 per 1000 sidor (Hi-Res Pipeline)
- **Perfekt för dina behov:** Med 100-1000 dokument/månad kostar det $1-10/månad

## 🔧 Setup (5 minuter)

### Steg 1: Skaffa API-nyckel

1. Gå till: https://unstructured.io/
2. Klicka på "Sign Up" eller "Get Started" 
3. Skapa ett konto (gratis)
4. Gå till din dashboard och kopiera API-nyckeln
5. **Viktigt:** API-endpointen är `https://api.unstructuredapp.io/` (inte `.io`)

### Steg 2: Lägg till API-nyckel

Öppna `project1.env` och ersätt:

```env
UNSTRUCTURED_API_KEY=your_unstructured_api_key_here
```

Med din riktiga API-nyckel:

```env
UNSTRUCTURED_API_KEY=din_riktiga_api_nyckel_här
```

### Steg 3: Starta om systemet

```bash
# Starta om din utvecklingsserver
npm start
```

## ✅ Vad händer nu?

Med Unstructured.io aktiverat kan systemet:

- ✅ **Processa alla PDF:er** (även skannade dokument)
- ✅ **Hantera komplexa layouts** (tabeller, bilder, diagram)
- ✅ **OCR för skannade dokument** (automatiskt)
- ✅ **Extrahera tabelldata** (strukturerat)
- ✅ **Stödja 20+ filformat** (PDF, DOCX, XLSX, PPTX, HTML, RTF, EPUB, etc.)

## 🔄 Fallback-system

Om Unstructured.io inte är konfigurerat fungerar systemet fortfarande för:

- ✅ **TXT-filer** (direkt textläsning)
- ✅ **CSV-filer** (enkel parsing)
- ❌ **PDF, DOCX, XLSX** (kräver Unstructured.io)

## 🧪 Testa systemet

1. Ladda upp samma PDF som misslyckades tidigare
2. Den ska nu processas framgångsrikt
3. Du kan söka i innehållet via GPT-chatten

## 📊 Monitoring

Kolla loggar i Supabase Dashboard:
- Functions → gulmaran-upload → Logs
- Se processing-status i DocumentList

## 🆘 Felsökning

### Problem: "Unstructured.io API key not configured"
**Lösning:** Kontrollera att `UNSTRUCTURED_API_KEY` är korrekt satt i `project1.env`

### Problem: "API error: 401"
**Lösning:** API-nyckeln är felaktig, kopiera en ny från Unstructured.io dashboard

### Problem: "API error: 429"
**Lösning:** Du har nått gränsen för gratis tier (1000 sidor/månad)

## 🎯 Resultat

Med denna implementation har du nu:

- ✅ **Enterprise-grade dokumentprocessing**
- ✅ **Stöd för alla vanliga filformat**
- ✅ **OCR för skannade dokument**
- ✅ **Robust felhantering**
- ✅ **Skalbar arkitektur**
- ✅ **Minimal underhållskostnad**

**Total kostnad:** $1-10/månad för professionell dokumentprocessing! 🚀
