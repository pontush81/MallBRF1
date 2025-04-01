# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

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

## About

A modern web application for managing apartment bookings and information, built with React and TypeScript. The application provides a robust platform for managing public pages, documents, and images.

## Features

* User authentication with Firebase
* Dynamic page content management with Markdown support
* Image and document management
* Responsive design with Material-UI
* Public and private page viewing
* File upload and management
* Image preview and zoom functionality
* PDF and document handling

## Environment Setup

The application requires the following environment variables:

### Firebase Configuration
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID
```

### API Configuration
```
REACT_APP_API_URL
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Start development server: `npm start`

## Production Build

1. Build the application: `npm run build`
2. Deploy to Vercel: Automatic deployment on push to main branch

## Testing

* Run unit tests: `npm test`
* Run E2E tests: `npm run cypress:open`

## API och CORS-konfiguration

För att säkerställa att API-anrop fungerar korrekt, kontrollera följande:

### Frontend (Next.js)

* Alla API-anrop använder relativa URL:er (`/api/...`) istället för absoluta URL:er
* API-anrop inkluderar följande headers:  
  ```javascript
  headers: {  
    'Accept': 'application/json',  
    'Content-Type': 'application/json',  
    'x-vercel-protection-bypass': 'true'  
  }
  ```
* Fetch-anrop har rätt konfiguration:  
  ```javascript
  {  
    mode: 'cors',  
    credentials: 'include'  
  }
  ```

### Backend (Express)

* CORS är korrekt konfigurerat med:  
  ```javascript
  app.use(cors({  
    origin: function(origin, callback) {  
      const allowedOrigins = [  
        'https://mallbrf.vercel.app',  
        'https://mall-brf-1-git-development-pontush81s-projects.vercel.app',  
        'http://localhost:3000'  
      ];  
      callback(null, allowedOrigins.includes(origin));  
    },  
    credentials: true  
  }));
  ```

## Deployment

### Vercel Deployment

1. Environment variables är korrekt konfigurerade
2. CORS headers är tillåtna i Vercel's configuration
3. Verifiera att både frontend och backend är deployade till rätt branch

### Felsökning

Om problem uppstår:

1. Kontrollera browser console för felmeddelanden
2. Verifiera nätverksanrop i browser devtools
3. Kontrollera Vercel logs för både frontend och backend
4. Verifiera att alla headers är korrekt satta i både request och response

## CORS-konfiguration

* API:et har uppdaterats för att tillåta följande domäner:  
  * https://www.gulmaran.com  
  * https://stage.gulmaran.com  
  * https://www.stage.gulmaran.com  
  * https://mall-brf-1.vercel.app  
  * https://mallbrf.vercel.app  
  * Lokala utvecklingsmiljöer

## Support

Vid problem, kontrollera:

1. Vercel Status
2. Supabase Status
3. Deployment logs i Vercel dashboard

## Säkerhet

* Använd alltid HTTPS
* Skydda dina API keys
* Regelbunden backup av data
* Följ security best practices för Node.js applikationer
