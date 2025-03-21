require('dotenv').config();
const { Pool } = require('pg');

async function checkBookingsTable() {
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
      // Get table structure
      const result = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          column_default,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'bookings'
        ORDER BY ordinal_position;
      `);

      console.log('\nBookings table structure:');
      console.table(result.rows);

      // Get a sample booking
      const sampleResult = await client.query('SELECT * FROM bookings LIMIT 1');
      if (sampleResult.rows.length > 0) {
        console.log('\nSample booking data:');
        console.log(sampleResult.rows[0]);
      } else {
        console.log('\nNo bookings found in the table');
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

checkBookingsTable().catch(console.error); 