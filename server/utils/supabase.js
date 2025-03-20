const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: { 'x-my-custom-header': 'my-app-name' }
    }
});

// Konfigurera SSL-inställningar för PostgreSQL-klienten
if (process.env.NODE_ENV === 'production') {
    const { Pool } = require('pg');
    const pool = new Pool({
        ssl: {
            rejectUnauthorized: false
        }
    });
}

module.exports = supabase; 