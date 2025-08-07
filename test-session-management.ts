// Quick session management test
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduelB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA3Nzc1NDUsImV4cCI6MjAyNjM1MzU0NX0.tF7jP7M-vRdOfrp8q0PJJGbxZgCRpwL0R1hq5qr8HPI';

// Test session configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSession() {
  console.log('🧪 Testing Supabase Session Management...');
  
  // Test 1: Get current session
  const { data: session, error } = await supabase.auth.getSession();
  console.log('Current session:', session.session ? 'Active' : 'None');
  console.log('Session error:', error);
  
  // Test 2: Check auth state change listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state change:', event);
    console.log('Session active:', session ? 'Yes' : 'No');
    if (session) {
      console.log('Token expires at:', new Date(session.expires_at! * 1000));
    }
  });
  
  // Test 3: Check if we can get user info
  const { data: user } = await supabase.auth.getUser();
  console.log('Current user:', user.user ? user.user.email : 'Not logged in');
  
  // Cleanup
  setTimeout(() => {
    subscription.unsubscribe();
    console.log('✅ Session management test complete');
  }, 1000);
}

testSession().catch(console.error);