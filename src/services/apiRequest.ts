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
    
    // Get fresh ID token
    const idToken = await currentUser.getIdToken(true);
    console.log('Got fresh ID token');
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-vercel-protection-bypass': 'true',
      ...options.headers
    };
    
    console.log('Making API request to:', `${API_BASE_URL}/api${path}`);
    console.log('With headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
} 