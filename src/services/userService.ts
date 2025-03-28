import { User } from '../types/User';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword,
} from 'firebase/auth';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Helper function to get the auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true); // Force token refresh
    console.log('Got Firebase token:', token.substring(0, 10) + '...'); // Debug log (only show first 10 chars)
    return token;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    return null;
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  try {
    // Add the Vercel protection bypass header in development mode
    if (window.location.hostname === 'localhost') {
      config.headers['x-vercel-protection-bypass'] = 'true';
    }
    
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added token to request headers'); // Debug log
    } else {
      console.error('No token available for request'); // Debug log
    }
  } catch (error) {
    console.error('Error in request interceptor:', error);
  }
  return config;
});

export const userService = {
  async getUserById(id: string): Promise<User | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        return null;
      }
      console.log('Making request to get user:', id); // Debug log
      const response = await api.get(`/api/users/${id}`);
      console.log('User data from API:', response.data); // Debug log
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.error('Authentication failed. Token might be invalid or expired.');
      }
      return null;
    }
  },

  async login(email: string, password: string): Promise<User | null> {
    try {
      console.log('Starting login process...'); // Debug log
      
      // First, sign in with Firebase
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth successful:', firebaseUser.uid); // Debug log
      
      // Force token refresh to get the latest custom claims (role)
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      console.log('Token claims after refresh:', idTokenResult.claims); // Debug log

      // Try to get the full user data from the API first
      try {
        const apiUser = await this.getUserById(firebaseUser.uid);
        if (apiUser) {
          console.log('Got user data from API:', apiUser); // Debug log
          return apiUser;
        }
      } catch (apiError) {
        console.error('Failed to fetch user data from API:', apiError);
      }

      // If we couldn't get the user from the API, create a temporary user
      // but first try to get the user's role from the API
      try {
        const response = await api.get(`/api/users/${firebaseUser.uid}/role`);
        const role = response.data?.role || 'user';
        console.log('Got user role from API:', role); // Debug log
        
        const tempUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          role: role,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        console.log('Created temporary user with role:', tempUser.role); // Debug log
        return tempUser;
      } catch (roleError) {
        console.error('Failed to fetch user role:', roleError);
        
        // Check token claims for role
        try {
          const claimRole = idTokenResult.claims.role;
          const role = (typeof claimRole === 'string' && 
            (claimRole === 'admin' || claimRole === 'user')) ? claimRole : 'user';
          console.log('Got role from token claims:', role); // Debug log
          
          const tempUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: role,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          console.log('Created user with role from token claims:', tempUser); // Debug log
          return tempUser;
        } catch (claimsError) {
          console.error('Failed to get token claims:', claimsError);
          
          // If all else fails, use default user role
          const tempUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          console.log('Created default user:', tempUser); // Debug log
          return tempUser;
        }
      }
    } catch (error: any) {
      console.error('Error during login:', error.message);
      return null;
    }
  },

  async register(email: string, password: string, name: string): Promise<User | null> {
    try {
      const response = await api.post('/users', {
        email,
        password,
        name
      });
      return response.data;
    } catch (error: any) {
      console.error('Error during registration:', error.response?.data || error.message);
      return null;
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        return null;
      }
      const response = await api.put(`/users/${id}`, updates);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error.response?.data || error.message);
      return null;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        return false;
      }
      await api.delete(`/users/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error.response?.data || error.message);
      return false;
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('No auth token available');
        return [];
      }
      const response = await api.get('/users');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error.response?.data || error.message);
      return [];
    }
  }
}; 