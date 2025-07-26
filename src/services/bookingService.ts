import { Booking } from '../types/Booking';
import bookingServiceSupabase from './bookingServiceSupabase';

// Use Supabase instead of Express API
console.log('BookingService använder Supabase direkt (inga API-anrop)');

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
  
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > CACHE_DURATION;
  }
  
  private isStale(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > STALE_WHILE_REVALIDATE_DURATION;
  }
  
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.cache.get(key);
    
    // If we have fresh data, return it
    if (existing && !this.isExpired(existing)) {
      return existing.data;
    }
    
    // If we have stale data but not too old, return stale data and refresh in background
    if (existing && !this.isStale(existing)) {
      // Start background refresh if not already pending
      if (!this.pendingRequests.has(key)) {
        const refreshPromise = this.refreshInBackground(key, fetcher);
        this.pendingRequests.set(key, refreshPromise);
      }
      return existing.data;
    }
    
    // If we have a pending request, wait for it
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      return await pendingRequest;
    }
    
    // No cache or very stale - fetch fresh data
    const fetchPromise = this.fetchAndCache(key, fetcher);
    this.pendingRequests.set(key, fetchPromise);
    
    try {
      return await fetchPromise;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
  
  private async refreshInBackground<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        isStale: false
      });
      return data;
    } catch (error) {
      console.warn(`Background refresh failed for ${key}:`, error);
      // Return stale data if refresh fails
      const existing = this.cache.get(key);
      if (existing) {
        return existing.data;
      }
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
  
  private async fetchAndCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    });
    return data;
  }
  
  invalidate(keyPattern?: string): void {
    if (keyPattern) {
      // Invalidate keys matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
    this.pendingRequests.clear();
  }
  
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

const cache = new BookingCache();

// Cache keys
const CACHE_KEYS = {
  ALL_BOOKINGS: 'all_bookings',
  BOOKINGS_BY_DATE: (date: string) => `bookings_by_date_${date}`,
  BOOKING_BY_ID: (id: string) => `booking_${id}`
};

const bookingService = {
  // Hämta alla bokningar
  async getAllBookings(): Promise<Booking[]> {
    return cache.get(CACHE_KEYS.ALL_BOOKINGS, async () => {
      console.log('🔄 Hämtar alla bokningar från Supabase...');
      return await bookingServiceSupabase.getAllBookings();
    });
  },

  // Hämta bokningar för ett specifikt datum
  async getBookingsByDate(date: string): Promise<Booking[]> {
    return cache.get(CACHE_KEYS.BOOKINGS_BY_DATE(date), async () => {
      console.log(`🔄 Hämtar bokningar för datum ${date} från Supabase...`);
      return await bookingServiceSupabase.getBookingsByDate(date);
    });
  },

  // Kolla tillgänglighet för datum
  async checkAvailability(date: string, startTime: string, endTime: string): Promise<boolean> {
    // Don't cache availability checks - they should be real-time
    console.log(`🔄 Kollar tillgänglighet för ${date} ${startTime}-${endTime}...`);
    return await bookingServiceSupabase.checkAvailability(date, startTime, endTime);
  },

  // Skapa ny bokning
  async createBooking(bookingData: any): Promise<Booking> {
    console.log('🔄 Skapar ny bokning i Supabase...');
    const booking = await bookingServiceSupabase.createBooking(bookingData);
    
    // Invalidate relevant cache entries
    cache.invalidate('bookings');
    
    return booking;
  },

  // Uppdatera bokning
  async updateBooking(id: string, bookingData: any): Promise<Booking> {
    console.log(`🔄 Uppdaterar bokning ${id} i Supabase...`);
    const booking = await bookingServiceSupabase.updateBooking(id, bookingData);
    
    // Invalidate relevant cache entries
    cache.invalidate('bookings');
    cache.invalidate(`booking_${id}`);
    
    return booking;
  },

  // Radera bokning
  async deleteBooking(id: string): Promise<void> {
    console.log(`🔄 Raderar bokning ${id} från Supabase...`);
    await bookingServiceSupabase.deleteBooking(id);
    
    // Invalidate relevant cache entries
    cache.invalidate('bookings');
    cache.invalidate(`booking_${id}`);
  },

  // Hämta bokning med ID
  async getBookingById(id: string): Promise<Booking | null> {
    return cache.get(CACHE_KEYS.BOOKING_BY_ID(id), async () => {
      console.log(`🔄 Hämtar bokning ${id} från Supabase...`);
      return await bookingServiceSupabase.getBookingById(id);
    });
  },

  // Hämta bokningar med email
  async getBookingsByEmail(email: string): Promise<Booking[]> {
    // Don't cache email lookups for privacy/security
    console.log(`🔄 Hämtar bokningar för email ${email} från Supabase...`);
    return await bookingServiceSupabase.getBookingsByEmail(email);
  },

  // Cache management
  clearCache(): void {
    console.log('🧹 Rensar booking cache...');
    cache.clear();
  },

  invalidateCache(pattern?: string): void {
    console.log(`🧹 Invaliderar booking cache${pattern ? ` (${pattern})` : ''}...`);
    cache.invalidate(pattern);
  },

  // Helper methods för kompatibilitet
  async getUpcomingBookings(limit = 10): Promise<Booking[]> {
    const allBookings = await this.getAllBookings();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allBookings
      .filter(booking => {
        const startDate = new Date(booking.startDate || booking.startdate || '');
        return startDate >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.startDate || a.startdate || '');
        const dateB = new Date(b.startDate || b.startdate || '');
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);
  },

  async getRecentBookings(limit = 10): Promise<Booking[]> {
    const allBookings = await this.getAllBookings();
    
    return allBookings
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.createdat || '');
        const dateB = new Date(b.createdAt || b.createdat || '');
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  },

  async getFutureBookings(limit = 100): Promise<Booking[]> {
    return this.getAllBookings();
  }
};

export default bookingService; 