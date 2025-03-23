// Firebase konfiguration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase konfiguration med direkta värden
const firebaseConfig = {
  apiKey: "AIzaSyDxBm9QUgWVa4gEHHWMz6EqXApOZEyoN8Y",
  authDomain: "mallbrf.firebaseapp.com",
  projectId: "mallbrf",
  storageBucket: "mallbrf.appspot.com",
  messagingSenderId: "654889533399",
  appId: "1:654889533399:web:0b0b0b0b0b0b0b0b0b0b0b"
};

// Initialisera Firebase
const app = initializeApp(firebaseConfig);

// Exportera Firebase-tjänster för användning i applikationen
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
