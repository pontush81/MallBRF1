export interface Booking {
  id: string;
  type?: 'laundry' | 'common-room' | 'other';
  
  // New format fields (Supabase)
  date?: string;
  startTime?: string;
  endTime?: string;
  weeks?: number;
  apartment?: string;
  floor?: string;
  
  // Legacy format fields (för bakåtkompatibilitet)
  startDate?: string;  // ISO-format datum (kamelnotation)
  endDate?: string;    // ISO-format datum (kamelnotation) 
  startdate?: string;  // ISO-format datum (från databas)
  enddate?: string;    // ISO-format datum (från databas)
  
  // Common fields
  name: string;
  email: string;
  phone?: string;
  message?: string;
  notes?: string;
  parkingSpace?: string;
  parking?: boolean;   // Legacy parking field
  status: 'pending' | 'confirmed' | 'cancelled';
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  createdat?: string;  // Database format
  updatedat?: string;  // Database format
}

// Legacy booking interface (håll för bakåtkompatibilitet)
export interface LegacyBooking {
  id: string;
  name: string;
  email: string;
  startDate?: string;  // ISO-format datum (kamelnotation)
  endDate?: string;    // ISO-format datum (kamelnotation)
  startdate?: string;  // ISO-format datum (från databas)
  enddate?: string;    // ISO-format datum (från databas)
  createdAt?: string;
  createdat?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  phone?: string;
  parking?: boolean;   // Om parkering har bokats
}

// Interface for creating new bookings
export interface CreateBookingData {
  type: 'laundry' | 'common-room' | 'other';
  date: string;
  startTime: string;
  endTime: string;
  weeks?: number;
  apartment: string;
  floor: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  parkingSpace?: string;
  endDate?: string; // Lägg till för korrekt datumhantering
}

// Interface for updating bookings
export interface UpdateBookingData {
  type?: 'laundry' | 'common-room' | 'other';
  date?: string;
  startTime?: string;
  endTime?: string;
  weeks?: number;
  apartment?: string;
  floor?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  parkingSpace?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

// Interface for guest booking data
export interface GuestData {
  name: string;
  arrival: string;
  departure: string;
  week: string;
  notes?: string;
  parking?: boolean;
  id?: string; // ID to identify the booking for editing/deletion
  startDateRaw?: string; // Raw ISO date for sorting
  endDateRaw?: string;   // Raw ISO date for sorting
}

// Interface for booking summary
export interface BookingSummary {
  month: string;
  year: string;
  bookings: number;
  nights: number;
  revenue: number;
  parkingRevenue: number;
  guestData: GuestData[];
} 