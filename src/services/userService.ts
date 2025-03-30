import { User } from '../types/User';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection,
  getDocs,
  setDoc
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

  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      
      // Debug: Log all document IDs to check for duplicates
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
      console.log(`Found ${querySnapshot.docs.length} total documents, ${users.length} unique users`);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
}; 