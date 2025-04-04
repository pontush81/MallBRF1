import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Initialize state from localStorage
  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setIsLoggedIn(true);
        setIsAdmin(parsedUser.role === 'admin');
      } catch (error) {
        // If parsing fails, clear localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
      }
    }
    
    setLoading(false);
  }, []);
  
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
