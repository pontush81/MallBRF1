require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testRLS() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  console.log('Testing RLS policies...\n');

  // Test 1: Anonymous access to pages
  console.log('Test 1: Anonymous access to pages');
  const { data: publicPages, error: publicPagesError } = await supabase
    .from('pages')
    .select('*')
    .eq('ispublished', true)
    .eq('show', true);

  console.log('Public pages access:', publicPagesError ? 'Failed ❌' : 'Success ✅');
  if (publicPagesError) console.error('Error:', publicPagesError.message);
  console.log('Found', publicPages?.length || 0, 'public pages\n');

  // Test 2: Try to access private pages without auth
  console.log('Test 2: Try to access private pages without auth');
  const { data: privatePages, error: privatePagesError } = await supabase
    .from('pages')
    .select('*')
    .eq('ispublished', false);

  const privateAccessBlocked = privatePagesError || (privatePages && privatePages.length === 0);
  console.log('Private pages blocked:', privateAccessBlocked ? 'Success ✅' : 'Failed ❌');
  if (privatePagesError) {
    console.log('Access denied via error:', privatePagesError.message);
  } else if (privatePages && privatePages.length === 0) {
    console.log('Access denied via empty result set (correct behavior)');
  }
  console.log();

  // Test 3: Try to create a booking without auth
  console.log('Test 3: Try to create a booking without auth');
  const { data: newBooking, error: bookingError } = await supabase
    .from('bookings')
    .insert([{
      name: 'Test Booking',
      email: 'test@example.com',
      startdate: new Date().toISOString(),
      enddate: new Date().toISOString(),
      status: 'pending',
      notes: 'Test booking'
    }]);

  console.log('Unauthorized booking blocked:', bookingError ? 'Success ✅' : 'Failed ❌');
  if (bookingError) console.log('Expected error:', bookingError.message);
  console.log();

  // Test 4: Try to access users table without auth
  console.log('Test 4: Try to access users table without auth');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  console.log('Users table access blocked:', usersError ? 'Success ✅' : 'Failed ❌');
  if (usersError) console.log('Expected error:', usersError.message);
  console.log();

  // Now let's try with authentication
  console.log('Attempting to sign in as a test user...');
  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  });

  if (signInError) {
    console.error('Failed to sign in:', signInError.message);
    return;
  }

  console.log('Signed in as:', user.email);

  // Test 5: Access own profile
  console.log('\nTest 5: Access own profile');
  const { data: profiles, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email);

  console.log('Own profile access:', profileError ? 'Failed ❌' : 'Success ✅');
  if (profileError) {
    console.error('Error:', profileError.message);
  } else {
    console.log('Profiles found:', profiles.length);
  }
  console.log();

  // Test 6: Create a booking as authenticated user
  console.log('Test 6: Create a booking as authenticated user');
  const { data: authBooking, error: authBookingError } = await supabase
    .from('bookings')
    .insert([{
      name: 'Auth Test Booking',
      email: user.email,
      startdate: new Date().toISOString(),
      enddate: new Date().toISOString(),
      status: 'pending',
      notes: 'Test booking created by RLS test'
    }]);

  console.log('Authorized booking creation:', authBookingError ? 'Failed ❌' : 'Success ✅');
  if (authBookingError) console.error('Error:', authBookingError.message);
  console.log();

  // Test 7: View all pages as authenticated user
  console.log('Test 7: View all pages as authenticated user');
  const { data: authPages, error: authPagesError } = await supabase
    .from('pages')
    .select('*');

  console.log('Authenticated pages access:', authPagesError ? 'Failed ❌' : 'Success ✅');
  if (authPagesError) console.error('Error:', authPagesError.message);
  console.log('Found', authPages?.length || 0, 'pages\n');

  // Sign out
  await supabase.auth.signOut();
  console.log('Tests completed and signed out.');
}

testRLS().catch(console.error); 