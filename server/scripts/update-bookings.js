require('dotenv').config();
const { supabase } = require('../utils/supabase');
const fs = require('fs');
const path = require('path');

async function updateBookings() {
  try {
    console.log('Starting bookings update...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../sql/update-bookings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
    
    console.log('Successfully updated bookings');
    console.log('Updated records:', data);
    
  } catch (error) {
    console.error('Failed to update bookings:', error);
    process.exit(1);
  }
}

// Run the update
updateBookings(); 