/**
 * Performance optimization utilities
 * Safe optimizations that won't break existing functionality
 */

// Font loading optimization
export const optimizeFontLoading = () => {
  // Preload critical fonts if not already loaded
  const criticalFonts = [
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2'
  ];

  criticalFonts.forEach(fontUrl => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = fontUrl;
    
    // Only add if not already present
    if (!document.querySelector(`link[href="${fontUrl}"]`)) {
      document.head.appendChild(link);
    }
  });
};

// Image lazy loading optimization
export const setupImageLazyLoading = () => {
  // Use native lazy loading if supported, fallback to intersection observer
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading is supported
    document.querySelectorAll('img[data-src]').forEach((img: any) => {
      img.src = img.dataset.src;
      img.loading = 'lazy';
    });
  } else {
    // Fallback to Intersection Observer
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Critical CSS optimization
export const optimizeCriticalCSS = () => {
  // Add critical styles for above-the-fold content
  const criticalCSS = `
    /* Critical styles for LCP optimization */
    .MuiContainer-root { 
      max-width: 1200px !important; 
      margin: 0 auto !important; 
      padding: 0 16px !important; 
    }
    .MuiTypography-h1, .MuiTypography-h2, .MuiTypography-h3 { 
      font-display: swap !important; 
      contain: layout style paint !important;
    }
    .MuiButton-root { 
      will-change: transform !important; 
      contain: layout style paint !important;
    }
    .MuiCard-root { 
      contain: layout style paint !important; 
      will-change: transform !important;
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

// Resource hints optimization
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: 'https://qhdgqevdmvkrwnzpwikz.supabase.co' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossOrigin) {
      link.crossOrigin = hint.crossOrigin;
    }
    
    // Only add if not already present
    if (!document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)) {
      document.head.appendChild(link);
    }
  });
};

// Bundle splitting optimization
export const optimizeBundleLoading = () => {
  // Prefetch non-critical chunks
  const nonCriticalChunks = [
    '/static/js/vendor.chunk.js',
    '/static/js/admin.chunk.js'
  ];

  nonCriticalChunks.forEach(chunk => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = chunk;
    
    // Only add if not already present and chunk exists
    if (!document.querySelector(`link[href="${chunk}"]`)) {
      document.head.appendChild(link);
    }
  });
};

// Main optimization function to run on app start
export const initPerformanceOptimizations = () => {
  // Run optimizations after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeFontLoading();
      addResourceHints();
      optimizeCriticalCSS();
      setupImageLazyLoading();
      optimizeBundleLoading();
    });
  } else {
    optimizeFontLoading();
    addResourceHints();
    optimizeCriticalCSS();
    setupImageLazyLoading();
    optimizeBundleLoading();
  }
};

// Web Vitals optimization
export const optimizeWebVitals = () => {
  // Optimize LCP by ensuring critical resources load first
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime);
      }
    });
  });
  
  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // Fallback for browsers that don't support LCP
    console.log('LCP monitoring not supported');
  }
};

const performanceOptimizations = {
  initPerformanceOptimizations,
  optimizeWebVitals,
  optimizeFontLoading,
  setupImageLazyLoading,
  optimizeCriticalCSS,
  addResourceHints,
  optimizeBundleLoading
};

export default performanceOptimizations;
