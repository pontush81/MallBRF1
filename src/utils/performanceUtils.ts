/**
 * Performance optimization utilities
 * Implements GPU-accelerated animations and efficient transforms
 */

// GPU-accelerated animation styles
export const gpuAnimations = {
  // Hover scale with GPU acceleration
  hoverScale: {
    transition: 'transform 0.2s ease',
    willChange: 'transform', // Hint browser to use GPU
    '&:hover': { 
      transform: 'scale3d(1.1, 1.1, 1)', // Use 3D transform for GPU
      backfaceVisibility: 'hidden' // Prevent flicker
    }
  },

  // Fade in animation
  fadeIn: {
    transition: 'opacity 0.3s ease',
    willChange: 'opacity',
    '&.fade-enter': {
      opacity: 0
    },
    '&.fade-enter-active': {
      opacity: 1
    }
  },

  // Slide animations
  slideUp: {
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform',
    transform: 'translate3d(0, 0, 0)', // Force GPU layer
    '&.slide-enter': {
      transform: 'translate3d(0, 20px, 0)'
    },
    '&.slide-enter-active': {
      transform: 'translate3d(0, 0, 0)'
    }
  },

  // Optimized loading spinner
  spin: {
    animation: 'optimizedSpin 1s linear infinite',
    willChange: 'transform',
    transform: 'translate3d(0, 0, 0)' // Force GPU layer
  }
};

// Keyframes for GPU-optimized animations
export const keyframes = `
  @keyframes optimizedSpin {
    0% { transform: rotate3d(0, 0, 1, 0deg); }
    100% { transform: rotate3d(0, 0, 1, 360deg); }
  }
`;

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
};

// Throttle utility for scroll events
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

// Lazy loading utility
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  if (!window.IntersectionObserver) {
    // Fallback for older browsers
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
};
