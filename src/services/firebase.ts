// Firebase konfiguration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase konfiguration med direkta värden
const firebaseConfig = {
  apiKey: "AIzaSyBcejOQaE8Zz9evK-YGQkgfbtZN5YdDubM",
  authDomain: "mallbrf.firebaseapp.com",
  projectId: "mallbrf",
  storageBucket: "mallbrf.firebasestorage.app",
  messagingSenderId: "126578972440", // Antaget värde baserat på app-ID
  appId: "1:126578972440:web:6ad785f99a7b344dd5b06d"
};

// Initialisera Firebase
const app = initializeApp(firebaseConfig);

// Exportera Firebase-tjänster för användning i applikationen
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
