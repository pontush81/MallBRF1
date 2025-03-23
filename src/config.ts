// API base URL from environment variable
export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production'
    ? process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api`  // Vercel deployment
      : '/api'  // Other production environments
    : 'http://localhost:3001/api');  // Development URL

// Fallback API URL (used when the regular API fails)
export const FALLBACK_API_ENABLED = true;

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE'; 