import { User } from '../types/User';
import { 
  getUserById, 
  login, 
  register, 
  getAllUsers, 
  syncAuthUsersWithFirestore 
} from './auth/userManagement';
import { 
  loginWithGoogle, 
  loginWithMicrosoft, 
  handleGoogleRedirect 
} from './auth/socialAuth';
import { getAllowlist, isUserAllowed } from './auth/allowlist';

// Export all auth methods together as a single userService object
export const userService = {
  // User management functions
  getUserById,
  login,
  register,
  getAllUsers,
  syncAuthUsersWithFirestore,
  
  // Social auth functions
  loginWithGoogle,
  loginWithMicrosoft,
  handleGoogleRedirect,
  
  // Allowlist functions
  getAllowlist,
  isUserAllowed
}; 