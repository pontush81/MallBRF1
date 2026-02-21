import React, { createContext, useContext } from 'react';
import { ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import { gulmaranTheme } from '../theme/gulmaranTheme';

interface ThemeContextType {
  mode: 'light';
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ mode: 'light', theme: gulmaranTheme }}>
      <MuiThemeProvider theme={gulmaranTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
