const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

// Konfigurera PostgreSQL pool med SSL-inställningar
const pool = new Pool({
    ssl: {
        rejectUnauthorized: false // Tillåter self-signed certifikat i produktion
    }
});

// Hantera pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

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
        headers: { 'x-my-custom-header': 'mallbrf1-app' }
    }
});

module.exports = { supabase, pool }; 