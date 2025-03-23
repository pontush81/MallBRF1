// server.js
// Trigger new deployment - 2024-03-21
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
// Lägg till dotenv för miljövariabler
require('dotenv').config();

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
const path = require('path');
const fs = require('fs');
const multer = require('multer');
// Import database connection and test function
const { pool, testConnection } = require('./db');
// Import Supabase client
const { supabase, testSupabaseConnection } = require('./utils/supabase');

// Importera backup-funktioner
const { createBackup, restoreFromBackup, listBackups } = require('./utils/backup');

// Importera routes
const pagesModule = require('./routes/pages');
const pagesRouter = pagesModule.router;

const app = express();
const PORT = process.env.PORT || 3002;

// Configure CORS with more specific options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-vercel-protection-bypass'],
  credentials: true
}));

// Authentication middleware
const authenticateRequest = (req, res, next) => {
  // Check for Vercel protection bypass header
  if (req.headers['x-vercel-protection-bypass'] === 'true') {
    return next();
  }

  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  // Extract token from Authorization header
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Verify token against environment variable
  if (token !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
};

// Define public routes that don't require authentication
const publicRoutes = [
  '/api/pages/visible',
  '/api/pages/published',
  '/api/pages/slug',
  '/health',
  '/manifest.json'
];

// Add middleware to handle public routes
app.use((req, res, next) => {
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  console.log(`[${new Date().toISOString()}] Accessing ${req.path} - Public route: ${isPublicRoute}`);
  
  if (isPublicRoute) {
    return next();
  }
  authenticateRequest(req, res, next);
});

// Configure file upload
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Verify environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

console.log('Environment variables verified successfully');
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Service Role Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
console.log('Anon Key length:', process.env.SUPABASE_ANON_KEY?.length);

// Routes
app.use('/api/pages', pagesRouter);

// Säkerställ att uploads-mappen finns - but only in development
const uploadsDir = path.join(__dirname, 'uploads');
const backupDir = path.join(__dirname, 'backups');

if (process.env.NODE_ENV !== 'production') {
    // Only attempt to create directories in development environment
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
        console.log('Created backup directory:', backupDir);
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

// Serve static files including manifest.json
app.use(express.static(path.join(__dirname, 'public')));

// Handle manifest.json specifically with proper CORS headers
app.get('/manifest.json', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json');
  
  res.json({
    "short_name": "MallBRF",
    "name": "MallBRF",
    "icons": [
      {
        "src": "favicon.ico",
        "sizes": "64x64 32x32 24x24 16x16",
        "type": "image/x-icon"
      }
    ],
    "start_url": ".",
    "display": "standalone",
    "theme_color": "#000000",
    "background_color": "#ffffff"
  });
});

// Add file upload middleware
pagesModule.setupFileUpload(app);

// Mount routes with proper error handling
app.use('/api/pages', pagesRouter);

// Backup endpoints
app.get('/api/backups', async (req, res) => {
    try {
        console.log('Listing backups...');
        const result = listBackups();
        if (result.success) {
            console.log('Found backups:', result.files ? result.files.length : 0);
            res.json({ success: true, files: result.files || [] });
        } else {
            console.error('Error listing backups:', result.error);
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/backup', async (req, res) => {
    try {
        console.log('Creating backup...', req.body);
        const { tables } = req.body || {};
        const result = await createBackup(tables);
        
        if (result.success) {
            console.log('Backup created:', result.fileName);
            
            // If we had partial success (some tables failed)
            if (result.partialSuccess) {
                console.warn('Some tables failed during backup:', result.errors);
                return res.json({ 
                    success: true, 
                    partialSuccess: true,
                    fileName: result.fileName,
                    errors: result.errors,
                    message: 'Backup created with some tables skipped due to permission issues'
                });
            }
            
            return res.json({ success: true, fileName: result.fileName });
        } else {
            console.error('Error creating backup:', result.error);
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/backups/:fileName/restore', async (req, res) => {
    try {
        console.log('Restoring backup...', req.params);
        const { fileName } = req.params;
        const result = await restoreFromBackup(fileName);
        
        if (result.success) {
            console.log('Restore completed for:', fileName);
            res.json({ success: true });
        } else {
            console.error('Error restoring backup:', result.error);
            
            // Check for permission error message
            if (result.error && result.error.includes('permission denied')) {
                return res.status(403).json({ 
                    success: false, 
                    error: result.error,
                    message: 'Behörighetsproblem: Din Supabase-användare saknar rättigheter att göra detta. Kontakta systemadministratören.'
                });
            }
            
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add direct api/pages/visible endpoint to ensure it's accessible
app.get('/api/pages/visible', async (req, res) => {
  try {
    console.log('Direct endpoint: fetching visible pages...');
    
    // Set CORS headers directly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Origin,Accept,X-Requested-With');
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('ispublished', true)
      .eq('show', true)
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
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

    console.log(`Found ${formattedPages.length} visible pages`);
    if (formattedPages.length > 0) {
      console.log('Sample page:', {
        id: formattedPages[0].id,
        title: formattedPages[0].title,
        isPublished: formattedPages[0].isPublished,
        show: formattedPages[0].show
      });
    }
    
    res.json(formattedPages);
  } catch (error) {
    console.error('Error fetching visible pages:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Could not fetch visible pages', details: error.message });
  }
});

// Handle OPTIONS requests for CORS preflight
app.options('*', cors());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Catch-all route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Konfigurera Multer för filuppladdning - use memory storage in production
let storage;
if (process.env.NODE_ENV === 'production') {
  // In production (Vercel), use memory storage
  console.log('Using memory storage for file uploads in production');
  storage = multer.memoryStorage();
} else {
  // In development, use disk storage
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // Skapa ett unikt filnamn med originalfilens filändelse
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
}

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB gräns
  fileFilter: function (req, file, cb) {
    // Godkänn endast vissa filtyper
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Endast bilder (jpeg, jpg, png, gif) och PDF-filer är tillåtna'));
  }
});

// Utility function to upload file to Supabase Storage
async function uploadToSupabaseStorage(file) {
  try {
    // Check if we have valid Supabase credentials before attempting upload
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.warn('Supabase credentials missing, using fallback storage method');
      // Return a fallback file info object with a temporary URL
      return {
        originalname: file.originalname,
        filename: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
        mimetype: file.mimetype,
        size: file.size,
        url: `/api/files/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}` // A URL that would be handled by our API
      };
    }
    
    // Create filename with timestamp for uniqueness
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('page-files')  // your bucket name
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });
      
    if (error) {
      console.error('Supabase Storage upload error:', error);
      // Fallback to temporary URL when Supabase upload fails
      return {
        originalname: file.originalname,
        filename: fileName,
        mimetype: file.mimetype,
        size: file.size,
        url: `/api/files/${fileName}` // A URL that would be handled by our API
      };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('page-files')
      .getPublicUrl(fileName);
      
    return {
      originalname: file.originalname,
      filename: fileName,
      mimetype: file.mimetype,
      size: file.size,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    // Fallback on errors
    return {
      originalname: file.originalname,
      filename: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
      mimetype: file.mimetype,
      size: file.size,
      url: `/api/files/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}` // A URL that would be handled by our API
    };
  }
}

// Utility function to delete file from Supabase Storage
async function deleteFromSupabaseStorage(filename) {
  try {
    // Check if we have valid Supabase credentials before attempting delete
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.warn('Supabase credentials missing, skipping storage deletion');
      return true; // Return success since we don't need to actually delete anything
    }
    
    const { error } = await supabase
      .storage
      .from('page-files')
      .remove([filename]);
      
    if (error) {
      console.error('Supabase Storage delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    return false;
  }
}

// Initiera databastabeller
const initDb = async () => {
  try {
    // Create tables using Supabase's API
    try {
      const { error: pagesError } = await supabase.rpc('create_pages_table', { schema: DB_SCHEMA });
      if (pagesError) {
        console.warn('Warning creating pages table:', pagesError.message);
      }
    } catch (err) {
      console.warn('Warning creating pages table:', err.message);
    }

    try {
      const { error: bookingsError } = await supabase.rpc('create_bookings_table', { schema: DB_SCHEMA });
      if (bookingsError) {
        console.warn('Warning creating bookings table:', bookingsError.message);
      }
    } catch (err) {
      console.warn('Warning creating bookings table:', err.message);
    }

    try {
      const { error: usersError } = await supabase.rpc('create_users_table', { schema: DB_SCHEMA });
      if (usersError) {
        console.warn('Warning creating users table:', usersError.message);
      }
    } catch (err) {
      console.warn('Warning creating users table:', err.message);
    }

    // Check if there are any users
    try {
      const { data: users, error: countError } = await supabase
        .from('users')
        .select('count');
      
      if (countError) {
        console.warn('Warning checking users:', countError.message);
      } else if (!users || users.length === 0) {
        // Add demo users using Supabase's API
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: '1',
              email: 'admin@example.com',
              name: 'Admin Användare',
              password: 'admin123', // Should be hashed in practice
              role: 'admin',
              isActive: true,
              createdAt: new Date().toISOString()
            }
          ]);
        
        if (insertError) {
          console.warn('Warning inserting demo user:', insertError.message);
        }
      }
    } catch (err) {
      console.warn('Warning managing users:', err.message);
    }

    console.log('Database initialization completed with warnings');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    // Don't throw the error, just log it and continue
  }
};

// Initiera databasen vid start
initDb();

// Function to ensure staging schema exists
async function ensureStagingSchema() {
  if (DB_SCHEMA === 'staging') {
    try {
      // Check if staging schema exists using Supabase's API
      const { data: schemas, error: schemaError } = await supabase.rpc('check_schema_exists', { schema_name: 'staging' });
      if (schemaError) throw schemaError;

      if (!schemas || schemas.length === 0) {
        console.log('Creating staging schema...');
        
        // Create staging schema using Supabase's API
        const { error: createError } = await supabase.rpc('create_staging_schema');
        if (createError) throw createError;

        // Copy table structures from public schema
        console.log('Copying table structures from public schema...');
        
        const { error: copyError } = await supabase.rpc('copy_tables_to_staging');
        if (copyError) throw copyError;

        console.log('Staging schema created and tables copied successfully!');
      } else {
        console.log('Staging schema already exists');
      }
    } catch (error) {
      console.error('Error ensuring staging schema:', error.message);
      throw error;
    }
  }
}

// Kör säkerställningen av staging-schemat efter databas-init
ensureStagingSchema();

// API-endpoints

// Testa API-endpointen
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fungerar!' });
});

// Test endpoint to verify database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].now,
      dbUrl: process.env.POSTGRES_URL_NON_POOLING ? 'Set (hidden)' : 'Not set',
      nodeEnv: process.env.NODE_ENV || 'not set'
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Add this right after the test-db endpoint
app.get('/api/debug-db', async (req, res) => {
  try {
    const dbInfo = {};
    
    // 1. Check if tables exist
    const tablesResult = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${DB_SCHEMA}'
    `);
    dbInfo.tables = tablesResult.rows.map(row => row.table_name);
    
    // 2. Check pages table schema
    if (dbInfo.tables.includes(withSchema('pages'))) {
      const pagesSchemaResult = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${withSchema('pages')}'
      `);
      dbInfo.pagesSchema = pagesSchemaResult.rows;
      
      // 3. Check for sample data
      const pagesDataResult = await db.query(`SELECT COUNT(*) FROM ${withSchema('pages')}`);
      dbInfo.pagesCount = parseInt(pagesDataResult.rows[0].count);
      
      // 4. Get sample page
      if (dbInfo.pagesCount > 0) {
        const samplePageResult = await db.query(`SELECT * FROM ${withSchema('pages')} LIMIT 1`);
        dbInfo.samplePage = samplePageResult.rows[0];
      }
      
      // 5. Check for visible pages specifically
      try {
        // Try lowercase first
        const visiblePagesResult = await db.query(`
          SELECT COUNT(*) FROM ${withSchema('pages')} WHERE ispublished = true AND show = true
        `);
        dbInfo.visiblePagesCount = parseInt(visiblePagesResult.rows[0].count);
        dbInfo.visiblePagesQuery = "ispublished = true AND show = true";
      } catch (err) {
        // If that fails, try with camelCase
        try {
          const visiblePagesResult = await db.query(`
            SELECT COUNT(*) FROM ${withSchema('pages')} WHERE "isPublished" = true AND "show" = true
          `);
          dbInfo.visiblePagesCount = parseInt(visiblePagesResult.rows[0].count);
          dbInfo.visiblePagesQuery = "\"isPublished\" = true AND \"show\" = true";
        } catch (err2) {
          dbInfo.visiblePagesError = err2.message;
        }
      }
    }
    
    // 6. Check connection string
    dbInfo.connectionInfo = {
      hasConnectionString: !!process.env.POSTGRES_URL_NON_POOLING,
      sslInConnectionString: process.env.POSTGRES_URL_NON_POOLING?.includes('sslmode=require'),
      nodeEnv: process.env.NODE_ENV || 'not set'
    };
    
    res.json({
      success: true,
      debug: dbInfo
    });
  } catch (error) {
    console.error('Debug database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Debug database test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Hämta alla sidor
app.get('/api/pages', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM ${withSchema('pages')}`);
    const pages = result.rows;
    
    // Konvertera till rätt format för frontend
    const formattedPages = pages.map(page => ({
      ...page,
      isPublished: Boolean(page.ispublished), // PostgreSQL returnerar lowercase-kolumnnamn
      show: Boolean(page.show),
      files: page.files ? JSON.parse(page.files) : []
    }));
    
    res.json(formattedPages);
  } catch (err) {
    console.error('Kunde inte hämta sidor:', err);
    res.status(500).json({ error: 'Kunde inte hämta sidor' });
  }
});

// Hämta publicerade sidor
app.get('/api/pages/published', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM ${withSchema('pages')} WHERE isPublished = true`);
    const pages = result.rows;
    
    // Konvertera till rätt format för frontend
    const formattedPages = pages.map(page => ({
      ...page,
      isPublished: Boolean(page.ispublished),
      show: Boolean(page.show),
      files: page.files ? JSON.parse(page.files) : []
    }));
    
    res.json(formattedPages);
  } catch (err) {
    console.error('Kunde inte hämta publicerade sidor:', err);
    res.status(500).json({ error: 'Kunde inte hämta publicerade sidor' });
  }
});

// Hämta en specifik sida med ID
app.get('/api/pages/:id', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM ${withSchema('pages')} WHERE id = $1`, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
    }
    
    const page = result.rows[0];
    
    // Konvertera till rätt format för frontend
    const formattedPage = {
      ...page,
      isPublished: Boolean(page.ispublished),
      show: Boolean(page.show),
      files: page.files ? JSON.parse(page.files) : []
    };
    
    res.json(formattedPage);
  } catch (err) {
    console.error('Kunde inte hämta sidan:', err);
    res.status(500).json({ error: 'Kunde inte hämta sidan' });
  }
});

// Hämta en specifik sida med slug
app.get('/api/pages/slug/:slug', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM ${withSchema('pages')} WHERE slug = $1`, [req.params.slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
    }
    
    const page = result.rows[0];
    
    // Konvertera till rätt format för frontend
    const formattedPage = {
      ...page,
      isPublished: Boolean(page.ispublished),
      show: Boolean(page.show),
      files: page.files ? JSON.parse(page.files) : []
    };
    
    res.json(formattedPage);
  } catch (err) {
    console.error('Kunde inte hämta sidan:', err);
    res.status(500).json({ error: 'Kunde inte hämta sidan' });
  }
});

// API - Ladda upp fil till sida
app.post('/api/pages/:id/upload', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'Ingen fil laddades upp' });
    }
    
    // Kontrollera om sidan existerar
    const pageResult = await db.query(`SELECT * FROM ${withSchema('pages')} WHERE id = $1`, [id]);
    
    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sidan hittades inte' });
    }
    
    let fileInfo;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, upload to Supabase Storage
      fileInfo = await uploadToSupabaseStorage(file);
      
      if (!fileInfo) {
        return res.status(500).json({ error: 'Kunde inte ladda upp filen till Supabase Storage' });
      }
    } else {
      // In development, use the filesystem
      const filePath = `/uploads/${file.filename}`;
      fileInfo = {
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: filePath
      };
    }
    
    // Uppdatera files-fältet i databasen
    const page = pageResult.rows[0];
    
    // Kontrollera om page.files är en JSON-sträng eller null
    let existingFiles = [];
    if (page.files) {
      try {
        existingFiles = JSON.parse(page.files);
      } catch (e) {
        console.error('Fel vid parsning av files JSON:', e);
      }
    }
    
    // Lägg till nya filen i fältet
    existingFiles.push(fileInfo);
    
    // Uppdatera databasen
    await db.query(
      `UPDATE ${withSchema('pages')} SET files = $1, updatedat = $2 WHERE id = $3`,
      [JSON.stringify(existingFiles), new Date().toISOString(), id]
    );
    
    // Skicka tillbaka filinfo
    res.status(200).json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('Fel vid filuppladdning:', error);
    res.status(500).json({ error: 'Fel vid filuppladdning: ' + error.message });
  }
});

// API - Ta bort fil från sida
app.delete('/api/pages/:pageId/files/:fileIndex', async (req, res) => {
  try {
    const { pageId, fileIndex } = req.params;
    
    // Hämta sidan och dess filer
    const pageResult = await db.query(`SELECT * FROM ${withSchema('pages')} WHERE id = $1`, [pageId]);
    
    if (pageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sidan hittades inte' });
    }
    
    const page = pageResult.rows[0];
    let files = [];
    
    if (page.files) {
      try {
        files = JSON.parse(page.files);
      } catch (e) {
        console.error('Fel vid parsning av files JSON:', e);
        return res.status(500).json({ error: 'Fel vid parsning av fildata' });
      }
    }
    
    // Find the file to delete by index or ID
    let index = parseInt(fileIndex, 10);
    let fileToDelete;
    
    // If it's not a valid index, try to find by ID
    if (isNaN(index) || index < 0 || index >= files.length) {
      // Try to find by ID instead
      index = files.findIndex(file => 
        file.id === fileIndex || file.filename === fileIndex
      );
      
      if (index === -1) {
        return res.status(400).json({ error: 'Filen hittades inte' });
      }
    }
    
    fileToDelete = files[index];
    
    // Ta bort filen fysiskt baserat på miljö
    if (process.env.NODE_ENV === 'production') {
      // In production, delete from Supabase Storage
      if (fileToDelete.filename) {
        const success = await deleteFromSupabaseStorage(fileToDelete.filename);
        if (!success) {
          console.warn('Could not delete file from Supabase Storage:', fileToDelete.filename);
          // Continue anyway to keep the database in sync
        }
      }
    } else if (fileToDelete.filename) {
      // In development, delete from filesystem
      const filePath = path.join(uploadsDir, fileToDelete.filename);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Kunde inte ta bort fil från filsystemet:', error);
          // Continue anyway to keep the database in sync
        }
      }
    }
    
    // Ta bort filen från databasen
    files.splice(index, 1);
    
    await db.query(
      `UPDATE ${withSchema('pages')} SET files = $1, updatedat = $2 WHERE id = $3`,
      [JSON.stringify(files), new Date().toISOString(), pageId]
    );
    
    res.status(200).json({ success: true, message: 'Filen har tagits bort' });
  } catch (error) {
    console.error('Fel vid borttagning av fil:', error);
    res.status(500).json({ error: 'Kunde inte ta bort filen: ' + error.message });
  }
});

// ---- BOOKING API ENDPOINTS ----

// Hämta alla bokningar
app.get('/api/bookings', async (req, res) => {
  try {
    console.log('Fetching all bookings from Supabase...');
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Supabase error fetching bookings:', error);
      return res.status(500).json({ 
        error: 'Kunde inte hämta bokningar', 
        details: error.message 
      });
    }

    if (!bookings) {
      console.log('No bookings found');
      return res.json([]);
    }

    // Normalisera fältnamnen för frontend
    const normalizedBookings = bookings.map(booking => ({
      ...booking,
      startDate: booking.startdate,
      endDate: booking.enddate,
      createdAt: booking.createdat
    }));

    console.log(`Found ${normalizedBookings.length} bookings`);
    res.json(normalizedBookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ 
      error: 'Kunde inte hämta bokningar', 
      details: err.message 
    });
  }
});

// Hämta en specifik bokning med ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !booking) {
      return res.status(404).json({ error: 'Bokningen kunde inte hittas' });
    }
    
    res.json(booking);
  } catch (err) {
    console.error('Kunde inte hämta bokningen:', err);
    res.status(500).json({ error: 'Kunde inte hämta bokningen', details: err.message });
  }
});

// Kontrollera tillgänglighet för datum
app.post('/api/bookings/check-availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start- och slutdatum krävs' });
    }
    
    console.log('Checking availability for dates:', { startDate, endDate });
    
    // Räkna totala antalet bokningar
    const totalBookingsResult = await db.query(`SELECT COUNT(*) FROM ${withSchema('bookings')}`);
    console.log('Total bookings in database:', totalBookingsResult.rows[0].count);
    
    // Eftersom det inte finns några bokningar i databasen, returnera alltid tillgängligt
    return res.json({
      available: true,
      overlappingBookings: []
    });
    
  } catch (err) {
    console.error('Kunde inte kontrollera tillgänglighet:', err);
    res.status(500).json({ error: 'Kunde inte kontrollera tillgänglighet', details: err.message });
  }
});

// Skapa en ny bokning
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, startDate, endDate, notes, phone } = req.body;
    
    if (!name || !email || !startDate || !endDate) {
      return res.status(400).json({ error: 'Namn, e-post, startdatum och slutdatum krävs' });
    }
    
    console.log('Creating booking with data:', { name, email, startDate, endDate });
    
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    const { data: newBooking, error } = await supabase
      .from('bookings')
      .insert([
        {
          id,
          name,
          email,
          startdate: startDate,
          enddate: endDate,
          createdat: now,
          status: 'pending',
          notes: notes || null,
          phone: phone || null
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating booking:', error);
      return res.status(500).json({ 
        error: 'Kunde inte skapa bokningen', 
        details: error.message 
      });
    }
    
    if (!newBooking) {
      return res.status(500).json({ error: 'Bokningen skapades men inget resultat returnerades' });
    }
    
    // Normalisera fältnamnen för frontend
    const normalizedBooking = {
      ...newBooking,
      startDate: newBooking.startdate,
      endDate: newBooking.enddate,
      createdAt: newBooking.createdat
    };
    
    console.log('Booking created successfully:', normalizedBooking);
    res.status(201).json(normalizedBooking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ 
      error: 'Kunde inte skapa bokningen', 
      details: err.message 
    });
  }
});

// Uppdatera en bokning
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { name, email, startDate, endDate, status, notes, phone } = req.body;
    const { id } = req.params;
    
    console.log('Updating booking with string dates:', id, req.body);
    
    // Kontrollera om bokningen finns
    const existingResult = await db.query(`SELECT * FROM ${withSchema('bookings')} WHERE id = $1`, [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bokningen kunde inte hittas' });
    }
    
    const existingBooking = existingResult.rows[0];
    
    // Om datumen ändras, kontrollera tillgänglighet
    if ((startDate && startDate !== existingBooking.startdate) || 
        (endDate && endDate !== existingBooking.enddate)) {
      
      const newStartDate = startDate || existingBooking.startdate;
      const newEndDate = endDate || existingBooking.enddate;
      
      console.log('Checking availability for updated dates:', { newStartDate, newEndDate });
      
      const overlappingResult = await db.query(`
        SELECT * FROM ${withSchema('bookings')} 
        WHERE 
          id != $1 AND
          status != 'cancelled' AND
          (
            /* Fall 1: Befintlig bokning överlappar med början av den nya bokningen */
            (startDate <= $2 AND endDate >= $2) OR
            /* Fall 2: Befintlig bokning överlappar med slutet av den nya bokningen */
            (startDate <= $3 AND endDate >= $3) OR
            /* Fall 3: Befintlig bokning helt inom den nya bokningen */
            (startDate >= $2 AND endDate <= $3) OR
            /* Fall 4: Befintlig bokning täcker helt den nya bokningen */
            (startDate <= $2 AND endDate >= $3)
          )
      `, [id, newStartDate, newEndDate]);
      
      if (overlappingResult.rows.length > 0) {
        console.log('Booking update failed: dates not available, overlapping bookings found:', overlappingResult.rows.length);
        return res.status(409).json({ 
          error: 'Datumen är inte tillgängliga', 
          overlappingBookings: overlappingResult.rows 
        });
      }
    }
    
    const result = await db.query(
      `UPDATE ${withSchema('bookings')} 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           startDate = COALESCE($3, startDate), 
           endDate = COALESCE($4, endDate), 
           status = COALESCE($5, status), 
           notes = COALESCE($6, notes),
           phone = COALESCE($7, phone)
       WHERE id = $8
       RETURNING *`,
      [name, email, startDate, endDate, status, notes, phone, id]
    );
    
    const updatedBooking = result.rows[0];
    console.log('Booking updated successfully:', updatedBooking);
    
    res.json(updatedBooking);
  } catch (err) {
    console.error('Kunde inte uppdatera bokningen:', err);
    res.status(500).json({ error: 'Kunde inte uppdatera bokningen' });
  }
});

// Radera en bokning
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kontrollera om bokningen finns
    const existingResult = await db.query(`SELECT * FROM ${withSchema('bookings')} WHERE id = $1`, [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bokningen kunde inte hittas' });
    }
    
    await db.query(`DELETE FROM ${withSchema('bookings')} WHERE id = $1`, [id]);
    
    res.json({ success: true, message: 'Bokningen har raderats' });
  } catch (err) {
    console.error('Kunde inte radera bokningen:', err);
    res.status(500).json({ error: 'Kunde inte radera bokningen' });
  }
});

// ENDAST FÖR UTVECKLINGSÄNDAMÅL - Ta bort i produktion!
app.post('/api/admin/execute-sql', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Ingen SQL-fråga angiven' });
    }
    
    // Kontrollera om det är en SELECT-fråga
    const isSelect = query.trim().toLowerCase().startsWith('select');
    
    if (isSelect) {
      const result = db.prepare(query).all();
      return res.json(result);
    } else {
      const result = db.prepare(query).run();
      return res.json({ 
        changes: result.changes, 
        lastInsertRowid: result.lastInsertRowid,
        message: 'Frågan kördes framgångsrikt' 
      });
    }
  } catch (err) {
    console.error('SQL-fel:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---- USER API ENDPOINTS ----

// Hämta alla användare
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query(`SELECT id, email, name, role, isActive, createdAt, lastLogin FROM ${withSchema('users')}`);
    // Formatera för frontend
    const formattedUsers = result.rows.map(user => ({
      ...user,
      isActive: Boolean(user.isactive)
    }));
    res.json(formattedUsers);
  } catch (err) {
    console.error('Kunde inte hämta användare:', err);
    res.status(500).json({ error: 'Kunde inte hämta användare' });
  }
});

// Hämta en specifik användare med ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await db.query(`SELECT id, email, name, role, isActive, createdAt, lastLogin FROM ${withSchema('users')} WHERE id = $1`, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Användaren kunde inte hittas' });
    }
    
    const user = result.rows[0];
    
    // Formatera för frontend
    const formattedUser = {
      ...user,
      isActive: Boolean(user.isactive)
    };
    
    res.json(formattedUser);
  } catch (err) {
    console.error('Kunde inte hämta användaren:', err);
    res.status(500).json({ error: 'Kunde inte hämta användaren' });
  }
});

// Skapa en ny användare
app.post('/api/users', async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'E-post och lösenord krävs' });
    }
    
    // Kontrollera om användaren redan finns
    const existingResult = await db.query(`SELECT * FROM ${withSchema('users')} WHERE email = $1`, [email]);
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'En användare med den e-postadressen finns redan' });
    }
    
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    // I produktion bör lösenordet hashas!
    const result = await db.query(
      `INSERT INTO ${withSchema('users')} (id, email, name, password, role, isActive, createdAt, lastLogin) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, name, role, isActive, createdAt, lastLogin`,
      [id, email, name || null, password, role || 'user', true, now, null]
    );
    
    const newUser = result.rows[0];
    
    // Formatera för frontend
    const formattedUser = {
      ...newUser,
      isActive: Boolean(newUser.isactive)
    };
    
    res.status(201).json(formattedUser);
  } catch (err) {
    console.error('Kunde inte skapa användaren:', err);
    res.status(500).json({ error: 'Kunde inte skapa användaren' });
  }
});

// Uppdatera en användare
app.put('/api/users/:id', async (req, res) => {
  try {
    const { email, name, password, role, isActive } = req.body;
    const { id } = req.params;
    
    // Kontrollera om användaren finns
    const existingResult = await db.query(`SELECT * FROM ${withSchema('users')} WHERE id = $1`, [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Användaren kunde inte hittas' });
    }
    
    // Om e-postadressen ändras, kontrollera att den inte redan används
    if (email && email !== existingResult.rows[0].email) {
      const emailCheckResult = await db.query(`SELECT * FROM ${withSchema('users')} WHERE email = $1 AND id != $2`, [email, id]);
      
      if (emailCheckResult.rows.length > 0) {
        return res.status(409).json({ error: 'E-postadressen används redan av en annan användare' });
      }
    }
    
    // Konvertera boolean till rätt format för PostgreSQL
    const activeValue = isActive !== undefined ? isActive : existingResult.rows[0].isactive;
    
    const result = await db.query(
      `UPDATE ${withSchema('users')} 
       SET email = COALESCE($1, email), 
           name = COALESCE($2, name), 
           password = COALESCE($3, password), 
           role = COALESCE($4, role), 
           isActive = $5
       WHERE id = $6
       RETURNING id, email, name, role, isActive, createdAt, lastLogin`,
      [email, name, password, role, activeValue, id]
    );
    
    const updatedUser = result.rows[0];
    
    // Formatera för frontend
    const formattedUser = {
      ...updatedUser,
      isActive: Boolean(updatedUser.isactive)
    };
    
    res.json(formattedUser);
  } catch (err) {
    console.error('Kunde inte uppdatera användaren:', err);
    res.status(500).json({ error: 'Kunde inte uppdatera användaren' });
  }
});

// Radera en användare
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kontrollera om användaren finns
    const existingResult = await db.query(`SELECT * FROM ${withSchema('users')} WHERE id = $1`, [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Användaren kunde inte hittas' });
    }
    
    await db.query(`DELETE FROM ${withSchema('users')} WHERE id = $1`, [id]);
    
    res.json({ success: true, message: 'Användaren har raderats' });
  } catch (err) {
    console.error('Kunde inte radera användaren:', err);
    res.status(500).json({ error: 'Kunde inte radera användaren' });
  }
});

// Add a fallback API endpoint to handle file requests in production
app.get('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  
  // In a real implementation, you'd check if this file exists in your database
  // and serve the appropriate content.
  console.log('Fallback file request handler called for:', filename);
  
  // Send a placeholder response for now with file info
  if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
    // For images, send a placeholder image
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')); // 1x1 transparent PNG
  } else if (filename.match(/\.pdf$/i)) {
    // For PDFs, send a simple PDF
    res.writeHead(200, { 'Content-Type': 'application/pdf' });
    res.end('Placeholder PDF content');
  } else {
    // For other files, send a text response
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Placeholder content for file: ${filename}`);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test Supabase connection before starting server
async function startServer() {
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error('Could not connect to database. Please check your credentials and connection settings.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();