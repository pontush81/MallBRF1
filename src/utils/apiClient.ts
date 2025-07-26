import { API_BASE_URL } from '../config';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  isFormData?: boolean;
  retryCount?: number;
  timeout?: number;
}

// Retry configuration
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

/**
 * Check if the error is temporary and worth retrying
 */
function isRetryableError(error: any): boolean {
  if (!error.status) return true; // Network errors are retryable
  
  // Retry on server errors (5xx) and some client errors
  return error.status >= 500 || error.status === 408 || error.status === 429;
}

/**
 * Check if user is online
 */
function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for the user to come back online
 */
function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }
    
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
  });
}

/**
 * Centralized API request function for making standardized fetch requests with retry logic
 * @param endpoint API endpoint path (without the base URL)
 * @param options Request options including method, headers, body, and auth requirements
 * @returns Promise with the parsed JSON response
 */
export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { 
    method = 'GET', 
    body, 
    requiresAuth = true, 
    isFormData = false,
    retryCount = DEFAULT_RETRY_COUNT,
    timeout = DEFAULT_TIMEOUT
  } = options;
  
  const headers = {
    'Accept': 'application/json',
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    'x-vercel-protection-bypass': 'true',
    ...(options.headers || {})
  };

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API_BASE_URL is: ${API_BASE_URL}`);
  console.log(`Making ${method} request to: ${url}`);

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // Wait for online connection if offline
      if (!isOnline()) {
        await waitForOnline();
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
        mode: 'cors',
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API request error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData,
          attempt: attempt + 1
        });
        
        const error = {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          url
        };

        // If this is the last attempt or error is not retryable, throw
        if (attempt === retryCount || !isRetryableError(error)) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
        console.log(`Retrying request in ${delay}ms... (attempt ${attempt + 2}/${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`API request failed for ${endpoint} (attempt ${attempt + 1}):`, error);
      
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        console.error('Request timed out');
      }

      // If this is the last attempt or error is not retryable, throw
      if (attempt === retryCount || (!isRetryableError(error) && error.name !== 'AbortError')) {
        throw error;
      }

      // Wait before retrying
      const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
      console.log(`Retrying request in ${delay}ms... (attempt ${attempt + 2}/${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Max retries exceeded');
}

/**
 * Helper function to handle API requests with fallback data and improved error handling
 * @param request The API request function to execute
 * @param fallbackData Data to return if the request fails
 * @returns Promise resolving to either the API response or fallback data
 */
export async function withFallback<T>(
  request: () => Promise<T>, 
  fallbackData: T
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    console.error('Using fallback data due to API error:', error);
    
    // Show user-friendly error notification
    if (typeof window !== 'undefined') {
      // Avoid showing multiple notifications
      const existingAlert = document.getElementById('fallback-alert');
      if (!existingAlert) {
        showErrorNotification(error);
      }
    }
    
    return fallbackData;
  }
}

/**
 * Show a professional error notification to the user
 */
function showErrorNotification(error: any) {
  const alertEl = document.createElement('div');
  alertEl.id = 'fallback-alert';
  
  // Modern styling
  Object.assign(alertEl.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid #e2e8f0',
    borderLeft: '4px solid #ef4444',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: '9999',
    maxWidth: '400px',
    minWidth: '320px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#1e293b',
    backdropFilter: 'blur(10px)',
    animation: 'slideDown 0.3s ease-out'
  });
  
  // Add CSS animation if not already present
  if (!document.getElementById('error-animations')) {
    const style = document.createElement('style');
    style.id = 'error-animations';
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Determine error message based on the error type
  let errorMessage = 'Kunde inte hämta senaste informationen.';
  let actionText = 'Ladda om sidan';
  
  if (!navigator.onLine) {
    errorMessage = 'Du verkar vara offline. Kontrollera din internetanslutning.';
    actionText = 'Försök igen';
  } else if (error?.status >= 500) {
    errorMessage = 'Servern är tillfälligt otillgänglig. Försök igen om en stund.';
  } else if (error?.status === 401 || error?.status === 403) {
    errorMessage = 'Din session har gått ut. Logga in igen.';
    actionText = 'Logga in';
  }
  
  // Content with icon and text
  alertEl.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: #ef4444; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
        <span style="color: white; font-size: 12px; font-weight: bold;">!</span>
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
          Anslutningsproblem
        </div>
        <div style="color: #64748b; margin-bottom: 12px;">
          ${errorMessage}
        </div>
        <button onclick="location.reload()" style="
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.3)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
          ${actionText}
        </button>
      </div>
      <button onclick="document.body.removeChild(this.closest('#fallback-alert'))" style="
        background: none;
        border: none;
        color: #94a3b8;
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
      " onmouseover="this.style.background='#f1f5f9'; this.style.color='#64748b'" onmouseout="this.style.background=''; this.style.color='#94a3b8'">
        ×
      </button>
    </div>
  `;
  
  document.body.appendChild(alertEl);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(alertEl)) {
      document.body.removeChild(alertEl);
    }
  }, 10000);
} 