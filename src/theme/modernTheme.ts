// Professional Design System for MallBRF1
// Sophisticated color palette for housing cooperative/property management

export const modernTheme = {
  // Professional color palette - trust, stability, sophistication
  colors: {
    // Professional navy blue - main primary (inspired by handbok.org)
    primary: {
      50: '#f0f4f8',
      100: '#d9e5ee',
      200: '#b3cbe0',
      300: '#8db1d2',
      400: '#6797c4',
      500: '#4a7ba7', // Professional navy blue
      600: '#3e6689',
      700: '#32516b',
      800: '#263c4d',
      900: '#1a272f',
    },
    // Keep professional blue as secondary
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Professional blue for accents
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Warm orange accent (inspired by handbok.org)
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Vibrant warm orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    // Green accent for success states
    accentGreen: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#059669', // Professional green
      600: '#047857',
      700: '#065f46',
      800: '#064e3b',
      900: '#022c22',
    },
    // Purple accent for variety
    accentPurple: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6', // Modern purple
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    gray: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    },
    white: '#ffffff',
    black: '#000000',
  },

  // Professional gradients - subtle and sophisticated (inspired by handbok.org)
  gradients: {
    // Modern card gradient - multi-layer effect
    card: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
    
    // Enhanced card hover with subtle blue tint
    cardHover: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 30%, #f0f9ff 100%)',
    
    // Primary gradient for buttons and CTAs
    primary: 'linear-gradient(135deg, #4a7ba7 0%, #3e6689 100%)',
    
    // Warm accent gradient
    accent: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    
    // Green accent gradient
    accentGreen: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    
    // Purple accent gradient
    accentPurple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    
    // Subtle background gradient
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    
    // Header gradient (for ModernHeader)
    header: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 20%, #f1f5f9 40%, #e2e8f0 75%, #cbd5e1 100%)',
    
    // Dark mode variants (for ModernCard)
    darkCard: 'linear-gradient(145deg, #27272a 0%, #3f3f46 100%)',
  },

  // Modern typography scale
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      secondary: '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
      mono: '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
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
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Modern spacing system
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // Modern shadows - multi-layer for depth (inspired by handbok.org)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    
    // Enhanced card shadows for modern feel
    card: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
    cardHover: '0 8px 20px rgba(0,0,0,0.08), 0 3px 12px rgba(0,0,0,0.1)',
    cardActive: '0 12px 28px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.15)',
    
    // Enhanced icon shadows
    icon: '0 3px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
    iconHover: '0 6px 20px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
    
    // Search bar shadows
    search: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
    searchFocus: '0 8px 24px rgba(139, 92, 246, 0.15), 0 3px 12px rgba(0,0,0,0.12)',
    
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Z-index scale
  zIndex: {
    auto: 'auto',
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    tooltip: 1000,
    modal: 1050,
    popover: 1100,
    overlay: 1200,
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '900px',
    lg: '1200px',
    xl: '1536px',
  },

  // Animation and transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
    bounce: '0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
}; 