const { Pool } = require('pg');
require('dotenv').config();

// Disable SSL certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testDatabase() {
  console.log('Testing database connection...');
  console.log('Connection string:', process.env.POSTGRES_URL_NON_POOLING);
  
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('Successfully connected to database');

    console.log('\nTesting simple query...');
    const timeResult = await client.query('SELECT NOW()');
    console.log('Database time:', timeResult.rows[0]);

    console.log('\nChecking pages table...');
    const pagesResult = await client.query('SELECT COUNT(*) FROM pages');
    console.log('Number of pages:', pagesResult.rows[0].count);

    console.log('\nChecking visible pages...');
    const visibleResult = await client.query('SELECT COUNT(*) FROM pages WHERE ispublished = true AND show = true');
    console.log('Number of visible pages:', visibleResult.rows[0].count);

    client.release();
  } catch (err) {
    console.error('Database error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      detail: err.detail
    });
  } finally {
    await pool.end();
  }
}

testDatabase(); 