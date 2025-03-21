// API base URL configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://proxy.cors.sh/https://mallbrf1.vercel.app/api'  // Production URL with different CORS proxy
  : 'http://localhost:3002/api';  // Development URL

// Supabase configuration
export const SUPABASE_URL = 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE'; 