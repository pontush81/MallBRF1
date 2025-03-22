const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log configuration (without exposing sensitive data)
console.log('Supabase Configuration:');
console.log('- URL:', supabaseUrl);
console.log('- Key length:', supabaseKey ? supabaseKey.length : 0);
console.log('- Environment:', process.env.NODE_ENV);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration:');
    console.error('- SUPABASE_URL:', !!supabaseUrl);
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
    process.exit(1);
}

// Create Supabase client with service role key for admin operations
console.log('Configuring Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public', // Always use public schema for now
        ssl: {
            rejectUnauthorized: false // Disable SSL certificate validation
        }
    },
    global: {
        headers: {
            'x-application-name': 'mallbrf-server'
        }
    }
});

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
                console.error('Key format:', supabaseKey.substring(0, 20) + '...');
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