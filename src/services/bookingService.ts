import { Booking } from '../types/Booking';
import { API_BASE_URL } from '../config';
import { BaseService } from './baseService';

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

class BookingService extends BaseService {
  constructor() {
    super('/api/bookings');
    console.log('BookingService använder API URL:', API_BASE_URL);
  }

  // Hämta alla bokningar
  async getAllBookings(): Promise<Booking[]> {
    try {
      console.log('Försöker hämta alla bokningar');
      const bookings = await this.get<Booking[]>();
      console.log('Hämtade bokningar:', bookings);
      return bookings;
    } catch (error) {
      console.error('Fel vid hämtning av bokningar:', error);
      return [];
    }
  }

  // Hämta en specifik bokning med ID
  async getBookingById(id: string): Promise<Booking | null> {
    try {
      console.log('Hämtar bokning med ID:', id);
      const booking = await this.get<Booking>(`/${id}`);
      console.log('Hittad bokning:', booking);
      return booking;
    } catch (error) {
      console.error('Fel vid hämtning av bokning:', error);
      return null;
    }
  }

  // Kontrollera tillgänglighet för datum
  async checkAvailability(startDate: string, endDate: string): Promise<AvailabilityResponse> {
    try {
      console.log('Kontrollerar tillgänglighet för:', startDate, 'till', endDate);
      const result = await this.post<AvailabilityResponse>('/check-availability', { startDate, endDate });
      console.log('Tillgänglighetsresultat:', result);
      return result;
    } catch (error) {
      console.error('Fel vid kontroll av tillgänglighet:', error);
      throw error;
    }
  }

  // Skapa en ny bokning
  async createBooking(bookingData: CreateBookingData): Promise<Booking | null> {
    try {
      console.log('Skapar ny bokning:', bookingData);
      const booking = await this.post<Booking>('', bookingData);
      console.log('Skapad bokning:', booking);
      return booking;
    } catch (error) {
      console.error('Fel vid skapande av bokning:', error);
      throw error;
    }
  }

  // Uppdatera en befintlig bokning
  async updateBooking(id: string, bookingData: UpdateBookingData): Promise<Booking | null> {
    try {
      console.log('Uppdaterar bokning:', id, bookingData);
      const booking = await this.put<Booking>(`/${id}`, bookingData);
      console.log('Uppdaterad bokning:', booking);
      return booking;
    } catch (error) {
      console.error('Fel vid uppdatering av bokning:', error);
      throw error;
    }
  }

  // Ta bort en bokning
  async deleteBooking(id: string): Promise<boolean> {
    try {
      console.log('Tar bort bokning:', id);
      await this.delete(`/${id}`);
      console.log('Bokning borttagen');
      return true;
    } catch (error) {
      console.error('Fel vid borttagning av bokning:', error);
      return false;
    }
  }
}

// Skapa en instans av BookingService
const bookingServiceInstance = new BookingService();

// Exportera som både en named export (för bakåtkompatibilitet) och som default export
export const bookingService = bookingServiceInstance;
export default bookingServiceInstance; 