import { 
  AuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../firebase';
import { isUserAllowed } from './allowlist';
import { getOrCreateUser } from './userManagement';
import { User } from '../../types/User';

// Generic function for social provider login
export async function loginWithSocialProvider(
  provider: AuthProvider, 
  providerName: string
): Promise<User | null> {
  try {
    console.log(`Starting ${providerName} sign-in from origin:`, window.location.origin);
    
    // Use popup for login
    const result = await signInWithPopup(auth, provider);
    console.log(`${providerName} sign-in successful, user:`, result.user.email);
    
    const firebaseUser = result.user;
    
    // Check if the user is allowed to log in
    if (firebaseUser.email && !(await isUserAllowed(firebaseUser.email))) {
      console.error('User not allowed to log in:', firebaseUser.email);
      await auth.signOut(); // Sign out the user from Firebase
      throw new Error('Du har inte behörighet att logga in. Kontakta administratören.');
    }
    
    // Get or create user in Firestore
    return await getOrCreateUser(firebaseUser);
  } catch (error: any) {
    console.error(`Error during ${providerName} login:`, error.code, error.message);
    if (error.customData) {
      console.error('Error details:', error.customData);
    }
    throw error; // Rethrow to allow UI to handle it
  }
}

// Provider-specific login methods
export async function loginWithGoogle(): Promise<User | null> {
  return loginWithSocialProvider(googleProvider, 'Google');
}

export async function loginWithMicrosoft(): Promise<User | null> {
  return loginWithSocialProvider(microsoftProvider, 'Microsoft');
}

// Handle redirect result (for backward compatibility)
export async function handleGoogleRedirect(): Promise<User | null> {
  try {
    console.log('Checking for Google redirect result...');
    console.log('Current URL:', window.location.href);
    
    // Get the result of the redirect operation
    const result = await getRedirectResult(auth);
    
    // If no redirect result (user just loaded the page normally), return null
    if (!result) {
      console.log('No redirect result found');
      return null;
    }
    
    console.log('Google redirect successful, user:', result.user.email);
    const firebaseUser = result.user;
    
    // Check if the user is allowed to log in
    if (firebaseUser.email && !(await isUserAllowed(firebaseUser.email))) {
      console.error('User not allowed to log in:', firebaseUser.email);
      await auth.signOut(); // Sign out the user from Firebase
      throw new Error('Du har inte behörighet att logga in. Kontakta administratören.');
    }
    
    // Get or create user
    return await getOrCreateUser(firebaseUser);
  } catch (error: any) {
    console.error('Error handling Google redirect result:', error.code, error.message);
    if (error.customData) {
      console.error('Error details:', error.customData);
    }
    if (error.code === 'auth/operation-not-supported-in-this-environment') {
      console.error('This operation is not supported in this environment. Make sure your domain is authorized.');
    }
    return null;
  }
} 