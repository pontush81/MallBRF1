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
      throw new Error('Ingen inloggad användare');
    }
    
    // Get fresh ID token
    const idToken = await currentUser.getIdToken(true);
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'x-vercel-protection-bypass': 'true',
      ...options.headers
    };
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
} 