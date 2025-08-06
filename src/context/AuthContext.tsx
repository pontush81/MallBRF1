import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseAvailable } from '../services/firebase';
import { userService } from '../services/userService';
import { User } from '../types/User';
import { clearSupabaseAuthCache } from '../services/supabaseAuth';
import { syncUserToSupabase } from '../services/supabaseSync';
import { cookieConsentService } from '../services/cookieConsent';

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => void;
  validateSession: () => Promise<void>;
  firebaseAvailable: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firebaseAvailable, setFirebaseAvailable] = useState(isFirebaseAvailable());
  const validationInProgress = useRef(false);

  const validateSession = async () => {
    if (validationInProgress.current) return;
    validationInProgress.current = true;

    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        console.log('Firebase not available - user needs to give authentication consent');
        clearUserData();
        return;
      }

      const firebaseUser = auth?.currentUser;
      if (!firebaseUser) {
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
          
          // Sync user to Supabase to ensure RLS policies work
          try {
            await syncUserToSupabase(parsedUser);
          } catch (error) {
            console.error('Failed to sync user to Supabase during validation:', error);
          }
        } else {
          // No saved user data, but Firebase user exists - fetch user data
          const userData = await userService.getUserById(firebaseUser.uid);
          if (userData) {
            await login(userData);
          } else {
            // User not found in Firestore - might be a GDPR-deleted user
            // Try to recover the profile if they're still on allowlist
            console.log('🔄 User profile not found, attempting recovery for:', firebaseUser.email);
            
            try {
              const { recoverDeletedUserProfile } = await import('../services/supabaseSync');
              const recoveredUser = await recoverDeletedUserProfile(firebaseUser);
              
              if (recoveredUser) {
                console.log('✅ Successfully recovered user profile');
                await login(recoveredUser);
              } else {
                console.log('❌ Could not recover user profile - user may not be allowed');
                clearUserData();
              }
            } catch (recoveryError) {
              console.error('Recovery attempt failed:', recoveryError);
              clearUserData();
            }
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
    clearSupabaseAuthCache(); // Clear Supabase auth tokens
    
    // Also clear all Supabase client caches
    const { clearAllAuthCaches } = require('../services/supabaseClient');
    clearAllAuthCaches();
    
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  // Handle consent changes
  useEffect(() => {
    const handleConsentChange = () => {
      const newFirebaseAvailable = isFirebaseAvailable();
      setFirebaseAvailable(newFirebaseAvailable);
      
      if (!newFirebaseAvailable) {
        console.log('Firebase consent revoked - clearing auth state');
        clearUserData();
      } else if (newFirebaseAvailable && !currentUser) {
        console.log('Firebase consent granted - attempting to restore session');
        validateSession();
      }
    };

    cookieConsentService.addListener(handleConsentChange);
    return () => cookieConsentService.removeListener(handleConsentChange);
  }, [currentUser, validateSession]);

  // Initialize and validate session
  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        console.log('Firebase auth not available - waiting for consent');
        setLoading(false);
        return;
      }

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
  }, [firebaseAvailable, validateSession]);

  // Validate session when user returns to the tab/window
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn && firebaseAvailable) {
        validateSession();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isLoggedIn && firebaseAvailable) {
        validateSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, firebaseAvailable, validateSession]);
  
  const login = async (user: User) => {
    console.log('🔍 Starting login process for:', user.email);
    
    // CRITICAL: Check GDPR/Supabase sync BEFORE setting login state
    // This prevents partial login states that confuse error handling
    try {
      console.log('🔍 Syncing user to Supabase before login...');
      await syncUserToSupabase(user);
      console.log('✅ Supabase sync successful, proceeding with login');
    } catch (error) {
      console.error('❌ Failed to sync user to Supabase:', error);
      
      // CRITICAL: If this is a GDPR-related error, we MUST prevent login completely
      if (error.message && error.message.includes('GDPR erasure request')) {
        console.error('🚨 GDPR VIOLATION: Preventing login for deleted user');
        
        // Make sure no login state is set
        setCurrentUser(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        
        // Force logout from Firebase Auth as well
        const auth = getFirebaseAuth();
        if (auth) {
          auth.signOut();
        }
        
        // Throw error that will be caught by Login component
        throw new Error('Account access denied: Your account has been permanently deleted per GDPR erasure request. You cannot log in to this system. same_user_attempting_restoration');
      }
      
      // For other sync errors, log but continue with login (non-critical)
      console.warn('⚠️ Non-critical sync error, allowing login to continue:', error.message);
    }
    
    // Only set login state after successful GDPR/Supabase checks
    console.log('✅ Setting user as logged in:', user.email);
    setCurrentUser(user);
    setIsLoggedIn(true);  
    setIsAdmin(user.role === 'admin');
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    const auth = getFirebaseAuth();
    if (auth) {
      auth.signOut();
    }
    clearUserData();
  };

  const value: AuthContextType = {
    currentUser,
    isLoggedIn,
    isAdmin,
    loading,
    login,
    logout,
    validateSession,
    firebaseAvailable
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
