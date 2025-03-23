import { User } from '../types/User';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  getDocs
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

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, updates);
      return this.getUserById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'users', id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
}; 