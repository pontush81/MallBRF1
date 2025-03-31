import { User } from '../types/User';
import { auth, db, googleProvider, facebookProvider } from './firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup
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
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      return this.getUserById(firebaseUser.uid);
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  },

  async loginWithGoogle(): Promise<User | null> {
    try {
      console.log('Starting Google sign-in from origin:', window.location.origin);
      
      // Use popup instead of redirect for local development
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful, user:', result.user.email);
      
      const firebaseUser = result.user;
      
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
    } catch (error: any) {
      console.error('Error during Google login:', error.code, error.message);
      if (error.customData) {
        console.error('Error details:', error.customData);
      }
      throw error; // Rethrow to allow UI to handle it
    }
  },

  async loginWithFacebook(): Promise<User | null> {
    try {
      console.log('Starting Facebook sign-in from origin:', window.location.origin);
      
      // Use popup for Facebook login
      const result = await signInWithPopup(auth, facebookProvider);
      console.log('Facebook sign-in successful, user:', result.user.email);
      
      const firebaseUser = result.user;
      
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
    } catch (error: any) {
      console.error('Error during Facebook login:', error.code, error.message);
      if (error.customData) {
        console.error('Error details:', error.customData);
      }
      throw error; // Rethrow to allow UI to handle it
    }
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