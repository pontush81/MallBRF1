import bookingService from '../../services/bookingService';
import { Booking } from '../../types/Booking';

// Mock the fetch API
global.fetch = jest.fn();

describe('bookingService', () => {
  const mockBooking: Booking = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    startDate: '2024-03-25',
    endDate: '2024-03-27',
    status: 'confirmed',
    phone: '1234567890',
    notes: 'Test booking'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBookings', () => {
    it('fetches all bookings successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([mockBooking])
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await bookingService.getAllBookings();

      expect(result).toEqual([mockBooking]);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/bookings'));
    });

    it('handles errors when fetching bookings', async () => {
      const mockError = new Error('Failed to fetch bookings');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      await expect(bookingService.getAllBookings()).rejects.toThrow(mockError);
    });
  });

  describe('createBooking', () => {
    it('creates a booking successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockBooking)
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await bookingService.createBooking({
        name: mockBooking.name,
        email: mockBooking.email,
        startDate: mockBooking.startDate!,
        endDate: mockBooking.endDate!,
        notes: mockBooking.notes,
        phone: mockBooking.phone
      });

      expect(result).toEqual(mockBooking);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bookings'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('handles errors when creating a booking', async () => {
      const mockError = new Error('Failed to create booking');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      await expect(
        bookingService.createBooking({
          name: mockBooking.name,
          email: mockBooking.email,
          startDate: mockBooking.startDate!,
          endDate: mockBooking.endDate!,
          notes: mockBooking.notes,
          phone: mockBooking.phone
        })
      ).rejects.toThrow(mockError);
    });
  });

  describe('checkAvailability', () => {
    it('checks availability successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ available: true, overlappingBookings: [] })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await bookingService.checkAvailability('2024-03-25', '2024-03-27');

      expect(result).toEqual({ available: true, overlappingBookings: [] });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bookings/check-availability'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('handles errors when checking availability', async () => {
      const mockError = new Error('Failed to check availability');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      await expect(
        bookingService.checkAvailability('2024-03-25', '2024-03-27')
      ).rejects.toThrow(mockError);
    });
  });

  describe('updateBooking', () => {
    it('updates a booking successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockBooking)
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await bookingService.updateBooking('1', {
        status: 'confirmed' as const
      });

      expect(result).toEqual(mockBooking);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bookings/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('handles errors when updating a booking', async () => {
      const mockError = new Error('Failed to update booking');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      await expect(
        bookingService.updateBooking('1', {
          status: 'confirmed' as const
        })
      ).rejects.toThrow(mockError);
    });
  });

  describe('deleteBooking', () => {
    it('deletes a booking successfully', async () => {
      const mockResponse = {
        ok: true
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await bookingService.deleteBooking('1');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bookings/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('handles errors when deleting a booking', async () => {
      const mockError = new Error('Failed to delete booking');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      const result = await bookingService.deleteBooking('1');

      expect(result).toBe(false);
    });
  });
}); 