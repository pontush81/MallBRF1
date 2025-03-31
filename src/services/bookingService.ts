import { Booking } from '../types/Booking';
import { API_BASE_URL } from '../config';

// Use the same API base URL as other services
console.log('BookingService använder API URL:', API_BASE_URL);

// Interface för tillgänglighetskontroll
interface AvailabilityResponse {
  available: boolean;
  overlappingBookings?: Booking[];
}

// Interface för att skapa en bokning
interface CreateBookingData {
  name: string;
  email: string;
  startDate: string;
  endDate: string;
  notes?: string;
  phone?: string;
  parking?: boolean;
}

// Interface för att uppdatera en bokning
interface UpdateBookingData {
  name?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  phone?: string;
  parking?: boolean;
}

// Service för att hantera bokningar
const bookingService = {
  // Hämta alla bokningar
  getAllBookings: async (): Promise<Booking[]> => {
    try {
      console.log('Försöker hämta alla bokningar från:', `${API_BASE_URL}/bookings`);
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: process.env.NODE_ENV === 'development' ? 'omit' : 'include'
      });
      console.log('Bokningsrespons status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(`Kunde inte hämta bokningar: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Hämtade bokningar:', data);
      return data;
    } catch (error) {
      console.error('Fel vid hämtning av bokningar:', error);
      return [];
    }
  },

  // Hämta en specifik bokning med ID
  getBookingById: async (id: string): Promise<Booking | null> => {
    try {
      console.log('Hämtar bokning med ID:', id);
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'include'
      });
      console.log('Bokningsrespons status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Bokning hittades inte (404)');
          return null;
        }
        throw new Error(`Kunde inte hämta bokningen: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Hittad bokning:', data);
      return data;
    } catch (error) {
      console.error('Fel vid hämtning av bokning:', error);
      return null;
    }
  },

  // Kontrollera tillgänglighet för datum
  checkAvailability: async (startDate: string, endDate: string): Promise<AvailabilityResponse> => {
    try {
      console.log('Kontrollerar tillgänglighet för:', startDate, 'till', endDate);
      const response = await fetch(`${API_BASE_URL}/bookings/check-availability`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        body: JSON.stringify({ startDate, endDate }),
        mode: 'cors',
        credentials: 'include'
      });
      console.log('Tillgänglighetsrespons status:', response.status);

      if (!response.ok) {
        throw new Error(`Kunde inte kontrollera tillgänglighet: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Tillgänglighetsresultat:', data);
      return data;
    } catch (error) {
      console.error('Fel vid kontroll av tillgänglighet:', error);
      throw error;
    }
  },

  // Skapa en ny bokning
  createBooking: async (bookingData: CreateBookingData): Promise<Booking | null> => {
    try {
      console.log('Skapar ny bokning:', bookingData);
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        body: JSON.stringify(bookingData),
        mode: 'cors',
        credentials: 'include'
      });
      console.log('Skapa bokning respons status:', response.status);

      if (!response.ok) {
        // Om det är en konflikt (datum inte tillgängliga)
        if (response.status === 409) {
          const errorData = await response.json();
          console.log('Konflikt vid bokning:', errorData);
          throw new Error(errorData.error);
        }
        throw new Error(`Kunde inte skapa bokningen: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Skapad bokning:', data);
      return data;
    } catch (error) {
      console.error('Fel vid skapande av bokning:', error);
      throw error;
    }
  },

  // Uppdatera en befintlig bokning
  updateBooking: async (id: string, bookingData: UpdateBookingData): Promise<Booking | null> => {
    try {
      console.log('Uppdaterar bokning:', id);
      
      // The server expects startDate, endDate, parking and then maps them to database fields
      const serverBookingData = {
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone || "",
        notes: bookingData.notes || "",
        startDate: bookingData.startDate, // Server expects startDate (camelCase)
        endDate: bookingData.endDate,     // Server expects endDate (camelCase)
        parking: bookingData.parking,     // Server expects parking (camelCase)
        status: bookingData.status || "pending"
      };
      
      console.log('Sending booking data:', JSON.stringify(serverBookingData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        body: JSON.stringify(serverBookingData),
        mode: 'cors',
        credentials: 'include'
      });
      
      console.log('Update booking response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Booking not found (404)');
          return null;
        }
        
        // Try to extract error message from response
        try {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          
          try {
            // Try to parse as JSON
            const errorJson = JSON.parse(errorText);
            if (errorJson && errorJson.error) {
              throw new Error(`Kunde inte uppdatera bokningen: ${errorJson.error}`);
            }
          } catch (parseError) {
            // Not valid JSON, use as is
          }
          
          if (response.status === 409) {
            throw new Error('Det finns redan bokningar för detta datum');
          }
          
          if (response.status === 500) {
            throw new Error('Servern kunde inte uppdatera bokningen.');
          }
          
          throw new Error(`Kunde inte uppdatera bokningen: ${errorText || response.statusText}`);
        } catch (e) {
          if (e instanceof Error) {
            throw e; // Re-throw our custom error
          }
          throw new Error(`Kunde inte uppdatera bokningen: ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Updated booking response:', data);
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  // Radera en bokning
  deleteBooking: async (id: string): Promise<boolean> => {
    try {
      console.log('Raderar bokning:', id);
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'include'
      });
      console.log('Radera bokning respons status:', response.status);

      if (!response.ok) {
        throw new Error(`Kunde inte radera bokningen: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raderingsresultat:', data);
      return true;
    } catch (error) {
      console.error('Fel vid radering av bokning:', error);
      return false;
    }
  },
};

export default bookingService; 