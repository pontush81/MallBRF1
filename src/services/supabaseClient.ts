import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

/** Custom error when session expired and refresh failed - triggers re-login flow */
export class SessionExpiredError extends Error {
  constructor(message = 'Din session har gått ut. Logga in igen för att fortsätta.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

/** Event dispatched when 401 + refresh fails - AuthContext listens and shows modal */
export const SESSION_EXPIRED_EVENT = 'mallbrf-session-expired';

/**
 * Make a REST call with a specific access token (bypasses session lookup).
 * Use this when you already have a valid token (e.g., from OAuth callback URL).
 */
export async function restCallWithToken(
  method: string,
  endpoint: string,
  accessToken: string,
  body?: any,
  timeout: number = 5000
): Promise<any> {
  const preferHeader = (method === 'POST' || method === 'PATCH') ? 'return=representation' : 'return=minimal';
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': preferHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  if (method === 'DELETE') return null;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const text = await response.text();
    return text.trim() ? JSON.parse(text) : null;
  }
  return null;
}

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
 * Check if a JWT token is expired.
 * Decodes the payload and checks the `exp` claim against current time with a 30s buffer.
 */
function isTokenExpired(jwt: string): boolean {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return true;
    // expired if current time is within 30s of expiry
    return Date.now() >= (payload.exp - 30) * 1000;
  } catch {
    return true;
  }
}

/**
 * Safe wrapper around supabaseClient.auth.getSession() with timeout protection.
 * Supabase v2 uses navigator.locks internally which can hang indefinitely
 * during auth initialization or lock contention.
 * On timeout, falls back to reading the token directly from localStorage.
 * If the localStorage token is expired, attempts a refresh before giving up.
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
          // Check if token is expired before returning it
          if (!isTokenExpired(token)) {
            return { data: { session: { access_token: token } } } as any;
          }
          // Token expired — try to refresh with 3s timeout
          try {
            const refreshPromise = supabaseClient.auth.refreshSession();
            const refreshTimeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('refreshSession timeout')), 3000)
            );
            const { data: { session: refreshedSession } } = await Promise.race([refreshPromise, refreshTimeout]) as any;
            if (refreshedSession?.access_token) {
              return { data: { session: refreshedSession } } as any;
            }
          } catch { /* refresh failed */ }
        }
      }
    } catch { /* ignore parse errors */ }
    return { data: { session: null } } as Awaited<ReturnType<typeof supabaseClient.auth.getSession>>;
  }
}

/**
 * Centralized authenticated REST call to Supabase.
 * Handles auth token retrieval, expiry checking, and 401 retry with refresh.
 */
export async function authenticatedRestCall(
  method: string,
  endpoint: string,
  body?: any,
  options?: { timeout?: number; requireAuth?: boolean }
): Promise<any> {
  const timeout = options?.timeout ?? 10000;
  const requireAuth = options?.requireAuth ?? (method !== 'GET');

  // 1. Get auth token
  let authToken: string | null = null;
  try {
    const { data: { session } } = await safeGetSession();
    if (session?.access_token) {
      authToken = session.access_token;
    }
  } catch { /* fall through to anon key */ }

  // 2. Check auth requirements
  if (!authToken && requireAuth) {
    throw new Error('Authentication required for this operation');
  }
  if (!authToken) {
    authToken = SUPABASE_ANON_KEY;
  }

  // 3. Make the request
  const preferHeader = (method === 'POST' || method === 'PATCH') ? 'return=representation' : 'return=minimal';

  const doFetch = (token: string) =>
    fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': preferHeader,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });

  let response = await doFetch(authToken);

  // 4. On 401, try refresh and retry once
  if (response.status === 401) {
    let refreshSucceeded = false;
    try {
      const refreshPromise = supabaseClient.auth.refreshSession();
      const refreshTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('refreshSession timeout')), 3000)
      );
      const { data: { session: refreshedSession } } = await Promise.race([refreshPromise, refreshTimeout]) as any;
      if (refreshedSession?.access_token) {
        response = await doFetch(refreshedSession.access_token);
        refreshSucceeded = response.ok;
      }
    } catch { /* refresh failed */ }

    // 4b. If still 401 after refresh attempt → session invalid, trigger re-login flow
    if (!refreshSucceeded && response.status === 401) {
      try {
        await supabaseClient.auth.signOut();
      } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      throw new SessionExpiredError();
    }
  }

  // 5. Handle response
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  if (method === 'DELETE') return null;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const text = await response.text();
    return text.trim() ? JSON.parse(text) : null;
  }
  return null;
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