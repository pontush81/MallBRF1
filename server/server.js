// server.js
// Trigger new deployment - 2024-03-21
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
// Import the already initialized firebase admin instance
const admin = require('./utils/firebase');
const auth = require('./middleware/auth');

// Importera centraliserad CORS-konfiguration
const corsConfig = require('./utils/corsConfig');

// Lägg till nödvändiga imports för proxy
const { createProxyMiddleware } = require('http-proxy-middleware');
const url = require('url');

// Lägg till dotenv för miljövariabler
// require('dotenv').config();

// Disable SSL verification in production (required for Vercel)
if (process.env.NODE_ENV === 'production') {
  // Instead of disabling SSL verification completely, we'll configure it properly
  process.env.PGSSLMODE = 'require';
  // Only set specific SSL options for database connections
  const dbSSLConfig = {
    rejectUnauthorized: false,
    ca: process.env.SSL_CERT || undefined
  };
  console.log('Running in production mode - SSL configured for database connections');
} else {
  console.log('Running in development mode');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Log environment configuration
console.log('Server Configuration:');
console.log('- Environment:', process.env.NODE_ENV);
console.log('- SSL Verification:', process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? 'Disabled' : 'Enabled');
console.log('- Port:', process.env.PORT || 3000);

console.log('\nDatabase Configuration:');
console.log('- Environment:', process.env.NODE_ENV);
console.log('- Connection String:', process.env.POSTGRES_URL ? 'Set' : 'Missing');
console.log('- SSL Enabled:', true);
console.log('- SSL Verify:', false);

console.log('\nSupabase Configuration:');
console.log('- URL:', process.env.SUPABASE_URL);
console.log('- Service Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
console.log('- Anon Key length:', process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0);
console.log('- Environment:', process.env.NODE_ENV);
console.log('- SSL Verify:', process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? 'Disabled' : 'Enabled');

// Ensure SSL certificate validation is disabled in production
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode - SSL certificate validation is disabled');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  process.env.PGSSLMODE = 'no-verify';
  
  // Validate required environment variables in production
  if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
    console.error('Missing required environment variables in production:');
    console.error('- SUPABASE_URL:', !!process.env.SUPABASE_URL);
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.error('- SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
    process.exit(1);
  }
} else {
  console.log('Running in development mode - SSL certificate validation is disabled for development');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Ersätt SQLite med PostgreSQL-klient
const { Pool } = require('pg');
// Import database connection and test function
const { pool, testConnection } = require('./db');
// Import Supabase client
const { supabase, testSupabaseConnection } = require('./utils/supabase');

// Importera routes
const pagesModule = require('./routes/pages');
const pagesRouter = pagesModule.router;
const bookingsModule = require('./routes/bookings');
const bookingsRouter = bookingsModule.router;
const backupModule = require('./routes/backup');
const backupRouter = backupModule.router;
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3002;

console.log(`Server starting at ${new Date().toISOString()}`);
console.log('Environment:', process.env.NODE_ENV || 'not set');

// =====================================
// MIDDLEWARE SETUP
// =====================================

// Apply CORS middleware with centralized configuration
app.use(cors(corsConfig.getCorsConfig()));

// Add explicit OPTIONS handler for preflight requests with error handling
app.options('*', (req, res, next) => {
  console.log('[CORS] Handling preflight request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers
  });

  cors(corsConfig.getCorsConfig())(req, res, (err) => {
    if (err) {
      console.error('[CORS] Preflight error:', err);
      res.status(403).json({ 
        error: 'CORS preflight failed',
        details: err.message,
        origin: req.headers.origin
      });
    } else {
      next();
    }
  });
});

// Basic request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request headers:', req.headers);
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// =====================================
// API ROUTES - NO AUTH REQUIRED
// =====================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'API is running' });
});

// Special debug endpoint
app.get('/api/debug', (req, res) => {
  console.log('Debug endpoint hit, showing request details');
  res.json({
    message: 'Debug endpoint',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    headers: req.headers,
    path: req.path,
    url: req.url,
    method: req.method,
    query: req.query,
    requestInfo: {
      ip: req.ip,
      protocol: req.protocol,
      hostname: req.hostname,
      originalUrl: req.originalUrl
    }
  });
});

// Public endpoints without auth middleware
app.get('/api/pages/visible', async (req, res) => {
  try {
    console.log('Handling /api/pages/visible request');
    console.log('Request headers:', req.headers);
    console.log('Request origin:', req.headers.origin);
    
    console.log('Fetching visible pages from Supabase...');
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('ispublished', true)
      .eq('show', true)
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Could not fetch visible pages', details: error.message });
    }

    if (!data) {
      console.log('No data returned from Supabase');
      return res.json([]);
    }
    
    if (data.length === 0) {
      console.log('No visible pages found in database');
      return res.json([]);
    }

    // Format response
    const formattedPages = data.map(page => ({
      id: page.id,
      title: page.title,
      content: page.content,
      slug: page.slug,
      isPublished: Boolean(page.ispublished),
      show: Boolean(page.show),
      files: page.files ? JSON.parse(page.files) : [],
      createdAt: page.createdat,
      updatedAt: page.updatedat
    }));

    console.log(`Found ${formattedPages.length} visible pages`);
    console.log('Sending response with pages:', formattedPages.map(p => p.title));
    res.json(formattedPages);
  } catch (error) {
    console.error('Error fetching visible pages:', error);
    res.status(500).json({ error: 'Could not fetch visible pages', details: error.message, stack: error.stack });
  }
});

// Public endpoint for getting page by slug
app.get('/api/pages/slug/:slug', async (req, res) => {
  try {
    console.log(`Handling /api/pages/slug/${req.params.slug} request directly`);
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Page not found' });
      }
      return res.status(500).json({ error: 'Could not fetch page', details: error.message });
    }

    if (!data) {
      console.log('Page not found');
      return res.status(404).json({ error: 'Page not found' });
    }

    // Format response
    const formattedPage = {
      id: data.id,
      title: data.title,
      content: data.content,
      slug: data.slug,
      isPublished: Boolean(data.ispublished),
      show: Boolean(data.show),
      files: data.files ? JSON.parse(data.files) : [],
      createdAt: data.createdat,
      updatedAt: data.updatedat
    };

    console.log(`Found page with slug ${req.params.slug} directly from server.js`);
    res.json(formattedPage);
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    res.status(500).json({ error: 'Could not fetch page', details: error.message });
  }
});

// Handle manifest.json
app.get('/manifest.json', (req, res) => {
  const manifest = {
    short_name: "MallBRF",
    name: "MallBRF Bokningssystem",
    icons: [
      {
        src: "favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon"
      },
      {
        src: "logo192.png",
        type: "image/png",
        sizes: "192x192"
      },
      {
        src: "logo512.png",
        type: "image/png",
        sizes: "512x512"
      }
    ],
    start_url: ".",
    display: "standalone",
    theme_color: "#000000",
    background_color: "#ffffff"
  };
  
  res.json(manifest);
});

// =====================================
// AUTH MIDDLEWARE FOR PROTECTED ROUTES
// =====================================

// Middleware för att verifiera x-vercel-protection-bypass header - endast för vissa API-anrop
app.use('/api', (req, res, next) => {
  // Tillåt OPTIONS-anrop för preflight requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Undanta vissa endpoints från autentisering
  const publicEndpoints = [
    '/api/pages/visible',
    '/api/pages/published',
    '/api/pages/slug',
    '/api/manifest.json',
    '/api/health',
    '/api/test',
    '/api/debug'
  ];

  // Skip if it's a public endpoint
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    console.log(`Skipping auth check for public endpoint: ${req.path}`);
    return next();
  }

  // Skip these paths as they're handled by the Firebase auth middleware
  const firebaseAuthPaths = [
    '/api/users',
    '/api/pages', 
    '/api/bookings',
    '/api/backup'
  ];
  
  // Skip Vercel protection for paths handled by Firebase auth
  if (firebaseAuthPaths.some(path => req.path.startsWith(path))) {
    console.log(`[Vercel Auth] Skipping Vercel protection for Firebase auth path: ${req.path}`);
    return next();
  }

  // För övriga API-anrop, verifiera x-vercel-protection-bypass
  const bypass = req.headers['x-vercel-protection-bypass'];
  if (!bypass || bypass !== 'true') {
    console.warn(`[Vercel Auth] Unauthorized request to ${req.path} - Missing or invalid x-vercel-protection-bypass header`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// =====================================
// PROTECTED API ROUTES
// =====================================

// Routes with auth middleware
app.use('/api/pages', auth, pagesRouter);
app.use('/api/bookings', auth, bookingsRouter);
app.use('/api/backup', auth, backupRouter);
app.use('/api/users', auth, usersRoutes);

// =====================================
// STATIC FILES & SPA ROUTING
// =====================================

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, '../build')));

// Handle root route - serve the frontend application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// =====================================
// START SERVER
// =====================================

// Test database connection
async function testDatabaseConnection() {
  try {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Database connection failed');
      return false;
    }
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Start the server
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

// Test database connection before starting server
testDatabaseConnection().then((isConnected) => {
  if (isConnected) {
    startServer();
  } else {
    console.error('Failed to connect to database. Server will not start.');
    process.exit(1);
  }
});

module.exports = app;