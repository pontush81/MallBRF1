import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { User } from '../../types/User';
import { auth, db } from '../firebase';
import { isUserAllowed } from './allowlist';

export async function getUserById(id: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', id));
    if (!userDoc.exists()) return null;
    return userDoc.data() as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    // Check if the email is allowed to log in
    if (!(await isUserAllowed(email))) {
      console.error('Email not allowed to log in:', email);
      throw new Error('Du har inte behörighet att logga in. Kontakta administratören.');
    }
    
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    return getUserById(firebaseUser.uid);
  } catch (error) {
    console.error('Error during login:', error);
    throw error; // Rethrow to allow UI to handle it
  }
}

export async function register(email: string, password: string, name: string): Promise<User | null> {
  try {
    // Check if the email is allowed to register
    if (!(await isUserAllowed(email))) {
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
    throw error; // Rethrow to allow UI to handle it
  }
}

export async function getOrCreateUser(firebaseUser: FirebaseUser): Promise<User | null> {
  // Check if user exists in Firestore
  let user = await getUserById(firebaseUser.uid);
  
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
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const usersCollection = collection(db, 'users');
    const userDocs = await getDocs(usersCollection);
    return userDocs.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

export async function syncAuthUsersWithFirestore(): Promise<void> {
  try {
    // This is a stub for now - in a real implementation, you would iterate 
    // through all auth users and ensure they have corresponding Firestore records
    console.log('Syncing auth users with Firestore...');
  } catch (error) {
    console.error('Error syncing auth users with Firestore:', error);
  }
} 