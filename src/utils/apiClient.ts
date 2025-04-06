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
        // Skapa alert element
        const alertEl = document.createElement('div');
        alertEl.id = 'fallback-alert';
        alertEl.style.position = 'fixed';
        alertEl.style.top = '10px';
        alertEl.style.left = '50%';
        alertEl.style.transform = 'translateX(-50%)';
        alertEl.style.backgroundColor = '#f8d7da';
        alertEl.style.color = '#721c24';
        alertEl.style.padding = '10px 20px';
        alertEl.style.borderRadius = '4px';
        alertEl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        alertEl.style.zIndex = '9999';
        alertEl.innerHTML = 'Sidan kunde inte laddas. <a href="javascript:location.reload()">Ladda om sidan</a> för att försöka igen.';
        
        // Lägg till stängknapp
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.marginLeft = '10px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'none';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => {
          document.body.removeChild(alertEl);
        };
        
        alertEl.appendChild(closeBtn);
        
        // Lägg till på sidan
        document.body.appendChild(alertEl);
        
        // Auto-ta bort efter 10 sekunder
        setTimeout(() => {
          if (document.body.contains(alertEl)) {
            document.body.removeChild(alertEl);
          }
        }, 10000);
      }
    }
    
    return fallbackData;
  }
} 