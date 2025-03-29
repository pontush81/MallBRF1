import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { auth } from './firebase';
import { API_BASE_URL } from '../config';

// Helper function to get the auth token
export const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    return null;
  }
};

// Create and configure the HTTP client
const createHttpClient = (): AxiosInstance => {
  // Determine base URL based on environment
  let apiBaseUrl = '';
  
  if (typeof window !== 'undefined') {
    // Client-side environment
    if (window.location.hostname === 'localhost') {
      apiBaseUrl = 'http://localhost:4000'; // Local development
    } else if (window.location.hostname.includes('stage.gulmaran.com')) {
      apiBaseUrl = 'https://mallbrf.vercel.app/api'; // Staging
    } else {
      apiBaseUrl = 'https://mallbrf.vercel.app/api'; // Production
    }
  }
  
  console.log(`[API] Using base URL: ${apiBaseUrl}`);
  
  // Create Axios client with cors configuration
  const client = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false, // Viktigt: måste matcha server-inställningen
  });

  // Add request interceptor for authentication
  client.interceptors.request.use(async (config) => {
    try {
      // Log request details
      console.log('Making request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullUrl: `${config.baseURL}${config.url}`,
        withCredentials: config.withCredentials,
        headers: config.headers
      });
      
      // Add Vercel protection bypass for stage environment
      if (window.location.hostname.includes('stage.gulmaran.com')) {
        // Lägg till en mer robust kontroll för Vercel-miljö
        const isVercelEnvironment = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
        if (isVercelEnvironment) {
          console.log('[API] Adding Vercel protection bypass for stage environment');
          config.headers['x-vercel-protection-bypass'] = 'true';
        }
      }
      
      // Add authentication token
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config;
  });

  // Add response interceptor for better error handling
  client.interceptors.response.use(
    response => response,
    error => {
      console.error('Request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data,
        config: error.config,
        message: error.message,
        stack: error.stack
      });

      // Hantera specifika feltyper
      if (error.response?.status === 403) {
        console.error('[API] CORS error - check server logs for details');
      } else if (error.response?.status === 401) {
        console.error('[API] Authentication error - check token');
      } else if (!error.response) {
        console.error('[API] Network error - check CORS configuration');
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const httpClient = createHttpClient(); 