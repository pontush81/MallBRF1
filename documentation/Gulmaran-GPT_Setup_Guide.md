# Gulmåran-GPT Setup Guide

## Översikt

Gulmåran-GPT är en AI-assistent som hjälper administratörer att söka och få svar från BRF Gulmårans dokument. Systemet använder RAG (Retrieval Augmented Generation) för att ge exakta svar baserat på uppladdade dokument.

## Förutsättningar

### 1. OpenAI API-nyckel

Du behöver en OpenAI API-nyckel för att använda systemet:

1. Gå till [OpenAI Platform](https://platform.openai.com/)
2. Skapa ett konto eller logga in
3. Navigera till API Keys
4. Skapa en ny API-nyckel
5. Kopiera nyckeln (den börjar med `sk-`)

### 2. Miljövariabler

Lägg till din OpenAI API-nyckel i miljövariablerna:

```bash
# I project1.env
OPENAI_API_KEY="sk-din-riktiga-api-nyckel-här"
```

### 3. Supabase Edge Functions

Kontrollera att Edge Functions är deployade:

```bash
npx supabase functions list
```

Du bör se:
- `gulmaran-chat`
- `gulmaran-upload` 
- `gulmaran-sign-url`

Om de saknas, kör:

```bash
npx supabase functions deploy gulmaran-chat
npx supabase functions deploy gulmaran-upload
npx supabase functions deploy gulmaran-sign-url
```

## Användning

### För Administratörer

1. **Logga in som admin** på webbplatsen
2. **Gå till Admin-panelen** (`/admin`)
3. **Klicka på "Gulmåran-GPT"** kortet
4. **Ladda upp dokument** i "Dokument"-fliken
5. **Ställ frågor** i "Chatt"-fliken

### Stödda Filformat

- **PDF** - Bäst för skannade dokument
- **TXT** - Bäst för textextraktion
- **DOCX** - Microsoft Word-dokument

**Rekommendation:** Konvertera PDF:er till TXT för bäst resultat.

### Dokumentbearbetning

När du laddar upp ett dokument:

1. **Uppladdning** - Filen sparas i Supabase Storage
2. **Textextraktion** - Text extraheras från dokumentet
3. **Chunkning** - Texten delas upp i mindre delar
4. **Embedding** - Varje chunk får en vektor-representation
5. **Indexering** - Chunks sparas i databasen för sökning

Detta kan ta 1-5 minuter beroende på dokumentstorlek.

## Säkerhet

### Åtkomstbehörighet

- Endast användare med `admin`-roll kan använda systemet
- Row Level Security (RLS) skyddar alla data
- Signerade URLs för dokumentåtkomst (15 min TTL)

### Dataskydd

- Inga personuppgifter loggas i chat-historik
- Endast dokumentreferenser och metadata sparas
- GDPR-kompatibel datahantering

### API-säkerhet

- Alla Edge Functions kräver autentisering
- Validering av användarroller
- Säker filuppladdning med storleks- och typbegränsningar

## Felsökning

### Vanliga Problem

**1. "Access denied" vid chat**
- Kontrollera att användaren har admin-roll
- Verifiera att RLS-policies är aktiva

**2. Dokumentuppladdning misslyckas**
- Kontrollera filstorlek (max 10MB)
- Verifiera filformat (PDF/TXT/DOCX)
- Kontrollera storage-behörigheter

**3. "No text could be extracted"**
- PDF:er kan vara bildbaserade - konvertera till TXT
- DOCX-stöd är begränsat - använd TXT istället

**4. Chat ger inga svar**
- Kontrollera att dokument är "completed" status
- Verifiera att OpenAI API-nyckel fungerar
- Kontrollera Edge Functions logs

### Loggar och Debugging

**Supabase Dashboard:**
- Gå till Functions → Logs
- Kontrollera fel i gulmaran-chat/upload funktioner

**Browser Console:**
- Öppna Developer Tools
- Kolla Network-fliken för API-fel
- Kontrollera Console för JavaScript-fel

**Database:**
```sql
-- Kontrollera dokument status
SELECT title, processing_status, processing_error 
FROM documents 
ORDER BY created_at DESC;

-- Kontrollera chunks
SELECT COUNT(*) as chunk_count, document_id 
FROM chunks 
GROUP BY document_id;
```

## Kostnader

### OpenAI API

- **Embeddings:** ~$0.0001 per 1K tokens
- **Chat:** ~$0.0015 per 1K tokens (GPT-4o-mini)

**Exempel:** Ett 10-sidors dokument kostar ca $0.01-0.05 att indexera.

### Supabase

- **Storage:** Inkluderat i gratis plan
- **Database:** Inkluderat för normalt bruk
- **Edge Functions:** 500K anrop/månad gratis

## Underhåll

### Regelbunden Kontroll

1. **Övervaka API-kostnader** i OpenAI Dashboard
2. **Kontrollera storage-användning** i Supabase
3. **Rensa gamla dokument** vid behov
4. **Uppdatera Edge Functions** vid nya versioner

### Backup

Viktiga tabeller att säkerhetskopiera:
- `documents` - Dokumentmetadata
- `chunks` - Indexerade textchunkar
- `chat_logs` - Chat-statistik

## Support

Vid problem:

1. **Kontrollera denna guide** först
2. **Kolla Supabase logs** för tekniska fel
3. **Verifiera miljövariabler** är korrekt satta
4. **Kontakta utvecklare** med specifika felmeddelanden

## Versionshistorik

- **v1.0** - Initial implementation
  - Grundläggande chat-funktionalitet
  - PDF/TXT/DOCX-stöd
  - Admin-integration
  - Säkerhet och RLS
