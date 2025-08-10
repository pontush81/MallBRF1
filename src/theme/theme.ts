import { createTheme, responsiveFontSizes, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

export type ThemeDesign = 'light' | 'dark' | 'nordic' | 'sunset' | 'ocean';
export type ThemeMode = 'light' | 'dark';
export type ThemeFont = 'roboto' | 'montserrat' | 'playfair' | 'opensans' | 'lato';

// Typsnitt definitioner
export const fontFamilies: Record<ThemeFont, string> = {
  roboto: '"Roboto", "Helvetica", "Arial", sans-serif',
  montserrat: '"Montserrat", "Roboto", "Helvetica", sans-serif',
  playfair: '"Playfair Display", "Georgia", serif',
  opensans: '"Open Sans", "Roboto", "Helvetica", sans-serif',
  lato: '"Lato", "Roboto", "Helvetica", sans-serif',
};

// Sparade inställningar för custom temadesign
export interface CustomColors {
  primaryMain?: string;
  primaryLight?: string;
  primaryDark?: string;
  secondaryMain?: string;
  secondaryLight?: string;
  secondaryDark?: string;
  accent?: string;
}

// Fördefinierade färgscheman
const themeDesigns = {
  // Ljust tema - blåa toner
  light: {
    primary: {
      main: '#1976D2', // Mörk blå
      light: '#64B5F6',
      dark: '#0D47A1',
    },
    secondary: {
      main: '#2196F3', // Ljusare blå
      light: '#90CAF9',
      dark: '#1565C0',
    },
    accent: '#82B1FF', // Ljus accent blå
  },
  
  // Mörkt tema - ren svart bakgrund
  dark: {
    primary: {
      main: '#4287f5', // Klar blå
      light: '#75a7ff',
      dark: '#0d55c9',
    },
    secondary: {
      main: '#90caf9', // Ljusare blå
      light: '#c3fdff',
      dark: '#5d99c6',
    },
    accent: '#0288d1', // Accent blå
  },
  
  // Nordic tema - slate-blå och terracotta
  nordic: {
    primary: {
      main: '#607D8B', // Slate blå
      light: '#90A4AE',
      dark: '#455A64',
    },
    secondary: {
      main: '#D84315', // Terracotta
      light: '#FF8A65',
      dark: '#BF360C',
    },
    accent: '#78909C', // Ljusare slate
  },
  
  // Sunset tema - lila och orange
  sunset: {
    primary: {
      main: '#673AB7', // Lila
      light: '#9575CD',
      dark: '#4527A0',
    },
    secondary: {
      main: '#FF5722', // Orange
      light: '#FF8A65',
      dark: '#E64A19',
    },
    accent: '#FFC107', // Gul accent
  },
  
  // Ocean tema - teal och korall
  ocean: {
    primary: {
      main: '#009688', // Teal
      light: '#4DB6AC',
      dark: '#00796B',
    },
    secondary: {
      main: '#FF5252', // Korall
      light: '#FF8A80',
      dark: '#D32F2F',
    },
    accent: '#40C4FF', // Ljusblå accent
  }
};

// Skapa tema baserat på vald design och ljus/mörkt läge
export function getAppTheme(
  design: ThemeDesign = 'light',
  mode: ThemeMode = 'light',
  fontFamily: ThemeFont = 'roboto',
  customColors: CustomColors = {}
): Theme {
  // Hämta färger baserat på designvalet, eller använd ljust tema som standard
  const themeColors = themeDesigns[design] || themeDesigns.light;
  
  // Hämta typsnittsfamiljen
  const selectedFontFamily = fontFamilies[fontFamily] || fontFamilies.roboto;
  
  // Definiera färgvariablerna
  let colors = {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    accent: themeColors.accent
  };
  
  // Anpassade bakgrundsfärger för dark mode
  const backgrounds = {
    light: {
      default: '#ffffff', // Clean white background
      paper: '#ffffff'
    },
    dark: {
      default: '#000000', // Helt svart bakgrund
      paper: '#121212'
    }
  };
  
  return responsiveFontSizes(
    createTheme({
      palette: {
        mode,
        primary: colors.primary,
        secondary: colors.secondary,
        background: {
          default: mode === 'light' ? backgrounds.light.default : backgrounds.dark.default,
          paper: mode === 'light' ? backgrounds.light.paper : backgrounds.dark.paper
        },
        text: {
          primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 1)',
          secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)'
        },
        ...(mode === 'dark' && {
          action: {
            active: 'rgba(255, 255, 255, 0.9)',
            hover: 'rgba(255, 255, 255, 0.08)',
            selected: 'rgba(255, 255, 255, 0.16)',
            disabled: 'rgba(255, 255, 255, 0.3)',
            disabledBackground: 'rgba(255, 255, 255, 0.12)'
          }
        }),
      },
      typography: {
        fontFamily: selectedFontFamily,
        h1: {
          fontSize: '2.5rem',
          fontWeight: 500,
          lineHeight: 1.2,
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
          ...(mode === 'dark' && {
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            fontWeight: 600
          })
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 500,
          lineHeight: 1.2,
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
          ...(mode === 'dark' && {
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            fontWeight: 600
          })
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 500,
          lineHeight: 1.2,
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
          ...(mode === 'dark' && {
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            fontWeight: 600
          })
        },
        h4: {
          fontSize: '1.5rem',
          fontWeight: 500,
          lineHeight: 1.2,
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
          ...(mode === 'dark' && {
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            fontWeight: 600
          })
        },
        h5: {
          fontSize: '1.25rem',
          fontWeight: 500,
          lineHeight: 1.2,
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
          ...(mode === 'dark' && {
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            fontWeight: 600
          })
        },
        h6: {
          fontSize: '1rem',
          fontWeight: 500,
          lineHeight: 1.2,
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
          ...(mode === 'dark' && {
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            fontWeight: 600
          })
        },
        subtitle1: {
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
        },
        subtitle2: {
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
        },
        body1: {
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
        },
        body2: {
          color: mode === 'dark' ? '#FFFFFF' : '#212121',
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: ({ theme }) => ({
              textTransform: 'none',
              borderRadius: 4,
              transition: 'all 0.2s',
              ...(theme.palette.mode === 'dark' && {
                boxShadow: 'none'
              }),
              ...(theme.palette.mode === 'light' && {
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.9)
                }
              })
            }),
          },
        },
        MuiTypography: {
          styleOverrides: {
            root: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                '&.MuiTypography-h1, &.MuiTypography-h2, &.MuiTypography-h3, &.MuiTypography-h4, &.MuiTypography-h5, &.MuiTypography-h6': {
                  color: '#FFFFFF',
                  textShadow: 'none',
                  fontWeight: 500
                }
              })
            }),
            h1: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                color: '#FFFFFF !important',
                textShadow: 'none !important',
                fontWeight: 500
              })
            }),
            h2: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                color: '#FFFFFF !important',
                textShadow: 'none !important',
                fontWeight: 500
              })
            }),
            h3: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                color: '#FFFFFF !important',
                textShadow: 'none !important',
                fontWeight: 500
              })
            }),
            h4: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                color: '#FFFFFF !important',
                textShadow: 'none !important',
                fontWeight: 500
              })
            }),
            h5: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                color: '#FFFFFF !important',
                textShadow: 'none !important',
                fontWeight: 500
              })
            }),
            h6: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                color: '#FFFFFF !important',
                textShadow: 'none !important',
                fontWeight: 500
              })
            }),
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: ({ theme }) => ({
              boxShadow: theme.palette.mode === 'light' 
                ? '0 4px 20px rgba(0,0,0,0.1)' 
                : 'none',
              background: theme.palette.mode === 'dark'
                ? '#121212'
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }),
          },
        },
        MuiCard: {
          styleOverrides: {
            root: ({ theme }) => ({
              boxShadow: theme.palette.mode === 'light'
                ? '0 2px 8px rgba(0,0,0,0.08)'
                : 'none',
              borderRadius: 4,
              transition: 'none',
              overflow: 'hidden',
              ...(theme.palette.mode === 'dark' && {
                backgroundColor: '#121212',
                border: '1px solid rgba(255,255,255,0.05)'
              }),
              ...(theme.palette.mode === 'light' && {
                backgroundColor: '#ffffff',
                border: '1px solid rgba(25, 118, 210, 0.05)'
              }),
            }),
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: ({ theme }) => ({
              transition: 'none',
              ...(theme.palette.mode === 'dark' && {
                backgroundImage: 'none',
                backgroundColor: '#121212',
                borderRadius: 4,
                boxShadow: 'none'
              }),
            }),
          },
        },
        MuiDivider: {
          styleOverrides: {
            root: ({ theme }) => ({
              borderColor: theme.palette.mode === 'light' 
                ? 'rgba(25, 118, 210, 0.1)' 
                : 'rgba(255,255,255,0.06)',
            }),
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                backgroundColor: 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }),
            }),
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: ({ theme }) => ({
              ...(theme.palette.mode === 'dark' && {
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                '&:nth-of-type(even)': {
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                },
              }),
            }),
          },
        },
      },
    })
  );
}

// Default theme för bakåtkompatibilitet
export const defaultTheme = getAppTheme('light', 'light');

// Funktion för att göra en färg mer mättad (för hover-effekter, etc.)
export const saturate = (color: string, amount: number = 0.15): string => {
  return color;
}; 