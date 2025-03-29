import { API_BASE_URL } from '../config';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
};

/**
 * Centralized API request function for making standardized fetch requests
 * @param endpoint API endpoint path (without the base URL)
 * @param options Request options including method, headers, body, and auth requirements
 * @returns Promise with the parsed JSON response
 */
export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(requiresAuth ? { 'x-vercel-protection-bypass': 'true' } : {}),
    ...(options.headers || {})
  };

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making ${method} request to: ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      mode: 'cors',
      credentials: 'omit'
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
    return fallbackData;
  }
} 