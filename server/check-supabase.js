require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    console.log('Checking bookings table...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    } else {
      console.log('Bookings columns:', Object.keys(bookings[0] || {}));
    }

    console.log('\nChecking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log('Users columns:', Object.keys(users[0] || {}));
    }

    console.log('\nChecking pages table...');
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .limit(1);

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
    } else {
      console.log('Pages columns:', Object.keys(pages[0] || {}));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema().catch(console.error); 