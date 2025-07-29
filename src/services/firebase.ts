// Firebase konfiguration med GDPR-compliance
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider, OAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { cookieConsentService } from './cookieConsent';

// Global variables for Firebase instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

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

// Initialize Firebase only if consent is given
function initializeFirebaseIfConsented(): boolean {
  if (!cookieConsentService.canUseFirebase()) {
    console.log('Firebase initialization blocked - no authentication consent');
    return false;
  }

  if (app) {
    return true; // Already initialized
  }

  try {
    console.log('Initializing Firebase with user consent...');
    
    // Initialisera Firebase
    app = initializeApp(firebaseConfig);

    // Initialize auth
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence);

    // Initialize Firestore
    db = getFirestore(app);

    // Initialize Storage
    storage = getStorage(app);

    // Initialize Google provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log('Firebase initialized successfully with GDPR compliance');
    return true;

  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
}

// Safe getters that check consent before returning instances
export function getFirebaseAuth(): Auth | null {
  if (!initializeFirebaseIfConsented()) {
    return null;
  }
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  if (!initializeFirebaseIfConsented()) {
    return null;
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!initializeFirebaseIfConsented()) {
    return null;
  }
  return storage;
}

export function getGoogleProvider(): GoogleAuthProvider | null {
  if (!initializeFirebaseIfConsented()) {
    return null;
  }
  return googleProvider;
}

// Legacy exports for backward compatibility (with consent checks)
export { getFirebaseAuth as auth };
export { getFirebaseDb as db };
export { getGoogleProvider as googleProvider };

// Facebook provider for social auth
export const facebookProvider = new OAuthProvider('facebook.com');

// Utility function to check if Firebase is available
export function isFirebaseAvailable(): boolean {
  return cookieConsentService.canUseFirebase() && app !== null;
}

// Function to re-initialize Firebase when consent changes
export function handleConsentChange(): void {
  if (cookieConsentService.canUseFirebase() && !app) {
    console.log('User gave authentication consent - initializing Firebase');
    initializeFirebaseIfConsented();
  } else if (!cookieConsentService.canUseFirebase() && app) {
    console.log('User revoked authentication consent - Firebase services disabled');
    // Note: We don't actually destroy the Firebase instance as it may be in use
    // Instead, getters will return null
  }
}

// Listen for consent changes
cookieConsentService.addListener(() => {
  handleConsentChange();
});

// Try to initialize immediately if consent already exists
if (cookieConsentService.hasConsent()) {
  initializeFirebaseIfConsented();
}
