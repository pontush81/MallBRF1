const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Always use public schema for now
const DB_SCHEMA = 'public';
console.log('Using database schema:', DB_SCHEMA);

// Helper function för att lägga till schema i SQL-frågor
const withSchema = (tableName) => tableName; // Don't add schema prefix for now

// Hämta alla sidor
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) throw error;

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

    res.json(formattedPages);
  } catch (error) {
    console.error('Kunde inte hämta sidor:', error);
    res.status(500).json({ error: 'Kunde inte hämta sidor' });
  }
});

// Hämta publicerade sidor
router.get('/published', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('ispublished', true)
      .order('createdat', { ascending: false });

    if (error) throw error;

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

    res.json(formattedPages);
  } catch (error) {
    console.error('Kunde inte hämta publicerade sidor:', error);
    res.status(500).json({ error: 'Kunde inte hämta publicerade sidor' });
  }
});

// Hämta synliga sidor
router.get('/visible', async (req, res) => {
  try {
    console.log('Fetching visible pages...');
    console.log('Request headers:', req.headers);
    
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

// Hämta en specifik sida med ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
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

    res.json(formattedPage);
  } catch (error) {
    console.error('Kunde inte hämta sidan:', error);
    res.status(500).json({ error: 'Kunde inte hämta sidan' });
  }
});

// Hämta en specifik sida med slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
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

    res.json(formattedPage);
  } catch (error) {
    console.error('Kunde inte hämta sidan:', error);
    res.status(500).json({ error: 'Kunde inte hämta sidan' });
  }
});

// Uppdatera en befintlig sida
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating page:', req.params.id);
    console.log('Update data:', req.body);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    
    const { title, content, slug, isPublished, show, files } = req.body;
    
    // Validate required fields
    if (!title || !content || !slug) {
      return res.status(400).json({ error: 'Obligatoriska fält saknas' });
    }
    
    // Check if the page exists
    const { data: existingPage, error: findError } = await supabase
      .from('pages')
      .select('id')
      .eq('id', req.params.id)
      .single();
      
    if (findError) {
      console.error('Error finding page:', findError);
      return res.status(500).json({ error: 'Kunde inte hitta sidan' });
    }
    
    if (!existingPage) {
      console.error('Page not found:', req.params.id);
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
    }
    
    // Convert files array to JSON string
    const filesJson = files ? JSON.stringify(files) : '[]';
    
    // Update the page
    const { data, error } = await supabase
      .from('pages')
      .update({
        title,
        content,
        slug,
        ispublished: isPublished,
        show: show,
        files: filesJson,
        updatedat: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating page:', error);
      return res.status(500).json({ error: 'Kunde inte uppdatera sidan', details: error.message });
    }
    
    if (!data) {
      console.error('No data returned after update');
      return res.status(404).json({ error: 'Sidan kunde inte uppdateras' });
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
    
    console.log('Page updated successfully:', formattedPage);
    res.json(formattedPage);
  } catch (error) {
    console.error('Could not update page:', error);
    res.status(500).json({ error: 'Kunde inte uppdatera sidan', details: error.message });
  }
});

// Create a new page endpoint
router.post('/', async (req, res) => {
  try {
    console.log('Creating new page');
    console.log('Page data:', req.body);
    
    const { title, content, slug, isPublished, show, files } = req.body;
    
    // Validate required fields
    if (!title || !content || !slug) {
      return res.status(400).json({ error: 'Obligatoriska fält saknas' });
    }
    
    // Check if slug is already in use
    const { data: existingPage, error: findError } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', slug)
      .single();
      
    if (existingPage) {
      return res.status(400).json({ error: 'Det finns redan en sida med denna URL' });
    }
    
    // Convert files array to JSON string
    const filesJson = files ? JSON.stringify(files) : '[]';
    
    // Create the page with a unique ID
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    const { data, error } = await supabase
      .from('pages')
      .insert({
        id,
        title,
        content,
        slug,
        ispublished: isPublished,
        show: show || true,
        files: filesJson,
        createdat: now,
        updatedat: now
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating page:', error);
      throw error;
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
    
    console.log('Page created successfully:', formattedPage);
    res.status(201).json(formattedPage);
  } catch (error) {
    console.error('Could not create page:', error);
    res.status(500).json({ error: 'Kunde inte skapa sidan' });
  }
});

// Delete a page
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting page:', req.params.id);
    
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Could not delete page:', error);
    res.status(500).json({ error: 'Kunde inte radera sidan' });
  }
});

// File upload setup function (not needed anymore as we're using express-fileupload middleware)
function setupFileUpload(app) {
  console.log('File upload middleware already configured in server.js');
}

// Add file upload endpoint
router.post('/upload', async (req, res) => {
  try {
    console.log('File upload request received');
    
    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('No files were uploaded');
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const file = req.files.file;
    console.log('Received file:', file.name);

    // Generate a unique filename
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.name}`;
    const uploadPath = path.join('/tmp', uniqueFilename);

    // Move the file to the temporary directory
    await file.mv(uploadPath);
    console.log('File moved to:', uploadPath);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(uniqueFilename, fs.createReadStream(uploadPath), {
        cacheControl: '3600',
        upsert: false
      });

    // Clean up the temporary file
    fs.unlinkSync(uploadPath);

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    console.log('File uploaded successfully:', data);
    res.json({
      success: true,
      file: {
        name: file.name,
        path: data.path,
        size: file.size,
        type: file.mimetype
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Could not upload file', details: error.message });
  }
});

// File deletion endpoint
router.delete('/:id/files/:fileId', async (req, res) => {
  try {
    const pageId = req.params.id;
    const fileId = req.params.fileId;
    console.log('Deleting file:', fileId, 'from page:', pageId);
    
    // Get the current page first to retrieve existing files
    const { data: page, error: getError } = await supabase
      .from('pages')
      .select('files')
      .eq('id', pageId)
      .single();
    
    if (getError || !page) {
      console.error('Page not found:', pageId);
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
    }
    
    // Remove the file from the files array
    const existingFiles = page.files ? JSON.parse(page.files) : [];
    const fileToRemove = existingFiles.find(f => f.id === fileId || f.filename === fileId);
    
    if (!fileToRemove) {
      return res.status(404).json({ error: 'Filen kunde inte hittas' });
    }
    
    // Try to delete the file from the filesystem
    try {
      const filePath = path.join(__dirname, '..', fileToRemove.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsError) {
      console.error('Error deleting file from filesystem:', fsError);
      // Continue even if file deletion fails
    }
    
    const updatedFiles = existingFiles.filter(f => f.id !== fileId && f.filename !== fileId);
    
    // Update the page with the new files array
    const { data, error } = await supabase
      .from('pages')
      .update({
        files: JSON.stringify(updatedFiles),
        updatedat: new Date()
      })
      .eq('id', pageId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating page after file deletion:', error);
      return res.status(500).json({ error: 'Kunde inte uppdatera sidan efter filborttagning' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Could not delete file:', error);
    res.status(500).json({ error: 'Kunde inte ta bort filen' });
  }
});

module.exports = { 
  router,
  setupFileUpload
}; 