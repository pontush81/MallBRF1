const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Force disable SSL certificate validation for Postgres connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
console.log('Using connection string (masked):', connectionString?.replace(/postgres:\/\/[^:]+:[^@]+@/, 'postgres://user:password@') || 'Not set');

let db;
if (connectionString) {
  db = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  console.warn('No database connection string found');
}

// Choose schema based on NODE_ENV
const DB_SCHEMA = process.env.NODE_ENV === 'production' ? 'public' : 'staging';
console.log(`Using database schema: ${DB_SCHEMA}`);

// Helper function to add schema to SQL queries
const withSchema = (tableName) => `${DB_SCHEMA}.${tableName}`;

// Configure Express
app.use(cors({
  origin: ['https://www.gulmaran.com', 'https://mallbrf.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Test database connection
if (db) {
  db.connect((err, client, done) => {
    if (err) {
      console.error('Database connection failed:', err.message);
    } else {
      console.log('Connected to PostgreSQL database');
      client.query('SELECT NOW()', (err, result) => {
        if (err) {
          console.error('Database test query failed:', err);
        } else {
          console.log('Database connection working, current time:', result.rows[0].now);
        }
        done();
      });
    }
  });
}

// Initialize database tables if needed
const initDb = async () => {
  if (!db) {
    console.log('Skipping database initialization - no connection');
    return;
  }

  try {
    // Create pages table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS ${withSchema('pages')} (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        slug TEXT NOT NULL,
        ispublished BOOLEAN NOT NULL,
        show BOOLEAN NOT NULL,
        createdat TEXT NOT NULL,
        updatedat TEXT NOT NULL,
        files TEXT
      )
    `);

    // Create bookings table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS ${withSchema('bookings')} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        startdate TEXT NOT NULL,
        enddate TEXT NOT NULL,
        createdat TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        phone TEXT,
        parkering TEXT
      )
    `);

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

// Initialize database
initDb();

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    schema: DB_SCHEMA,
    hasDb: !!db
  });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  if (!db) {
    return res.status(500).json({
      success: false,
      message: 'No database connection configured'
    });
  }

  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].now,
      schema: DB_SCHEMA
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Get all pages
app.get('/api/pages', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const result = await db.query(`SELECT * FROM ${withSchema('pages')}`);
    const pages = result.rows.map(page => ({
      ...page,
      isPublished: Boolean(page.ispublished),
      show: Boolean(page.show),
      createdAt: page.createdat,
      updatedAt: page.updatedat,
      files: page.files ? JSON.parse(page.files) : []
    }));
    
    res.json(pages);
  } catch (err) {
    console.error('Error fetching pages:', err);
    res.status(500).json({ error: 'Could not fetch pages', details: err.message });
  }
});

// Get visible pages (published and show = true)
app.get('/api/pages/visible', async (req, res) => {
  if (!db) {
    console.log('No database connection - returning fallback data');
    return res.json([
      {
        id: '1',
        title: 'Fallback - Information',
        content: 'This page was loaded from fallback data because the database was not available.',
        slug: 'fallback-information',
        isPublished: true,
        show: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: []
      }
    ]);
  }

  try {
    console.log('Fetching visible pages from database...');
    
    const result = await db.query(`
      SELECT * FROM ${withSchema('pages')} 
      WHERE ispublished = true AND show = true
      ORDER BY title ASC
    `);
    
    const pages = result.rows.map(page => ({
      id: page.id,
      title: page.title,
      content: page.content,
      slug: page.slug,
      isPublished: Boolean(page.ispublished),
      show: Boolean(page.show),
      createdAt: page.createdat,
      updatedAt: page.updatedat,
      files: page.files ? JSON.parse(page.files) : []
    }));
    
    console.log(`Found ${pages.length} visible pages`);
    res.json(pages);
  } catch (err) {
    console.error('Error fetching visible pages:', err);
    
    // Return fallback data on error
    res.json([
      {
        id: '1',
        title: 'Fallback - Information',
        content: 'This page was loaded from fallback data due to a database error.',
        slug: 'fallback-information',
        isPublished: true,
        show: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: []
      }
    ]);
  }
});

// Get published pages
app.get('/api/pages/published', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const result = await db.query(`
      SELECT * FROM ${withSchema('pages')} 
      WHERE ispublished = true
      ORDER BY title ASC
    `);
    
    const pages = result.rows.map(page => ({
      ...page,
      isPublished: Boolean(page.ispublished),
      show: Boolean(page.show),
      createdAt: page.createdat,
      updatedAt: page.updatedat,
      files: page.files ? JSON.parse(page.files) : []
    }));
    
    res.json(pages);
  } catch (err) {
    console.error('Error fetching published pages:', err);
    res.status(500).json({ error: 'Could not fetch published pages' });
  }
});

// Get page by ID
app.get('/api/pages/:id', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const result = await db.query(`SELECT * FROM ${withSchema('pages')} WHERE id = $1`, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    const page = result.rows[0];
    const formattedPage = {
      ...page,
      isPublished: Boolean(page.ispublished),
      show: Boolean(page.show),
      createdAt: page.createdat,
      updatedAt: page.updatedat,
      files: page.files ? JSON.parse(page.files) : []
    };
    
    res.json(formattedPage);
  } catch (err) {
    console.error('Error fetching page:', err);
    res.status(500).json({ error: 'Could not fetch page' });
  }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const result = await db.query(`SELECT * FROM ${withSchema('bookings')} ORDER BY createdat DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Could not fetch bookings' });
  }
});

// Create new booking
app.post('/api/bookings', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const { name, email, startDate, endDate, notes, phone, parkingSpace } = req.body;
    
    if (!name || !email || !startDate || !endDate) {
      return res.status(400).json({ error: 'Name, email, start date and end date are required' });
    }
    
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    const result = await db.query(
      `INSERT INTO ${withSchema('bookings')} (id, name, email, startdate, enddate, createdat, status, notes, phone, parkering) 
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [id, name, email, startDate, endDate, now, 'pending', notes || null, phone || null, parkingSpace || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Could not create booking' });
  }
});

// Handle CORS preflight requests
app.options('*', cors());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel
module.exports = app;

// Start server in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database Schema: ${DB_SCHEMA}`);
  });
} 