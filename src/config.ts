// API base URL configuration
// Function to determine the correct API base URL based on environment
const getApiBaseUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // In development, use the development server
    return process.env.REACT_APP_API_URL ? 
      `${process.env.REACT_APP_API_URL}/api` : 
      'http://localhost:3002/api';
  }
  
  // In production, use relative path (handled by Vercel)
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Fallback API URL (used when the regular API fails)
export const FALLBACK_API_ENABLED = true;

// Supabase configuration
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE'; 