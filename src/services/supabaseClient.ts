import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { auth } from './firebase';

// Initialize Supabase client with auth configuration
const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use Firebase Auth instead of Supabase Auth
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to get Firebase user token for Supabase
export async function getSupabaseToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('No Firebase user found for Supabase auth');
      return null;
    }
    
    // Get Firebase ID token
    const idToken = await currentUser.getIdToken();
    return idToken;
  } catch (error) {
    console.error('Error getting Firebase token for Supabase:', error);
    return null;
  }
}

// Helper function to create authenticated Supabase client
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  const token = await getSupabaseToken();
  
  if (token) {
    // Set the auth token for this request
    supabaseClient.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed with Firebase
      expires_in: 3600,
      token_type: 'bearer',
      user: null // Will be populated by Supabase
    } as any);
  }
  
  return supabaseClient;
}

// Helper function for RLS-safe database operations
export async function executeWithRLS<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  try {
    const authenticatedClient = await getAuthenticatedSupabaseClient();
    return await operation(authenticatedClient);
  } catch (error) {
    console.error('Supabase operation failed:', error);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw error;
  }
}

export default supabaseClient; 