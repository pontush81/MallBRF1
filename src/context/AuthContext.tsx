import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/User';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { userService } from '../services/userService';

// Make this file a module
export {};

// Typer för context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  login: (user: User) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentUser: User | null;
}

// Skapa context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  logout: async () => {},
  login: () => {},
  isLoggedIn: false,
  isAdmin: false,
  currentUser: null
});

// Context provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed properties
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'admin';
  const currentUser = user;

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Firebase user found:', firebaseUser.uid);
          
          // Get token details
          const idTokenResult = await firebaseUser.getIdTokenResult(true);
          console.log('Token claims:', idTokenResult.claims);
          
          try {
            // Try to get user data from API
            const userData = await userService.getUserById(firebaseUser.uid);
            if (userData) {
              console.log('User data from API:', userData);
              setUser(userData);
              localStorage.setItem('userData', JSON.stringify(userData));
            } else {
              // Use Firebase data if API fails
              const claimRole = idTokenResult.claims.role;
              const role = (typeof claimRole === 'string' && 
                (claimRole === 'admin' || claimRole === 'user')) ? claimRole : 'user';
              console.log('Using Firebase data with role:', role);
              
              const tempUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || '',
                role: role,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
              };
              
              setUser(tempUser);
              localStorage.setItem('userData', JSON.stringify(tempUser));
            }
          } catch (apiError) {
            console.error('Error fetching user data from API:', apiError);
            
            // Use Firebase data if API fails
            const claimRole = idTokenResult.claims.role;
            const role = (typeof claimRole === 'string' && 
              (claimRole === 'admin' || claimRole === 'user')) ? claimRole : 'user';
            console.log('Using Firebase data with role:', role);
            
            const tempUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              role: role,
              isActive: true,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            
            setUser(tempUser);
            localStorage.setItem('userData', JSON.stringify(tempUser));
          }
          
          setLoading(false);
        } else {
          // User is signed out
          setUser(null);
          localStorage.removeItem('userData');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError('An error occurred while checking authentication status');
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Failed to logout');
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      logout, 
      login,
      isLoggedIn,
      isAdmin,
      currentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook för att använda auth-kontexten
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
