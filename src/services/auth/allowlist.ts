import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Interface for the allowlist
export interface Allowlist {
  emails: string[];
  domains: string[];
  lastUpdated: string;
}

// Get the allowlist from Firestore
export async function getAllowlist(): Promise<Allowlist> {
  try {
    const allowlistDoc = await getDoc(doc(db, 'settings', 'allowlist'));
    
    if (allowlistDoc.exists()) {
      return allowlistDoc.data() as Allowlist;
    } else {
      // If the allowlist doesn't exist, return empty list
      return { emails: [], domains: [], lastUpdated: new Date().toISOString() };
    }
  } catch (error) {
    console.error('Error fetching allowlist:', error);
    // On error, return empty list
    return { emails: [], domains: [], lastUpdated: new Date().toISOString() };
  }
}

// Check if user is allowed to log in
export async function isUserAllowed(email: string): Promise<boolean> {
  try {
    // Get the allowlist from Firestore
    const allowlist = await getAllowlist();
    
    // If lists are empty, allow all (default behavior)
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
    // On error, allow the user (to avoid locking out admin users)
    return true;
  }
} 