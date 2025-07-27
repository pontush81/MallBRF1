import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,

  getDocs,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { User } from '../../types/User';
import { isUserAllowed } from './allowlist';
import { sendNewUserNotification } from './settings';
// Removed apiRequest import - no longer needed after Express migration

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
    // Check if user's email is in allowlist
    const allowed = await isUserAllowed(email);
    if (!allowed) {
      throw new Error('Din e-postadress är inte godkänd för registrering');
    }

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
    
    return userDocs.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as User));
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

export const deleteUser = async (uid: string) => {
  try {
    console.log('Starting user deletion process for:', uid);
    
    // Delete user document from Firestore
    console.log('Deleting user document from Firestore');
    await deleteDoc(doc(db, 'users', uid));
    
    // Note: Firebase Auth user deletion is now handled by Firebase Admin 
    // in production, or can be done manually via Firebase Console
    // No need for Express server dependency
    console.log('User document deleted from Firestore successfully');
    console.log('Note: Firebase Auth user should be deleted via Firebase Console if needed');
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

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