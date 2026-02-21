// New AuthContext using pure Supabase (replaces Firebase)
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { 
  AuthUser, 
  getCurrentUser, 
  logout as supabaseLogout, 
  onAuthStateChange 
} from '../services/supabaseAuthNew';

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isBoard: boolean;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBoard, setIsBoard] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef<AuthUser | null>(null);

  // Helper: update auth state only if data actually changed
  const updateUser = (user: AuthUser) => {
    const prev = currentUserRef.current;
    if (prev && prev.id === user.id && prev.role === user.role && prev.email === user.email) {
      console.log('ℹ️ Skipping redundant auth update for:', user.email);
      return; // no state change needed
    }
    console.log('🔄 Auth state updating:', user.email, 'role:', user.role);
    currentUserRef.current = user;
    setCurrentUser(user);
    setIsLoggedIn(true);
    setIsAdmin(user.role === 'admin');
    setIsBoard(user.role === 'board');
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  };

  // Initialize auth state
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {

        // Check if there's already a user logged in
        const user = await getCurrentUser();
        if (user) {
          updateUser(user);
        }

        // Listen for auth state changes
        // CRITICAL: use updateUser() to skip redundant updates that would
        // interrupt React 18 Suspense/lazy loading with unnecessary re-renders
        unsubscribe = onAuthStateChange((user) => {
          console.log('Auth state changed:', user?.email || 'logged out');

          if (user) {
            updateUser(user);
          } else {
            clearUserData();
          }
        });

      } catch (error) {
        console.error('Error initializing auth:', error);
        clearUserData();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Clean up for bfcache compatibility
    const handlePageHide = () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Force close any WebLocks for BFCache compatibility
      // (Silent - no debug logging needed in production)
    };

    // Enhanced BFCache support
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, []);

  const clearUserData = () => {
    currentUserRef.current = null;
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsBoard(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
  };

  const login = (user: AuthUser) => {
    console.log('Login called for:', user.email);
    updateUser(user);
    console.log('✅ Auth state updated for:', user.email, '| Role:', user.role);
  };

  const logout = async () => {
    console.log('🔄 AuthContext logout called - clearing UI state immediately');
    
    // CRITICAL: Clear UI state IMMEDIATELY (don't wait for Supabase)
    clearUserData();
    
    // CRITICAL: Also call Supabase logout to clear server-side session
    try {
      await supabaseLogout();
      console.log('✅ Supabase logout completed');
    } catch (error) {
      console.warn('⚠️ Supabase logout failed (continuing anyway):', error);
    }
    
    console.log('✅ Logout completed successfully');
  };

  const value: AuthContextType = {
    currentUser,
    isLoggedIn,
    isAdmin,
    isBoard,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};