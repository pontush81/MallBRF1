import { 
  AuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../firebase';
import { isUserAllowed } from './allowlist';
import { User } from '../../types/User';
import { getDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendNewUserNotification } from './settings';

// Generisk funktion för inloggning med social tjänst
export async function loginWithSocialProvider(provider: GoogleAuthProvider | OAuthProvider): Promise<User> {
  try {
    // Försök logga in med den valda providern
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Kontrollera att användaren har en e-postadress
    if (!user.email) {
      // Logga ut om e-postadressen saknas
      await auth.signOut();
      throw new Error('E-postadress saknas från ditt konto. Vi behöver en e-postadress för att verifiera ditt medlemskap.');
    }
    
    // Kontrollera om användaren finns i Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isAllowed = await isUserAllowed(user.email);
    
    if (userDoc.exists()) {
      // Uppdatera befintlig användare
      const userData = userDoc.data() as User;
      
      // Om användaren finns men inte är aktiv
      if (!userData.isActive) {
        // Aktivera användaren om e-postadressen är på tillåtna listan
        if (isAllowed) {
          await updateDoc(doc(db, 'users', user.uid), {
            isActive: true,
            pendingApproval: false,
            lastLogin: new Date().toISOString()
          });
          
          return {
            ...userData,
            isActive: true,
            pendingApproval: false,
            lastLogin: new Date().toISOString()
          };
        } else {
          // Om användaren inte är aktiv och inte på listan, logga ut
          await auth.signOut();
          throw new Error('Ditt konto väntar på godkännande. Du kommer få tillgång när ditt konto har godkänts.');
        }
      }
      
      // Uppdatera senaste inloggningstiden
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      });
      
      return {
        ...userData,
        lastLogin: new Date().toISOString()
      };
      
    } else {
      // Skapa ny användare
      const newUser: User = {
        id: user.uid,
        email: user.email,
        name: user.displayName || '',
        role: 'user',
        isActive: isAllowed,
        pendingApproval: !isAllowed,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // Om användaren inte finns på listan, skicka notifikation och logga ut
      if (!isAllowed) {
        // Skicka notifikation till admin
        await sendNewUserNotification(newUser);
        
        // Logga ut
        await auth.signOut();
        throw new Error('Din registrering har tagits emot. Ditt konto behöver godkännas av administratören innan du kan logga in.');
      }
      
      return newUser;
    }
    
  } catch (error) {
    console.error('Error signing in with social provider:', error);
    throw error;
  }
}

// Logga in med Google
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  return loginWithSocialProvider(provider);
}

// Logga in med Microsoft
export async function loginWithMicrosoft(): Promise<User> {
  const provider = new OAuthProvider('microsoft.com');
  provider.addScope('user.read');
  provider.setCustomParameters({
    prompt: 'consent'
  });
  return loginWithSocialProvider(provider);
}

// Hantera omdirigering från OAuth-flödet (för avancerade scenarier)
export async function handleGoogleRedirect(): Promise<User | null> {
  try {
    // Använd getRedirectResult som är rätt metod för att hantera omdirigeringar
    const result = await getRedirectResult(auth);
    
    if (!result) {
      console.log('No redirect result found');
      return null;
    }
    
    const user = result.user;
    
    // Kontrollera att användaren har en e-postadress
    if (!user.email) {
      await auth.signOut();
      throw new Error('E-postadress saknas från ditt konto. Vi behöver en e-postadress för att verifiera ditt medlemskap.');
    }
    
    // Återanvänd samma logik som i loginWithSocialProvider
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isAllowed = await isUserAllowed(user.email);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      
      if (!userData.isActive) {
        if (isAllowed) {
          await updateDoc(doc(db, 'users', user.uid), {
            isActive: true,
            pendingApproval: false,
            lastLogin: new Date().toISOString()
          });
          
          return {
            ...userData,
            isActive: true,
            pendingApproval: false,
            lastLogin: new Date().toISOString()
          };
        } else {
          await auth.signOut();
          throw new Error('Ditt konto väntar på godkännande. Du kommer få tillgång när ditt konto har godkänts.');
        }
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString()
      });
      
      return {
        ...userData,
        lastLogin: new Date().toISOString()
      };
    } else {
      const newUser: User = {
        id: user.uid,
        email: user.email,
        name: user.displayName || '',
        role: 'user',
        isActive: isAllowed,
        pendingApproval: !isAllowed,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), newUser);
      
      if (!isAllowed) {
        await sendNewUserNotification(newUser);
        await auth.signOut();
        throw new Error('Din registrering har tagits emot. Ditt konto behöver godkännas av administratören innan du kan logga in.');
      }
      
      return newUser;
    }
  } catch (error) {
    console.error('Error handling redirect:', error);
    return null;
  }
} 