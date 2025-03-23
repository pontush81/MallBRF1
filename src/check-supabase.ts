import { supabase } from './supabaseClient';

async function checkFrontendConnection() {
  console.log('Checking frontend Supabase configuration...');
  
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('ispublished', true)
      .limit(1);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Found published pages:', data.length);
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
}

// Run the test
checkFrontendConnection(); 