import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { format, differenceInDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Booking } from '../../types/Booking';
import bookingService from '../../services/bookingService';
import BookingStatus from '../../components/booking/BookingStatus';

const BookingStatusPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const fetchedBookings = await bookingService.getAllBookings();
      setBookings(fetchedBookings);
    } catch (err) {
      setError('Kunde inte hämta bokningar');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupBookingsByMonth = (bookings: Booking[]) => {
    return bookings.reduce((acc: Record<string, Booking[]>, booking) => {
      if (!booking.startDate) return acc;
      
      const date = new Date(booking.startDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      
      acc[monthKey].push(booking);
      return acc;
    }, {});
  };

  const calculateNights = (booking: Booking): number => {
    if (!booking.startDate || !booking.endDate) return 0;
    
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0;
    }
    
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotalNights = (bookings: Booking[]): number => {
    return bookings.reduce((total, booking) => total + calculateNights(booking), 0);
  };

  const calculateRevenueForBooking = (booking: Booking): number => {
    if (!booking.startDate || !booking.endDate) return 0;
    
    const startDate = new Date(booking.startDate);
    const firstDayOfYear = new Date(startDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (startDate.getTime() - firstDayOfYear.getTime()) / 86400000;
    const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    const nights = calculateNights(booking);
    let pricePerNight = 400; // Default low season price
    
    if (week >= 24 && week <= 32) {
      if ([27, 28, 29].includes(week)) {
        pricePerNight = 800; // Tennis weeks
      } else {
        pricePerNight = 600; // High season
      }
    }
    
    return nights * pricePerNight;
  };

  const calculateRevenueForMonth = (bookings: Booking[]): number => {
    return bookings.reduce((total, booking) => total + calculateRevenueForBooking(booking), 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const groupedBookings = groupBookingsByMonth(bookings);
  const sortedMonthKeys = Object.keys(groupedBookings).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return yearB - yearA || monthB - monthA;
  });

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: { xs: 2, sm: 4 }, 
        mb: 4,
        px: { xs: 2, sm: 3 }
      }}
    >
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          mb: 3,
          color: 'primary.main'
        }}
      >
        Bokningsstatus
      </Typography>

      {bookings.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 2,
            backgroundColor: 'info.lighter',
            border: '1px solid',
            borderColor: 'info.light'
          }}
        >
          Inga bokningar hittades
        </Alert>
      ) : (
        <Box>
          {sortedMonthKeys.map(monthKey => {
            const [year, month] = monthKey.split('-');
            const monthBookings = groupedBookings[monthKey];
            const monthName = format(new Date(Number(year), Number(month) - 1), 'LLLL', { locale: sv });
            
            const guestData = monthBookings.map(booking => {
              const startDate = new Date(booking.startDate || '');
              const week = Math.ceil((startDate.getTime() - new Date(startDate.getFullYear(), 0, 1).getTime()) / 86400000 / 7);
              
              return {
                name: booking.name,
                arrival: booking.startDate ? format(new Date(booking.startDate), 'E d MMM', { locale: sv }) : 'N/A',
                departure: booking.endDate ? format(new Date(booking.endDate), 'E d MMM', { locale: sv }) : 'N/A',
                week: week.toString(),
                notes: booking.notes,
                parking: booking.parking
              };
            });

            const totalNights = calculateTotalNights(monthBookings);
            const totalRevenue = calculateRevenueForMonth(monthBookings);
            
            const parkingRevenue = monthBookings.reduce((sum, booking) => {
              if (!booking.parking) return sum;
              const start = new Date(booking.startDate || '');
              const end = new Date(booking.endDate || '');
              const nights = differenceInDays(end, start);
              return sum + (nights * 75);
            }, 0);

            return (
              <BookingStatus
                key={monthKey}
                month={monthName}
                year={year}
                bookings={monthBookings.length}
                nights={totalNights}
                revenue={totalRevenue}
                parkingRevenue={parkingRevenue}
                guestData={guestData}
              />
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default BookingStatusPage; 