const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Force disable SSL certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Log configuration (without exposing sensitive data)
console.log('Supabase Configuration:');
console.log('- URL:', supabaseUrl);
console.log('- Service Key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);
console.log('- Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('- Environment:', process.env.NODE_ENV);
console.log('- SSL Verify:', process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? 'Disabled' : 'Enabled');

// Validate configuration
const missingConfig = [];
if (!supabaseUrl) missingConfig.push('SUPABASE_URL');
if (!supabaseServiceKey && !supabaseAnonKey) missingConfig.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');

if (missingConfig.length > 0) {
    console.error('Missing required Supabase configuration:', missingConfig.join(', '));
    process.exit(1);
}

// Create Supabase client with appropriate key
console.log('Configuring Supabase client...');
const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        },
        db: {
            schema: 'public',
            ssl: {
                rejectUnauthorized: false
            }
        },
        global: {
            headers: {
                'x-application-name': 'mallbrf-server',
                'x-client-info': 'supabase-js'
            }
        }
    }
);

// Test connection function with better error handling
async function testSupabaseConnection() {
    try {
        console.log('Testing Supabase connection...');
        
        // First, try a simple query to test basic connectivity
        const { data: testData, error: testError } = await supabase
            .from('pages')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.error('Supabase connection test failed:', {
                message: testError.message,
                code: testError.code,
                details: testError.details,
                hint: testError.hint
            });
            
            // Check for specific error types
            if (testError.code === 'PGRST116') {
                console.error('Database connection error - check your connection string and SSL settings');
            } else if (testError.message.includes('Invalid API key')) {
                console.error('API key validation failed - check your service role key');
                console.error('Key format:', supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : supabaseAnonKey.substring(0, 20) + '...');
                console.error('Please verify the key in your Supabase dashboard');
            }
            return false;
        }
        
        console.log('✅ Supabase connection successful');
        return true;
    } catch (err) {
        console.error('Connection error:', {
            message: err.message,
            stack: err.stack,
            code: err.code
        });
        
        if (err.message.includes('SSL')) {
            console.error('SSL connection error - check your SSL configuration');
        }
        return false;
    }
}

module.exports = {
    supabase,
    testSupabaseConnection
}; 