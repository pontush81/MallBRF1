import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  deleteUser as deleteFirebaseUser,
  getAuth,
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { User } from '../../types/User';
import { auth, db } from '../firebase';
import { isUserAllowed } from './allowlist';
import { sendNewUserNotification } from './settings';

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function login(email: string, password: string): Promise<User> {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get additional user data from Firestore
    const userData = await getUserById(user.uid);
    
    if (!userData) {
      throw new Error('User data not found');
    }
    
    // Check if user is active
    if (!userData.isActive) {
      // Sign out if user is not active
      await auth.signOut();
      throw new Error('Ditt konto är inte aktivt än. Vänta på godkännande från administratören.');
    }
    
    // Update last login time
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp()
    });
    
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(email: string, password: string, name: string): Promise<User> {
  try {
    const auth = getAuth();
    
    // Check if user's email is in allowlist
    const allowed = await isUserAllowed(email);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    const userData: User = {
      id: user.uid,
      email: email,
      name: name,
      role: 'user',
      isActive: allowed, // Active if email is in allowlist
      pendingApproval: !allowed,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    
    // If not allowed, sign out
    if (!allowed) {
      await auth.signOut();
      
      // Send notification to admin about new user registration
      await sendNewUserNotification(userData);
      
      throw new Error('Din registrering har tagits emot. Ditt konto behöver godkännas av administratören innan du kan logga in.');
    }
    
    return userData;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const usersCollection = collection(db, 'users');
    const userDocs = await getDocs(usersCollection);
    
    return userDocs.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function updateUserStatus(
  userId: string, 
  updates: boolean | { isActive?: boolean; role?: 'user' | 'admin' }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    
    // If updates is a boolean, convert it to the expected object format
    const updateData = typeof updates === 'boolean' 
      ? { isActive: updates, pendingApproval: !updates }
      : updates;
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'users', userId));
    
    // Note: Deleting from Auth requires admin SDK or custom auth endpoints
    // This is a simplified version for client-side
    console.warn('User deleted from Firestore, but not from Auth. Auth deletion requires server-side code.');
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function syncAuthUsersWithFirestore(): Promise<void> {
  try {
    // This would typically need to be done through a server function
    // as Firebase Admin SDK is needed to list all users
    // For client-side, we'll implement a simplified version that works with 
    // what we have access to

    // Get all users from Firestore
    const firestoreUsers = await getAllUsers();
    const firestoreUserIds = firestoreUsers.map(user => user.id);
    
    // Get current user from Auth
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser && !firestoreUserIds.includes(currentUser.uid)) {
      // Create a Firestore record for the current user if they don't have one
      const userData: User = {
        id: currentUser.uid,
        email: currentUser.email || '',
        name: currentUser.displayName || 'User',
        role: 'user',
        isActive: true, // Assuming they're active since they're authenticated
        pendingApproval: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', currentUser.uid), userData);
    }
    
    // Note: We can't access other Auth users from client side
    // A complete implementation would require a server function
  } catch (error) {
    console.error('Error syncing users:', error);
    throw error;
  }
} 