const express = require('express');
const router = express.Router();
const { supabase } = require('../utils/supabase');

// Kontrollera tillgänglighet
router.post('/check-availability', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    console.log('Kontrollerar tillgänglighet för:', startDate, 'till', endDate);

    // Konvertera datum till databasformat
    const startDateStr = new Date(startDate).toISOString();
    const endDateStr = new Date(endDate).toISOString();

    console.log('Söker efter överlappande bokningar:', startDateStr, 'till', endDateStr);

    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`and(startdate.lte.${endDateStr},enddate.gte.${startDateStr})`)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Fel vid kontroll av tillgänglighet:', error);
      return res.status(500).json({ error: 'Kunde inte kontrollera tillgänglighet' });
    }

    // Mappa svaret för frontend
    const mappedBookings = existingBookings.map(booking => ({
      ...booking,
      startDate: booking.startdate,
      endDate: booking.enddate,
      createdAt: booking.createdat,
      parking: booking.parkering === true || booking.parkering === 'true' || booking.parkering === 't' ? true : 
               booking.parkering === false || booking.parkering === 'false' || booking.parkering === 'f' ? false : null
    }));

    console.log('Hittade bokningar:', mappedBookings.length);

    res.json({
      available: !mappedBookings || mappedBookings.length === 0,
      overlappingBookings: mappedBookings || []
    });
  } catch (error) {
    console.error('Serverfel vid kontroll av tillgänglighet:', error);
    res.status(500).json({ error: 'Kunde inte kontrollera tillgänglighet' });
  }
});

// Hämta alla bokningar
router.get('/', async (req, res) => {
  try {
    console.log('Hämtar alla bokningar');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Supabase Service Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Fel vid hämtning av bokningar:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      });
    }

    // Logga parkering-fälten för felsökning
    if (data && data.length > 0) {
      console.log('FELSÖKNING - Parkeringsvärden:');
      data.forEach((booking, index) => {
        console.log(`Bokning ${index + 1} (${booking.id}): parkering = ${booking.parkering} (typ: ${typeof booking.parkering})`);
      });
    }

    // Mappa fältnamnen för frontend
    const mappedData = data.map(booking => {
      // Konvertera specifikt parkering-fältet
      let parkingValue = null;
      
      // För true-värden
      if (booking.parkering === true || booking.parkering === 'true' || booking.parkering === 't' || booking.parkering === 'yes' || booking.parkering === 'ja') {
        parkingValue = true;
      } 
      // För false-värden
      else if (booking.parkering === false || booking.parkering === 'false' || booking.parkering === 'f' || booking.parkering === 'no' || booking.parkering === 'nej') {
        parkingValue = false;
      }
      
      // Om databasen innehåller "Ja"/"Nej" som strängar
      else if (typeof booking.parkering === 'string') {
        const val = booking.parkering.toLowerCase().trim();
        if (val === 'ja' || val === 'yes') {
          parkingValue = true;
        } else if (val === 'nej' || val === 'no') {
          parkingValue = false;
        }
      }

      const result = {
        ...booking,
        startDate: booking.startdate,
        endDate: booking.enddate,
        createdAt: booking.createdat,
        parking: parkingValue
      };
      
      console.log(`Bokning ${booking.id} - Konverterad: parkering=${booking.parkering} → parking=${result.parking}`);
      
      return result;
    });

    console.log(`Hittade ${mappedData.length} bokningar`);
    res.json(mappedData);
  } catch (error) {
    console.error('Serverfel vid hämtning av bokningar:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Kunde inte hämta bokningar',
      details: error.message
    });
  }
});

// Hämta en specifik bokning
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Hämtar bokning med ID:', id);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fel vid hämtning av bokning:', error);
      return res.status(404).json({ error: 'Bokning hittades inte' });
    }

    // Mappa fältnamnen för frontend
    const mappedData = {
      ...data,
      startDate: data.startdate,
      endDate: data.enddate,
      createdAt: data.createdat,
      parking: data.parkering === true || data.parkering === 'true' || data.parkering === 't' ? true : 
               data.parkering === false || data.parkering === 'false' || data.parkering === 'f' ? false : null
    };

    res.json(mappedData);
  } catch (error) {
    console.error('Serverfel vid hämtning av bokning:', error);
    res.status(500).json({ error: 'Kunde inte hämta bokningen' });
  }
});

// Skapa en ny bokning
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    console.log('Skapar ny bokning:', bookingData);

    // Mappa frontend-fält till databasfält
    const dbBookingData = {
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      startdate: bookingData.startDate,
      enddate: bookingData.endDate,
      notes: bookingData.notes,
      status: bookingData.status || 'pending',
      parkering: bookingData.parking || false
    };

    // Kontrollera tillgänglighet
    const { data: existingBookings, error: availabilityError } = await supabase
      .from('bookings')
      .select('*')
      .or(`and(startdate.lte.${dbBookingData.enddate},enddate.gte.${dbBookingData.startdate})`)
      .neq('status', 'cancelled');

    if (availabilityError) {
      console.error('Fel vid kontroll av tillgänglighet:', availabilityError);
      return res.status(500).json({ error: 'Kunde inte kontrollera tillgänglighet' });
    }

    if (existingBookings && existingBookings.length > 0) {
      return res.status(409).json({ 
        error: 'Det finns redan bokningar för detta datum',
        overlappingBookings: existingBookings
      });
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([dbBookingData])
      .select()
      .single();

    if (error) {
      console.error('Fel vid skapande av bokning:', error);
      return res.status(500).json({ error: error.message });
    }

    // Mappa svaret för frontend
    const mappedData = {
      ...data,
      startDate: data.startdate,
      endDate: data.enddate,
      createdAt: data.createdat,
      parking: data.parkering === true || data.parkering === 'true' || data.parkering === 't' ? true : 
               data.parkering === false || data.parkering === 'false' || data.parkering === 'f' ? false : null
    };

    res.status(201).json(mappedData);
  } catch (error) {
    console.error('Serverfel vid skapande av bokning:', error);
    res.status(500).json({ error: 'Kunde inte skapa bokningen' });
  }
});

// Uppdatera en bokning
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookingData = req.body;
    console.log('Uppdaterar bokning:', id, bookingData);

    // Mappa frontend-fält till databasfält
    const dbBookingData = {
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      startdate: bookingData.startDate,
      enddate: bookingData.endDate,
      notes: bookingData.notes,
      status: bookingData.status,
      parkering: bookingData.parking
    };

    // Kontrollera tillgänglighet för uppdateringen
    if (dbBookingData.startdate || dbBookingData.enddate) {
      const { data: existingBookings, error: availabilityError } = await supabase
        .from('bookings')
        .select('*')
        .neq('id', id)
        .or(`and(startdate.lte.${dbBookingData.enddate || bookingData.endDate},enddate.gte.${dbBookingData.startdate || bookingData.startDate})`)
        .neq('status', 'cancelled');

      if (availabilityError) {
        console.error('Fel vid kontroll av tillgänglighet:', availabilityError);
        return res.status(500).json({ error: 'Kunde inte kontrollera tillgänglighet' });
      }

      if (existingBookings && existingBookings.length > 0) {
        return res.status(409).json({ 
          error: 'Det finns redan bokningar för detta datum',
          overlappingBookings: existingBookings
        });
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(dbBookingData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Fel vid uppdatering av bokning:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Bokning hittades inte' });
    }

    // Mappa svaret för frontend
    const mappedData = {
      ...data,
      startDate: data.startdate,
      endDate: data.enddate,
      createdAt: data.createdat,
      parking: data.parkering === true || data.parkering === 'true' || data.parkering === 't' ? true : 
               data.parkering === false || data.parkering === 'false' || data.parkering === 'f' ? false : null
    };

    res.json(mappedData);
  } catch (error) {
    console.error('Serverfel vid uppdatering av bokning:', error);
    res.status(500).json({ error: 'Kunde inte uppdatera bokningen' });
  }
});

// Radera en bokning
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Raderar bokning:', id);

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Fel vid radering av bokning:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Bokningen har raderats' });
  } catch (error) {
    console.error('Serverfel vid radering av bokning:', error);
    res.status(500).json({ error: 'Kunde inte radera bokningen' });
  }
});

module.exports = {
  router
};
