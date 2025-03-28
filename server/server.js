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

// CORS configuration
const getCorsConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  console.log('Configuring CORS for environment:', env);

  // Define allowed origins based on environment
  const allowedOrigins = {
    development: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      '*'
    ],
    staging: [
      'https://www.stage.gulmaran.com',
      'https://mallbrf.vercel.app',
      '*'
    ],
    production: [
      'https://www.gulmaran.com',
      'https://mallbrf.vercel.app',
      '*'
    ]
  };

  // Get origins for current environment
  const origins = allowedOrigins[env] || allowedOrigins.development;
  console.log('Allowed origins:', origins);

  // For immediate fix, let's use a simpler CORS config that works on all environments
  if (process.env.CORS_ORIGIN === '*') {
    console.log('Using wildcard CORS configuration');
    return {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-vercel-protection-bypass',
        'Origin',
        'Accept',
        'X-Requested-With'
      ]
    };
  }

  return {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('Request with no origin - allowing');
        return callback(null, true);
      }
      
      // For debugging
      console.log('Request origin:', origin);
      
      // Allow all origins temporarily to fix CORS issues
      if (true) {
        console.log('Allowing all origins temporarily');
        return callback(null, true);
      }
      
      if (origins.includes(origin) || origins.includes('*')) {
        console.log('Origin allowed:', origin);
        callback(null, true);
      } else {
        console.log('Origin blocked:', origin);
        callback(new Error(`Not allowed by CORS in ${env} environment`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-vercel-protection-bypass',
      'Origin',
      'Accept',
      'X-Requested-With'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
  };
};

// Apply CORS middleware with environment-specific configuration
app.use(cors(getCorsConfig()));
app.use(express.json());

// Add CORS preflight handler for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

// Add a global CORS middleware
app.use((req, res, next) => {
  // Allow CORS from all origins in development and staging
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

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
    '/api/test'
  ];

  // Skip if it's a public endpoint
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
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
    console.log('Handling /api/pages/visible request directly');
    
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

    if (!data || data.length === 0) {
      console.log('No visible pages found');
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

    console.log(`Found ${formattedPages.length} visible pages directly from server.js`);
    res.json(formattedPages);
  } catch (error) {
    console.error('Error fetching visible pages:', error);
    res.status(500).json({ error: 'Could not fetch visible pages', details: error.message });
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

// Routes with auth middleware
app.use('/api/pages', auth, pagesRouter);
app.use('/api/bookings', auth, bookingsRouter);
app.use('/api/backup', auth, backupRouter);
app.use('/api/users', auth, usersRoutes);

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
  // Skip API routes - let them be handled by their own handlers
  if (req.path.startsWith('/api/')) {
    return next();
  }

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

// Add proxy middleware to avoid CORS issues
const apiProxy = createProxyMiddleware({
  target: 'https://mallbrf.vercel.app',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy/api': '/api'
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add headers to the proxied request
    proxyReq.setHeader('x-vercel-protection-bypass', 'true');
    
    // Copy auth header if present
    const authHeader = req.headers.authorization;
    if (authHeader) {
      proxyReq.setHeader('Authorization', authHeader);
    }
    
    console.log(`Proxying request: ${req.method} ${req.url} -> https://mallbrf.vercel.app${req.url.replace('/proxy', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Proxy response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Apply proxy middleware
app.use('/proxy/api', apiProxy);

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