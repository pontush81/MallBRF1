// Mobile Performance Optimizations
// Utilities för att förbättra prestanda på mobila enheter

/**
 * Detektera om användaren är på mobil enhet
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
};

/**
 * Detektera om användaren har långsam internetanslutning
 */
export const isSlowConnection = (): boolean => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }
  
  const connection = (navigator as any).connection;
  return connection && (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
};

/**
 * Prioritera kritiska resurser för mobil
 */
export const preloadCriticalResources = (): void => {
  if (typeof document === 'undefined') return;
  
  // Preload kritiska CSS och JS filer
  const criticalResources = [
    '/static/css/main.css',
    '/static/js/main.js'
  ];
  
  criticalResources.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = href.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
  });
};

/**
 * Optimera för mobila enheter genom att minska animationer
 */
export const optimizeForMobile = (): void => {
  if (!isMobileDevice()) return;
  
  // Minska animationer på mobil för bättre prestanda
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      .MuiCircularProgress-root {
        animation-duration: 0.8s !important;
      }
    }
  `;
  document.head.appendChild(style);
};

/**
 * Lazy load iconer och fonts för bättre LCP
 */
export const optimizeFontLoading = (): void => {
  if (typeof document === 'undefined') return;
  
  // Lägg till font-display: swap för alla fonts
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      font-display: swap;
    }
    
    * {
      font-display: swap !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Implementera intelligent prefetching baserat på användarens beteende
 */
export const intelligentPrefetch = (): void => {
  if (isSlowConnection()) {
    console.log('🐌 Slow connection detected - skipping prefetch');
    return;
  }
  
  // Prefetch vanliga sidor efter 2 sekunder
  setTimeout(() => {
    const commonPages = ['/pages', '/about', '/contact'];
    commonPages.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }, 2000);
};

/**
 * Optimera bilder för mobil
 */
export const optimizeImagesForMobile = (): void => {
  if (!isMobileDevice()) return;
  
  // Lägg till loading="lazy" för alla bilder som inte redan har det
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    (img as HTMLImageElement).loading = 'lazy';
  });
};

/**
 * Initiera alla mobila optimeringar
 */
export const initMobileOptimizations = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('📱 Initializing mobile optimizations...');
  
  // Kör optimeringar när DOM är redo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeForMobile();
      optimizeFontLoading();
      preloadCriticalResources();
      intelligentPrefetch();
      optimizeImagesForMobile();
    });
  } else {
    optimizeForMobile();
    optimizeFontLoading();
    preloadCriticalResources();
    intelligentPrefetch();
    optimizeImagesForMobile();
  }
  
  console.log('✅ Mobile optimizations initialized');
};
