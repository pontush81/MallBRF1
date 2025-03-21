const { Pool } = require('pg');
require('dotenv').config();

// Force disable SSL certificate validation for Postgres connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || "postgres://localhost:5432/mall_brf";
const DB_SCHEMA = process.env.NODE_ENV === 'production' ? 'public' : 'staging';

console.log('Database Configuration:');
console.log('- Connection String (masked):', connectionString.replace(/postgres:\/\/[^:]+:[^@]+@/, 'postgres://user:password@'));
console.log('- Schema:', DB_SCHEMA);
console.log('- NODE_ENV:', process.env.NODE_ENV);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const testPages = [
  {
    title: 'Welcome Page',
    content: 'Welcome to our website! This is a test page.',
    slug: 'welcome',
    ispublished: true,
    show: true,
    files: []
  },
  {
    title: 'About Us',
    content: 'Learn more about our organization.',
    slug: 'about',
    ispublished: true,
    show: true,
    files: []
  },
  {
    title: 'Hidden Page',
    content: 'This page should not be visible.',
    slug: 'hidden',
    ispublished: false,
    show: false,
    files: []
  }
];

async function addTestPages() {
  try {
    console.log('\nAdding test pages...');
    
    // First, clear existing pages
    await pool.query(`DELETE FROM ${DB_SCHEMA}.pages`);
    console.log('Cleared existing pages');
    
    // Add each test page
    for (const page of testPages) {
      const result = await pool.query(`
        INSERT INTO ${DB_SCHEMA}.pages (
          title,
          content,
          slug,
          ispublished,
          show,
          files,
          createdat,
          updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [
        page.title,
        page.content,
        page.slug,
        page.ispublished,
        page.show,
        JSON.stringify(page.files)
      ]);
      
      console.log(`Added page: ${result.rows[0].title} (${result.rows[0].slug})`);
    }
    
    // Verify pages were added
    const count = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE ispublished = true AND show = true) as visible
      FROM ${DB_SCHEMA}.pages
    `);
    
    console.log('\nPages in database:');
    console.log(`- Total: ${count.rows[0].total}`);
    console.log(`- Visible: ${count.rows[0].visible}`);
    
  } catch (error) {
    console.error('\nError adding test pages:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await pool.end();
  }
}

addTestPages(); 