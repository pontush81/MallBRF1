import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import userService from '../services/userService';

// Make this file a module
export {};

// Typer för context
interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

// Skapa context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Lyssna på Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Hämta användardata från Firestore
          const userData = await userService.getUserById(firebaseUser.uid);
          
          if (userData) {
            setCurrentUser(userData);
            // Spara även i localStorage som fallback
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            console.warn('Hittade ingen användardata för inloggad användare');
            // Skapa standardanvändare baserat på Firebase-användare
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'user',
              name: firebaseUser.displayName || undefined
            };
            setCurrentUser(basicUser);
            localStorage.setItem('user', JSON.stringify(basicUser));
          }
        } catch (error) {
          console.error('Kunde inte hämta användardata:', error);
        }
      } else {
        // Ingen Firebase-användare, prova att återställa från localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
          } catch (error) {
            console.error('Kunde inte läsa användardata från localStorage:', error);
            localStorage.removeItem('user');
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });
    
    return () => unsubscribe(); // Städa upp vid unmount
  }, []);
  
  // Login-funktion (används när vi explicit loggar in)
  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };
  
  // Logout-funktion
  const logout = async () => {
    try {
      await signOut(auth); // Logga ut från Firebase
      setCurrentUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Kunde inte logga ut:', error);
    }
  };
  
  // Kontextvärdena
  const value = {
    currentUser,
    isLoggedIn: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    login,
    logout,
    loading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook för att använda auth-kontexten
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth måste användas inom en AuthProvider');
  }
  return context;
};

export default AuthContext;
