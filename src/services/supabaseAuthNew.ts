// New Pure Supabase Auth Service (replaces Firebase)
// Modern implementation following Supabase best practices
import supabase from './supabaseClient';
import { auditLogger, logLogin, logLogout } from './auditLogger';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

/**
 * Login with email/password using Supabase Auth
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Login failed: No user data returned');
  }

  // Get user profile from our users table
  const userProfile = await getUserProfile(data.user.id);
  return userProfile;
}

/**
 * Login with Google using Supabase Auth
 */
export async function loginWithGoogle(): Promise<void> {
  // Determine correct redirect URL based on environment
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  
  let redirectTo: string;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development
    redirectTo = `${origin}/auth/callback`;
  } else if (hostname.includes('vercel.app')) {
    // Staging/Preview (Vercel deployments)
    redirectTo = `${origin}/auth/callback`;
  } else {
    // Production (custom domain)
    redirectTo = `https://www.gulmaran.com/auth/callback`;
  }
    
  console.log('🔧 OAuth Environment:', { hostname, origin, redirectTo });

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  });

  if (error) {
    throw new Error(`Google login failed: ${error.message}`);
  }
  // Redirect will happen automatically
}

/**
 * Register new user with Supabase Auth
 */
export async function registerUser(email: string, password: string, name: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  });

  if (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Registration failed: No user data returned');
  }

  // Create user profile in our users table
  const userProfile = await createUserProfile(data.user.id, email, name);
  return userProfile;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  try {
    const userProfile = await getUserProfile(user.id);
    return userProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  // Get current user for logging before logout
  const currentUser = await getCurrentUser().catch(() => null);
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
  
  // Log logout event for audit trail
  if (currentUser) {
    await logLogout(currentUser.id, currentUser.email);
  }
}

/**
 * Get user profile from users table
 */
async function getUserProfile(userId: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, isactive')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('User profile not found in database');
  }

  if (!data.isactive) {
    throw new Error('Your account has been deactivated. Please contact an administrator.');
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as 'user' | 'admin',
    isActive: data.isactive
  };
}

/**
 * Create user profile in users table
 */
async function createUserProfile(userId: string, email: string, name: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email,
      name: name,
      role: 'user', // Default role
      isactive: true,
      createdat: new Date().toISOString(),
      lastlogin: new Date().toISOString(),
      password: '' // Supabase Auth handles passwords
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as 'user' | 'admin',
    isActive: data.isactive
  };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        const userProfile = await getUserProfile(session.user.id);
        callback(userProfile);
      } catch (error) {
        console.error('Error getting user profile on auth state change:', error);
        callback(null);
      }
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });
  
  // Return unsubscribe function
  return () => subscription.unsubscribe();
}

/**
 * Handle OAuth callback - Modern Supabase approach
 * Let Supabase automatically detect and process OAuth sessions
 */
export async function handleAuthCallback(): Promise<AuthUser | null> {
  console.log('🔄 Handling OAuth callback (modern approach)...');
  
  try {
    // Let Supabase automatically detect session from URL
    // This is handled by detectSessionInUrl: true in client config
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting OAuth session:', error);
      return null;
    }
    
    if (!data.session?.user) {
      console.log('❌ No OAuth session found after callback');
      return null;
    }
    
    const userData = data.session.user;
    console.log('✅ OAuth session established:', userData.email);
    
    // Clean URL for security (remove OAuth parameters)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    try {
      // Try to get existing profile by Supabase auth ID
      const existingProfile = await getUserProfile(userData.id);
      console.log('✅ Found existing profile:', existingProfile.email);
      console.log('🔧 Profile details - Role:', existingProfile.role, '| isActive:', existingProfile.isActive, '| ID:', existingProfile.id);
      
      // Log successful login event
      await logLogin(existingProfile.id, existingProfile.email, true);
      
      return existingProfile;
    } catch (error) {
      console.log('ℹ️ No profile found by auth ID, checking by email...');
      
      // Handle Firebase-to-Supabase migration case
      // Look for existing user by email (from Firebase migration)  
      try {
        const { data: existingByEmail } = await supabase
          .from('users')
          .select('id, email, name, role, isactive')  
          .eq('email', userData.email)
          .single();
        
        if (existingByEmail) {
          console.log('✅ Found existing user by email:', existingByEmail.email);
          
          // If ID already matches, just return the user
          if (existingByEmail.id === userData.id) {
            console.log('✅ User ID already updated, returning profile');
            return {
              id: existingByEmail.id,
              email: existingByEmail.email,
              name: existingByEmail.name,
              role: existingByEmail.role as 'user' | 'admin',
              isActive: existingByEmail.isactive
            };
          }
          
          // If ID doesn't match, this is a migration case - update the ID atomically
          console.log('🔄 Migrating user ID from Firebase to Supabase auth (atomic)');
          
          const { data: migrationResult, error: migrationError } = await supabase
            .rpc('migrate_user_id_atomic', {
              old_user_id: existingByEmail.id,
              new_user_id: userData.id,
              user_email: userData.email
            });
          
          if (migrationError) {
            console.error('❌ Atomic migration failed:', migrationError);
            throw new Error(`Migration failed: ${migrationError.message}`);
          }
          
          console.log('✅ Successfully migrated user ID atomically:', migrationResult.migration_status);
          
          const migratedUser = {
            id: migrationResult.id,
            email: migrationResult.email,
            name: migrationResult.name,
            role: migrationResult.role as 'user' | 'admin',
            isActive: migrationResult.isactive
          };
          
          // Log successful login after migration
          await logLogin(migratedUser.id, migratedUser.email, true);
          
          // Log admin action for user ID migration
          await auditLogger.logAdminAction(
            'system',
            'system@supabase.com',
            'user_id_migration',
            'users',
            migratedUser.id,
            {
              old_user_id: existingByEmail.id,
              migration_status: migrationResult.migration_status
            }
          );
          
          return migratedUser;
        }
      } catch (emailError) {
        console.log('ℹ️ User not found by email, will create new profile');
      }
      
      // Create new user profile (should be rare with modern implementation)
      console.log('🆕 Creating new user profile for OAuth user');
      return await createUserProfileFromOAuth(userData);
    }
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return null;
  }
}

/**
 * Create user profile from OAuth user data
 */
async function createUserProfileFromOAuth(oauthUser: any): Promise<AuthUser> {
  console.log('🆕 Creating profile for OAuth user:', oauthUser.email);
  
  const userData = {
    id: oauthUser.id,  // Use Supabase auth ID directly as primary key
    email: oauthUser.email,
    name: oauthUser.user_metadata?.full_name || oauthUser.email?.split('@')[0] || 'User',
    password: 'oauth_user', // Placeholder since OAuth users don't have passwords
    role: 'user',
    isactive: true,
    createdat: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) {
    console.error('Error creating OAuth user profile:', error);
    
    // Handle duplicate email constraint violation (user already exists)
    if (error.code === '23505' && error.message.includes('users_email_key')) {
      console.log('🔄 User already exists, attempting to fetch existing profile...');
      
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email, name, role, isactive')
          .eq('email', oauthUser.email)
          .single();
        
        if (existingUser) {
          console.log('✅ Found existing user profile:', existingUser.email);
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role as 'user' | 'admin',
            isActive: existingUser.isactive
          };
        }
      } catch (fetchError) {
        console.error('Could not fetch existing user:', fetchError);
      }
    }
    
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  console.log('✅ Created new user profile:', data.email);
  
  const newUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as 'user' | 'admin',
    isActive: data.isactive
  };
  
  // Log successful login for new user
  await logLogin(newUser.id, newUser.email, true);
  
  // Log user creation event
  await auditLogger.logAdminAction(
    'system',
    'system@supabase.com', 
    'user_profile_creation',
    'users',
    newUser.id,
    {
      auth_provider: 'google_oauth',
      created_via: 'oauth_callback'
    }
  );
  
  return newUser;
}