const { Pool } = require('pg');
require('dotenv').config();

// Force disable SSL certificate validation for Postgres connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Get connection string from environment, with fallbacks
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || "postgres://localhost:5432/mall_brf";

console.log('Database Configuration:');
console.log('- Environment:', process.env.NODE_ENV);
console.log('- Connection String:', connectionString.split('@')[0].includes('postgres://') ? 'postgres://[hidden]' : '[hidden]');
console.log('- SSL Enabled:', true);
console.log('- SSL Verify:', false);

// Parse connection string to remove sslmode if present
let finalConnectionString = connectionString;
if (finalConnectionString.includes('sslmode=')) {
  finalConnectionString = finalConnectionString.replace(/\?sslmode=(require|verify-ca|verify-full)/, '');
}

// Add connection timeout parameter
finalConnectionString = finalConnectionString + (finalConnectionString.includes('?') ? '&' : '?') + 'connect_timeout=30';

// Create the pool with proper configuration
const pool = new Pool({
  connectionString: finalConnectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000,
  query_timeout: 10000,
  max: 20,
  idleTimeoutMillis: 30000
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (err.code === 'ETIMEDOUT') {
    console.error('Connection timed out. Please check your network connection and database availability.');
  }
});

// Helper function to test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      console.log('Database connection successful, server time:', result.rows[0].now);
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database connection failed:', err);
    console.error('Connection details:', {
      host: pool.options.host,
      port: pool.options.port,
      database: pool.options.database,
      user: pool.options.user,
      ssl: pool.options.ssl
    });
    return false;
  }
}

// Helper function to execute queries with proper error handling
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', {
      text,
      params,
      error: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    throw err;
  }
}

// Helper function to get a client from the pool
async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has checked out for more than 5 seconds!');
    console.error(`The last executed query on this client was: ${client.lastQuery}`);
  }, 5000);

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
}; 