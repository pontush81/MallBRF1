// Supabase configuration - Uses local for development, production for builds
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk';

// Cloudflare Turnstile (spam protection)
export const TURNSTILE_SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY || '';

// API configuration
export const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// Debug: Log which environment we're using (force redeploy for Supavisor migration)
console.log('🔧 Supabase Config:', {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY.substring(0, 20) + '...',
  isLocal: SUPABASE_URL.includes('127.0.0.1'),
  environment: process.env.NODE_ENV,
  envVarUrl: process.env.REACT_APP_SUPABASE_URL ? 'SET' : 'FALLBACK',
  envVarKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'FALLBACK',
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  origin: typeof window !== 'undefined' ? window.location.origin : 'server'
}); 