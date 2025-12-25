/**
 * Båstad Theme - "Kvällsljus över Bjärehalvön"
 * 
 * A distinctive design system inspired by the Swedish west coast:
 * - Deep ocean blues for trust and depth
 * - Warm sand tones for comfort
 * - Sunset terracotta for energy
 * - Natural greens for growth
 * 
 * Typography: Fraunces (distinctive serif) + DM Sans (modern sans)
 */

export const bastadTheme = {
  // ═══════════════════════════════════════════════════════════
  // COLOR PALETTE - "Kvällsljus över Bjärehalvön"
  // ═══════════════════════════════════════════════════════════
  colors: {
    // Deep Ocean - Primary (trust, depth, sophistication)
    ocean: {
      50: '#f0f4f8',
      100: '#d9e2ec',
      200: '#bcccdc',
      300: '#9fb3c8',
      400: '#7e9ab8',
      500: '#627d98',
      600: '#486581',
      700: '#334e68',
      800: '#243b53',
      900: '#102a43', // Deep sea - main dark
      950: '#0a1628', // Midnight ocean - hero backgrounds
    },
    
    // Sunset Sand - Warm neutrals
    sand: {
      50: '#fdfcfb',
      100: '#f9f5f0',
      200: '#f5ebe0', // Primary sand - light backgrounds
      300: '#ede0d4',
      400: '#e3d5ca',
      500: '#d5c4a1',
      600: '#b8a586',
      700: '#8b7355', // Driftwood
      800: '#6b5744',
      900: '#4a3c2a',
    },
    
    // Sunset Terracotta - Accent (warmth, action)
    terracotta: {
      50: '#fef6f0',
      100: '#fce8d9',
      200: '#f9d0b3',
      300: '#f4b183',
      400: '#eb8f5a',
      500: '#c2703a', // Primary terracotta - CTAs
      600: '#a85c2d',
      700: '#8c4a24',
      800: '#6f3a1c',
      900: '#522b14',
    },
    
    // Sea Green - Secondary accent (nature, growth)
    seagreen: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#2d6a4f', // Deep sea green
      600: '#1b4332',
      700: '#14532d',
      800: '#064e3b',
      900: '#022c22',
    },
    
    // Twilight Blue - Hover states, links
    twilight: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#1e3a5f', // Primary twilight
      600: '#0e477d',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Utility colors
    white: '#ffffff',
    black: '#0a0a0a',
    
    // Semantic colors
    success: '#2d6a4f',
    warning: '#d97706',
    error: '#be123c',
    info: '#1e3a5f',
  },

  // ═══════════════════════════════════════════════════════════
  // TYPOGRAPHY - Distinctive & Memorable
  // ═══════════════════════════════════════════════════════════
  typography: {
    fontFamily: {
      // Fraunces: A distinctive serif with personality
      heading: '"Fraunces", Georgia, "Times New Roman", serif',
      // DM Sans: Clean, modern, excellent readability
      body: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      // Monospace for code
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
      '7xl': '4.5rem',   // 72px - Hero headlines
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: 1.1,
      snug: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // GRADIENTS - Atmospheric & Distinctive
  // ═══════════════════════════════════════════════════════════
  gradients: {
    // Hero gradient - Dramatic ocean sunset
    hero: 'linear-gradient(135deg, #0a1628 0%, #102a43 25%, #1e3a5f 50%, #334e68 75%, #486581 100%)',
    
    // Alternative hero - warmer sunset feel
    heroWarm: 'linear-gradient(180deg, #102a43 0%, #243b53 40%, #334e68 70%, #c2703a 100%)',
    
    // Subtle page background
    pageBackground: 'linear-gradient(180deg, #fdfcfb 0%, #f5ebe0 100%)',
    
    // Card hover effect
    cardHover: 'linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, rgba(194, 112, 58, 0.05) 100%)',
    
    // CTA button gradient
    ctaButton: 'linear-gradient(135deg, #c2703a 0%, #a85c2d 100%)',
    
    // Ocean button (secondary)
    oceanButton: 'linear-gradient(135deg, #1e3a5f 0%, #102a43 100%)',
    
    // Text gradient for special headlines
    textGradient: 'linear-gradient(135deg, #f5ebe0 0%, #c2703a 50%, #f5ebe0 100%)',
  },

  // ═══════════════════════════════════════════════════════════
  // SHADOWS - Subtle & Natural
  // ═══════════════════════════════════════════════════════════
  shadows: {
    sm: '0 1px 2px 0 rgba(10, 22, 40, 0.05)',
    base: '0 1px 3px 0 rgba(10, 22, 40, 0.1), 0 1px 2px -1px rgba(10, 22, 40, 0.1)',
    md: '0 4px 6px -1px rgba(10, 22, 40, 0.1), 0 2px 4px -2px rgba(10, 22, 40, 0.1)',
    lg: '0 10px 15px -3px rgba(10, 22, 40, 0.1), 0 4px 6px -4px rgba(10, 22, 40, 0.1)',
    xl: '0 20px 25px -5px rgba(10, 22, 40, 0.1), 0 8px 10px -6px rgba(10, 22, 40, 0.1)',
    '2xl': '0 25px 50px -12px rgba(10, 22, 40, 0.25)',
    
    // Warm glow for CTAs
    warmGlow: '0 10px 40px -10px rgba(194, 112, 58, 0.4)',
    
    // Card shadow with warm accent
    card: '0 4px 20px -4px rgba(10, 22, 40, 0.08), 0 0 0 1px rgba(10, 22, 40, 0.04)',
    cardHover: '0 12px 40px -8px rgba(10, 22, 40, 0.15), 0 0 0 1px rgba(194, 112, 58, 0.1)',
    
    inner: 'inset 0 2px 4px 0 rgba(10, 22, 40, 0.06)',
  },

  // ═══════════════════════════════════════════════════════════
  // SPACING & LAYOUT
  // ═══════════════════════════════════════════════════════════
  spacing: {
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    32: '8rem',      // 128px
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  // ═══════════════════════════════════════════════════════════
  // ANIMATIONS & TRANSITIONS
  // ═══════════════════════════════════════════════════════════
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Keyframe animation values
  animations: {
    fadeInUp: {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    scaleIn: {
      from: { opacity: 0, transform: 'scale(0.95)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
    slideInFromRight: {
      from: { opacity: 0, transform: 'translateX(20px)' },
      to: { opacity: 1, transform: 'translateX(0)' },
    },
  },

  // ═══════════════════════════════════════════════════════════
  // BREAKPOINTS
  // ═══════════════════════════════════════════════════════════
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Export type for TypeScript
export type BastadTheme = typeof bastadTheme;
export default bastadTheme;

