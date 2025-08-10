import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

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
  },
  db: {
    schema: 'public'
  },
  // Note: Custom headers removed to avoid CORS issues with Edge Functions
  // global: {
  //   headers: {
  //     'x-application-name': 'mallbrf-production'
  //   }
  // }
});

// Connection test disabled - all critical functions now use direct API
// The hanging SDK connection test was causing production issues

// Cache for authenticated client to avoid creating multiple instances
let authenticatedClientCache: SupabaseClient | null = null;
let cachedTokenForClient: string | null = null;

// Helper function to get authenticated Supabase client using native Supabase auth
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  try {
    // Add timeout to prevent hanging in production (same issue as OAuth/pages)
    const sessionPromise = supabaseClient.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth session timeout after 5 seconds')), 5000)
    );
    
    const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
    const { data: { session } } = result;
    
    if (session?.access_token) {
      console.log('✅ Using authenticated Supabase client with valid session');
      return supabaseClient; // The main client already has the session
    }

    // Fallback to anon client if no session available
    console.log('⚠️ No active session, using anon client');
    return supabaseClient;

  } catch (error) {
    console.error('Error getting authenticated client:', error);
    
    // If timeout, return anon client as fallback
    if (error.message?.includes('timeout')) {
      console.log('⚠️ Auth session timeout, using anon client as fallback');
    }
    
    return supabaseClient;
  }
}

// Helper function for public database operations (no auth required)
export async function executePublic<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  try {
    // Add timeout protection to all public operations
    const operationPromise = operation(supabaseClient);
    const timeoutPromise = new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Public operation timeout after 10 seconds')), 10000)
    );
    
    return await Promise.race([operationPromise, timeoutPromise]);
  } catch (error) {
    console.error('Supabase public operation failed:', error);
    
    // If timeout and fallback available, use it
    if (error.message?.includes('timeout') && fallbackValue !== undefined) {
      console.log('⚠️ Using fallback value due to timeout');
      return fallbackValue;
    }
    
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
    
    // Add timeout protection to all RLS operations
    const operationPromise = operation(authenticatedClient);
    const timeoutPromise = new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('RLS operation timeout after 10 seconds')), 10000)
    );
    
    return await Promise.race([operationPromise, timeoutPromise]);
  } catch (error) {
    console.error('Supabase operation failed:', error);
    
    // If timeout and fallback available, use it
    if (error.message?.includes('timeout') && fallbackValue !== undefined) {
      console.log('⚠️ Using fallback value due to RLS timeout');
      return fallbackValue;
    }
    
    // If it's a role error, clear cache and try once more
    if (error?.message?.includes('role') && error?.message?.includes('does not exist')) {
      console.log('🔄 Role error detected, clearing cache and retrying...');
      
      // Clear caches
      authenticatedClientCache = null;
      cachedTokenForClient = null;
      
      // Native Supabase auth cache clearing handled automatically
      console.log('🔄 Using native Supabase auth session management');
      
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