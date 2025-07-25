import { Booking } from '../types/Booking';
import { API_BASE_URL } from '../config';

// Use the same API base URL as other services
console.log('BookingService använder API URL:', API_BASE_URL);

// Cache konfiguration
const CACHE_DURATION = 30000; // 30 sekunder cache
const STALE_WHILE_REVALIDATE_DURATION = 300000; // 5 minuter stale-while-revalidate

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

class BookingCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    duration: number = CACHE_DURATION
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    // Om vi har färsk data, returnera den direkt
    if (cached && !cached.isStale && (now - cached.timestamp) < duration) {
      console.log(`Cache hit för ${key} (${now - cached.timestamp}ms sedan)`);
      return cached.data;
    }
    
    // Om vi har stale data men inte för gammal, returnera den och uppdatera i bakgrunden
    if (cached && cached.isStale && (now - cached.timestamp) < STALE_WHILE_REVALIDATE_DURATION) {
      console.log(`Stale cache hit för ${key}, uppdaterar i bakgrunden`);
      
      // Starta bakgrundsuppdatering utan att vänta
      this.backgroundRefresh(key, fetcher, duration);
      
      return cached.data;
    }
    
    // Om vi har en pågående request för samma nyckel, vänta på den
    if (this.pendingRequests.has(key)) {
      console.log(`Väntar på pågående request för ${key}`);
      return this.pendingRequests.get(key)!;
    }
    
    // Ingen cache eller för gammal data - hämta ny data
    console.log(`Cache miss för ${key}, hämtar ny data`);
    const promise = this.fetchAndCache(key, fetcher, duration);
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      
      // Om vi har stale data vid fel, returnera den istället
      if (cached && cached.data) {
        console.log(`API-fel, returnerar stale data för ${key}`);
        return cached.data;
      }
      
      throw error;
    }
  }
  
  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    duration: number
  ): Promise<void> {
    try {
      await this.fetchAndCache(key, fetcher, duration);
    } catch (error) {
      console.log(`Bakgrundsuppdatering misslyckades för ${key}:`, error);
    }
  }
  
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    duration: number
  ): Promise<T> {
    const data = await fetcher();
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      isStale: false
    });
    
    // Sätt data som stale efter cache duration
    setTimeout(() => {
      const entry = this.cache.get(key);
      if (entry && entry.timestamp === now) {
        entry.isStale = true;
      }
    }, duration);
    
    console.log(`Cachade ${key} vid ${now}`);
    return data;
  }
  
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
      console.log(`Invaliderade cache för ${key}`);
    } else {
      this.cache.clear();
      this.pendingRequests.clear();
      console.log('Invaliderade all cache');
    }
  }
  
  // Städa upp gamla cache-entries
  cleanup(): void {
    const now = Date.now();
    const maxAge = STALE_WHILE_REVALIDATE_DURATION * 2;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
        console.log(`Rensade gammal cache för ${key}`);
      }
    }
  }
}

// Global cache instance
const bookingCache = new BookingCache();

// Städa cache var 10:e minut
setInterval(() => bookingCache.cleanup(), 600000);

// Invalidera cache vid appstart för att undvika gamla data
bookingCache.invalidate();

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
  // Hämta alla bokningar med optimerad cache och robust felhantering
  getAllBookings: async (options: { 
    forceRefresh?: boolean; 
    dateRange?: { start: string; end: string };
    limit?: number;
  } = {}): Promise<Booking[]> => {
    const { forceRefresh = false, dateRange, limit } = options;
    
    // Skapa cache-nyckel baserat på filter
    let cacheKey = 'all-bookings';
    if (dateRange) {
      cacheKey += `-${dateRange.start}-${dateRange.end}`;
    }
    if (limit) {
      cacheKey += `-limit-${limit}`;
    }
    
    // Om force refresh, invalidera cache först
    if (forceRefresh) {
      bookingCache.invalidate(cacheKey);
    }
    
    const fetcher = async (): Promise<Booking[]> => {
      try {
        // Bygg URL med query parameters
        let url = `${API_BASE_URL}/bookings`;
        const params = new URLSearchParams();
        
        if (dateRange) {
          params.append('startDate', dateRange.start);
          params.append('endDate', dateRange.end);
        }
        if (limit) {
          params.append('limit', limit.toString());
        }
        
        if (params.toString()) {
          url += '?' + params.toString();
        }
        
        console.log('Hämtar bokningar från:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-vercel-protection-bypass': 'true'
          },
          mode: 'cors',
          credentials: process.env.NODE_ENV === 'development' ? 'include' : 'include'
        });

        console.log('Bokningsrespons status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', response.status, errorText);
          
          if (response.status === 401) {
            console.error('Unauthorized - detta kan vara normalt för nya sessions');
          }
          
          // Returnera tom array för att undvika krasch av appen
          console.warn('Returnerar tom array på grund av API-fel');
          return [];
        }

        const data = await response.json();
        console.log(`Hämtade ${data.length} bokningar från API`);
        
        // Optimerad datumbehandling - görs en gång här istället för i varje komponent
        const processedBookings = data.map((booking: any) => {
          const startDate = booking.startDate || booking.startdate;
          const endDate = booking.endDate || booking.enddate;
          
          return {
            ...booking,
            startDate: startDate ? new Date(startDate).toISOString() : null,
            endDate: endDate ? new Date(endDate).toISOString() : null,
            parking: Boolean(booking.parking || booking.parkering)
          };
        });
        
        return processedBookings;
      } catch (error) {
        console.error('Fel vid hämtning av bokningar:', error);
        // Returnera tom array istället för att kasta fel
        return [];
      }
    };
    
    return bookingCache.get(cacheKey, fetcher);
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
      
      // Invalidera alla booking caches eftersom en ny bokning skapades
      bookingCache.invalidate();
      
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
      
      // Invalidera alla booking caches eftersom en bokning uppdaterades
      bookingCache.invalidate();
      
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
      
      // Invalidera alla booking caches eftersom en bokning raderades
      bookingCache.invalidate();
      
      return true;
    } catch (error) {
      console.error('Fel vid radering av bokning:', error);
      return false;
    }
  },

  // Helper-metoder för cache-hantering
  invalidateCache: (key?: string) => {
    bookingCache.invalidate(key);
  },

  // Hämta bokningar för en specifik månad (optimerat för kalendervisning)
  getBookingsForMonth: async (year: number, month: number): Promise<Booking[]> => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    return bookingService.getAllBookings({
      dateRange: { start: startDate, end: endDate }
    });
  },

  // Hämta kommande bokningar (optimerat för dashboard)
  getUpcomingBookings: async (limit: number = 5): Promise<Booking[]> => {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const endDate = futureDate.toISOString().split('T')[0];
    
    return bookingService.getAllBookings({
      dateRange: { start: today, end: endDate },
      limit
    });
  }
};

export default bookingService; 