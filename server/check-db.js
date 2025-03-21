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

async function checkDatabase() {
  try {
    console.log('\nTesting database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✓ Successfully connected to database');
    
    // Test schema existence
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [DB_SCHEMA]);
    
    if (schemaResult.rows.length > 0) {
      console.log(`✓ Schema '${DB_SCHEMA}' exists`);
    } else {
      console.log(`✗ Schema '${DB_SCHEMA}' does not exist`);
    }
    
    // Test pages table
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = 'pages'
      )
    `, [DB_SCHEMA]);
    
    if (tableResult.rows[0].exists) {
      console.log(`✓ Table '${DB_SCHEMA}.pages' exists`);
      
      // Count pages
      const countResult = await client.query(`
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE ispublished = true AND show = true) as visible
        FROM ${DB_SCHEMA}.pages
      `);
      
      console.log('\nPages Statistics:');
      console.log(`- Total pages: ${countResult.rows[0].total}`);
      console.log(`- Visible pages: ${countResult.rows[0].visible}`);
      
      // Show sample page if any exist
      if (countResult.rows[0].total > 0) {
        const samplePage = await client.query(`
          SELECT * FROM ${DB_SCHEMA}.pages LIMIT 1
        `);
        console.log('\nSample page:', samplePage.rows[0]);
      }
      
      // Show table structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = $1
        AND table_name = 'pages'
        ORDER BY ordinal_position
      `, [DB_SCHEMA]);
      
      console.log('\nTable Structure:');
      columnsResult.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } else {
      console.log(`✗ Table '${DB_SCHEMA}.pages' does not exist`);
    }
    
    client.release();
  } catch (error) {
    console.error('\nDatabase Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await pool.end();
  }
}

checkDatabase(); 