export interface Booking {
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

// Interface for guest booking data
export interface GuestData {
  name: string;
  arrival: string;
  departure: string;
  week: string;
  notes?: string;
  parking?: boolean;
  id?: string; // ID to identify the booking for editing/deletion
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