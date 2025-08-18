import { createTheme, ThemeOptions } from '@mui/material/styles';
import { designTokens } from './designSystem';

// Custom MUI theme using Gulmaran Design System
const gulmaranThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    
    primary: {
      main: designTokens.colors.primary[500],
      light: designTokens.colors.primary[300],
      dark: designTokens.colors.primary[700],
      contrastText: designTokens.colors.neutral.white,
    },
    
    secondary: {
      main: designTokens.colors.secondary[500],
      light: designTokens.colors.secondary[300],
      dark: designTokens.colors.secondary[700],
      contrastText: designTokens.colors.neutral.white,
    },
    
    success: {
      main: designTokens.colors.success[500],
      light: designTokens.colors.success[300],
      dark: designTokens.colors.success[700],
      contrastText: designTokens.colors.neutral.white,
    },
    
    warning: {
      main: designTokens.colors.warning[500],
      light: designTokens.colors.warning[300],
      dark: designTokens.colors.warning[700],
      contrastText: designTokens.colors.neutral.white,
    },
    
    error: {
      main: designTokens.colors.error[500],
      light: designTokens.colors.error[300],
      dark: designTokens.colors.error[700],
      contrastText: designTokens.colors.neutral.white,
    },
    
    background: {
      default: designTokens.colors.neutral.background,
      paper: designTokens.colors.neutral.surface,
    },
    
    text: {
      primary: designTokens.colors.secondary[800],
      secondary: designTokens.colors.secondary[600],
      disabled: designTokens.colors.secondary[400],
    },
    
    divider: designTokens.colors.neutral.outline,
    
    grey: {
      50: designTokens.colors.secondary[50],
      100: designTokens.colors.secondary[100],
      200: designTokens.colors.secondary[200],
      300: designTokens.colors.secondary[300],
      400: designTokens.colors.secondary[400],
      500: designTokens.colors.secondary[500],
      600: designTokens.colors.secondary[600],
      700: designTokens.colors.secondary[700],
      800: designTokens.colors.secondary[800],
      900: designTokens.colors.secondary[900],
    },
  },
  
  typography: {
    fontFamily: designTokens.typography.fontFamily.primary,
    
    // Headings
    h1: {
      fontSize: designTokens.typography.fontSize['5xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: designTokens.typography.fontSize['4xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: designTokens.typography.fontSize['3xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.tight,
    },
    h4: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    h5: {
      fontSize: designTokens.typography.fontSize.xl,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    h6: {
      fontSize: designTokens.typography.fontSize.lg,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    
    // Body text
    body1: {
      fontSize: designTokens.typography.fontSize.base,
      fontWeight: designTokens.typography.fontWeight.normal,
      lineHeight: designTokens.typography.lineHeight.relaxed,
    },
    body2: {
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.normal,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    
    // Captions and overlines
    caption: {
      fontSize: designTokens.typography.fontSize.xs,
      fontWeight: designTokens.typography.fontWeight.normal,
      lineHeight: designTokens.typography.lineHeight.normal,
      color: designTokens.colors.secondary[600],
    },
    overline: {
      fontSize: designTokens.typography.fontSize.xs,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.normal,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: designTokens.colors.secondary[600],
    },
    
    // Buttons
    button: {
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      textTransform: 'none',
      letterSpacing: '0.025em',
    },
  },
  
  shape: {
    borderRadius: parseInt(designTokens.borderRadius.lg.replace('rem', '')) * 16, // Convert rem to px
  },
  
  spacing: 8, // 8px base unit
  
  shadows: [
    'none',
    designTokens.shadows.sm,
    designTokens.shadows.base,
    designTokens.shadows.md,
    designTokens.shadows.md,
    designTokens.shadows.lg,
    designTokens.shadows.lg,
    designTokens.shadows.xl,
    designTokens.shadows.xl,
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
    designTokens.shadows['2xl'],
  ],
  
  components: {
    // Button Component
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
          padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
          fontSize: designTokens.typography.fontSize.sm,
          fontWeight: designTokens.typography.fontWeight.medium,
          textTransform: 'none',
          boxShadow: 'none',
          transition: designTokens.transitions.normal,
          
          '&:hover': {
            boxShadow: designTokens.shadows.sm,
            transform: 'translateY(-1px)',
          },
          
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        sizeSmall: {
          padding: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`,
          fontSize: designTokens.typography.fontSize.xs,
        },
        sizeLarge: {
          padding: `${designTokens.spacing[4]} ${designTokens.spacing[8]}`,
          fontSize: designTokens.typography.fontSize.base,
        },
      },
    },
    
    // Card Component
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
          border: `1px solid ${designTokens.colors.neutral.outline}`,
          boxShadow: designTokens.shadows.sm,
          transition: designTokens.transitions.normal,
          
          '&:hover': {
            boxShadow: designTokens.shadows.md,
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    
    // Paper Component
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
          border: `1px solid ${designTokens.colors.neutral.outline}`,
        },
        elevation1: {
          boxShadow: designTokens.shadows.sm,
        },
        elevation2: {
          boxShadow: designTokens.shadows.base,
        },
        elevation3: {
          boxShadow: designTokens.shadows.md,
        },
      },
    },
    
    // TextField Component
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.borderRadius.md,
            backgroundColor: designTokens.colors.neutral.surface,
            transition: designTokens.transitions.normal,
            
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: designTokens.colors.primary[300],
              },
            },
            
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: designTokens.colors.primary[500],
                borderWidth: '2px',
              },
            },
          },
        },
      },
    },
    
    // Chip Component
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.full,
          fontWeight: designTokens.typography.fontWeight.medium,
          fontSize: designTokens.typography.fontSize.xs,
        },
      },
    },
    
    // AppBar Component
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: designTokens.colors.neutral.surface,
          color: designTokens.colors.secondary[800],
          boxShadow: designTokens.shadows.sm,
          borderBottom: `1px solid ${designTokens.colors.neutral.outline}`,
        },
      },
    },
    
    // Table Components
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${designTokens.colors.neutral.outline}`,
          fontSize: designTokens.typography.fontSize.sm,
        },
        head: {
          backgroundColor: designTokens.colors.neutral.surfaceVariant,
          fontWeight: designTokens.typography.fontWeight.semibold,
          color: designTokens.colors.secondary[700],
        },
      },
    },
    
    // Dialog Component
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: designTokens.borderRadius.xl,
          padding: designTokens.spacing[6],
        },
      },
    },
    
    // Menu Component
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: designTokens.borderRadius.lg,
          boxShadow: designTokens.shadows.lg,
          border: `1px solid ${designTokens.colors.neutral.outline}`,
        },
      },
    },
    
    // MenuItem Component
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.base,
          margin: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
          fontSize: designTokens.typography.fontSize.sm,
          
          '&:hover': {
            backgroundColor: designTokens.colors.primary[50],
          },
          
          '&.Mui-selected': {
            backgroundColor: designTokens.colors.primary[100],
            
            '&:hover': {
              backgroundColor: designTokens.colors.primary[200],
            },
          },
        },
      },
    },
  },
  
  breakpoints: {
    values: {
      xs: 0,
      sm: parseInt(designTokens.breakpoints.sm),
      md: parseInt(designTokens.breakpoints.md),
      lg: parseInt(designTokens.breakpoints.lg),
      xl: parseInt(designTokens.breakpoints.xl),
    },
  },
};

// Create the theme
export const gulmaranTheme = createTheme(gulmaranThemeOptions);

export default gulmaranTheme;
