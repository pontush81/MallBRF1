import { auth } from './firebase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

interface SupabaseAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Get a Supabase-compatible JWT token from Firebase authentication
 */
export async function getSupabaseAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('No Firebase user found');
      return null;
    }

    // Get Firebase ID token
    const firebaseToken = await currentUser.getIdToken();

    // Call our auth bridge edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/firebase-auth-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ firebaseToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Auth bridge error:', error);
      return null;
    }

    const authData: SupabaseAuthResponse = await response.json();
    
    // Store for future use (optional - with expiration check)
    localStorage.setItem('supabase_auth_token', authData.access_token);
    localStorage.setItem('supabase_auth_expires', (Date.now() + (authData.expires_in * 1000)).toString());
    
    return authData.access_token;
    
  } catch (error) {
    console.error('Error getting Supabase auth token:', error);
    return null;
  }
}

/**
 * Get cached token if still valid, otherwise fetch new one
 */
export async function getCachedSupabaseToken(): Promise<string | null> {
  try {
    const cachedToken = localStorage.getItem('supabase_auth_token');
    const expiresAt = localStorage.getItem('supabase_auth_expires');
    
    if (cachedToken && expiresAt) {
      const expires = parseInt(expiresAt);
      const now = Date.now();
      
      // If token expires in more than 5 minutes, use cached version
      if (expires > (now + 5 * 60 * 1000)) {
        return cachedToken;
      }
    }
    
    // Token expired or doesn't exist, get new one
    return await getSupabaseAuthToken();
    
  } catch (error) {
    console.error('Error getting cached token:', error);
    return await getSupabaseAuthToken();
  }
}

/**
 * Clear cached authentication tokens
 */
export function clearSupabaseAuthCache(): void {
  localStorage.removeItem('supabase_auth_token');
  localStorage.removeItem('supabase_auth_expires');
  console.log('🗑️ Cleared Supabase auth cache');
} 