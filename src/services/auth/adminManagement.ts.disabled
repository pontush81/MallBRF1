import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../../types/User';
// MIGRATION: Removed syncUserToSupabase - using native Supabase auth
// import { syncUserToSupabase } from '../supabaseSync';
import { AUTO_ADMIN_EMAILS, shouldBeAdmin } from './adminConfig';

/**
 * Promote an existing user to admin role in both Firestore and Supabase
 */
export async function promoteUserToAdmin(userId: string): Promise<User | null> {
  try {
    console.log('Promoting user to admin:', userId);
    
    // Get current user data from Firestore
    const userDoc = await getDoc(doc(db(), 'users', userId));
    
    if (!userDoc.exists()) {
      console.error('User not found in Firestore:', userId);
      return null;
    }
    
    const userData = userDoc.data() as User;
    
    // Update role to admin in Firestore
    await updateDoc(doc(db(), 'users', userId), {
      role: 'admin',
      lastLogin: new Date().toISOString()
    });
    
    const updatedUser: User = {
      ...userData,
      role: 'admin',
      lastLogin: new Date().toISOString()
    };
    
    // Sync to Supabase so RLS policies work
    // MIGRATION: Disabled syncUserToSupabase - using native Supabase auth
    // await syncUserToSupabase(updatedUser);
    
    console.log('✅ User promoted to admin successfully:', userData.email);
    return updatedUser;
    
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw error;
  }
}

/**
 * Demote an admin user to regular user role in both Firestore and Supabase
 */
export async function demoteAdminToUser(userId: string): Promise<User | null> {
  try {
    console.log('Demoting admin to user:', userId);
    
    // Get current user data from Firestore
    const userDoc = await getDoc(doc(db(), 'users', userId));
    
    if (!userDoc.exists()) {
      console.error('User not found in Firestore:', userId);
      return null;
    }
    
    const userData = userDoc.data() as User;
    
    // Update role to user in Firestore
    await updateDoc(doc(db(), 'users', userId), {
      role: 'user',
      lastLogin: new Date().toISOString()
    });
    
    const updatedUser: User = {
      ...userData,
      role: 'user',
      lastLogin: new Date().toISOString()
    };
    
    // Sync to Supabase so RLS policies work
    // MIGRATION: Disabled syncUserToSupabase - using native Supabase auth
    // await syncUserToSupabase(updatedUser);
    
    console.log('✅ Admin demoted to user successfully:', userData.email);
    return updatedUser;
    
  } catch (error) {
    console.error('Error demoting admin to user:', error);
    throw error;
  }
}

/**
 * Check if a user should automatically get admin privileges based on their email
 */
export function isAutoAdminEmail(email: string): boolean {
  return shouldBeAdmin(email);
}

/**
 * Get list of emails that automatically get admin privileges
 */
export function getAutoAdminEmails(): string[] {
  return [...AUTO_ADMIN_EMAILS];
}

/**
 * Instructions for adding new auto-admin emails
 */
export function getAdminInstructions(): string {
  return `
För att lägga till nya administratörer som automatiskt får admin-rättigheter:

1. Öppna filen: src/services/auth/adminConfig.ts
2. Lägg till den nya e-postadressen i AUTO_ADMIN_EMAILS-listan
3. Spara filen - nya användare med den e-postadressen kommer automatiskt få admin-roll

Nuvarande auto-admin e-postadresser:
${AUTO_ADMIN_EMAILS.map(email => `• ${email}`).join('\n')}

Obs: Detta påverkar bara nya användare som loggar in för första gången.
För befintliga användare, använd promoteUserToAdmin() funktionen.
  `.trim();
} 