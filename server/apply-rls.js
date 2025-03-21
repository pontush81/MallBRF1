require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function applyRLS() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Reading SQL file...');
    const sqlFile = await fs.readFile(path.join(__dirname, 'enable-rls.sql'), 'utf8');
    
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Applying RLS policies...');
      await client.query(sqlFile);
      console.log('Successfully applied RLS policies!');
      
      // Verify RLS is enabled
      const tables = ['pages', 'bookings', 'users'];
      for (const table of tables) {
        const result = await client.query(`
          SELECT relrowsecurity 
          FROM pg_class 
          WHERE relname = $1 
          AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        `, [table]);
        
        if (result.rows.length > 0) {
          console.log(`RLS status for ${table}: ${result.rows[0].relrowsecurity ? 'Enabled' : 'Disabled'}`);
        } else {
          console.log(`Could not verify RLS status for ${table}`);
        }
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error applying RLS:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
applyRLS().catch(console.error); 