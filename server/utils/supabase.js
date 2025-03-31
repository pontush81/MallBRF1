const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Force disable SSL certificate validation in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Log environment variables (without exposing sensitive data)
console.log('Initializing Supabase client with:');
console.log('- URL:', process.env.SUPABASE_URL);
console.log('- Service Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
console.log('- Anon Key length:', process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0);

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('bookings').select('count');
    
    if (error) {
      console.error('Supabase connection test failed:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
}

module.exports = {
  supabase,
  testSupabaseConnection
}; 