import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
// MIGRATION: Replaced Firebase auth with native Supabase auth
import supabaseClient from '../services/supabaseClient';
// import { userService } from '../services/userService'; // MIGRATION: disabled
import { User } from '../types/User';
// MIGRATION: Using native Supabase auth - all Firebase references removed
import { auditLogger } from '../services/auditLogger';

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => void;
  validateSession: () => Promise<void>;
  supabaseReady: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(true);
  const validationInProgress = useRef(false);

  const validateSession = async () => {
    if (validationInProgress.current) return;
    validationInProgress.current = true;

    try {
      // Check Supabase auth session
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error);
        clearUserData();
        return;
      }

      if (!session?.user) {
        clearUserData();
        return;
      }

      // Session is valid, now get user data from Supabase
      const supabaseUser = session.user;
      
      // Check if we have cached user data first
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          // Verify the cached user matches current auth user
          if (parsedUser.id === supabaseUser.id) {
            setCurrentUser(parsedUser);
            setIsLoggedIn(true);
            setIsAdmin(parsedUser.role === 'admin');
            console.log('✅ Using cached user data:', parsedUser.email);
            return;
          }
        } catch (parseError) {
          console.warn('Invalid cached user data, will fetch from database');
        }
      }

      // Fetch user data from Supabase database directly
      try {
        console.log('🚀 Fetching user profile via direct REST API...');
        
        const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/users?id=eq.${supabaseUser.id}&select=*`, {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });

        const userData = response.ok ? (await response.json())[0] : null;
        const error = !response.ok;
          
        if (userData && !error) {
          await login(userData);
          console.log('✅ User validated from Supabase database:', userData.email);
        } else {
          // User exists in auth but not in users table - create profile
          console.log('🔄 Creating user profile for authenticated user:', supabaseUser.email);
          const newUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            role: 'user' as const, // Default role
            createdAt: new Date().toISOString()
          };
          
          // Save to database directly
          try {
            const createResponse = await fetch('https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/users', {
              method: 'POST',
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(newUser),
              signal: AbortSignal.timeout(5000)
            });
            
            const insertError = !createResponse.ok;
              
            if (!insertError) {
              await login(newUser);
              console.log('✅ Created and logged in new user:', newUser.email);
            } else {
              console.error('Failed to create user profile:', insertError);
              clearUserData();
            }
          } catch (createError) {
            console.error('Failed to create user profile:', createError);
            clearUserData();
          }
        }
      } catch (dbError) {
        console.error('Database error during session validation:', dbError);
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
    
    // MIGRATION: Using native Supabase auth clearing instead of Firebase bridge
    // Note: Actual Supabase logout is handled in the new auth system
    
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  // Supabase is always ready - no consent needed for authentication
  useEffect(() => {
    setSupabaseReady(true);
  }, []);

  // Initialize and validate session with Supabase
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Listen to Supabase auth state changes
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('🔐 Supabase auth event:', event, session?.user?.email);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session?.user) {
                await validateSession();
                // Log successful auth event (moved to validateSession to avoid duplicate logging)
              }
            } else if (event === 'SIGNED_OUT') {
              clearUserData();
              // Logout audit logging is handled in the logout function
            }
            
            if (mounted) {
              setLoading(false);
            }
          }
        );

        // Initial session check
        await validateSession();
        if (mounted) {
          setLoading(false);
        }

        // Return cleanup function
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          clearUserData();
          setLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      mounted = false;
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [supabaseReady, validateSession]);

  // Validate session when user returns to the tab/window
  useEffect(() => {
    const handleFocus = () => {
      if (isLoggedIn && supabaseReady) {
        validateSession();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isLoggedIn && supabaseReady) {
        validateSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, supabaseReady, validateSession]);
  
  const login = async (user: User) => {
    console.log('🔍 Starting login process for:', user.email);
    
    // MIGRATION: Temporarily disabled old Firebase sync during Supabase migration
    // TODO: Remove this entire section after migration is complete
    /*
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
    */
    
    // Only set login state after successful GDPR/Supabase checks
    console.log('✅ Setting user as logged in:', user.email);
    setCurrentUser(user);
    setIsLoggedIn(true);  
    setIsAdmin(user.role === 'admin');
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = async () => {
    try {
      // Log audit event before logout
      if (currentUser) {
        await auditLogger.logAuthEvent('auth_logout', currentUser.id);
      }
      
      // Sign out from Supabase
      await supabaseClient.auth.signOut();
      
      // Clear local data
      clearUserData();
      
      console.log('✅ Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if signOut fails
      clearUserData();
    }
  };

  const value: AuthContextType = {
    currentUser,
    isLoggedIn,
    isAdmin,
    loading,
    login,
    logout,
    validateSession,
    supabaseReady
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
