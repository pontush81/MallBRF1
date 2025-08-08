import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { getCachedSupabaseToken } from './supabaseAuth';

// Initialize Supabase client with full auth config (MIGRATION: Updated for pure Supabase auth)
const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mallbrf-supabase-auth'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Cache for authenticated client to avoid creating multiple instances
let authenticatedClientCache: SupabaseClient | null = null;
let cachedTokenForClient: string | null = null;

// Helper function to get authenticated Supabase client using secure JWT bridge
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  try {
    const token = await getCachedSupabaseToken();

    if (token) {
      // Reuse cached client if token hasn't changed
      if (authenticatedClientCache && cachedTokenForClient === token) {
        return authenticatedClientCache;
      }

      // Clear previous client to avoid multiple instances
      if (authenticatedClientCache) {
        console.log('🔄 Replacing cached Supabase client with new token');
      }

      // Create new authenticated client with the secure JWT
      authenticatedClientCache = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          // Stable storage key to prevent multiple instances
          storageKey: `supabase.auth.maintenance.${token.slice(-8)}`
        },
        global: {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      });

      cachedTokenForClient = token;
      return authenticatedClientCache;
    }

    // Fallback to anon client if no token available
    console.warn('No auth token available, using anon client');
    return supabaseClient;

  } catch (error) {
    console.error('Error creating authenticated client:', error);
    return supabaseClient;
  }
}

// Helper function for public database operations (no auth required)
export async function executePublic<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  try {
    return await operation(supabaseClient);
  } catch (error) {
    console.error('Supabase public operation failed:', error);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw error;
  }
}

// Helper function for RLS-safe database operations (auth required)
export async function executeWithRLS<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  try {
    const authenticatedClient = await getAuthenticatedSupabaseClient();
    return await operation(authenticatedClient);
  } catch (error) {
    console.error('Supabase operation failed:', error);
    
    // If it's a role error, clear cache and try once more
    if (error?.message?.includes('role') && error?.message?.includes('does not exist')) {
      console.log('🔄 Role error detected, clearing cache and retrying...');
      
      // Clear caches
      authenticatedClientCache = null;
      cachedTokenForClient = null;
      
      // Import and clear supabase auth cache
      const { clearSupabaseAuthCache } = await import('./supabaseAuth');
      clearSupabaseAuthCache();
      
      // Retry once
      try {
        const freshClient = await getAuthenticatedSupabaseClient();
        return await operation(freshClient);
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
        throw retryError;
      }
    }
    
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    throw error;
  }
}

// Helper function to manually clear all auth caches
export function clearAllAuthCaches(): void {
  // Clear client caches
  authenticatedClientCache = null;
  cachedTokenForClient = null;
  
  // Clear localStorage caches
  localStorage.removeItem('supabase_auth_token');
  localStorage.removeItem('supabase_auth_expires');
  
  console.log('🗑️ All auth caches cleared');
}

export default supabaseClient; 