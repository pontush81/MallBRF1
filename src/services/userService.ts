import { User, UserFormData } from '../types/User';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateEmail,
} from 'firebase/auth';
import { auth, db } from './firebase';

// Användarsamling i Firestore
const USERS_COLLECTION = 'users';

// Service för att hantera användare med Firebase
const userService = {
  // Hämta alla användare från Firestore
  getAllUsers: async (): Promise<User[]> => {
    try {
      const usersCollection = collection(db, USERS_COLLECTION);
      const querySnapshot = await getDocs(usersCollection);
      
      const users: User[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          name: data.name || '',
          role: data.role,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          lastLogin: data.lastLogin?.toDate().toISOString() || undefined
        };
      });
      
      return users;
    } catch (error) {
      console.error('Fel vid hämtning av användare:', error);
      throw new Error('Kunde inte hämta användare');
    }
  },

  // Hämta en specifik användare med ID
  getUserById: async (id: string): Promise<User | null> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email,
        name: data.name || '',
        role: data.role,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        lastLogin: data.lastLogin?.toDate().toISOString() || undefined
      };
    } catch (error) {
      console.error('Fel vid hämtning av användare:', error);
      return null;
    }
  },

  // Skapa en ny användare med Firebase Authentication och Firestore
  createUser: async (userData: UserFormData): Promise<User | null> => {
    try {
      // Skapa användare i Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password || 'tempPassword123'
      );
      
      const uid = userCredential.user.uid;
      const now = new Date();
      
      // Skapa användarprofil i Firestore
      const userProfile = {
        email: userData.email,
        name: userData.name || '',
        role: userData.role,
        isActive: userData.isActive,
        createdAt: Timestamp.fromDate(now),
        lastLogin: null
      };
      
      // Spara användaren i Firestore
      await setDoc(doc(db, USERS_COLLECTION, uid), userProfile);
      
      // Returnera den nya användaren
      return {
        id: uid,
        email: userData.email,
        name: userData.name || '',
        role: userData.role,
        isActive: userData.isActive,
        createdAt: now.toISOString(),
        lastLogin: undefined
      };
    } catch (error) {
      console.error('Fel vid skapande av användare:', error);
      throw new Error('Kunde inte skapa användaren');
    }
  },

  // Uppdatera en befintlig användare
  updateUser: async (id: string, userData: Partial<UserFormData>): Promise<User | null> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const updates: any = {};
      
      if (userData.name !== undefined) {
        updates.name = userData.name;
      }
      
      if (userData.role !== undefined) {
        updates.role = userData.role;
      }
      
      if (userData.isActive !== undefined) {
        updates.isActive = userData.isActive;
      }
      
      // Uppdatera användarprofilen i Firestore
      await updateDoc(userRef, updates);
      
      // Om e-postadressen har ändrats, uppdatera den i Firebase Auth
      if (userData.email && userData.email !== docSnap.data().email) {
        // För detta behöver vi vara inloggade som användaren eller som admin
        // Detta är en förenklad implementation
        try {
          if (auth.currentUser) {
            await updateEmail(auth.currentUser, userData.email);
          }
          updates.email = userData.email;
        } catch (error) {
          console.error('Kunde inte uppdatera e-postadress i Firebase Auth:', error);
        }
      }
      
      // Hämta den uppdaterade användaren
      const updatedDocSnap = await getDoc(userRef);
      const updatedData = updatedDocSnap.data();
      
      if (!updatedData) {
        throw new Error('Kunde inte hämta uppdaterad användardata');
      }
      
      return {
        id: updatedDocSnap.id,
        email: updatedData.email,
        name: updatedData.name || '',
        role: updatedData.role as 'user' | 'admin',
        isActive: updatedData.isActive,
        createdAt: updatedData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        lastLogin: updatedData.lastLogin?.toDate().toISOString() || undefined
      };
    } catch (error) {
      console.error('Fel vid uppdatering av användare:', error);
      return null;
    }
  },

  // Radera en användare
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      // Radera användarprofil från Firestore
      await deleteDoc(doc(db, USERS_COLLECTION, id));
      
      // Idealt skulle vi också radera användaren från Firebase Auth
      // men det kräver att användaren är inloggad eller admin-rättigheter
      // För en fullständig implementation skulle detta behöva göras via Cloud Functions
      
      return true;
    } catch (error) {
      console.error('Fel vid radering av användare:', error);
      return false;
    }
  },

  // Logga in en användare
  loginUser: async (email: string, password: string): Promise<User | null> => {
    try {
      // Autentisera med Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Hämta användarprofil från Firestore
      const userRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        // Om användarprofildata saknas, skapa en grundläggande profil
        const basicProfile = {
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || '',
          role: 'user' as 'user' | 'admin', // Default roll
          isActive: true,
          createdAt: Timestamp.now(),
          lastLogin: Timestamp.now()
        };
        
        await setDoc(userRef, basicProfile);
        
        return {
          id: uid,
          email: basicProfile.email,
          name: basicProfile.name,
          role: basicProfile.role,
          isActive: basicProfile.isActive,
          createdAt: basicProfile.createdAt.toDate().toISOString(),
          lastLogin: basicProfile.lastLogin.toDate().toISOString()
        };
      }
      
      // Uppdatera senaste inloggning
      await updateDoc(userRef, {
        lastLogin: Timestamp.now()
      });
      
      const userData = docSnap.data();
      
      return {
        id: uid,
        email: userData.email,
        name: userData.name || '',
        role: (userData.role || 'user') as 'user' | 'admin',
        isActive: userData.isActive !== false,
        createdAt: userData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    } catch (error) {
      console.error('Fel vid inloggning:', error);
      return null;
    }
  }
};

export default userService; 