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
  // Log important configuration
  console.log('Creating HTTP client with baseURL:', API_BASE_URL);
  console.log('Current hostname:', window.location.hostname);
  
  // Justera baseURL så att vi inte får dubbla /api
  let adjustedBaseURL = API_BASE_URL;
  if (window.location.hostname.includes('stage.gulmaran.com') && API_BASE_URL.includes('mallbrf.vercel.app')) {
    // Ta bort /api i slutet eftersom PageService redan använder /api/pages
    adjustedBaseURL = 'https://mallbrf.vercel.app';
    console.log('Adjusted baseURL to prevent double /api:', adjustedBaseURL);
  }
  
  const client = axios.create({
    baseURL: adjustedBaseURL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: false,
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