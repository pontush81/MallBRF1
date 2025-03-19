const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

// Check if credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  
  // Create a dummy client that logs errors but doesn't crash
  supabase = {
    storage: {
      from: (bucketName) => ({
        upload: (path, data, options) => {
          console.error(`Cannot upload to Supabase: missing credentials. Would upload to bucket: ${bucketName}, path: ${path}`);
          return { error: { message: 'Missing Supabase credentials' } };
        },
        remove: (paths) => {
          console.error(`Cannot delete from Supabase: missing credentials. Would delete from bucket: ${bucketName}, paths:`, paths);
          return { error: { message: 'Missing Supabase credentials' } };
        },
        getPublicUrl: (path) => {
          return { data: { publicUrl: `/uploads/${path}` } };
        }
      })
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase; 