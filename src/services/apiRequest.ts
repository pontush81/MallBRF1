import { getAuth } from 'firebase/auth';
import { API_BASE_URL } from '../config';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('No logged in user found');
      throw new Error('Ingen inloggad användare');
    }
    
    // Get cached ID token (only refreshes if expired)
    const idToken = await currentUser.getIdToken(false);
    console.log('Got ID token (cached if valid)');
    
    // Ensure path does not start with a slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Compose the full URL - don't add /api/ since API_BASE_URL already includes it
    const url = `${API_BASE_URL}/${normalizedPath}`;
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-vercel-protection-bypass': 'true',
      ...options.headers
    };
    
    // Reduced logging for better performance in production
    if (process.env.NODE_ENV === 'development') {
      console.log('Making API request to:', url);
      console.log('With authorization:', headers.Authorization ? 'Bearer token included' : 'No token');
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData;
      
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json().catch(() => null);
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 100) + '...');
        errorData = { error: 'Unexpected response format' };
      }
      
      console.error('API Request failed:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        error: errorData
      });
      
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      const text = await response.text();
      console.log('Non-JSON response (success):', text.substring(0, 100) + '...');
      return { success: true } as unknown as T;
    }
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
} 