import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getAppTheme, ThemeDesign, ThemeMode, ThemeFont, CustomColors } from '../theme/theme';

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
  // Inställningar för tema
  const [design, setDesign] = useState<ThemeDesign>(() => {
    const savedDesign = localStorage.getItem('themeDesign');
    return (savedDesign as ThemeDesign) || 'light';
  });
  
  // Alltid använda light mode
  const [, setMode] = useState<ThemeMode>('light');
  
  const [font, setFont] = useState<ThemeFont>(() => {
    const savedFont = localStorage.getItem('themeFont');
    return (savedFont as ThemeFont) || 'roboto';
  });
  
  const [customColors, setCustomColors] = useState<CustomColors>({});
  
  // Alltid inaktivera auto mode
  const [autoModeEnabled] = useState<boolean>(false);
  
  // Spara designval
  useEffect(() => {
    localStorage.setItem('themeDesign', design);
  }, [design]);
  
  // Spara typsnitt
  useEffect(() => {
    localStorage.setItem('themeFont', font);
  }, [font]);
  
  // Uppdatera en specifik färg
  const setCustomColor = (key: keyof CustomColors, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Automatiskt mörkt/ljust läge baserat på tid på dygnet - inaktiverat
  useEffect(() => {
    // Automatisk växling är inaktiverad
    // Alltid sätt mode till 'light'
    setMode('light');
  }, []);
  
  // Växla mellan ljust och mörkt läge - inaktiverat
  const toggleThemeMode = () => {
    // Funktion behålls för bakåtkompatibilitet men gör ingenting
    console.log('Dark mode är inaktiverat i applikationen');
  };
  
  // Växla automatiskt läge - inaktiverat
  const toggleAutoMode = () => {
    // Funktion behålls för bakåtkompatibilitet men gör ingenting
    console.log('Auto mode är inaktiverat i applikationen');
  };
  
  // Byt design/färgschema
  const changeThemeDesign = (newDesign: ThemeDesign) => {
    setDesign(newDesign);
  };
  
  // Alias för setFont för att matcha interfacet
  const setFontFamily = setFont;
  
  // Skapa tema baserat på nuvarande inställningar
  const [theme, setAppTheme] = useState<Theme>(getAppTheme(design, 'light', font, customColors));
  
  // Uppdatera temat när inställningar ändras - alltid använd 'light' som mode
  useEffect(() => {
    setAppTheme(getAppTheme(design, 'light', font, customColors));
  }, [design, font, customColors]);
  
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
  
  return (
    <ThemeContext.Provider 
      value={{
        mode: 'light',
        toggleThemeMode,
        setMode,
        design,
        setDesign,
        fontFamily: font,
        setFontFamily,
        changeThemeDesign,
        customColors,
        setCustomColor,
        autoModeEnabled,
        toggleAutoMode,
        theme,
        getPreviewColors
      }}
    >
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};