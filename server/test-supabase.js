require('dotenv').config();
const { supabase, testSupabaseConnection } = require('./utils/supabase');

async function testSupabase() {
  console.log('Testing Supabase connection...');
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Test connection
    const connected = await testSupabaseConnection();
    console.log('Connection test result:', connected);
    
    if (connected) {
      // Try to fetch visible pages
      console.log('\nFetching visible pages...');
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('ispublished', true)
        .eq('show', true);
      
      if (error) {
        console.error('Error fetching visible pages:', error);
      } else {
        console.log(`Found ${data.length} visible pages`);
        if (data.length > 0) {
          console.log('First page:', {
            id: data[0].id,
            title: data[0].title,
            slug: data[0].slug
          });
        }
      }
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testSupabase()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Unhandled error:', err))
  .finally(() => process.exit(0)); 