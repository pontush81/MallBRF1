require('dotenv').config();
const { Pool } = require('pg');

// Disable SSL certificate validation for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use environment variable or default to local database
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

// Create a new pool instance
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current database time:', result.rows[0].now);
    
    // Test pages table
    console.log('\nTesting pages table...');
    const pages = await client.query('SELECT COUNT(*) FROM pages');
    console.log('Total pages in database:', pages.rows[0].count);
    
    const visiblePages = await client.query('SELECT COUNT(*) FROM pages WHERE ispublished = true AND show = true');
    console.log('Visible pages:', visiblePages.rows[0].count);
    
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('Connection string (masked):', connectionString.replace(/:[^:@]*@/, ':***@'));
  } finally {
    await pool.end();
  }
}

testConnection().catch(console.error); 