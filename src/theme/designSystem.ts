/**
 * Gulmaran Design System
 * Modern design tokens and theme configuration
 */

// Design Tokens
export const designTokens = {
  // Color Palette
  colors: {
    // Primary Colors - Modern Blue
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE', 
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#2563EB', // Main primary
      600: '#1D4ED8',
      700: '#1E40AF',
      800: '#1E3A8A',
      900: '#1E3A8A',
    },
    
    // Secondary Colors - Sophisticated Gray
    secondary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B', // Main secondary
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    
    // Success Colors - Modern Green
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#059669', // Main success
      600: '#047857',
      700: '#065F46',
      800: '#064E3B',
      900: '#022C22',
    },
    
    // Warning Colors - Warm Orange
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#D97706', // Main warning
      600: '#B45309',
      700: '#92400E',
      800: '#78350F',
      900: '#451A03',
    },
    
    // Error Colors - Clean Red
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#DC2626', // Main error
      600: '#B91C1C',
      700: '#991B1B',
      800: '#7F1D1D',
      900: '#450A0A',
    },
    
    // Neutral Colors
    neutral: {
      white: '#FFFFFF',
      black: '#000000',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceVariant: '#F1F5F9',
      outline: '#E2E8F0',
      outlineVariant: '#CBD5E1',
    }
  },
  
  // Typography Scale
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  
  // Spacing Scale (8px grid system)
  spacing: {
    0: '0px',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem',    // 128px
  },
  
  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-out',
    normal: '250ms ease-out',
    slow: '350ms ease-out',
    
    // Specific transition types
    fade: 'opacity 150ms ease-out',
    scale: 'transform 150ms ease-out',
    slide: 'transform 250ms ease-out',
    color: 'color 150ms ease-out, background-color 150ms ease-out',
  },
};

// Component Variants
export const componentVariants = {
  button: {
    primary: {
      backgroundColor: designTokens.colors.primary[500],
      color: designTokens.colors.neutral.white,
      '&:hover': {
        backgroundColor: designTokens.colors.primary[600],
      },
      '&:active': {
        backgroundColor: designTokens.colors.primary[700],
      },
    },
    secondary: {
      backgroundColor: designTokens.colors.secondary[100],
      color: designTokens.colors.secondary[700],
      '&:hover': {
        backgroundColor: designTokens.colors.secondary[200],
      },
      '&:active': {
        backgroundColor: designTokens.colors.secondary[300],
      },
    },
    success: {
      backgroundColor: designTokens.colors.success[500],
      color: designTokens.colors.neutral.white,
      '&:hover': {
        backgroundColor: designTokens.colors.success[600],
      },
    },
    warning: {
      backgroundColor: designTokens.colors.warning[500],
      color: designTokens.colors.neutral.white,
      '&:hover': {
        backgroundColor: designTokens.colors.warning[600],
      },
    },
    error: {
      backgroundColor: designTokens.colors.error[500],
      color: designTokens.colors.neutral.white,
      '&:hover': {
        backgroundColor: designTokens.colors.error[600],
      },
    },
  },
  
  card: {
    elevated: {
      backgroundColor: designTokens.colors.neutral.surface,
      boxShadow: designTokens.shadows.md,
      borderRadius: designTokens.borderRadius.lg,
      border: `1px solid ${designTokens.colors.neutral.outline}`,
    },
    flat: {
      backgroundColor: designTokens.colors.neutral.surface,
      border: `1px solid ${designTokens.colors.neutral.outline}`,
      borderRadius: designTokens.borderRadius.lg,
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `2px solid ${designTokens.colors.neutral.outline}`,
      borderRadius: designTokens.borderRadius.lg,
    },
  },
};

export default designTokens;
