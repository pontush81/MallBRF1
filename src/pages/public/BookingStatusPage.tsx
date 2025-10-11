import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { StandardLoading } from '../../components/common/StandardLoading';
import { format, differenceInDays, getISOWeek, isValid } from 'date-fns';
import { sv } from 'date-fns/locale';

// Robust week number calculation that works consistently across platforms
const getWeekNumber = (date: Date | string | any): number => {
  try {
    // Handle various date input types
    let validDate: Date;
    
    if (date instanceof Date) {
      validDate = date;
    } else if (typeof date === 'string') {
      validDate = new Date(date);
    } else if (date && typeof date === 'object' && date.getTime) {
      // Handle date-like objects that might come from date pickers
      validDate = new Date(date.getTime());
    } else {
      console.warn('🔄 Unexpected date type for week calculation:', typeof date, date);
      return 0;
    }
    
    // Validate the date
    if (isNaN(validDate.getTime())) {
      console.warn('⚠️ Invalid date for week calculation:', date);
      return 0;
    }
    
    // Use date-fns getISOWeek for reliable calculation
    const weekNumber = getISOWeek(validDate);
    
    // Extra validation - ensure we got a valid number
    if (typeof weekNumber !== 'number' || isNaN(weekNumber)) {
      console.error('🚨 getISOWeek returned NaN for date:', validDate.toISOString());
      // Fallback: manual week calculation
      const startOfYear = new Date(validDate.getFullYear(), 0, 1);
      const daysSinceStart = Math.floor((validDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const fallbackWeek = Math.ceil((daysSinceStart + startOfYear.getDay()) / 7);
      console.log('🔄 Using fallback week calculation:', fallbackWeek);
      return Math.max(1, Math.min(53, fallbackWeek));
    }
    
    // Sanity check - ISO week should be between 1-53
    if (weekNumber < 1 || weekNumber > 53) {
      console.warn('🚨 Suspicious week number:', weekNumber, 'for date:', validDate.toISOString());
      // Fallback calculation if needed
      return Math.max(1, Math.min(53, weekNumber));
    }
    
    return weekNumber;
  } catch (error) {
    console.error('❌ Error in getWeekNumber:', error, 'for input:', date);
    return 0;
  }
};
import { Booking } from '../../types/Booking';
import bookingServiceSupabase from '../../services/bookingServiceSupabase';
import BookingStatus from '../../components/booking/BookingStatus';
import { useAuth } from '../../context/AuthContextNew';

const BookingStatusPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const fetchedBookings = await bookingServiceSupabase.getAllBookings();
      console.log('Fetched bookings from API:', fetchedBookings);
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
    const week = isValid(startDate) ? getISOWeek(startDate) : 0;
    
    const nights = calculateNights(booking);
    let pricePerNight = 400; // Default low season price
    
    if (week >= 24 && week <= 32) {
      if ([28, 29].includes(week)) {
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
        <StandardLoading message="Loading booking status..." />
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
  console.log('Grouped bookings by month:', groupedBookings);
  
  const sortedMonthKeys = Object.keys(groupedBookings).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return yearB - yearA || monthB - monthA;
  });
  console.log('Sorted month keys:', sortedMonthKeys);

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
            
            // Sort monthly bookings by arrival date in chronological order
            const sortedMonthBookings = [...monthBookings].sort((a, b) => {
              const dateA = new Date(a.startDate || '');
              const dateB = new Date(b.startDate || '');
              console.log(`Sorting bookings: ${a.name} (${a.startDate}, ${dateA}) vs ${b.name} (${b.startDate}, ${dateB})`);
              return dateA.getTime() - dateB.getTime();
            });
            
            console.log('Sorted month bookings for', monthName, year, ':', sortedMonthBookings);
            
            // Create guestData directly from sortedMonthBookings to maintain sort order
            const guestData = sortedMonthBookings.map(booking => {
              // Use standardized date format for consistency
              const startDateStr = booking.startDate || booking.startdate || '';
              const endDateStr = booking.endDate || booking.enddate || '';
              
              // Log for debugging
              console.log(`Creating GuestData for ${booking.name}:`, {
                original: { 
                  startDate: booking.startDate, 
                  startdate: booking.startdate,
                  endDate: booking.endDate,
                  enddate: booking.enddate
                },
                using: { startDateStr, endDateStr }
              });
              
              const startDate = new Date(startDateStr);
              console.log('🔍 Debug week calculation for', booking.name, ':', {
                startDateStr,
                startDate,
                isValidDate: !isNaN(startDate.getTime()),
                startDateISO: startDate.toISOString()
              });
              
              // Use our robust getWeekNumber function for consistent results
              const week = isValid(startDate) ? getWeekNumber(startDate) : 0;
              
              console.log('📅 Week result:', week, 'for date:', startDateStr);
              
              return {
                id: booking.id,
                name: booking.name,
                arrival: startDateStr ? format(new Date(startDateStr), 'E d MMM', { locale: sv }) : 'N/A',
                departure: endDateStr ? format(new Date(endDateStr), 'E d MMM', { locale: sv }) : 'N/A',
                week: `v.${week}`,
                notes: booking.notes,
                parking: booking.parking,
                startDateRaw: startDateStr,
                endDateRaw: endDateStr
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
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
              />
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default BookingStatusPage; 