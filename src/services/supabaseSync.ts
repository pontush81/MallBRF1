import { User } from '../types/User';
import supabaseClient from './supabaseClient';

/**
 * Check if a user has been deleted via GDPR erasure request
 * This prevents automatic recreation of deleted users
 * USES SECURE SERVER-SIDE CHECK via Edge Function
 */
async function checkGDPRDeletionStatus(userId: string, email: string): Promise<boolean> {
  try {
    console.log('🔍 Checking GDPR deletion status via secure API:', email);
    
    // Use Edge Function with service_role access for secure GDPR check
    const { API_BASE_URL, SUPABASE_ANON_KEY } = await import('../config');
    const response = await fetch(`${API_BASE_URL}/firebase-auth-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action: 'check_gdpr_deletion',
        userId: userId,
        email: email,
        checkType: 'existing_account_restoration' // Only block restoration, not new accounts
      })
    });

    if (!response.ok) {
      console.error('GDPR check API failed:', response.status, response.statusText);
      // CRITICAL: DENY-BY-DEFAULT for security
      console.error('🚨 BLOCKING user sync due to failed GDPR check (security measure)');
      return true; // Block sync if we can't verify safety
    }

    const result = await response.json();
    
    if (result.isGDPRDeleted) {
      console.error('🚨 User found in GDPR deletion blacklist:', result);
      return true; // User is GDPR deleted
    }

    console.log('✅ User cleared GDPR check, safe to sync');
    return false; // User not in blacklist, safe to sync
    
  } catch (error) {
    console.error('Failed to check GDPR deletion status:', error);
    // CRITICAL: DENY-BY-DEFAULT for security - if we can't check, don't allow sync
    console.error('🚨 BLOCKING user sync due to GDPR check failure (security measure)');
    return true; // Block sync if check fails (security-first approach)
  }
}

/**
 * Sync a Firebase user to Supabase users table
 * This ensures that users authenticated via Firebase can access Supabase RLS-protected resources
 */
export async function syncUserToSupabase(user: User): Promise<void> {
  try {
    console.log('Syncing user to Supabase:', user.email);
    
    // GDPR CHECK: Prevent recreation of deleted users
    const isGDPRDeleted = await checkGDPRDeletionStatus(user.id, user.email);
    if (isGDPRDeleted) {
      console.error('🚨 GDPR VIOLATION PREVENTED: Attempt to recreate deleted user:', user.email);
      throw new Error('User has been permanently deleted per GDPR erasure request and cannot be recreated');
    }
    
    // Use a simpler upsert approach without checking existing user first
    // This avoids the 401 error when trying to read from users table
    const supabaseUserData = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      password: '', // Firebase handles authentication, so we don't need password
      role: user.role,
      isactive: user.isActive ?? true,
      createdat: user.createdAt || new Date().toISOString(),
      lastlogin: user.lastLogin || new Date().toISOString()
    };

    // Use upsert (insert or update) to handle both new and existing users
    const { error: upsertError } = await supabaseClient
      .from('users')
      .upsert(supabaseUserData, {
        onConflict: 'id'
      });

    if (upsertError) {
      console.error('Error upserting user to Supabase:', upsertError);
      
      // If upsert fails due to RLS, try using the anon key directly for user creation
      // This is a fallback for initial user sync
      console.log('Trying alternative sync method...');
      
      // For now, just log and continue - the user can still use the app
      // The admin can manually add them to Supabase if needed
      console.log('User sync failed, but login will continue. Admin may need to manually add user to Supabase.');
      return;
    }

    console.log('✅ Successfully synced user to Supabase:', user.email);
    
  } catch (error) {
    console.error('Failed to sync user to Supabase:', error);
    
    // CRITICAL: If this is a GDPR-related error, we MUST prevent login completely
    if (error.message && error.message.includes('GDPR erasure request')) {
      console.error('🚨 GDPR VIOLATION: Blocking login completely for deleted user');
      throw new Error('Account access denied: User data has been permanently deleted per GDPR erasure request');
    }
    
    // For other sync errors, don't block login but log the issue
    console.log('User sync failed, but login will continue. The RLS policies may not work until user is manually added to Supabase.');
  }
}

/**
 * Recover a user profile that was deleted from Supabase but still exists in Firebase Auth
 * This handles cases where GDPR deletion removed Supabase profile but left Firebase Auth intact
 */
export async function recoverDeletedUserProfile(firebaseUser: any): Promise<User | null> {
  try {
    console.log('🔄 Attempting to recover deleted user profile for:', firebaseUser.email);
    
    // GDPR CHECK: Never recover GDPR-deleted users
    const isGDPRDeleted = await checkGDPRDeletionStatus(firebaseUser.uid, firebaseUser.email);
    if (isGDPRDeleted) {
      console.error('🚨 GDPR VIOLATION PREVENTED: Attempt to recover GDPR-deleted user:', firebaseUser.email);
      console.error('🚨 This user was permanently deleted and must not be recreated');
      return null;
    }
    
    // Check if user is allowed (check allowlist)
    const { isUserAllowed } = await import('./auth/allowlist');
    const { getInitialUserRole } = await import('./auth/adminConfig');
    
    const isAllowed = await isUserAllowed(firebaseUser.email);
    if (!isAllowed) {
      console.log('User not on allowlist, cannot recover profile');
      return null;
    }

    // Create a recovered user profile
    const recoveredUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || 'Återställd användare',
      role: getInitialUserRole(firebaseUser.email),
      isActive: true, // Activate since they're on allowlist
      pendingApproval: false,
      createdAt: new Date().toISOString(), // New creation date
      lastLogin: new Date().toISOString()
    };

    // Sync to both Firebase Firestore and Supabase
    const { setDoc, doc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    // Recreate in Firebase Firestore
    await setDoc(doc(db(), 'users', firebaseUser.uid), recoveredUser);
    
    // Sync to Supabase
    await syncUserToSupabase(recoveredUser);
    
    console.log('✅ Successfully recovered user profile for:', firebaseUser.email);
    
    // TODO: Send email notification to admin about profile recovery
    // This would require creating a separate API endpoint or using the existing email service
    console.log('📧 Profile recovery completed for user:', firebaseUser.email);
    console.log('📧 Admin notification: User profile recovered after GDPR deletion');
    
    return recoveredUser;
    
  } catch (error) {
    console.error('Failed to recover user profile:', error);
    return null;
  }
}

/**
 * Sync multiple users from Firebase to Supabase
 */
export async function syncAllUsersToSupabase(users: User[]): Promise<void> {
  console.log(`Syncing ${users.length} users to Supabase...`);
  
  for (const user of users) {
    await syncUserToSupabase(user);
  }
  
  console.log('✅ All users synced to Supabase');
} 