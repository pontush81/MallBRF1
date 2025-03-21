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

async function checkPages() {
  try {
    console.log('Checking pages in database...');
    console.log(`Using schema: ${DB_SCHEMA}`);
    
    // Check total number of pages
    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM ${DB_SCHEMA}.pages`
    );
    console.log(`Total pages: ${totalResult.rows[0].count}`);
    
    // Check visible pages
    const visibleResult = await pool.query(
      `SELECT * FROM ${DB_SCHEMA}.pages WHERE ispublished = true AND show = true`
    );
    console.log(`Visible pages: ${visibleResult.rows.length}`);
    
    if (visibleResult.rows.length > 0) {
      console.log('\nVisible pages:');
      visibleResult.rows.forEach(page => {
        console.log(`- ${page.title} (ID: ${page.id}, Slug: ${page.slug})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking pages:', error);
  } finally {
    await pool.end();
  }
}

checkPages(); 