const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Disable SSL certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function updatePolicies() {
  try {
    // Read the SQL file
    console.log('Reading SQL file...');
    const sqlFilePath = path.join(__dirname, 'sql', 'update-bookings-policies.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Initialize Supabase client with service role key
    console.log('Connecting to Supabase...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Execute the SQL as admin using service role key
    console.log('Executing SQL to update policies...');
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      throw error;
    }
    
    console.log('Successfully updated policies!');
    
    // Get current policies
    const { data: policies, error: policiesError } = await supabase.from('pg_policy')
      .select()
      .eq('polrelid', 'public.bookings');
    
    if (policiesError) {
      console.error('Could not fetch policies:', policiesError);
    } else {
      console.log('\nCurrent policies for bookings table:');
      policies.forEach(row => {
        console.log(`- ${row.polname} (${row.polcmd})`);
      });
    }
  } catch (error) {
    console.error('Error updating policies:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updatePolicies()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = updatePolicies; 