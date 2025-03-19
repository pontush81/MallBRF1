// server.js
const express = require('express');
const cors = require('cors');
// Lägg till dotenv för miljövariabler
require('dotenv').config();
// Åsidosätt certifikatverifiering för utvecklingsmiljö
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('SSL-certifikatverifiering inaktiverad för utvecklingsmiljö');
} else {
  console.log('SSL-certifikatverifiering aktiv för produktionsmiljö');
}
// Ersätt SQLite med PostgreSQL-klient
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
// Import Supabase client
const supabase = require('./utils/supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Säkerställ att uploads-mappen finns - but only in development
const uploadsDir = path.join(__dirname, 'uploads');
if (process.env.NODE_ENV !== 'production') {
  // Only attempt to create directories in development environment
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
} else {
  console.log('Running in production mode - skipping uploads directory creation (using read-only filesystem)');
}

// Skapa och konfigurera databaspool med Supabase
// Don't override SSL config since it's already in the connection string
const connectionString = process.env.POSTGRES_URL_NON_POOLING || "postgres://localhost:5432/mall_brf";
console.log('Using connection string (masked):', connectionString.replace(/postgres:\/\/[^:]+:[^@]+@/, 'postgres://user:password@'));

const db = new Pool({
  connectionString: connectionString,
  // Let the connection string's sslmode=require handle SSL settings
  // Only add specific SSL settings if not present in connection string
  ssl: !connectionString.includes('sslmode=') && process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: true } : undefined
});

console.log('Database connection configured with:');
console.log('- SSL mode from connection string:', connectionString.includes('sslmode=require') ? 'Required from connection string' : 'Not specified in connection string');
console.log('- Node Env:', process.env.NODE_ENV || 'not set');

// Testa databaskopplingen
db.connect((err, client, done) => {
  if (err) {
    console.error('Databaskoppling misslyckades:', err);
  } else {
    console.log('Ansluten till PostgreSQL-databas');
    // Testa med en enkel fråga
    client.query('SELECT NOW()', (err, result) => {
      if (err) {
        console.error('Fel vid testfråga:', err);
      } else {
        console.log('Databasfråga fungerar, datum från server:', result.rows[0].now);
      }
      done();
    });
  }
});

// Konfigurera Express
// VIKTIGT: CORS måste konfigureras innan routes
app.use(cors());
app.use(express.json());

// Förbättra hanteringen av statiska filer för debugging
app.use('/uploads', (req, res, next) => {
  console.log(`File request: ${req.path}`);
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Sätt lämpliga headers för filnedladdning
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

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
      return null;
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
    return null;
  }
}

// Utility function to delete file from Supabase Storage
async function deleteFromSupabaseStorage(filename) {
  try {
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
    // Skapa pages-tabell om den inte finns - with lowercase column names
    await db.query(`
      CREATE TABLE IF NOT EXISTS pages (
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
    
    // Kontrollera om pages-tabellen saknar files-kolumnen
    const tableInfo = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pages' AND column_name = 'files'
    `);
    
    // Lägg till files-kolumn om den saknas
    if (tableInfo.rows.length === 0) {
      console.log('Lägger till files-kolumn i pages-tabellen...');
      await db.query('ALTER TABLE pages ADD COLUMN files TEXT');
    }
    
    // Skapa bookings-tabell om den inte finns
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        phone TEXT
      )
    `);
    
    // Skapa users-tabell om den inte finns
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TEXT NOT NULL,
        lastLogin TEXT
      )
    `);
    
    // Kontrollera om det finns några användare
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    
    if (parseInt(userCount.rows[0].count) === 0) {
      // Lägg till några demo-användare
      const initialUsers = [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin Användare',
          password: 'admin123', // I praktiken bör lösenord hashas
          role: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          id: '2',
          email: 'user@example.com',
          name: 'Test Användare',
          password: 'user123', // I praktiken bör lösenord hashas
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: null
        }
      ];
      
      for (const user of initialUsers) {
        await db.query(
          'INSERT INTO users(id, email, name, password, role, isActive, createdAt, lastLogin) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
          [user.id, user.email, user.name, user.password, user.role, user.isActive, user.createdAt, user.lastLogin]
        );
      }
    }
    
    // Kontrollera om det finns några sidor
    const pageCount = await db.query('SELECT COUNT(*) as count FROM pages');
    
    if (parseInt(pageCount.rows[0].count) === 0) {
      // Lägg till några demo-sidor
      const initialPages = [
        {
          id: '1',
          title: 'Välkomstsida',
          content: '# Välkommen\n\nDetta är vår välkomstsida.\n\n## Underrubrik\n\nDetta är en underrubrik med **fet text** och *kursiv text*.',
          slug: 'valkomstsida',
          ispublished: true,
          show: true,
          createdat: '2023-03-15T12:00:00Z',
          updatedat: '2023-03-15T12:00:00Z',
          files: null
        },
        {
          id: '2',
          title: 'Om oss',
          content: '# Om oss\n\nVi är ett företag som fokuserar på kvalitet och kundnöjdhet.\n\n## Vår historia\n\nVårt företag grundades 2010 med målet att erbjuda de bästa produkterna på marknaden.',
          slug: 'om-oss',
          ispublished: true,
          show: true,
          createdat: '2023-03-16T12:00:00Z',
          updatedat: '2023-03-16T12:00:00Z',
          files: null
        },
        {
          id: '3',
          title: 'Kontakt',
          content: '# Kontakta oss\n\nDu kan nå oss via följande kanaler:\n\n- Email: info@example.com\n- Telefon: 08-123 45 67\n- Adress: Exempelgatan 123, 123 45 Stockholm',
          slug: 'kontakt',
          ispublished: true,
          show: false,
          createdat: '2023-03-17T12:00:00Z',
          updatedat: '2023-03-17T12:00:00Z',
          files: null
        },
        {
          id: '4',
          title: 'Information om lägenheten',
          content: '# Information om lägenheten\n\n## Beskrivning\nVår mysiga lägenhet erbjuder en perfekt miljö för din semester. Med 2 sovrum och ett fullt utrustat kök är detta ditt hem hemifrån.\n\n## Bekvämligheter\n- Trådlöst internet\n- Fullt utrustat kök\n- Smart-TV\n- Tvättmaskin\n- Balkong med utsikt\n\n## Regler\n1. Incheckning: 15:00\n2. Utcheckning: 11:00\n3. Ingen rökning\n4. Inga husdjur\n5. Inga fester\n6. Respektera grannarna - tyst efter 22:00\n\n## Viktigt att veta\nLägenheten ligger på andra våningen och det finns ingen hiss. Parkering finns tillgänglig på gatan (avgift tillkommer).',
          slug: 'lagenhet-info',
          ispublished: true,
          show: true,
          createdat: '2023-03-18T12:00:00Z',
          updatedat: '2023-03-18T12:00:00Z',
          files: null
        }
      ];
      
      for (const page of initialPages) {
        await db.query(
          'INSERT INTO pages(id, title, content, slug, ispublished, show, createdat, updatedat, files) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [page.id, page.title, page.content, page.slug, page.ispublished, page.show, page.createdat, page.updatedat, page.files]
        );
      }
    }
    
    console.log('Databastabeller initierade');
  } catch (err) {
    console.error('Fel vid initiering av databas:', err);
  }
};

// Initiera databasen vid start
initDb();

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
      WHERE table_schema = 'public'
    `);
    dbInfo.tables = tablesResult.rows.map(row => row.table_name);
    
    // 2. Check pages table schema
    if (dbInfo.tables.includes('pages')) {
      const pagesSchemaResult = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'pages'
      `);
      dbInfo.pagesSchema = pagesSchemaResult.rows;
      
      // 3. Check for sample data
      const pagesDataResult = await db.query('SELECT COUNT(*) FROM pages');
      dbInfo.pagesCount = parseInt(pagesDataResult.rows[0].count);
      
      // 4. Get sample page
      if (dbInfo.pagesCount > 0) {
        const samplePageResult = await db.query('SELECT * FROM pages LIMIT 1');
        dbInfo.samplePage = samplePageResult.rows[0];
      }
      
      // 5. Check for visible pages specifically
      try {
        // Try lowercase first
        const visiblePagesResult = await db.query(`
          SELECT COUNT(*) FROM pages WHERE ispublished = true AND show = true
        `);
        dbInfo.visiblePagesCount = parseInt(visiblePagesResult.rows[0].count);
        dbInfo.visiblePagesQuery = "ispublished = true AND show = true";
      } catch (err) {
        // If that fails, try with camelCase
        try {
          const visiblePagesResult = await db.query(`
            SELECT COUNT(*) FROM pages WHERE "isPublished" = true AND "show" = true
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
    const result = await db.query('SELECT * FROM pages');
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
    const result = await db.query('SELECT * FROM pages WHERE isPublished = true');
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

// Hämta sidor som ska visas
app.get('/api/pages/visible', async (req, res) => {
  try {
    console.log('Fetching visible pages...');
    
    // Log column names from the table to debug
    console.log('Checking pages table schema...');
    try {
      const schemaResult = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'pages'
      `);
      console.log('Pages table schema:', schemaResult.rows.map(r => `${r.column_name} (${r.data_type})`));
    } catch (schemaErr) {
      console.error('Failed to fetch schema:', schemaErr);
    }
    
    // Use lowercase column names to avoid case-sensitivity issues
    const result = await db.query(`
      SELECT * FROM pages 
      WHERE "ispublished" = true AND "show" = true
    `);
    
    const pages = result.rows;
    console.log(`Found ${pages.length} visible pages`);
    
    if (pages.length > 0) {
      console.log('Sample page columns:', Object.keys(pages[0]));
    }
    
    const formattedPages = pages.map(page => ({
      ...page,
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
    
    res.json(formattedPages);
  } catch (err) {
    console.error('Kunde inte hämta synliga sidor:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      detail: err.detail
    });
    res.status(500).json({ error: 'Kunde inte hämta synliga sidor', details: err.message });
  }
});

// Hämta en specifik sida med ID
app.get('/api/pages/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    
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
    const result = await db.query('SELECT * FROM pages WHERE slug = $1', [req.params.slug]);
    
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

// Skapa en ny sida
app.post('/api/pages', async (req, res) => {
  try {
    const { title, content, slug, isPublished, show } = req.body;
    
    if (!title || !content || !slug) {
      return res.status(400).json({ error: 'Titel, innehåll och slug krävs' });
    }
    
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    const result = await db.query(
      'INSERT INTO pages(id, title, content, slug, ispublished, show, createdat, updatedat, files) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, title, content, slug, isPublished, show, now, now, '[]']
    );
    
    const newPage = result.rows[0];
    
    // Returnera med rätt format för frontend
    res.status(201).json({
      ...newPage,
      isPublished: Boolean(newPage.ispublished),
      show: Boolean(newPage.show),
      files: []
    });
  } catch (err) {
    console.error('Kunde inte skapa sidan:', err);
    res.status(500).json({ error: 'Kunde inte skapa sidan' });
  }
});

// Uppdatera en sida
app.put('/api/pages/:id', async (req, res) => {
  try {
    const { title, content, slug, isPublished, show, files } = req.body;
    const { id } = req.params;
    
    // Kontrollera om sidan finns
    const existingPageResult = await db.query('SELECT * FROM pages WHERE id = $1', [id]);
    
    if (existingPageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
    }
    
    const existingPage = existingPageResult.rows[0];
    
    // Hantera filarray
    let filesList = existingPage.files ? JSON.parse(existingPage.files) : [];
    if (files) {
      filesList = files;
    }
    
    // Uppdatera sidan
    const updatedAt = new Date().toISOString();
    const updatedTitle = title || existingPage.title;
    const updatedContent = content || existingPage.content;
    const updatedSlug = slug || existingPage.slug;
    const updatedIsPublished = isPublished !== undefined ? isPublished : existingPage.ispublished;
    const updatedShow = show !== undefined ? show : existingPage.show;
    const updatedFiles = JSON.stringify(filesList);
    
    const result = await db.query(
      `UPDATE pages 
       SET title = $1, content = $2, slug = $3, 
           ispublished = $4, show = $5, updatedat = $6, files = $7
       WHERE id = $8
       RETURNING *`,
      [updatedTitle, updatedContent, updatedSlug, updatedIsPublished, updatedShow, updatedAt, updatedFiles, id]
    );
    
    const updatedPage = result.rows[0];
    
    // Returnera med rätt format för frontend
    res.json({
      ...updatedPage,
      isPublished: Boolean(updatedPage.ispublished),
      show: Boolean(updatedPage.show),
      files: filesList
    });
  } catch (err) {
    console.error('Kunde inte uppdatera sidan:', err);
    res.status(500).json({ error: 'Kunde inte uppdatera sidan' });
  }
});

// Radera en sida
app.delete('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kontrollera om sidan finns
    const existingPageResult = await db.query('SELECT * FROM pages WHERE id = $1', [id]);
    
    if (existingPageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
    }
    
    const existingPage = existingPageResult.rows[0];
    
    // Ta bort tillhörande filer om de finns
    if (existingPage.files) {
      const files = JSON.parse(existingPage.files);
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    // Radera sidan
    await db.query('DELETE FROM pages WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Sidan har raderats' });
  } catch (err) {
    console.error('Kunde inte radera sidan:', err);
    res.status(500).json({ error: 'Kunde inte radera sidan' });
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
    const pageResult = await db.query('SELECT * FROM pages WHERE id = $1', [id]);
    
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
      'UPDATE pages SET files = $1, updatedat = $2 WHERE id = $3',
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
    const pageResult = await db.query('SELECT * FROM pages WHERE id = $1', [pageId]);
    
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
    
    const index = parseInt(fileIndex, 10);
    
    if (isNaN(index) || index < 0 || index >= files.length) {
      return res.status(400).json({ error: 'Ogiltigt filindex' });
    }
    
    const fileToDelete = files[index];
    
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
      'UPDATE pages SET files = $1, updatedat = $2 WHERE id = $3',
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
    const result = await db.query('SELECT * FROM bookings');
    res.json(result.rows);
  } catch (err) {
    console.error('Kunde inte hämta bokningar:', err);
    res.status(500).json({ error: 'Kunde inte hämta bokningar' });
  }
});

// Hämta en specifik bokning med ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bokningen kunde inte hittas' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Kunde inte hämta bokningen:', err);
    res.status(500).json({ error: 'Kunde inte hämta bokningen' });
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
    const totalBookingsResult = await db.query('SELECT COUNT(*) FROM bookings');
    console.log('Total bookings in database:', totalBookingsResult.rows[0].count);
    
    // Eftersom det inte finns några bokningar i databasen, returnera alltid tillgängligt
    return res.json({
      available: true,
      overlappingBookings: []
    });
    
  } catch (err) {
    console.error('Kunde inte kontrollera tillgänglighet:', err);
    res.status(500).json({ error: 'Kunde inte kontrollera tillgänglighet: ' + err.message });
  }
});

// Skapa en ny bokning
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, startDate, endDate, notes, phone } = req.body;
    
    if (!name || !email || !startDate || !endDate) {
      return res.status(400).json({ error: 'Namn, e-post, startdatum och slutdatum krävs' });
    }
    
    console.log('Creating booking with dates:', { name, email, startDate, endDate });
    
    // Räkna totala antalet bokningar
    const totalBookingsResult = await db.query('SELECT COUNT(*) FROM bookings');
    console.log('Total bookings in database before insert:', totalBookingsResult.rows[0].count);
    
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    console.log('Inserting new booking with ID:', id);
    
    try {
      const result = await db.query(
        'INSERT INTO bookings(id, name, email, startDate, endDate, createdAt, status, notes, phone) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [id, name, email, startDate, endDate, now, 'pending', notes || null, phone || null]
      );
      
      console.log('INSERT query executed. Returned rows:', result.rows.length);
      
      if (result.rows.length > 0) {
        const newBooking = result.rows[0];
        console.log('Booking created successfully:', newBooking);
        
        // Verifiera att bokningen har sparats genom att hämta alla bokningar igen
        const verifyBookingsResult = await db.query('SELECT COUNT(*) FROM bookings');
        console.log('Total bookings in database after insert:', verifyBookingsResult.rows[0].count);
        
        res.status(201).json(newBooking);
      } else {
        console.error('No rows returned after INSERT');
        res.status(500).json({ error: 'Bokningen skapades men inget resultat returnerades' });
      }
    } catch (insertErr) {
      console.error('Error inserting booking:', insertErr);
      res.status(500).json({ error: 'Kunde inte spara bokningen i databasen: ' + insertErr.message });
    }
  } catch (err) {
    console.error('Kunde inte skapa bokningen:', err);
    res.status(500).json({ error: 'Kunde inte skapa bokningen: ' + err.message });
  }
});

// Uppdatera en bokning
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { name, email, startDate, endDate, status, notes, phone } = req.body;
    const { id } = req.params;
    
    console.log('Updating booking with string dates:', id, req.body);
    
    // Kontrollera om bokningen finns
    const existingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    
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
        SELECT * FROM bookings 
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
      `UPDATE bookings 
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
    const existingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bokningen kunde inte hittas' });
    }
    
    await db.query('DELETE FROM bookings WHERE id = $1', [id]);
    
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
    const result = await db.query('SELECT id, email, name, role, isActive, createdAt, lastLogin FROM users');
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
    const result = await db.query('SELECT id, email, name, role, isActive, createdAt, lastLogin FROM users WHERE id = $1', [req.params.id]);
    
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
    const existingResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'En användare med den e-postadressen finns redan' });
    }
    
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    // I produktion bör lösenordet hashas!
    const result = await db.query(
      'INSERT INTO users(id, email, name, password, role, isActive, createdAt, lastLogin) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, name, role, isActive, createdAt, lastLogin',
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
    const existingResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Användaren kunde inte hittas' });
    }
    
    // Om e-postadressen ändras, kontrollera att den inte redan används
    if (email && email !== existingResult.rows[0].email) {
      const emailCheckResult = await db.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, id]);
      
      if (emailCheckResult.rows.length > 0) {
        return res.status(409).json({ error: 'E-postadressen används redan av en annan användare' });
      }
    }
    
    // Konvertera boolean till rätt format för PostgreSQL
    const activeValue = isActive !== undefined ? isActive : existingResult.rows[0].isactive;
    
    const result = await db.query(
      `UPDATE users 
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
    const existingResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Användaren kunde inte hittas' });
    }
    
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Användaren har raderats' });
  } catch (err) {
    console.error('Kunde inte radera användaren:', err);
    res.status(500).json({ error: 'Kunde inte radera användaren' });
  }
});

// Starta servern
app.listen(PORT, () => {
  console.log(`Server körs på http://localhost:${PORT}`);
  console.log(`Boknings-API tillgängligt på http://localhost:${PORT}/api/bookings`);
  console.log(`Databasanslutning: ${process.env.POSTGRES_URL_NON_POOLING}`);
});