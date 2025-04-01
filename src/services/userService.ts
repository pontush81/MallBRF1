import { User } from '../types/User';
import { auth, db, googleProvider, facebookProvider } from './firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  AuthProvider,
  UserCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection,
  getDocs,
  setDoc,
  query,
  where
} from 'firebase/firestore';

// Interface för vitlistan
interface Allowlist {
  emails: string[];
  domains: string[];
  lastUpdated: string;
}

export const userService = {
  async getUserById(id: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) return null;
      return userDoc.data() as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async login(email: string, password: string): Promise<User | null> {
    try {
      // Check if the email is allowed to log in
      if (!(await this.isUserAllowed(email))) {
        console.error('Email not allowed to log in:', email);
        throw new Error('Du har inte behörighet att logga in. Kontakta administratören.');
      }
      
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      return this.getUserById(firebaseUser.uid);
    } catch (error) {
      console.error('Error during login:', error);
      throw error; // Rethrow to allow UI to handle it
    }
  },

  // Hämta vitlistan från Firestore
  async getAllowlist(): Promise<Allowlist> {
    try {
      // Hämta dokument från Firestore
      const allowlistDoc = await getDoc(doc(db, 'settings', 'allowlist'));
      
      if (allowlistDoc.exists()) {
        return allowlistDoc.data() as Allowlist;
      } else {
        // Om vitlistan inte finns, returnera tom lista
        return { emails: [], domains: [], lastUpdated: new Date().toISOString() };
      }
    } catch (error) {
      console.error('Error fetching allowlist:', error);
      // Vid fel, returnera tom lista
      return { emails: [], domains: [], lastUpdated: new Date().toISOString() };
    }
  },

  // Check if user is allowed to log in
  async isUserAllowed(email: string): Promise<boolean> {
    try {
      // Hämta vitlistan från Firestore
      const allowlist = await this.getAllowlist();
      
      // Om listorna är tomma, tillåt alla (standardbeteende)
      if (allowlist.emails.length === 0 && allowlist.domains.length === 0) {
        return true;
      }

      // Check if the email is in the allowlist
      const emailLower = email.toLowerCase();
      
      // First check exact email matches
      if (allowlist.emails.some(allowed => allowed.toLowerCase() === emailLower)) {
        return true;
      }
      
      // Then check domain matches
      const domain = emailLower.split('@')[1];
      if (domain && allowlist.domains.some(allowed => allowed.toLowerCase() === domain.toLowerCase())) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if user is allowed:', error);
      // Vid fel, tillåt användaren (för att undvika att låsa ute admin-användare)
      return true;
    }
  },

  // Generic function for social provider login
  async loginWithSocialProvider(provider: AuthProvider, providerName: string): Promise<User | null> {
    try {
      console.log(`Starting ${providerName} sign-in from origin:`, window.location.origin);
      
      // Use popup for login
      const result = await signInWithPopup(auth, provider);
      console.log(`${providerName} sign-in successful, user:`, result.user.email);
      
      const firebaseUser = result.user;
      
      // Check if the user is allowed to log in
      if (firebaseUser.email && !(await this.isUserAllowed(firebaseUser.email))) {
        console.error('User not allowed to log in:', firebaseUser.email);
        await auth.signOut(); // Sign out the user from Firebase
        throw new Error('Du har inte behörighet att logga in. Kontakta administratören.');
      }
      
      // Get or create user in Firestore
      return await this.getOrCreateUser(firebaseUser);
    } catch (error: any) {
      console.error(`Error during ${providerName} login:`, error.code, error.message);
      if (error.customData) {
        console.error('Error details:', error.customData);
      }
      throw error; // Rethrow to allow UI to handle it
    }
  },

  // Helper function to get or create a user in Firestore
  async getOrCreateUser(firebaseUser: FirebaseUser): Promise<User | null> {
    // Check if user exists in Firestore
    let user = await this.getUserById(firebaseUser.uid);
    
    if (user) {
      console.log('User already exists in Firestore:', user);
    } else {
      console.log('Creating new user in Firestore for:', firebaseUser.email);
      // If user doesn't exist in Firestore, create a new record
      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      try {
        // Save to Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), user);
        console.log('Successfully created user in Firestore');
      } catch (error: any) {
        console.error('Error creating user in Firestore:', error.code, error.message);
        if (error.customData) {
          console.error('Error details:', error.customData);
        }
        // Still return the user even if we couldn't save to Firestore
      }
    }
    
    return user;
  },

  // Simplified provider-specific login methods
  async loginWithGoogle(): Promise<User | null> {
    return this.loginWithSocialProvider(googleProvider, 'Google');
  },

  async loginWithFacebook(): Promise<User | null> {
    return this.loginWithSocialProvider(facebookProvider, 'Facebook');
  },

  // This function should be called when the page loads to handle redirect result
  // We'll keep this for backwards compatibility
  async handleGoogleRedirect(): Promise<User | null> {
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
      if (firebaseUser.email && !(await this.isUserAllowed(firebaseUser.email))) {
        console.error('User not allowed to log in:', firebaseUser.email);
        await auth.signOut(); // Sign out the user from Firebase
        throw new Error('Du har inte behörighet att logga in. Kontakta administratören.');
      }
      
      // Get or create user
      return await this.getOrCreateUser(firebaseUser);
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
  },

  async register(email: string, password: string, name: string): Promise<User | null> {
    try {
      // Check if the email is allowed to register
      if (!(await this.isUserAllowed(email))) {
        console.error('Email not allowed to register:', email);
        throw new Error('Du har inte behörighet att registrera dig. Kontakta administratören.');
      }
      
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(firebaseUser, { displayName: name });

      // Create user profile in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email,
        name,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      return userData;
    } catch (error) {
      console.error('Error during registration:', error);
      return null;
    }
  },

  async syncAuthUsersWithFirestore(): Promise<void> {
    try {
      // We can only sync the current logged-in user from client-side code
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No logged in user to sync');
        return;
      }
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        console.log('Creating Firestore record for auth user:', currentUser.uid);
        
        // Create user document in Firestore
        const userData: User = {
          id: currentUser.uid,
          email: currentUser.email || '',
          name: currentUser.displayName || '',
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        // Save to Firestore
        await setDoc(doc(db, 'users', currentUser.uid), userData);
        console.log('Created Firestore user document for:', currentUser.uid);
      } else {
        console.log('User already exists in Firestore:', currentUser.uid);
      }
    } catch (error) {
      console.error('Error syncing auth users with Firestore:', error);
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      // First sync any missing users
      await this.syncAuthUsersWithFirestore();
      
      const querySnapshot = await getDocs(collection(db, 'users'));
      
      // Debug: Log all document IDs
      console.log('User documents in Firestore:', querySnapshot.docs.map(doc => doc.id));
      
      // Create a Map to filter duplicates by ID
      const uniqueUsers = new Map<string, User>();
      
      querySnapshot.docs.forEach(doc => {
        const userData = doc.data() as User;
        // Only add if we have a valid ID and haven't seen this ID before
        if (userData.id && !uniqueUsers.has(userData.id)) {
          uniqueUsers.set(userData.id, userData);
        }
      });
      
      const users = Array.from(uniqueUsers.values());
      console.log(`Found ${querySnapshot.docs.length} total documents, ${users.length} unique users after sync`);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
}; 