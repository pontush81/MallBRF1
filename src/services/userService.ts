import { User } from '../types/User';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { BaseService } from './baseService';
import { httpClient } from './httpClient';

class UserService extends BaseService {
  constructor() {
    super('/api/users');
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      console.log('Making request to get user:', id);
      
      try {
        const user = await this.get<User>(`/${id}`);
        console.log('User data from API:', user);
        return user;
      } catch (apiError) {
        console.error('Error with API call:', apiError);
        
        // Get user role from Firebase token claims as fallback
        try {
          const firebaseUser = auth.currentUser;
          if (firebaseUser) {
            const idTokenResult = await firebaseUser.getIdTokenResult(true);
            console.log('Token claims after refresh:', idTokenResult.claims);
            
            const claimRole = idTokenResult.claims.role;
            const role = (typeof claimRole === 'string' && 
              (claimRole === 'admin' || claimRole === 'user')) ? claimRole : 'user';
            console.log('Using role from token claims:', role);
            
            // Create a temporary user object with Firebase data
            const tempUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              role: role,
              isActive: true,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            console.log('Created user from Firebase data:', tempUser);
            return tempUser;
          }
        } catch (firebaseError) {
          console.error('Error getting Firebase data:', firebaseError);
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('Error fetching user:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.error('Authentication failed. Token might be invalid or expired.');
      }
      return null;
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    try {
      console.log('Starting login process...');
      
      // First, sign in with Firebase
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth successful:', firebaseUser.uid);
      
      // Force token refresh to get the latest custom claims (role)
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      console.log('Token claims after refresh:', idTokenResult.claims);

      // Try to get the full user data from the API first
      try {
        const apiUser = await this.getUserById(firebaseUser.uid);
        if (apiUser) {
          console.log('Got user data from API:', apiUser);
          return apiUser;
        }
      } catch (apiError) {
        console.error('Failed to fetch user data from API:', apiError);
      }

      // If we couldn't get the user from the API, create a temporary user
      // but first try to get the user's role from the API
      try {
        const response = await httpClient.get(`/api/users/${firebaseUser.uid}/role`);
        const role = response.data?.role || 'user';
        console.log('Got user role from API:', role);
        
        const tempUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          role: role,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        console.log('Created temporary user with role:', tempUser.role);
        return tempUser;
      } catch (roleError) {
        console.error('Failed to fetch user role:', roleError);
        
        // Check token claims for role
        try {
          const claimRole = idTokenResult.claims.role;
          const role = (typeof claimRole === 'string' && 
            (claimRole === 'admin' || claimRole === 'user')) ? claimRole : 'user';
          console.log('Got role from token claims:', role);
          
          const tempUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: role,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          console.log('Created user with role from token claims:', tempUser);
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
          console.log('Created default user:', tempUser);
          return tempUser;
        }
      }
    } catch (error: any) {
      console.error('Error during login:', error.message);
      return null;
    }
  }

  async register(email: string, password: string, name: string): Promise<User | null> {
    try {
      return await this.post<User>('', { email, password, name });
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      return await this.put<User>(`/${id}`, updates);
    } catch (error: any) {
      console.error('Error updating user:', error.response?.data || error.message);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.delete(`/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error.response?.data || error.message);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.get<User[]>();
    } catch (error: any) {
      console.error('Error fetching all users:', error.response?.data || error.message);
      return [];
    }
  }
}

// Skapa en instans av UserService
const userServiceInstance = new UserService();

// Exportera som både en named export (för bakåtkompatibilitet) och som default export
export const userService = userServiceInstance;
export default userServiceInstance; 