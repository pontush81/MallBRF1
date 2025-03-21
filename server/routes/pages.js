const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
require('dotenv').config();

const DB_SCHEMA = process.env.NODE_ENV === 'production' ? 'public' : 'staging';

// Helper function för att lägga till schema i SQL-frågor
const withSchema = (tableName) => `${DB_SCHEMA}.${tableName}`;

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
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('ispublished', true)
      .eq('show', true)
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

    console.log(`Found ${formattedPages.length} visible pages`);
    if (formattedPages.length > 0) {
      console.log('Sample page:', formattedPages[0]);
    }
    
    res.json(formattedPages);
  } catch (error) {
    console.error('Kunde inte hämta synliga sidor:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Kunde inte hämta synliga sidor' });
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

module.exports = router; 