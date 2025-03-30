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
        credentials: 'include'
      });
      console.log('Bokningsrespons status:', response.status);

      if (!response.ok) {
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
      console.log('Uppdaterar bokning:', id, bookingData);
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        body: JSON.stringify(bookingData),
        mode: 'cors',
        credentials: 'include'
      });
      console.log('Uppdatera bokning respons status:', response.status);

      if (!response.ok) {
        // Om det är en konflikt (datum inte tillgängliga)
        if (response.status === 409) {
          const errorData = await response.json();
          console.log('Konflikt vid uppdatering:', errorData);
          throw new Error(errorData.error);
        }
        
        if (response.status === 404) {
          console.log('Bokning hittades inte vid uppdatering (404)');
          return null;
        }
        throw new Error(`Kunde inte uppdatera bokningen: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Uppdaterad bokning:', data);
      return data;
    } catch (error) {
      console.error('Fel vid uppdatering av bokning:', error);
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