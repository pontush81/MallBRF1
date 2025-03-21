require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkPage(slug) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  console.log(`Checking access to page with slug: ${slug}\n`);

  // Try as anonymous user
  console.log('1. Testing as anonymous user:');
  const { data: anonPage, error: anonError } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (anonError) {
    console.log('❌ Anonymous access denied:', anonError.message);
  } else {
    console.log('✅ Anonymous access granted:', anonPage ? 'Page found' : 'No page found');
    if (anonPage) {
      console.log('Page details:', {
        title: anonPage.title,
        ispublished: anonPage.ispublished,
        show: anonPage.show
      });
    }
  }

  // Try as authenticated user
  console.log('\n2. Testing as authenticated user:');
  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  });

  if (signInError) {
    console.log('❌ Could not sign in:', signInError.message);
    return;
  }

  console.log(`Signed in as: ${user.email}`);
  const { data: authPage, error: authError } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (authError) {
    console.log('❌ Authenticated access denied:', authError.message);
  } else {
    console.log('✅ Authenticated access granted:', authPage ? 'Page found' : 'No page found');
    if (authPage) {
      console.log('Page details:', {
        title: authPage.title,
        ispublished: authPage.ispublished,
        show: authPage.show
      });
    }
  }

  await supabase.auth.signOut();
}

// Get the slug from command line argument or use a default
const slug = process.argv[2] || 'test-page';
checkPage(slug).catch(console.error); 