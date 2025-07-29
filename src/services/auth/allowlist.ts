import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Interface for the allowlist
export interface Allowlist {
  emails: string[];
  domains: string[];
  lastUpdated: string;
}

const ALLOWLIST_ID = 'email_allowlist';

/**
 * Hämta listan av tillåtna e-postadresser och domäner
 */
export async function getAllowlist(): Promise<Allowlist> {
  try {
    const allowlistDoc = await getDoc(doc(db(), 'settings', ALLOWLIST_ID));
    
    if (allowlistDoc.exists()) {
      const data = allowlistDoc.data() as Allowlist;
      return {
        emails: data.emails || [],
        domains: data.domains || [],
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    } else {
      // Om listan inte finns, skapa en tom lista
      const newAllowlist: Allowlist = {
        emails: [],
        domains: [],
        lastUpdated: new Date().toISOString()
      };
      await setDoc(doc(db(), 'settings', ALLOWLIST_ID), newAllowlist);
      return newAllowlist;
    }
  } catch (error) {
    console.error('Error fetching allowlist:', error);
    return {
      emails: [],
      domains: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Kontrollera om en e-postadress finns i listan av tillåtna användare
 */
export async function isUserAllowed(email: string): Promise<boolean> {
  try {
    if (!email) return false;
    
    const allowlist = await getAllowlist();
    
    // Om allowlist är tom (inga e-postadresser och inga domäner) ska alla nekas
    // om whitelist-funktionen är aktiv
    if (allowlist.emails.length === 0 && allowlist.domains.length === 0) {
      return false; // Inga domäner eller e-post tillåts när listan är tom
    }
    
    // Normalisera e-postadressen för jämförelse
    const normalizedEmail = email.toLowerCase().trim();
    
    // Kontrollera om e-postadressen finns direkt i listan
    if (allowlist.emails.some(allowedEmail => 
      allowedEmail.toLowerCase().trim() === normalizedEmail
    )) {
      return true;
    }
    
    // Kontrollera om domänen finns i listan
    const domain = normalizedEmail.split('@')[1];
    if (domain && allowlist.domains.some(allowedDomain => 
      domain.toLowerCase().trim() === allowedDomain.toLowerCase().trim()
    )) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if user is allowed:', error);
    return false;
  }
}

/**
 * Uppdatera listan av tillåtna e-postadresser och domäner
 */
export async function updateAllowlist(allowlist: Allowlist): Promise<void> {
  try {
    // Validera e-postadresser och domäner
    const validEmails = allowlist.emails.filter(email => 
      email && email.includes('@') && email.includes('.')
    );
    
    const validDomains = allowlist.domains.filter(domain => 
      domain && domain.includes('.')
    );
    
    // Spara den uppdaterade listan till Firestore
    const updatedAllowlist: Allowlist = {
      emails: validEmails,
      domains: validDomains,
      lastUpdated: new Date().toISOString()
    };
    
    await setDoc(doc(db(), 'settings', ALLOWLIST_ID), updatedAllowlist);
    console.log('Allowlist updated successfully');
  } catch (error) {
    console.error('Error updating allowlist:', error);
    throw error;
  }
} 