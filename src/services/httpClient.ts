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
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
  });

  // Add request interceptor for authentication
  client.interceptors.request.use(async (config) => {
    try {
      // Add Vercel protection bypass in development
      if (window.location.hostname === 'localhost') {
        config.headers['x-vercel-protection-bypass'] = 'true';
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