// New Pure Supabase Auth Service (replaces Firebase)
import supabase from './supabaseClient';
import { User } from '../types/User';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
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
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
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
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
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
    role: data.role,
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
    role: data.role,
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
 * Handle OAuth callback (for Google/other social logins)
 */
export async function handleAuthCallback(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Auth callback error:', error);
    return null;
  }

  if (data.session?.user) {
    try {
      return await getUserProfile(data.session.user.id);
    } catch (error) {
      console.error('Error getting user profile after callback:', error);
      return null;
    }
  }

  return null;
}