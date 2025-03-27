// server.js
// Trigger new deployment - 2024-03-21
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
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

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://mall-brf-1-git-development-pontush81s-projects.vercel.app',
      'https://mall-brf-1.vercel.app',
      'https://mallbrf.vercel.app',
      'https://www.gulmaran.com',
      'https://stage.gulmaran.com',
      'https://www.stage.gulmaran.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With', 'x-vercel-protection-bypass'],
  maxAge: 86400
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Serve static files from the build directory (måste vara före autentisering)
app.use(express.static(path.join(__dirname, '../build')));

// Handle manifest.json with proper CORS headers (no auth required)
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

  // Set CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  res.json(manifest);
});

// Add headers middleware (utan CORS-headers)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Middleware för att verifiera x-vercel-protection-bypass header - endast för API-anrop
app.use('/api', (req, res, next) => {
  // Tillåt OPTIONS-anrop för preflight requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  // För API-anrop, verifiera x-vercel-protection-bypass
  const bypass = req.headers['x-vercel-protection-bypass'];
  if (!bypass || bypass !== 'true') {
    console.warn(`Unauthorized request to ${req.path} - Missing or invalid x-vercel-protection-bypass header`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Origin:', req.headers.origin);
  next();
});

// Body parsers and file upload middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test endpoint (no auth required)
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'API is running' });
});

// Routes
app.use('/api/pages', pagesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/backup', backupRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Säkerställ att uploads-mappen finns - but only in development
const uploadsDir = path.join(__dirname, 'uploads');

if (process.env.NODE_ENV !== 'production') {
  // Only attempt to create directories in development environment
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
} else {
  console.log('Running in production mode - skipping directory creation (using read-only filesystem)');
}

// Update the schema handling
const DB_SCHEMA = 'public'; // Always use public schema for now
console.log(`Using database schema: ${DB_SCHEMA}`);

// Helper function to add schema to table names
function withSchema(tableName) {
  return tableName; // Don't add schema prefix for now
}

console.log('Database connection configured with:');
console.log('- SSL mode: SSL enabled with rejectUnauthorized: false (required for Vercel)');
console.log('- Node Env:', process.env.NODE_ENV || 'not set');
console.log('- Schema:', DB_SCHEMA);

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

// Handle root route - serve the frontend application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Handle 404 errors for static files
app.use((req, res, next) => {
  // Om det är en statisk fil, försök hitta den i build-mappen
  if (req.path.includes('.')) {
    const filePath = path.join(__dirname, '../build', req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.log(`404 for static file: ${req.path}`);
      res.status(404).send('Not found');
    }
  } else {
    // För alla andra routes, skicka index.html
    res.sendFile(path.join(__dirname, '../build/index.html'));
  }
});

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