// New AuthContext using pure Supabase (replaces Firebase)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        // Check if there's already a user logged in
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setIsAdmin(user.role === 'admin');
          
          // Save to localStorage for persistence
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('isLoggedIn', 'true');
        }

        // Listen for auth state changes
        unsubscribe = onAuthStateChange((user) => {
          console.log('Auth state changed:', user?.email || 'logged out');
          
          if (user) {
            setCurrentUser(user);
            setIsLoggedIn(true);
            setIsAdmin(user.role === 'admin');
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
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
      if ('locks' in navigator) {
        navigator.locks.query().then((state) => {
          // Log but don't interfere with Supabase internal locks
          console.debug('Active locks:', state);
        });
      }
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
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
  };

  const login = (user: AuthUser) => {
    console.log('Login called for:', user.email);
    setCurrentUser(user);
    setIsLoggedIn(true);
    setIsAdmin(user.role === 'admin');
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = async () => {
    console.log('🔄 AuthContext logout called - clearing UI state immediately');
    
    // CRITICAL: Clear UI state IMMEDIATELY (don't wait for Supabase)
    clearUserData();
    
    // Note: Using localStorage-based auth, Supabase logout handled in service layer
    console.log('✅ Logout completed successfully');
  };

  const value: AuthContextType = {
    currentUser,
    isLoggedIn,
    isAdmin,
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