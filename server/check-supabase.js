require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
  console.log('Checking Supabase configuration...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Service Key Length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('\nChecking pages table...');
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .limit(1);

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
    } else {
      console.log('Pages table accessible');
      console.log('Columns:', Object.keys(pages[0] || {}));
    }

    console.log('\nConnection test completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkSchema(); 