import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types/User';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { userService } from '../services/userService';

// Make this file a module
export {};

// Typer för context
interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (user: User) => void;
  logout: () => Promise<boolean>;
}

// Skapa context
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoggedIn: false,
  isAdmin: false,
  login: () => {},
  logout: async () => false,
});

// Context provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const validationInProgress = useRef(false);

  // Validate session and refresh token if needed
  const validateSession = async () => {
    if (validationInProgress.current) return;
    
    try {
      validationInProgress.current = true;
      
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        // No Firebase user, clear local storage
        clearUserData();
        return;
      }

      // Check if token is still valid by trying to refresh it
      try {
        await firebaseUser.getIdToken(true); // Force refresh
        
        // If successful, validate user data from local storage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);
          setIsLoggedIn(true);
          setIsAdmin(parsedUser.role === 'admin');
                 } else {
           // No saved user data, but Firebase user exists - fetch user data
           const userData = await userService.getUserById(firebaseUser.uid);
           if (userData) {
             login(userData);
           } else {
             clearUserData();
           }
         }
      } catch (tokenError) {
        console.warn('Token validation failed:', tokenError);
        clearUserData();
      }
    } catch (error) {
      console.error('Session validation error:', error);
      clearUserData();
    } finally {
      validationInProgress.current = false;
    }
  };

  const clearUserData = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('pages_last_load');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  // Initialize and validate session
  useEffect(() => {
    try {
      // Listen to Firebase auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await validateSession();
        } else {
          clearUserData();
        }
        setLoading(false);
      });

      // Cleanup function
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearUserData();
      setLoading(false);
    }
  }, []);

  // Validate session when user returns to the tab/window
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn) {
        validateSession();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isLoggedIn) {
        validateSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn]);
  
  const login = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setIsAdmin(user.role === 'admin');
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = async () => {
    try {
      setLoading(true);
      await auth.signOut();
      
      // Clear storage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isLoggedIn');
      
      // Update state
      setCurrentUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);
      
      // Add small delay before completing logout to avoid ResizeObserver errors
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      setLoading(false);
      return false;
    }
  };

  // Value object to provide through context
  const value = {
    currentUser,
    isLoggedIn,
    isAdmin,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook för att använda auth-kontexten
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
