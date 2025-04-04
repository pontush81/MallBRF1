import { User } from '../types/User';
import { 
  getUserById, 
  login, 
  register, 
  getAllUsers, 
  syncAuthUsersWithFirestore,
  updateUserStatus,
  deleteUser
} from './auth/userManagement';
import { 
  loginWithGoogle, 
  loginWithMicrosoft, 
  handleGoogleRedirect 
} from './auth/socialAuth';
import { getAllowlist, isUserAllowed, updateAllowlist } from './auth/allowlist';
import { getNotificationSettings, updateNotificationSettings, sendNewUserNotification } from './auth/settings';

// Export all auth methods together as a single userService object
export const userService = {
  // User management functions
  getUserById,
  login,
  register,
  getAllUsers,
  syncAuthUsersWithFirestore,
  updateUserStatus,
  deleteUser,
  
  // Social auth functions
  loginWithGoogle,
  loginWithMicrosoft,
  handleGoogleRedirect,
  
  // Allowlist functions
  getAllowlist,
  isUserAllowed,
  updateAllowlist,
  
  // Notification settings functions
  getNotificationSettings,
  updateNotificationSettings,
  sendNewUserNotification
}; 