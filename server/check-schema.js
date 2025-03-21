require('dotenv').config();
const { Pool } = require('pg');

async function checkSchema() {
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
      // Check users table
      console.log('\nChecking users table structure:');
      const usersResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position;
      `);
      console.table(usersResult.rows);

      // Check bookings table
      console.log('\nChecking bookings table structure:');
      const bookingsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bookings'
        ORDER BY ordinal_position;
      `);
      console.table(bookingsResult.rows);

      // Check pages table
      console.log('\nChecking pages table structure:');
      const pagesResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'pages'
        ORDER BY ordinal_position;
      `);
      console.table(pagesResult.rows);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema().catch(console.error); 