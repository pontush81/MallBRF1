const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Force disable SSL certificate validation in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Försök med olika miljövariabler
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log configuration (without exposing sensitive data)
console.log('Supabase Configuration:');
console.log('- URL:', supabaseUrl);
console.log('- Service Key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);
console.log('- Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('- Environment:', process.env.NODE_ENV);

// Validate configuration
if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  console.error('Missing required Supabase configuration');
  console.error('- SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('- SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

// Use service key if available, otherwise fall back to anon key
const apiKey = supabaseServiceKey || supabaseAnonKey;

// Create Supabase client
console.log('Configuring Supabase client...');
console.log('Using key type:', supabaseServiceKey ? 'SERVICE_ROLE' : 'ANON');

// Set options based on environment
const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'mallbrf-server'
    }
  }
};

// Add SSL options for production
if (process.env.NODE_ENV === 'production') {
  options.db.ssl = { rejectUnauthorized: false };
}

const supabase = createClient(supabaseUrl, apiKey, options);

// Test connection function
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('pages')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Connection error:', {
      message: err.message,
      code: err.code
    });
    return false;
  }
}

module.exports = {
  supabase,
  testSupabaseConnection
}; 