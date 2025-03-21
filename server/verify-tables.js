require('dotenv').config();
const { Pool } = require('pg');

async function verifyTables() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      // Check tables existence
      const tables = ['pages', 'bookings', 'users'];
      for (const table of tables) {
        console.log(`\nChecking ${table} table structure:`);
        const result = await client.query(`
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = $1
          ORDER BY ordinal_position;
        `, [table]);

        if (result.rows.length === 0) {
          console.log(`Table ${table} not found!`);
        } else {
          console.table(result.rows);
        }

        // Get sample data
        const sampleResult = await client.query(`SELECT * FROM ${table} LIMIT 1`);
        if (sampleResult.rows.length > 0) {
          console.log(`\nSample ${table} data:`);
          console.log(sampleResult.rows[0]);
        } else {
          console.log(`\nNo data found in ${table}`);
        }
      }

      // Check if users table has role column
      const roleCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'role';
      `);
      
      if (roleCheck.rows.length === 0) {
        console.log('\nWARNING: users table is missing the role column!');
      } else {
        console.log('\nRole column exists in users table:', roleCheck.rows[0]);
      }

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifyTables().catch(console.error); 