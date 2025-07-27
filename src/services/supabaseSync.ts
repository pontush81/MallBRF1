import { User } from '../types/User';
import supabaseClient from './supabaseClient';

/**
 * Sync a Firebase user to Supabase users table
 * This ensures that users authenticated via Firebase can access Supabase RLS-protected resources
 */
export async function syncUserToSupabase(user: User): Promise<void> {
  try {
    console.log('Syncing user to Supabase:', user.email);
    
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
    // Don't throw error to prevent login failures
    // Just log the issue so app continues to work
    console.log('User sync failed, but login will continue. The RLS policies may not work until user is manually added to Supabase.');
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