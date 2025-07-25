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
    // Reduced logging for better performance
    console.log('Fetching visible pages...');
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('ispublished', true)
      .eq('show', true)
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
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
    const { id, fileId } = req.params;
    console.log('Attempting to delete file:', { id, fileId });

    // Get current page data
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (pageError) {
      console.error('Error fetching page:', pageError);
      return res.status(500).json({ error: 'Kunde inte hitta sidan' });
    }

    if (!page) {
      console.error('Page not found:', id);
      return res.status(404).json({ error: 'Sidan kunde inte hittas' });
    }

    // Parse files array from JSON string if needed
    let files = [];
    try {
      files = typeof page.files === 'string' ? JSON.parse(page.files) : page.files;
    } catch (e) {
      console.error('Error parsing files array:', e);
      files = [];
    }

    if (!Array.isArray(files)) {
      console.error('Invalid files data:', files);
      return res.status(500).json({ error: 'Ogiltig siddata' });
    }

    // Find the file to delete
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) {
      console.error('File not found:', fileId);
      return res.status(404).json({ error: 'Filen kunde inte hittas' });
    }

    console.log('Found file to delete:', fileToDelete);

    // Delete from Supabase Storage using the correct path
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([`pages/${fileToDelete.filename}`]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      return res.status(500).json({ error: 'Kunde inte radera filen från lagringen' });
    }

    // Update page data
    const updatedFiles = files.filter(f => f.id !== fileId);
    const { error: updateError } = await supabase
      .from('pages')
      .update({ 
        files: JSON.stringify(updatedFiles),
        updatedat: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating page:', updateError);
      return res.status(500).json({ error: 'Kunde inte uppdatera sidan' });
    }

    console.log('Successfully deleted file and updated page');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in delete file endpoint:', error);
    res.status(500).json({ error: 'Ett oväntat fel uppstod' });
  }
});

// Hämta en fil via proxy
router.get('/file/:pageId/:filename', async (req, res) => {
  try {
    const { pageId, filename } = req.params;
    const filePath = `pages/${pageId}/${filename}`;

    console.log('Attempting to fetch file:', filePath);

    // Sätt CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Först kontrollera om filen finns
    const { data: fileExists, error: existsError } = await supabase.storage
      .from('files')
      .list(filePath.split('/').slice(0, -1).join('/'));

    if (existsError) {
      console.error('Error checking file existence:', existsError);
      return res.status(404).json({ error: 'Filen kunde inte hittas' });
    }

    const file = fileExists.find(f => f.name === filePath.split('/').pop());
    if (!file) {
      console.error('File not found in bucket');
      return res.status(404).json({ error: 'Filen kunde inte hittas' });
    }

    // Hämta filen från Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('files')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return res.status(500).json({ error: 'Kunde inte ladda ner filen' });
    }

    // Hämta filens metadata för att sätta rätt content-type
    const { data: fileMetadata } = await supabase.storage
      .from('files')
      .getMetadata(filePath);

    // Sätt rätt headers
    res.setHeader('Content-Type', fileMetadata?.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Skicka filen
    res.send(fileData);
  } catch (error) {
    console.error('Error in file download endpoint:', error);
    res.status(500).json({ error: 'Ett oväntat fel uppstod' });
  }
});

// Ladda upp en fil till en sida
router.post('/:id/upload', async (req, res) => {
  try {
    console.log('File upload request received', {
      files: req.files ? Object.keys(req.files) : 'none',
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
    
    if (!req.files || !req.files.file) {
      console.error('No files were uploaded', {
        body: req.body
      });
      return res.status(400).json({ error: 'Ingen fil uppladdad' });
    }

    const file = req.files.file;
    const pageId = req.params.id;

    console.log('Starting file upload process...');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype,
      encoding: file.encoding,
      truncated: file.truncated,
      md5: file.md5,
      dataType: typeof file.data,
      dataIsBuffer: Buffer.isBuffer(file.data),
      dataLength: file.data ? (Buffer.isBuffer(file.data) ? file.data.length : 'unknown') : 'none'
    });

    // Validera filstorlek
    if (file.size === 0) {
      console.error('File has zero size');
      return res.status(400).json({ 
        error: 'Kunde inte ladda upp filen', 
        details: 'Filen är tom (0 bytes)' 
      });
    }

    // Validera MIME-typ
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.error('Unsupported file type:', file.mimetype);
      return res.status(400).json({ 
        error: 'Kunde inte ladda upp filen', 
        details: 'Filtypen stöds inte' 
      });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${pageId}/${Date.now()}.${fileExt}`;
    let filePath = `pages/${fileName}`;  // Changed to let since we modify it

    console.log('Attempting to upload to Supabase storage...');
    console.log('Target path:', filePath);
    console.log('File size:', file.size);
    console.log('File type:', file.mimetype);

    // First, try to create the bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw bucketsError;
    }

    const filesBucket = buckets.find(b => b.name === 'files');
    if (!filesBucket) {
      console.log('Creating files bucket...');
      const { error: createBucketError } = await supabase.storage.createBucket('files', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      });
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        throw createBucketError;
      }
    }

    // Kontrollera om filen redan finns
    const { data: existingFiles } = await supabase.storage
      .from('files')
      .list(`pages/${pageId}`);

    if (existingFiles?.some(f => f.name === filePath.split('/').pop())) {
      console.log('File already exists, generating new filename');
      const newFileName = `${pageId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      filePath = `pages/${newFileName}`;
    }

    // Create a Buffer from the file data if it's not already a Buffer
    const fileBuffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);

    // Verify the buffer is not empty
    if (fileBuffer.length === 0) {
      console.error('File buffer is empty');
      return res.status(400).json({ 
        error: 'Kunde inte ladda upp filen', 
        details: 'File data is empty' 
      });
    }

    console.log('Uploading file buffer of size:', fileBuffer.length);

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true  // Changed to true to allow overwriting if needed
      });

    if (uploadError) {
      console.error('Supabase upload error details:', {
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        message: uploadError.message,
        filePath,
        fileSize: fileBuffer.length,
        mimeType: file.mimetype
      });
      throw uploadError;
    }

    if (!uploadData) {
      throw new Error('Upload completed but no data returned from Supabase');
    }

    console.log('File uploaded successfully to Supabase:', uploadData);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);

    // Get current page data
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('files')
      .eq('id', pageId)
      .single();

    if (pageError) {
      console.error('Error fetching page:', pageError);
      throw pageError;
    }

    // Parse existing files or use empty array
    const files = page.files ? JSON.parse(page.files) : [];

    // Add new file to the array
    const newFile = {
      id: Date.now().toString(),
      filename: filePath,
      originalName: file.name,
      mimetype: file.mimetype,
      url: publicUrl,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    files.push(newFile);

    // Update page with new files array
    const { error: updateError } = await supabase
      .from('pages')
      .update({ files: JSON.stringify(files) })
      .eq('id', pageId);

    if (updateError) {
      console.error('Error updating page:', updateError);
      throw updateError;
    }

    console.log('Page updated successfully with new file');
    res.json({ 
      success: true, 
      file: newFile,
      message: 'Filen har laddats upp'
    });
  } catch (error) {
    console.error('Error in file upload process:', error);
    res.status(500).json({ 
      error: 'Kunde inte ladda upp filen',
      details: error.message || 'Ett oväntat fel uppstod'
    });
  }
});

module.exports = { 
  router,
  setupFileUpload
}; 