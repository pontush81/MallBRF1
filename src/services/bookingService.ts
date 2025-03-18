import { Booking } from '../types/Booking';

// API URL
const API_URL = 'http://localhost:3001/api';

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
}

// Interface för att uppdatera en bokning
interface UpdateBookingData {
  name?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}

// Service för att hantera bokningar
const bookingService = {
  // Hämta alla bokningar
  getAllBookings: async (): Promise<Booking[]> => {
    try {
      const response = await fetch(`${API_URL}/bookings`);
      if (!response.ok) {
        throw new Error('Kunde inte hämta bokningar');
      }
      return await response.json();
    } catch (error) {
      console.error('Fel vid hämtning av bokningar:', error);
      return [];
    }
  },

  // Hämta en specifik bokning med ID
  getBookingById: async (id: string): Promise<Booking | null> => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Kunde inte hämta bokningen');
      }
      return await response.json();
    } catch (error) {
      console.error('Fel vid hämtning av bokning:', error);
      return null;
    }
  },

  // Kontrollera tillgänglighet för datum
  checkAvailability: async (startDate: string, endDate: string): Promise<AvailabilityResponse> => {
    try {
      const response = await fetch(`${API_URL}/bookings/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!response.ok) {
        throw new Error('Kunde inte kontrollera tillgänglighet');
      }

      return await response.json();
    } catch (error) {
      console.error('Fel vid kontroll av tillgänglighet:', error);
      throw error;
    }
  },

  // Skapa en ny bokning
  createBooking: async (bookingData: CreateBookingData): Promise<Booking | null> => {
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        // Om det är en konflikt (datum inte tillgängliga)
        if (response.status === 409) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }
        throw new Error('Kunde inte skapa bokningen');
      }

      return await response.json();
    } catch (error) {
      console.error('Fel vid skapande av bokning:', error);
      throw error;
    }
  },

  // Uppdatera en befintlig bokning
  updateBooking: async (id: string, bookingData: UpdateBookingData): Promise<Booking | null> => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        // Om det är en konflikt (datum inte tillgängliga)
        if (response.status === 409) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }
        
        if (response.status === 404) {
          return null;
        }
        throw new Error('Kunde inte uppdatera bokningen');
      }

      return await response.json();
    } catch (error) {
      console.error('Fel vid uppdatering av bokning:', error);
      throw error;
    }
  },

  // Radera en bokning
  deleteBooking: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kunde inte radera bokningen');
      }

      return true;
    } catch (error) {
      console.error('Fel vid radering av bokning:', error);
      return false;
    }
  },
};

export default bookingService; 