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

// Helper function to transform booking data
const transformBookingData = (booking) => {
  return {
    id: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    startDate: booking.startdate,
    endDate: booking.enddate,
    notes: booking.notes,
    status: booking.status,
    parking: booking.parkering === true || booking.parkering === 'true' || booking.parkering === 1,
    createdAt: booking.createdat,
    updatedAt: booking.updatedat
  };
};

// Helper function to transform booking data for database
const transformBookingDataForDB = (booking) => {
  // Ensure proper date format for Supabase
  const startDate = booking.startDate ? new Date(booking.startDate).toISOString() : null;
  const endDate = booking.endDate ? new Date(booking.endDate).toISOString() : null;
  
  console.log('Transforming dates:', {
    input: {
      startDate: booking.startDate,
      endDate: booking.endDate
    },
    transformed: {
      startdate: startDate,
      enddate: endDate
    }
  });
  
  return {
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    startdate: startDate,
    enddate: endDate,
    notes: booking.notes,
    status: booking.status || 'pending',
    parkering: booking.parking === true || booking.parking === 'true' || booking.parking === 1
  };
};

// Hämta alla bokningar
router.get('/', async (req, res) => {
  try {
    console.log('Attempting to fetch all bookings...');
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Supabase Service Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`Successfully fetched ${bookings.length} bookings`);
    const transformedBookings = bookings.map(transformBookingData);
    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details
    });
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: error.message,
      code: error.code
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
    const bookingData = transformBookingDataForDB(req.body);
    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'startdate', 'enddate'];
    const missingFields = requiredFields.filter(field => !bookingData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: `Missing: ${missingFields.join(', ')}` 
      });
    }
    
    // Validate date formats
    try {
      new Date(bookingData.startdate);
      new Date(bookingData.enddate);
    } catch (err) {
      console.error('Invalid date format:', { 
        startdate: bookingData.startdate, 
        enddate: bookingData.enddate 
      });
      return res.status(400).json({ 
        error: 'Invalid date format', 
        details: 'Dates must be in ISO format'
      });
    }
    
    console.log('Attempting database insert with validated data...');
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select();

    if (error) {
      console.error('Database error creating booking:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('Successfully created booking, response:', data);
    if (!data || data.length === 0) {
      throw new Error('No data returned after successful insert');
    }
    
    const transformedBooking = transformBookingData(data[0]);
    res.status(201).json(transformedBooking);
  } catch (error) {
    console.error('Error creating booking:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details || 'No details available'
    });
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
});

// Uppdatera en bokning
router.put('/:id', async (req, res) => {
  try {
    const bookingData = transformBookingDataForDB(req.body);
    const { data, error } = await supabase
      .from('bookings')
      .update(bookingData)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    const transformedBooking = transformBookingData(data[0]);
    res.json(transformedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
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
