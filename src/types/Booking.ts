export interface Booking {
  id: string;
  name: string;
  email: string;
  startDate: string;  // ISO-format datum
  endDate: string;    // ISO-format datum
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
} 