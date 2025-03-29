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
  if (window.location.hostname.includes('stage.gulmaran.com') && API_BASE_URL.includes('mallbrf.vercel.app/api')) {
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
    // Behåll credentials för samma domän, men inte för cross-origin (när vi använder absolut URL)
    withCredentials: !adjustedBaseURL.includes('https://'),
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
        withCredentials: config.withCredentials
      });
      
      // Add Vercel protection bypass in development
      if (window.location.hostname === 'localhost') {
        config.headers['x-vercel-protection-bypass'] = 'true';
      }
      
      // Lägg alltid till x-vercel-protection-bypass för stage.gulmaran.com
      if (window.location.hostname.includes('stage.gulmaran.com')) {
        config.headers['x-vercel-protection-bypass'] = 'true';
      }
      
      // Set specific headers for gulmaran.com domains when using local API
      if (window.location.hostname.includes('gulmaran.com') && !config.baseURL.includes('https://')) {
        // Ensure we're using the API correctly
        if (!config.url?.startsWith('/api') && !config.baseURL?.includes('/api')) {
          if (!config.url?.startsWith('/')) {
            config.url = `/api/${config.url}`;
          } else {
            config.url = `/api${config.url}`;
          }
          console.log('Modified URL for API:', config.url);
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

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Log error details
      if (error.response) {
        console.error('API error response:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config.url
        });
        
        // Handle specific HTTP error codes if needed
        if (error.response.status === 401) {
          console.error('Authentication error. User might not be logged in or token expired.');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

export const httpClient = createHttpClient(); 