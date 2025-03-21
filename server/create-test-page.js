const { Pool } = require('pg');
require('dotenv').config();

// Force disable SSL certificate validation for Postgres connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || "postgres://localhost:5432/mall_brf";
const DB_SCHEMA = process.env.NODE_ENV === 'production' ? 'public' : 'staging';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestPage() {
  try {
    console.log('Creating test page...');
    console.log(`Using schema: ${DB_SCHEMA}`);
    
    // Create a test page
    const result = await pool.query(
      `INSERT INTO ${DB_SCHEMA}.pages (
        title,
        content,
        slug,
        ispublished,
        show,
        files,
        createdat,
        updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        'Test Page',
        'This is a test page to verify database functionality.',
        'test-page',
        true,
        true,
        '[]',
        new Date(),
        new Date()
      ]
    );
    
    console.log('Test page created successfully:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('Error creating test page:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await pool.end();
  }
}

createTestPage(); 