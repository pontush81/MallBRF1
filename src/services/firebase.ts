// Firebase konfiguration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Debug: Log environment variables (remove in production)
console.log('Environment Variables Status:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'Set' : 'Missing',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Missing',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Missing',
  appId: process.env.REACT_APP_FIREBASE_APP_ID ? 'Set' : 'Missing'
});

// Firebase konfiguration med miljövariabler
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Kontrollera att alla nödvändiga miljövariabler finns
if (!firebaseConfig.apiKey) {
  console.error('Firebase Configuration:', firebaseConfig);
  throw new Error('Firebase API Key saknas i miljövariablerna');
}

// Initialisera Firebase
const app = initializeApp(firebaseConfig);

// Exportera Firebase-tjänster för användning i applikationen
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
