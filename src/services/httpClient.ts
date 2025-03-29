import axios, { AxiosInstance } from 'axios';
import { auth } from './firebase';

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
      // Local development - använd relativ URL för Vite proxy
      apiBaseUrl = '/api';
      console.log('[API] Using local development proxy: /api');
    } else if (window.location.hostname.includes('stage.gulmaran.com')) {
      // Staging - använd absolut URL med API-delen
      apiBaseUrl = '/api';
      console.log('[API] Using stage environment API: /api (from same domain)');
    } else {
      // Production
      apiBaseUrl = 'https://mallbrf.vercel.app/api';
      console.log('[API] Using production API URL:', apiBaseUrl);
    }
  }
  
  // Create Axios client
  const client = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });

  // Add request interceptor for authentication and debugging
  client.interceptors.request.use(async (config) => {
    try {
      // Logga detaljerad information om anropet
      const fullUrl = `${config.baseURL || ''}${config.url || ''}`.replace(/\/\//g, '/').replace('://', '://');
      console.log('[API] Making request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullUrl: fullUrl,
        headers: config.headers,
      });
      
      // Lägg till autentisering om det behövs
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API] Error in request interceptor:', error);
    }
    return config;
  });

  // Add response interceptor for better error handling
  client.interceptors.response.use(
    response => {
      console.log('[API] Response received:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
      });
      return response;
    },
    error => {
      console.error('[API] Request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
        }
      });

      if (error.response?.status === 403) {
        console.error('[API] CORS error or authentication problem');
      } else if (!error.response) {
        console.error('[API] Network error - server might be down or CORS issue');
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const httpClient = createHttpClient(); 