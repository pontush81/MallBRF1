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

// CORS Proxy URL - byt till en mer pålitlig proxy
const CORS_PROXY_URL = 'https://corsproxy.io/?';

// Create and configure the HTTP client
const createHttpClient = (): AxiosInstance => {
  // Determine base URL based on environment
  let apiBaseUrl = '';
  let useProxy = false;
  
  if (typeof window !== 'undefined') {
    // Client-side environment
    if (window.location.hostname === 'localhost') {
      apiBaseUrl = 'http://localhost:4000'; // Local development
    } else if (window.location.hostname.includes('stage.gulmaran.com')) {
      // För stage.gulmaran.com behöver vi använda en CORS-proxy
      useProxy = true;
      apiBaseUrl = 'https://mallbrf.vercel.app/api'; // Staging
      console.log('[API] Setting base URL for stage environment - using CORS proxy');
    } else {
      apiBaseUrl = 'https://mallbrf.vercel.app/api'; // Production
    }
  }
  
  console.log(`[API] Using base URL: ${apiBaseUrl}`);
  console.log(`[API] Using CORS proxy: ${useProxy}`);
  
  // Create Axios client with cors configuration
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
      // Skapa full URL
      let fullUrl = `${config.baseURL || ''}${config.url || ''}`.replace(/\/\//g, '/').replace('://', '://');
      
      // Använd proxy om det behövs
      if (useProxy && window.location.hostname.includes('stage.gulmaran.com')) {
        // Klient-sidan behöver hantera CORS-proxyn
        config.url = '';
        config.baseURL = `${CORS_PROXY_URL}${encodeURIComponent(fullUrl)}`;
        fullUrl = `${CORS_PROXY_URL}${encodeURIComponent(fullUrl)}`;
        console.log('[API] Using CORS proxy URL:', fullUrl);
      }
      
      // Log request details
      console.log('Making request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullUrl: fullUrl,
        withCredentials: config.withCredentials,
        headers: config.headers,
        useProxy: useProxy
      });
      
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
    response => {
      console.log('[API] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        data: response.data
      });
      
      return response;
    },
    error => {
      console.error('Request failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data,
        config: error.config,
        message: error.message
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