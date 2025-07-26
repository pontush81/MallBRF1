// API base URL configuration
// After Supabase migration: No Express server needed!
const getApiBaseUrl = () => {
  // All API calls now go through Supabase or Edge Functions
  // No more Express server dependencies
  console.log('Using Supabase-only architecture - no Express server needed');
  
  // In production, use Vercel serverless functions if any are needed
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  // Fallback for SSR - but most calls go directly to Supabase
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Note: FALLBACK_API_ENABLED can be disabled since we use Supabase directly
export const FALLBACK_API_ENABLED = false;

// Supabase configuration - This is now our main backend!
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE'; 