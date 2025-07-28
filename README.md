# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Performance Optimizations

### Cold Start Fix (2025-01-XX)
Fixed slow cold start issues on production by:
- **Removed legacy server**: Eliminated the Node.js serverless function that was causing cold start delays
- **Migrated to Supabase Edge Functions**: All API calls now use Supabase Edge Functions instead of legacy server endpoints
- **Implemented code splitting**: All heavy components are lazy-loaded using React.lazy()
- **Optimized font loading**: Reduced font weight variants from 6 to 3 (400, 500, 600)
- **Updated Vercel config**: Optimized for static-only deployment with better caching headers

### Localhost Caching Fix
Improved localhost development experience by:
- **Enhanced version checking**: More aggressive cache-busting in development mode
- **Better cache headers**: Additional cache-busting meta tags in index.html
- **Content hash checking**: Detects changes more reliably in development

## Available Scripts

In the project directory you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

# MallBRF Deployment Guide

## Förutsättningar

För att kunna deploya lösningen behöver du:

1. Ett [Vercel](https://vercel.com)-konto
2. Ett [Supabase](https://supabase.com)-konto
3. Git installerat på din dator
4. Node.js version 18 eller senare

## Steg-för-steg Guide

### 1. Supabase Setup

1. Skapa ett nytt projekt i Supabase
2. Notera följande uppgifter från ditt projekt:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key)

### 2. Vercel Setup

1. Gå till [Vercel](https://vercel.com) och logga in
2. Klicka på "New Project"
3. Importera ditt Git-repository
4. Konfigurera följande environment variables under Settings > Environment Variables:
   ```
   SUPABASE_URL=din_supabase_url
   SUPABASE_ANON_KEY=din_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=din_supabase_service_role_key
   NODE_ENV=production
   ```

### 3. Deployment

#### Automatisk Deployment
1. Pusha dina ändringar till `main` eller `development` branch
2. Vercel kommer automatiskt att deploya din applikation

#### Manuell Deployment
1. Installera Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Logga in på Vercel via CLI:
   ```bash
   vercel login
   ```
3. Deploya projektet:
   ```bash
   vercel
   ```

### 4. Verifiera Deployment

1. Kontrollera att frontend fungerar genom att besöka din Vercel URL
2. Testa API-endpoints:
   - `https://din-url.vercel.app/api/pages/visible`
   - `https://din-url.vercel.app/api/pages/published`
   - `https://din-url.vercel.app/health`

### 5. Felsökning

Om du stöter på problem, kontrollera:

1. Vercel deployment logs under "Deployments" fliken
2. Environment variables är korrekt konfigurerade
3. Supabase connection är aktiv
4. Node version är korrekt (18+)

### 6. Viktiga Filer

- `vercel.json`: Konfigurerar routing och build settings
- `server/server.js`: Huvudapplikationen
- `server/package.json`: Server dependencies
- `package.json`: Frontend dependencies

### 7. Branching Strategi

- `main`: Produktion
- `development`: Utveckling och staging
- Feature branches bör skapas från `development`

### 8. Miljöer

Du kan ha flera miljöer i Vercel:
- Production (main branch)
- Preview (pull requests)
- Development (development branch)

### 9. Backup

Innan deployment, säkerställ att du har:
1. Backat upp din Supabase databas
2. Sparat alla environment variables
3. Dokumenterat eventuella customizations

## Support.

Vid problem, kontrollera:
1. [Vercel Status](https://status.vercel.com)
2. [Supabase Status](https://status.supabase.com)
3. Deployment logs i Vercel dashboard

## Säkerhet

- Använd alltid HTTPS
- Skydda dina API keys
- Regelbunden backup av data
- Följ security best practices för Node.js applikationer

# MallBRF1

## Om Projektet

MallBRF1 är en modern webbapplikation för bostadsrättsföreningar, byggd med React, TypeScript och Node.js. Applikationen erbjuder en robust plattform för att hantera bokningar, dokument och information för bostadsrättsföreningar.

### Huvudfunktioner
- **Bokningshantering**
  - Kalenderintegration med FullCalendar
  - Bokning av gemensamma utrymmen
  - Hantering av bokningsregler och tidsgränser

- **Dokumenthantering**
  - Uppladdning och hantering av dokument
  - Versionering av dokument
  - Säker lagring i Supabase

- **Innehållshantering**
  - Markdown-stöd för sidor och dokument
  - Publika och privata sidor
  - Bildhantering med förhandsgranskning

- **Användarhantering**
  - Firebase Authentication
  - Rollbaserad åtkomstkontroll
  - Användarprofiler och behörigheter

## Teknisk Stack

### Frontend
- React 18 med TypeScript
- Material-UI (MUI) för användargränssnitt
- React Router för navigation
- Firebase för autentisering
- FullCalendar för bokningshantering
- React Markdown för innehållshantering

### Backend
- Node.js/Express
- Supabase för databas och lagring
- Firebase Admin SDK
- Nodemailer för e-posthantering

### Deployment & Infrastruktur
- Vercel för frontend och API
- Supabase för databas och filhantering
- Firebase för autentisering och realtidsfunktioner

## Projektstruktur

```
mallbrf1/
├── app/                    # Next.js API routes
├── src/                    # Frontend React-kod
│   ├── components/        # Återanvändbara komponenter
│   ├── pages/            # Sidspecifika komponenter
│   ├── services/         # API-tjänster
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Hjälpfunktioner
│   └── types/            # TypeScript typer
├── server/               # Backend Node.js/Express
│   ├── routes/          # API endpoints
│   ├── service/         # Affärslogik
│   ├── scripts/         # Hjälpscript
│   └── sql/             # Databasscript
└── public/              # Statiska filer
```

## Installation och Utveckling

### Förutsättningar
- Node.js 18 eller senare
- Git
- Ett Supabase-konto
- Ett Firebase-konto
- Ett Vercel-konto (för deployment)

### Lokal Utveckling

1. Klona repot:
   ```bash
   git clone https://github.com/pontush81/MallBRF1.git
   cd MallBRF1
   ```

2. Installera beroenden:
   ```bash
   npm install
   cd server && npm install
   ```

3. Konfigurera miljövariabler:
   - Kopiera `.env.example` till `.env.local` i root-mappen
   - Kopiera `server/.env.example` till `server/.env`
   - Fyll i alla nödvändiga miljövariabler

4. Starta utvecklingsservern:
   ```bash
   # Terminal 1 - Frontend
   npm start
   
   # Terminal 2 - Backend
   npm run server
   ```

## Deployment

### Vercel Deployment

1. Pusha ändringar till `main` eller `development` branch
2. Vercel kommer automatiskt att deploya applikationen

### Miljövariabler

#### Frontend (.env.local)
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
REACT_APP_API_URL=
```

#### Backend (server/.env)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

## Testing

### Frontend Testing
```bash
# Kör enhetstester
npm test

# Kör E2E-tester med Cypress
npm run cypress:open
```

### Backend Testing
```bash
cd server
npm test
```

## Backup och Underhåll

### Databasbackup
```bash
# Kör backup manuellt
npm run backup

# Schemalagd backup
npm run backup:scheduler
```

## Säkerhet

- Alla API-anrop använder HTTPS
- Row Level Security (RLS) i Supabase
- Firebase Authentication för användarhantering
- Säker filhantering med signerade URLs
- Regelbundna säkerhetsuppdateringar

## Support och Felsökning

### Vanliga Problem

1. **CORS-fel**
   - Kontrollera att CORS är korrekt konfigurerat i `server/server.js`
   - Verifiera att domänen finns i `allowedOrigins`

2. **Autentiseringsfel**
   - Kontrollera Firebase-konfigurationen
   - Verifiera att användaren har rätt behörigheter

3. **Databasanslutningsfel**
   - Kontrollera Supabase-anslutningen
   - Verifiera miljövariabler

### Resurser
- [Vercel Status](https://status.vercel.com)
- [Supabase Status](https://status.supabase.com)
- [Firebase Status](https://status.firebase.google.com)

## Versionering

Projektet använder semantisk versionering:
- `main`: Produktionsversion
- `development`: Utvecklingsversion
- Feature branches skapas från `development`

## Licens

Privat - Alla rättigheter förbehållna
// Force Vercel deployment - Mon Jul 28 09:17:34 CEST 2025
// Trigger production deployment after GitHub reconnect - Mon Jul 28 09:31:28 CEST 2025
Mon Jul 28 09:34:59 CEST 2025
