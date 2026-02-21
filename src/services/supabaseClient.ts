import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Initialize Supabase client with full auth config (MIGRATION: Updated for pure Supabase auth)
export const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

/**
 * Safe wrapper around supabaseClient.auth.getSession() with timeout protection.
 * Supabase v2 uses navigator.locks internally which can hang indefinitely
 * during auth initialization or lock contention.
 * On timeout, falls back to reading the token directly from localStorage.
 */
export async function safeGetSession(timeoutMs: number = 1000) {
  try {
    const sessionPromise = supabaseClient.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('getSession timeout')), timeoutMs)
    );
    return await Promise.race([sessionPromise, timeoutPromise]);
  } catch {
    // Fast fallback: read token directly from localStorage (same key the SDK uses)
    try {
      const raw = localStorage.getItem('mallbrf-supabase-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (token) {
          return { data: { session: { access_token: token } } } as any;
        }
      }
    } catch { /* ignore parse errors */ }
    return { data: { session: null } } as Awaited<ReturnType<typeof supabaseClient.auth.getSession>>;
  }
}

// Cache for authenticated client to avoid creating multiple instances
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let authenticatedClientCache: SupabaseClient | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cachedTokenForClient: string | null = null;

// Helper function to get authenticated Supabase client using native Supabase auth
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  const { data: { session } } = await safeGetSession();

  if (session?.access_token) {
    return supabaseClient;
  }

  return supabaseClient;
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
      setTimeout(() => reject(new Error('Public operation timeout after 30 seconds')), 30000)
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
      setTimeout(() => reject(new Error('RLS operation timeout after 30 seconds')), 30000)
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