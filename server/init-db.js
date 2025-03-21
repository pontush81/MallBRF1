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

async function initDatabase() {
  try {
    console.log('Initializing database...');
    console.log(`Using schema: ${DB_SCHEMA}`);
    
    // Create schema if it doesn't exist
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA}`);
    console.log(`Schema ${DB_SCHEMA} created or already exists`);
    
    // Check if pages table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'pages'
      )
    `, [DB_SCHEMA]);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creating pages table...');
      
      // Create pages table
      await pool.query(`
        CREATE TABLE ${DB_SCHEMA}.pages (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          slug VARCHAR(255) UNIQUE NOT NULL,
          ispublished BOOLEAN DEFAULT false,
          show BOOLEAN DEFAULT false,
          files JSONB DEFAULT '[]',
          createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Pages table created successfully');
      
      // Insert a test page
      const testPage = await pool.query(`
        INSERT INTO ${DB_SCHEMA}.pages (
          title,
          content,
          slug,
          ispublished,
          show,
          files
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [
        'Welcome',
        'Welcome to our website! This is a test page.',
        'welcome',
        true,
        true,
        '[]'
      ]);
      
      console.log('Test page created:', testPage.rows[0]);
    } else {
      console.log('Pages table already exists');
      
      // Check table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = $1
        AND table_name = 'pages'
        ORDER BY ordinal_position
      `, [DB_SCHEMA]);
      
      console.log('Current table structure:');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
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

initDatabase(); 