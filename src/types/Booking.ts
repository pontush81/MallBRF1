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
  status: 'confirmed';
  notes?: string;
  phone?: string;
} 