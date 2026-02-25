import { Booking, CreateBookingData, UpdateBookingData } from '../types/Booking';
import { authenticatedRestCall } from './supabaseClient';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Database table mapping
const BOOKINGS_TABLE = 'bookings';
const AVAILABILITY_VIEW = 'booking_availability';

/**
 * Public REST call using anon key only (no auth required).
 * Used for the booking_availability view which exposes no personal data.
 */
async function publicRestCall(endpoint: string, timeout: number = 5000) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    throw new Error(`Public REST API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Helper function to transform database row to Booking object (using legacy schema)
function transformBookingFromDB(row: any): Booking {
  // Databasen har startdate/enddate (legacy format)
  const startDate = row.startdate;
  const endDate = row.enddate;

  // Extrahera datum och tid från startdate för ny format-kompatibilitet
  let date: string | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;

  if (startDate) {
    const startDateObj = new Date(startDate);
    date = startDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    startTime = startDateObj.toTimeString().substring(0, 5); // HH:MM
  }

  if (endDate) {
    const endDateObj = new Date(endDate);
    endTime = endDateObj.toTimeString().substring(0, 5); // HH:MM
  }

  return {
    id: row.id?.toString(),

    // New format fields
    type: row.type || 'laundry',
    date: date,
    startTime: startTime,
    endTime: endTime,
    weeks: row.weeks || 1,
    apartment: row.apartment,
    floor: row.floor,

    // Legacy format fields (for backwards compatibility)
    startDate: startDate || row.startdate || row.startDate,
    endDate: endDate || row.enddate || row.endDate,
    startdate: row.startdate || startDate,
    enddate: row.enddate || endDate,

    // Common fields
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    notes: row.notes,
    parkingSpace: row.parkering || row.parking_space || row.parkingSpace,
    parking: !!row.parkering || row.parking === true || !!row.parking_space,
    status: row.status || 'pending',

    // Timestamps
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    createdat: row.created_at || row.createdat,
    updated_at: row.updated_at || row.updated_at
  };
}

// Helper function to transform Booking object to database row (using legacy schema)
function transformBookingToDB(booking: Partial<Booking> | CreateBookingData): any {
  // För CreateBookingData - konvertera från ny struktur till gammal
  if ('date' in booking && booking.date) {
    // Använd endDate om det finns, annars beräkna från date + weeks
    let startDate: Date;
    let endDate: Date;

    if ((booking as CreateBookingData).endDate) {
      // Använd de faktiska datumen
      startDate = new Date((booking as CreateBookingData).date);
      endDate = new Date((booking as CreateBookingData).endDate!);
    } else {
      // Fallback till gammal logik
      startDate = new Date(booking.date + 'T14:00:00');
      endDate = new Date(startDate);
      const nights = booking.weeks ? booking.weeks * 7 : 1;
      endDate.setDate(startDate.getDate() + nights);
    }

    return {
      name: booking.name,
      email: booking.email,
      startdate: startDate.toISOString(),
      enddate: endDate.toISOString(),
      phone: booking.phone || '',
      notes: booking.message || '',
      parkering: booking.parkingSpace || null,
      status: (booking as Booking).status || 'pending',
      updated_at: new Date().toISOString()
    };
  }

  // För legacy Booking objekt
  return {
    name: booking.name,
    email: booking.email,
    startdate: (booking as Booking).startDate || (booking as Booking).startdate,
    enddate: (booking as Booking).endDate || (booking as Booking).enddate,
    phone: booking.phone || '',
    notes: (booking as Booking).notes || '',
    parkering: (booking as Booking).parking || null,
    status: (booking as Booking).status || 'pending',
    updated_at: new Date().toISOString()
  };
}

const bookingServiceSupabase = {
  /**
   * Fetch public booking availability (dates only, no personal data).
   * Uses the booking_availability view - accessible without authentication.
   * Returns minimal booking objects with only date/status fields.
   */
  getBookingAvailability: async (): Promise<Booking[]> => {
    console.log('🔓 Fetching public booking availability...');

    try {
      const params = new URLSearchParams();
      params.append('select', '*');
      params.append('order', 'startdate.asc');

      const endpoint = `${AVAILABILITY_VIEW}?${params.toString()}`;
      const data = await publicRestCall(endpoint);

      const bookings = (data || []).map((row: any) => ({
        id: row.id?.toString(),
        startDate: row.startdate,
        endDate: row.enddate,
        startdate: row.startdate,
        enddate: row.enddate,
        status: row.status || 'pending',
        // No personal data in availability view
        name: '',
        email: '',
      } as Booking));

      console.log(`✅ Found ${bookings.length} bookings (public availability)`);
      return bookings;
    } catch (error) {
      console.error('❌ Error fetching booking availability:', error);
      throw new Error('Kunde inte hämta bokningskalender');
    }
  },

  /**
   * Fetch all bookings with full details (requires authentication).
   * Returns complete booking objects including personal data.
   */
  getAllBookings: async (options: {
    forceRefresh?: boolean;
    dateRange?: { start: string; end: string };
    limit?: number;
  } = {}): Promise<Booking[]> => {
    console.log('🔐 Fetching bookings (authenticated)...', options);

    try {
      // Build query parameters
      let params = new URLSearchParams();
      params.append('order', 'createdat.desc');
      params.append('select', '*');

      // Add date range filter if specified
      if (options.dateRange) {
        params.append('date', `gte.${options.dateRange.start}`);
        params.append('date', `lte.${options.dateRange.end}`);
      }

      // Add limit if specified
      if (options.limit && options.limit > 0) {
        params.append('limit', options.limit.toString());
      }

      const endpoint = `${BOOKINGS_TABLE}?${params.toString()}`;
      const data = await authenticatedRestCall('GET', endpoint, undefined, { timeout: 5000 });

      const bookings = data?.map(transformBookingFromDB) || [];
      console.log(`✅ Found ${bookings.length} bookings (authenticated)`);

      return bookings;

    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      throw new Error('Kunde inte hämta bokningar från databasen');
    }
  },

  // Hämta bokningar för ett specifikt datum (använder legacy schema)
  getBookingsByDate: async (date: string): Promise<Booking[]> => {
    console.log('🔐 Fetching bookings by date (authenticated)...', date);

    try {
      // Konvertera datum till rätt format för jämförelse
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const params = new URLSearchParams();
      params.append('select', '*');
      params.append('startdate', `gte.${startOfDay.toISOString()}`);
      params.append('startdate', `lte.${endOfDay.toISOString()}`);
      params.append('order', 'startdate.asc');

      const endpoint = `${BOOKINGS_TABLE}?${params.toString()}`;
      const data = await authenticatedRestCall('GET', endpoint, undefined, { timeout: 5000 });

      console.log(`✅ Found ${data?.length || 0} bookings for date ${date}`);
      return data?.map(transformBookingFromDB) || [];

    } catch (error) {
      console.error('❌ Error fetching bookings by date:', error);
      throw error;
    }
  },

  // Kontrollera tillgänglighet för ett datum och tid (använder legacy schema)
  checkAvailability: async (date: string, startTime: string, endTime: string, weeks: number = 1): Promise<boolean> => {
    try {
      // Validera datum format först
      if (!date || typeof date !== 'string') {
        console.error('Invalid date provided to checkAvailability:', date);
        return false;
      }

      // Skapa start- och slutdatum för den nya bokningen
      let newBookingStartDate: Date;
      let newBookingEndDate: Date;

      if (date.includes('T')) {
        newBookingStartDate = new Date(date);
        newBookingEndDate = new Date(date);
      } else {
        newBookingStartDate = new Date(date + 'T14:00:00');
        newBookingEndDate = new Date(date + 'T14:00:00');
      }

      // Kontrollera att datum är giltigt
      if (isNaN(newBookingStartDate.getTime()) || isNaN(newBookingEndDate.getTime())) {
        console.error('Invalid date format:', date);
        return false;
      }

      // Beräkna slutdatum baserat på veckor
      const nights = weeks * 7;
      newBookingEndDate.setDate(newBookingStartDate.getDate() + nights);

      // Use public availability view for overlap check (no auth needed)
      console.log('🔓 Checking availability via public view...');

      const params = new URLSearchParams();
      params.append('select', 'startdate,enddate');

      const endpoint = `${AVAILABILITY_VIEW}?${params.toString()}`;
      const data = await publicRestCall(endpoint);

      console.log(`✅ Retrieved ${data?.length || 0} bookings for availability check`);

      // Kontrollera överlappningar med befintliga bokningar
      if (data && data.length > 0) {
        for (const existingBooking of data) {
          const existingStart = new Date(existingBooking.startdate);
          const existingEnd = new Date(existingBooking.enddate);

          const hasOverlap =
            newBookingStartDate < existingEnd &&
            newBookingEndDate > existingStart;

          if (hasOverlap) {
            console.log('Found booking conflict:', {
              existing: { start: existingStart, end: existingEnd },
              new: { start: newBookingStartDate, end: newBookingEndDate }
            });
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      throw error;
    }
  },

  // Skapa en ny bokning (requires authentication)
  createBooking: async (bookingData: CreateBookingData): Promise<Booking | null> => {
    console.log('🔐 Creating new booking (authenticated)...', bookingData);

    try {
      let endDateForCheck = bookingData.endDate;

      if (!endDateForCheck && bookingData.weeks) {
        const startDate = new Date(bookingData.date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (bookingData.weeks * 7));
        endDateForCheck = endDate.toISOString();
      }

      // TODO: Re-enable availability check once date format issues are resolved
      console.log('Skipping availability check for now - will implement later');

      const dbData = {
        ...transformBookingToDB(bookingData),
        createdat: new Date().toISOString()
      };

      const data = await authenticatedRestCall('POST', BOOKINGS_TABLE, dbData, {
        timeout: 5000,
        requireAuth: true,
      });

      if (!data || data.length === 0) {
        throw new Error('Kunde inte skapa bokningen');
      }

      console.log('✅ Created booking (authenticated):', data[0]);
      return transformBookingFromDB(data[0]);

    } catch (error: any) {
      console.error('❌ Error creating booking:', error);
      if (error.message?.includes('23505')) {
        throw new Error('En bokning finns redan för denna tid');
      }
      throw new Error('Kunde inte skapa bokningen');
    }
  },

  // Uppdatera en befintlig bokning (requires authentication + authorization via RLS)
  updateBooking: async (id: string, bookingData: UpdateBookingData): Promise<Booking | null> => {
    console.log('🔐 Updating booking (authenticated)...', id, bookingData);

    try {
      const dbData = transformBookingToDB(bookingData);

      const params = new URLSearchParams();
      params.append('id', `eq.${id}`);

      const endpoint = `${BOOKINGS_TABLE}?${params.toString()}`;
      const data = await authenticatedRestCall('PATCH', endpoint, dbData, {
        timeout: 5000,
        requireAuth: true,
      });

      console.log('✅ Updated booking (authenticated):', data);
      return data && data.length > 0 ? transformBookingFromDB(data[0]) : null;

    } catch (error) {
      console.error('❌ Error updating booking:', error);
      throw new Error('Kunde inte uppdatera bokningen');
    }
  },

  // Ta bort en bokning (requires authentication + authorization via RLS)
  deleteBooking: async (id: string): Promise<void> => {
    console.log('🔐 Deleting booking (authenticated)...', id);

    try {
      const params = new URLSearchParams();
      params.append('id', `eq.${id}`);

      const endpoint = `${BOOKINGS_TABLE}?${params.toString()}`;
      await authenticatedRestCall('DELETE', endpoint, undefined, {
        timeout: 5000,
        requireAuth: true,
      });

      console.log('✅ Deleted booking (authenticated):', id);

    } catch (error) {
      console.error('❌ Error deleting booking:', error);
      throw new Error('Kunde inte ta bort bokningen');
    }
  },

  // Hämta bokning via ID (requires authentication)
  getBookingById: async (id: string): Promise<Booking | null> => {
    console.log('🔐 Fetching booking by ID (authenticated)...', id);

    try {
      const params = new URLSearchParams();
      params.append('id', `eq.${id}`);
      params.append('select', '*');

      const endpoint = `${BOOKINGS_TABLE}?${params.toString()}`;
      const data = await authenticatedRestCall('GET', endpoint, undefined, { timeout: 5000 });

      if (!data || data.length === 0) {
        console.log('No booking found with ID:', id);
        return null;
      }

      console.log('✅ Found booking by ID (authenticated):', data[0]);
      return transformBookingFromDB(data[0]);

    } catch (error) {
      console.error('❌ Error fetching booking by ID:', error);
      throw error;
    }
  },

  // Hämta bokningar för en specifik användare (via e-post, requires authentication)
  getBookingsByEmail: async (email: string): Promise<Booking[]> => {
    console.log('🔐 Fetching bookings by email (authenticated)...', email);

    try {
      const params = new URLSearchParams();
      params.append('email', `eq.${email}`);
      params.append('select', '*');
      params.append('order', 'createdat.desc');

      const endpoint = `${BOOKINGS_TABLE}?${params.toString()}`;
      const data = await authenticatedRestCall('GET', endpoint, undefined, { timeout: 5000 });

      console.log(`✅ Found ${data?.length || 0} bookings for email ${email}`);
      return data?.map(transformBookingFromDB) || [];

    } catch (error) {
      console.error('❌ Error fetching bookings by email:', error);
      throw error;
    }
  }
};

export default bookingServiceSupabase;
