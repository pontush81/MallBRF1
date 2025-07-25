import { API_BASE_URL } from '../config';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
  isFormData?: boolean;
};

/**
 * Centralized API request function for making standardized fetch requests
 * @param endpoint API endpoint path (without the base URL)
 * @param options Request options including method, headers, body, and auth requirements
 * @returns Promise with the parsed JSON response
 */
export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, requiresAuth = true, isFormData = false } = options;
  
  const headers = {
    'Accept': 'application/json',
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    'x-vercel-protection-bypass': 'true',
    ...(options.headers || {})
  };

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API_BASE_URL is: ${API_BASE_URL}`);
  console.log(`Making ${method} request to: ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      mode: 'cors',
      credentials: 'include'
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API request error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorData
      });
      
      throw {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        url
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Helper function to handle API requests with fallback data
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
    
    // Visa tydligt meddelande för användaren
    if (typeof window !== 'undefined') {
      // Undvik att visa flera meddelanden
      const existingAlert = document.getElementById('fallback-alert');
      if (!existingAlert) {
        // Skapa modern, professionell error notification
        const alertEl = document.createElement('div');
        alertEl.id = 'fallback-alert';
        
        // Modern styling som matchar appens design
        Object.assign(alertEl.style, {
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #0ea5e9',
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
        
        // Lägg till CSS animation
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
        
        // Innehåll med ikon och text
        alertEl.innerHTML = `
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: #0ea5e9; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
              <span style="color: white; font-size: 12px; font-weight: bold;">!</span>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
                Anslutningsproblem
              </div>
              <div style="color: #64748b; margin-bottom: 12px;">
                Kunde inte hämta senaste informationen. Kontrollera din internetanslutning.
              </div>
              <button onclick="location.reload()" style="
                background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
              " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(14, 165, 233, 0.3)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                Ladda om sidan
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
        
        // Lägg till på sidan
        document.body.appendChild(alertEl);
        
        // Auto-dölja efter 8 sekunder med fade out
        setTimeout(() => {
          if (document.body.contains(alertEl)) {
            alertEl.style.transition = 'all 0.3s ease-out';
            alertEl.style.opacity = '0';
            alertEl.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => {
              if (document.body.contains(alertEl)) {
                document.body.removeChild(alertEl);
              }
            }, 300);
          }
        }, 8000);
      }
    }
    
    return fallbackData;
  }
} 