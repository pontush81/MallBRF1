import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getAppTheme, ThemeDesign, ThemeMode, ThemeFont, CustomColors } from '../theme/theme';
import { alpha } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';

interface ThemeContextType {
  mode: ThemeMode;
  toggleThemeMode: () => void;
  setMode: (mode: ThemeMode) => void;
  design: ThemeDesign;
  setDesign: (design: ThemeDesign) => void;
  fontFamily: ThemeFont;
  setFontFamily: (font: ThemeFont) => void;
  changeThemeDesign: (design: ThemeDesign) => void;
  customColors: CustomColors;
  setCustomColor: (key: keyof CustomColors, value: string) => void;
  autoModeEnabled: boolean;
  toggleAutoMode: () => void;
  theme: Theme;
  getPreviewColors: (design: ThemeDesign) => { primary: string, secondary: string, accent: string };
}

// Skapa context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook för att använda theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider komponent
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Hämta tema-inställningar från localStorage eller använd standardvärden
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'light';
  });
  
  const [design, setDesign] = useState<ThemeDesign>(() => {
    const savedDesign = localStorage.getItem('themeDesign');
    return (savedDesign as ThemeDesign) || 'light'; // Använder det nya ljusa temat som standard
  });
  
  const [fontFamily, setFont] = useState<ThemeFont>(() => {
    const savedFont = localStorage.getItem('themeFont') as ThemeFont | null;
    return savedFont || 'roboto';
  });
  
  const [customColors, setCustomColors] = useState<CustomColors>(() => {
    const savedColors = localStorage.getItem('themeCustomColors');
    return savedColors ? JSON.parse(savedColors) : {};
  });
  
  const [autoModeEnabled, setAutoModeEnabled] = useState<boolean>(() => {
    const savedAutoMode = localStorage.getItem('themeAutoMode');
    return savedAutoMode ? savedAutoMode === 'true' : false;
  });
  
  // Spara inställningarna i localStorage när de ändras
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);
  
  useEffect(() => {
    localStorage.setItem('themeDesign', design);
  }, [design]);
  
  useEffect(() => {
    localStorage.setItem('themeFont', fontFamily);
  }, [fontFamily]);
  
  useEffect(() => {
    localStorage.setItem('themeCustomColors', JSON.stringify(customColors));
  }, [customColors]);
  
  useEffect(() => {
    localStorage.setItem('themeAutoMode', String(autoModeEnabled));
  }, [autoModeEnabled]);
  
  // Automatiskt mörkt/ljust läge baserat på tid på dygnet
  useEffect(() => {
    if (!autoModeEnabled) return;
    
    const checkTimeAndSetMode = () => {
      const hour = new Date().getHours();
      const newMode = (hour >= 6 && hour < 18) ? 'light' : 'dark';
      setMode(newMode);
    };
    
    // Kör direkt vid start
    checkTimeAndSetMode();
    
    // Kör var 15:e minut
    const interval = setInterval(checkTimeAndSetMode, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoModeEnabled]);
  
  // Växla mellan ljust och mörkt läge
  const toggleThemeMode = () => {
    if (autoModeEnabled) {
      // Om automatiskt läge är på, stäng av det och byt till motsatt läge
      setAutoModeEnabled(false);
      setMode(prev => prev === 'light' ? 'dark' : 'light');
    } else {
      // Annars bara växla läge
      setMode(prev => prev === 'light' ? 'dark' : 'light');
    }
  };
  
  // Växla automatiskt läge
  const toggleAutoMode = () => {
    setAutoModeEnabled(prev => !prev);
  };
  
  // Byt design/färgschema
  const changeThemeDesign = (newDesign: ThemeDesign) => {
    setDesign(newDesign);
  };
  
  // Alias för setFont för att matcha interfacet
  const setFontFamily = setFont;
  
  // Skapa tema baserat på nuvarande inställningar
  const [theme, setAppTheme] = useState<Theme>(getAppTheme(design, mode, fontFamily, customColors));
  
  // Uppdatera temat när inställningar ändras
  useEffect(() => {
    setAppTheme(getAppTheme(design, mode, fontFamily, customColors));
  }, [design, mode, fontFamily, customColors]);
  
  // Fördefinierade färgprover för förhandsvisning
  const designPreviews = {
    light: {
      primary: '#1976D2', // Mörk blå
      secondary: '#2196F3', // Ljusare blå
      accent: '#82B1FF', // Ljus accent blå
    }
  };

  // Funktion för att hämta förhandsvisningsfärger för ett tema
  const getPreviewColors = (design: ThemeDesign) => {
    if (designPreviews[design]) {
      return designPreviews[design];
    }
    return designPreviews.light; // Fallback
  };

  // Funktion för att uppdatera en anpassad färg
  const setCustomColor = (key: keyof CustomColors, value: string) => {
    const updatedColors = { ...customColors, [key]: value };
    setCustomColors(updatedColors);
    
    // Spara till localStorage
    localStorage.setItem('themeCustomColors', JSON.stringify(updatedColors));
    
    // Uppdatera temat när färger ändras
    setAppTheme(getAppTheme(design, mode, fontFamily, updatedColors));
  };
  
  return (
    <ThemeContext.Provider value={{ 
      mode, 
      toggleThemeMode, 
      setMode, 
      design, 
      setDesign, 
      fontFamily, 
      setFontFamily, 
      changeThemeDesign, 
      customColors, 
      autoModeEnabled,
      toggleAutoMode,
      theme,
      setCustomColor,
      getPreviewColors
    }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};