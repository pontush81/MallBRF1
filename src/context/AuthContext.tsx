import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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
  
  // Försök att återställa användardata från localStorage vid start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Kunde inte läsa användardata från localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);
  
  // Spara användardata till localStorage när den ändras
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('user');
    }
  }, [currentUser]);
  
  // Logga in användare
  const login = (user: User) => {
    setCurrentUser(user);
  };
  
  // Logga ut användare
  const logout = () => {
    setCurrentUser(null);
  };
  
  // Kontrollera om användaren är admin
  const isAdmin = !!currentUser && currentUser.role === 'admin';
  
  // Kontrollera om användaren är inloggad
  const isLoggedIn = !!currentUser;
  
  const value = {
    currentUser,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    loading
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook för enkel åtkomst till context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth måste användas inom en AuthProvider');
  }
  return context;
};

export default AuthContext;
