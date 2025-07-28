// Version check utility to detect when app has updates
// This helps prevent users from being stuck with cached old versions


const VERSION_CHECK_INTERVAL = 30000; // 30 seconds
let versionCheckInterval: NodeJS.Timeout | null = null;

/**
 * Check if there's a new version available by comparing timestamps
 */
async function checkForUpdates(): Promise<boolean> {
  try {
    // More aggressive cache-busting for development
    const cacheBuster = Date.now() + Math.random().toString(36).substr(2, 9);
    const response = await fetch(`/manifest.json?v=${cacheBuster}&_cb=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    // In development, be more aggressive about detecting changes
    if (process.env.NODE_ENV === 'development') {
      const content = await response.text();
      const contentHash = content.length + content.substring(0, 100); // Simple content hash
      const storedHash = localStorage.getItem('app_content_hash');
      
      if (storedHash && contentHash !== storedHash) {
        localStorage.setItem('app_content_hash', contentHash);
        return true;
      }
      
      if (!storedHash) {
        localStorage.setItem('app_content_hash', contentHash);
      }
    }
    
    // Production version checking
    const lastModified = response.headers.get('last-modified');
    const storedLastModified = localStorage.getItem('app_last_modified');
    
    if (storedLastModified && lastModified !== storedLastModified) {
      localStorage.setItem('app_last_modified', lastModified || '');
      return true;
    }
    
    if (!storedLastModified && lastModified) {
      localStorage.setItem('app_last_modified', lastModified);
    }
    
    return false;
  } catch (error) {
    console.log('Version check failed:', error);
    return false;
  }
}

/**
 * Show a professional update notification
 */
function showUpdateNotification(): void {
  // Remove any existing notification
  const existing = document.getElementById('update-notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.id = 'update-notification';
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: '10000',
    maxWidth: '400px',
    minWidth: '320px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    animation: 'slideDown 0.3s ease-out'
  });
  
  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; margin-top: 2px;">
        <span style="color: white; font-size: 12px; font-weight: bold;">↻</span>
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">
          Ny version tillgänglig
        </div>
        <div style="opacity: 0.9; margin-bottom: 12px;">
          Ladda om sidan för att få de senaste förbättringarna.
        </div>
        <button onclick="location.reload()" style="
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
          Ladda om nu
        </button>
      </div>
      <button onclick="document.body.removeChild(this.closest('#update-notification'))" style="
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
      " onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color='rgba(255, 255, 255, 0.7)'">
        ×
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.transition = 'all 0.3s ease-out';
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 300);
    }
  }, 10000);
}

/**
 * Start version checking
 */
export function startVersionCheck(): void {
  if (typeof window === 'undefined') return;
  
  // Initial check after 5 seconds
  setTimeout(async () => {
    const hasUpdate = await checkForUpdates();
    if (hasUpdate) {
      showUpdateNotification();
    }
  }, 5000);
  
  // Periodic checks
  versionCheckInterval = setInterval(async () => {
    const hasUpdate = await checkForUpdates();
    if (hasUpdate) {
      showUpdateNotification();
    }
  }, VERSION_CHECK_INTERVAL);
}

/**
 * Stop version checking
 */
export function stopVersionCheck(): void {
  if (versionCheckInterval) {
    clearInterval(versionCheckInterval);
    versionCheckInterval = null;
  }
}

/**
 * Force reload with cache bust
 */
export function forceReload(): void {
  // Clear local storage cache indicators
  localStorage.removeItem('app_last_modified');
  
  // Force reload without cache
  window.location.reload();
} 