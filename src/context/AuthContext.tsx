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
      if (firebaseUser) {
        try {
          // First, get the ID token result to check claims
          const idTokenResult = await firebaseUser.getIdTokenResult(true);
          console.log('Token claims:', idTokenResult.claims);
          
          // Try to get user data from API
          const userData = await userService.getUserById(firebaseUser.uid);
          
          if (userData) {
            console.log('User data from API:', userData);
            setUser(userData);
          } else {
            // If API call fails, use Firebase data with claims
            const claimRole = idTokenResult.claims.role;
            const role = (typeof claimRole === 'string' && 
              (claimRole === 'admin' || claimRole === 'user')) ? claimRole : 'user';
            console.log('Using Firebase data with role:', role);
            
            const tempUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: role,
              name: firebaseUser.displayName || '',
              isActive: true,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            setUser(tempUser);
          }
        } catch (error) {
          console.error('Error during auth state change:', error);
          setError('Failed to fetch user data');
        }
      } else {
        // No Firebase user, try to restore from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Failed to logout');
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
