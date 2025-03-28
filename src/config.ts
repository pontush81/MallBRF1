// API base URL configuration
const getApiBaseUrl = () => {
  const env = process.env.NODE_ENV || 'development';
  const hostname = window.location.hostname;
  
  console.log('Environment:', env);
  console.log('Hostname:', hostname);

  // Development environment (lokal utveckling)
  if (env === 'development' && hostname.includes('localhost')) {
    return 'http://localhost:3002';
  }

  // Staging och production - använd proxy för att undvika CORS-problem
  // Genom att använda samma origin (current hostname) undviker vi CORS helt
  if (hostname === 'www.stage.gulmaran.com' || hostname === 'www.gulmaran.com') {
    // När vi är på samma domän, använd /proxy/api som pekar till vår proxy-middleware
    return '/proxy';
  }

  // Om vi kör direkt på Vercel, använd absolut URL
  if (hostname.includes('vercel.app')) {
    return '/api';  // Använd relativ URL för att låta proxy hantera anropet
  }

  // Fallback för okända miljöer
  console.warn('Unknown environment or hostname, using proxy API URL');
  return '/proxy';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('Using API base URL:', API_BASE_URL);

// Fallback API URL (used when the regular API fails)
export const FALLBACK_API_ENABLED = true;

// Supabase configuration
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE'; 