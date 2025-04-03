const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPolicies() {
  try {
    console.log('Testar policies för bookings-tabellen...');
    
    // 1. Hämta alla bookings för att få ett test-ID
    console.log('\nHämtar alla bookings:');
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!bookings || bookings.length === 0) {
      console.log('Inga bookings hittades för test');
      return;
    }
    
    const testBooking = bookings[0];
    console.log(`Använder bokning med ID ${testBooking.id} för testning`);
    
    // 2. Försöker uppdatera med service role (admin)
    console.log('\nTestar UPDATE som admin:');
    const testNote = `Test note ${new Date().toISOString()}`;
    const { data: updateData, error: updateError } = await supabase
      .from('bookings')
      .update({ notes: testNote })
      .eq('id', testBooking.id)
      .select();
    
    if (updateError) {
      console.error('UPDATE som admin misslyckades:', updateError);
    } else {
      console.log('UPDATE som admin lyckades:', updateData);
    }
    
    // 3. Skapa en temporär bokning för att testa radering
    console.log('\nSkapar en temporär bokning för DELETE-test:');
    const { data: insertData, error: insertError } = await supabase
      .from('bookings')
      .insert({
        name: 'Test Booking',
        email: 'test@example.com',
        startdate: new Date().toISOString(),
        enddate: new Date(Date.now() + 86400000).toISOString(), // Nästa dag
        status: 'pending'
      })
      .select();
    
    if (insertError) {
      console.error('Kunde inte skapa test-bokning:', insertError);
    } else {
      console.log('Skapade test-bokning:', insertData);
      
      // 4. Försöker radera den temporära bokningen
      console.log('\nTestar DELETE som admin:');
      const { data: deleteData, error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', insertData[0].id)
        .select();
      
      if (deleteError) {
        console.error('DELETE som admin misslyckades:', deleteError);
      } else {
        console.log('DELETE som admin lyckades');
      }
    }
    
    console.log('\nPolicytest slutfört.');
  } catch (error) {
    console.error('Fel vid testning av policies:', error);
  }
}

// Kör testet
testPolicies(); 