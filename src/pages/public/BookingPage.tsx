import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Alert, 
  Divider,

  Tooltip,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Stack,
  Menu,
  MenuItem,
  Select,

} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Person, 
  Email, 
  Check, 
   
  Description as DescriptionIcon,

  AdminPanelSettings as AdminPanelSettingsIcon,
  Backup as BackupIcon 
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as dateFns from 'date-fns';
import { sv } from 'date-fns/locale';
import bookingServiceSupabase from '../../services/bookingServiceSupabase';
import { SessionExpiredError } from '../../services/supabaseClient';
import BookingSkeleton from '../../components/common/BookingSkeleton';
import pageServiceSupabase from '../../services/pageServiceSupabase';
import { useAuth } from '../../context/AuthContextNew';
// toast removed - using Dialog for confirmation instead
import BookingStatus from '../../components/booking/BookingStatus';
import { Booking } from '../../types/Booking';
import { bastadTheme } from '../../theme/bastadTheme';
import { adminUtils } from '../../utils/adminUtils';
import { MinimalLoading, ButtonLoading } from '../../components/common/StandardLoading';
import { calculateTotalRevenue, calculateBookingPrice, PRICING } from '../../utils/bookingPricing';

// Modern styled components for booking page
// ModernHeroSection removed - not currently used

const ModernCard = styled(Paper)(({ theme }) => ({
  borderRadius: bastadTheme.borderRadius.xl,
  background: bastadTheme.colors.white,
  border: `1px solid ${bastadTheme.colors.sand[200]}`,
  boxShadow: bastadTheme.shadows.md,
  padding: bastadTheme.spacing[4], // Reduced from spacing[6] to spacing[4] (32px)
  transition: bastadTheme.transitions.normal,
  '&:hover': {
    boxShadow: bastadTheme.shadows.lg,
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: bastadTheme.borderRadius.lg,
  textTransform: 'none',
  fontWeight: bastadTheme.typography.fontWeight.semibold,
  padding: `${bastadTheme.spacing[3]} ${bastadTheme.spacing[6]}`,
  boxShadow: bastadTheme.shadows.sm,
  transition: bastadTheme.transitions.normal,
  '&:hover': {
    boxShadow: bastadTheme.shadows.md,
    transform: 'translateY(-1px)',
  },
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: bastadTheme.borderRadius.lg,
    backgroundColor: bastadTheme.colors.white,
    transition: bastadTheme.transitions.normal,
    minHeight: { xs: '56px', sm: '48px' }, // Better touch targets on mobile
    '&:hover': {
      boxShadow: bastadTheme.shadows.sm,
    },
    '&.Mui-focused': {
      boxShadow: bastadTheme.shadows.md,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: bastadTheme.colors.twilight[500],
        borderWidth: '2px',
      },
    },
  },
  '& .MuiInputBase-input': {
    padding: { xs: '16px 14px', sm: '12px 14px' }, // More padding on mobile
    fontSize: { xs: '16px', sm: '14px' }, // Larger text on mobile to prevent zoom
  },
}));



// Helper function to group bookings by month
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

// Custom day component för kalendern
const CustomPickersDay = ({
  selectedDays = [],
  bookedDates = [],
  ...other
}: PickersDayProps<Date> & {
  selectedDays?: Date[];
  bookedDates?: Booking[];
}) => {
  // Format date to YYYY-MM-DD for simple comparison
  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  // Check if a date is fully booked (not available for checkin or checkout)
  const isDateFullyBooked = (day: Date) => {
    const dayStr = formatDateStr(day);
    
    // First check traditional fully booked days (middle of a booking)
    for (const booking of bookedDates) {
      const startDateStr = formatDateStr(new Date(booking.startDate || booking.startdate));
      const endDateStr = formatDateStr(new Date(booking.endDate || booking.enddate));
      
      // If day is after start date and before end date, it's fully booked
      if (dayStr > startDateStr && dayStr < endDateStr) {
        return true;
      }
    }
    
    return false;
  };

  // Check if day is a checkout date for any booking
  const isCheckoutDate = (day: Date) => {
    const dayStr = formatDateStr(day);
    
    for (const booking of bookedDates) {
      const endDateStr = formatDateStr(new Date(booking.endDate || booking.enddate));
      
      // If day is exactly the end date of a booking, it's a checkout date
      if (dayStr === endDateStr) {
        return true;
      }
    }
    
    return false;
  };

  // Check if this day is a checkin date for any booking
  const isCheckinDate = (day: Date) => {
    const dayStr = formatDateStr(day);
    
    for (const booking of bookedDates) {
      const startDateStr = formatDateStr(new Date(booking.startDate || booking.startdate));
      
      // If day is exactly the start date of a booking, it's a checkin date
      if (dayStr === startDateStr) {
        return true;
      }
    }
    
    return false;
  };

  // Check if a date has back-to-back bookings (one booking ends and another starts on same day)
  const hasBackToBackBookings = (day: Date) => {
    return isCheckoutDate(day) && isCheckinDate(day);
  };

  // Check if a date is effectively fully booked (either fully booked or has back-to-back bookings)


  // Enhanced date selection logic for range selection
  const checkDateInRange = () => {
    if (!other.day) return { isSelected: false, isStartDate: false, isEndDate: false, isInRange: false };
    
    const dayToCheck = new Date(other.day);
    dayToCheck.setHours(0, 0, 0, 0);
    const dayTime = dayToCheck.getTime();
    
    // Check if it's exactly a selected date (start or end)
    const isExactMatch = selectedDays.some(date => {
      if (!date) return false;
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      return selectedDate.getTime() === dayTime;
    });
    
    // If we have both start and end dates, check if current day is in range
    if (selectedDays.length === 2 && selectedDays[0] && selectedDays[1]) {
      const startDate = new Date(selectedDays[0]);
      const endDate = new Date(selectedDays[1]);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      // Ensure proper order (start <= end)
      const actualStart = Math.min(startTime, endTime);
      const actualEnd = Math.max(startTime, endTime);
      
      const isStartDate = dayTime === actualStart;
      const isEndDate = dayTime === actualEnd;
      const isInRange = dayTime > actualStart && dayTime < actualEnd;
      
      return {
        isSelected: isExactMatch || isInRange,
        isStartDate,
        isEndDate,
        isInRange
      };
    }
    
    return {
      isSelected: isExactMatch,
      isStartDate: isExactMatch,
      isEndDate: false,
      isInRange: false
    };
  };
  
  const dateRangeStatus = checkDateInRange();
  const { isSelected, isStartDate, isEndDate, isInRange } = dateRangeStatus;
  
  const isFullyBooked = isDateFullyBooked(other.day);
  const isCheckin = isCheckinDate(other.day);
  const isBackToBack = hasBackToBackBookings(other.day);
  
  // Determine what tooltip to show
  // Airbnb-style: checkout dates are available, checkin dates are blocked
  let tooltipText = "Tillgängligt";
  if (isStartDate && isEndDate) {
    tooltipText = "Enstaka dag vald";
  } else if (isStartDate) {
    tooltipText = "Ankomst";
  } else if (isEndDate) {
    tooltipText = "Avresa";
  } else if (isInRange) {
    tooltipText = "Ingår i bokningen";
  } else if (isFullyBooked || isBackToBack || isCheckin) {
    // Checkin dates are blocked (someone is checking in that day)
    tooltipText = "Upptaget";
  }
  // isCheckout dates are available (checkout at 11:00, new checkin at 14:00)

  // Determine style properties based on date status
  let styles: any = {
    position: 'relative',
    transition: 'all 0.2s ease',
  };

  // Apply styles in order of priority
  if (isStartDate || isEndDate) {
    // Start and end dates (highest priority)
    styles = {
      ...styles,
      backgroundColor: 'primary.main',
      color: 'white',
      fontWeight: 'bold',
      transform: { xs: 'scale(1.08)', sm: 'scale(1.12)', md: 'scale(1.15)' },
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: 10,
      borderRadius: isStartDate && isEndDate ? '50%' : 
                   isStartDate ? '50% 8px 8px 50%' : 
                   isEndDate ? '8px 50% 50% 8px' : '50%',
      '&:hover': {
        backgroundColor: 'primary.dark',
      },
    };
  } else if (isInRange) {
    // Days between start and end (range selection)
    styles = {
      ...styles,
      backgroundColor: 'rgba(25, 118, 210, 0.12)', // Light blue background
      color: 'primary.main',
      fontWeight: 'medium',
      borderRadius: '8px',
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        transform: 'scale(1.02)',
      },
    };
  } else if (isFullyBooked || isBackToBack || isCheckin) {
    // Blocked dates: fully booked, back-to-back, or checkin day (Airbnb-style)
    // Checkout dates are NOT blocked - new guests can check in after checkout
    styles = {
      ...styles,
      backgroundColor: '#e5e7eb', // Neutral gray (like Airbnb)
      color: '#9ca3af',
      fontWeight: 'normal',
      cursor: 'not-allowed',
      pointerEvents: 'none',
      textDecoration: 'line-through',
      '&:hover': {
        backgroundColor: '#e5e7eb',
        cursor: 'not-allowed'
      },
    };
  } else {
    // Available dates (including checkout dates - available for new checkin)
    // Available dates (lowest priority)
    styles = {
      ...styles,
      '&:hover': {
        backgroundColor: '#e3f2fd',
        transform: { xs: 'scale(1.04)', sm: 'scale(1.06)' },
      },
    };
  }

  return (
    <Tooltip 
      title={tooltipText} 
      arrow
      placement="top"
    >
      <span>
        <PickersDay
          {...other}
          selected={isSelected}
          sx={styles}
          disabled={isFullyBooked || isBackToBack}
        />
      </span>
    </Tooltip>
  );
};

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State för formulärdata
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [parking, setParking] = useState(false);
  
  // State för valideringsfel
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  
  // State för befintliga bokningar
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  // FullCalendar-komponenten
  const calendarRef = useRef<any>(null);

  // Multi-month calendar state
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  // Flytta hooks till komponentnivån
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Använd Authentication context
  const { isLoggedIn, currentUser, isAdmin } = useAuth();


  // Admin-specific state variables
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  

  // State för bekräftelsedialog (bokning skapad)
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  // State för raderingsbekräftelse
  const [deleteSuccessDialogOpen, setDeleteSuccessDialogOpen] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editParking, setEditParking] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  

  
  // Admin toolbar state
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [backupLoading, setBackupLoading] = useState(false);

  const [backupMenuAnchorEl, setBackupMenuAnchorEl] = useState<null | HTMLElement>(null);

  


  // Admin handler functions
  const handleBackupMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setBackupMenuAnchorEl(event.currentTarget);
  };

  const handleBackupMenuClose = () => {
    setBackupMenuAnchorEl(null);
  };

  // Hämta bokningsdata - publik availability för kalendern, full data om inloggad
  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);

      if (isLoggedIn) {
        // Authenticated: fetch full booking details (personal data included)
        const bookings = await bookingServiceSupabase.getAllBookings();
        setExistingBookings(bookings || []);
        setCalendarEvents([]);
      } else {
        // Public: fetch only date availability (no personal data)
        const availability = await bookingServiceSupabase.getBookingAvailability();
        setExistingBookings(availability || []);
        setCalendarEvents([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [isLoggedIn]);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(calendarEvents);
      calendarApi.render();
    }
  }, [calendarEvents]);

  useEffect(() => {
    const fetchApartmentInfo = async () => {
      try {
        await pageServiceSupabase.getPageBySlug('gastlagenhet');
      } catch (error) {
        console.log('Kunde inte hämta lägenhetsinformation, fortsätter utan den');
      }
    };

    fetchApartmentInfo();
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone((currentUser as any).phone || '');
    }
  }, [isLoggedIn, currentUser]);









  // Skicka in bokningen
  const submitBooking = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    
    try {
      // Normalize dates to midnight UTC for consistent handling
      const normalizedStartDate = new Date(startDate);
      const normalizedEndDate = new Date(endDate);
      normalizedStartDate.setUTCHours(0, 0, 0, 0);
      normalizedEndDate.setUTCHours(0, 0, 0, 0);
      
      // Kontrollera både:
      // 1. Om någon bokning börjar samma dag som vår bokning slutar
      // 2. Om någon bokning slutar samma dag som vår bokning börjar
      

      
      // Gamla tillgänglighetskontroller togs bort eftersom de var oanvända
      
      // Skip detailed availability check for now since we already validate against existingBookings above
      // The client-side validation above should be sufficient for detecting conflicts
      
      // Använd de ursprungliga datumen direkt
      const booking = await bookingServiceSupabase.createBooking({
        type: 'common-room', // Gästlägenhet = common room  
        date: normalizedStartDate.toISOString(), // Fullt datum med tid
        startTime: '14:00', // Check-in tid
        endTime: '11:00',   // Check-out tid  
        weeks: 1, // Alltid 1 för gästlägenhetsbokningar
        apartment: '1', // Default apartment
        floor: '1',     // Default floor
        name,
        email,
        phone: phone || '',
        message: notes || '',
        parkingSpace: parking ? 'Ja' : undefined,
        // Lägg till slutdatum för korrekt hantering
        endDate: normalizedEndDate.toISOString()
      });
      
      if (booking) {
        // Formatera datumen för visning i bekräftelsedialogen
        const formattedStartDate = dateFns.format(normalizedStartDate, 'd MMM', { locale: sv });
        const formattedEndDate = dateFns.format(normalizedEndDate, 'd MMM', { locale: sv });
        const nights = dateFns.differenceInDays(normalizedEndDate, normalizedStartDate);
        
        console.log('🎉 Booking successful! Showing confirmation dialog...');
        
        // Visa bekräftelsedialog istället för toast
        setConfirmationMessage(`Din bokning ${formattedStartDate} - ${formattedEndDate} (${nights} ${nights === 1 ? 'natt' : 'nätter'}) är bekräftad!`);
        setConfirmationDialogOpen(true);
        
        // Återställ formuläret
        setStartDate(null);
        setEndDate(null);
        setNotes('');
        setParking(false);
        
        // Uppdatera bokningslistan
        await fetchBookings();
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      // SessionExpiredError triggers global modal - don't show duplicate snackbar
      if (!(error instanceof SessionExpiredError)) {
        setSnackbarMessage('Ett fel uppstod när bokningen skulle skapas. Försök igen senare.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Starta om bokningsprocessen
  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
          // Reset form
          // Clear any previous errors
    setValidationErrors({});
    setParking(false);
    
    if (!isLoggedIn) {
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
    }
    
    fetchBookings();
  };

  // Rendera bokningsformuläret
  const renderBookingForm = () => {
    if (!isLoggedIn) {
      return (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 3,
            backgroundColor: 'info.lighter',
            border: '1px solid',
            borderColor: 'info.light',
            borderRadius: 2
          }}
        >
          Du måste vara inloggad för att kunna boka. 
          <Button 
            component={RouterLink} 
            to="/login" 
            sx={{ ml: 2 }}
          >
            Logga in
          </Button>
        </Alert>
      );
    }

    return (
      <Paper
        elevation={0}
        sx={{ 
          mt: { xs: 1, sm: 3 },
          mx: { xs: -0.5, sm: 0 }, // Slightly negative margin on mobile
          px: { xs: 1, sm: 6 }, // Minimal padding on mobile, more on desktop
          py: { xs: 2, sm: 4 },
          backgroundColor: { xs: 'transparent', sm: bastadTheme.colors.white },
          borderRadius: { xs: 0, sm: bastadTheme.borderRadius.xl },
          border: { xs: 'none', sm: `1px solid ${bastadTheme.colors.sand[200]}` },
          boxShadow: { xs: 'none', sm: bastadTheme.shadows.md },
        }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
                <ModernTextField
                  fullWidth
                  label="Namn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                <ModernTextField
                  fullWidth
                  label="E-post"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                <ModernTextField
                  fullWidth
                  label="Telefon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
                />
                <ModernTextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Anteckningar"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={parking}
                      onChange={(e) => setParking(e.target.checked)}
                      color="primary"
                      sx={{ 
                        '& .MuiSvgIcon-root': { 
                          fontSize: { xs: '28px', sm: '24px' } // Larger touch target on mobile
                        } 
                      }}
                    />
                  }
                  label="Jag behöver parkering"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: { xs: '16px', sm: '14px' }, // Larger text on mobile
                    },
                    marginTop: { xs: 1, sm: 0.5 }, // Extra spacing on mobile
                  }}
                />
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: { xs: 'stretch', sm: 'flex-end' },
                mt: { xs: 2.5, sm: 2 }
              }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={submitBooking}
                  disabled={isLoading}
                  sx={{
                    width: { xs: '100%', sm: 'auto' }, // Full width on mobile, auto on desktop
                    py: { xs: 1.5, sm: 1.5 }, // Reduced padding for more reasonable size
                    px: { xs: 3, sm: 4 },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: { xs: '16px', sm: '1rem' }, // More reasonable text size
                    minHeight: { xs: '44px', sm: '42px' }, // Smaller but still good touch target
                    minWidth: { xs: 'auto', sm: 200 },
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  {isLoading ? (
                    <MinimalLoading size={24} />
                  ) : (
                    <>
                      <Check sx={{ mr: 1 }} />
                      Bekräfta bokning
                    </>
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
      </Paper>
    );
  };

  // Generate multiple months for display
  const generateMonthsToShow = () => {
    const months = [];
    const today = new Date();
    const monthsToShow = isMobile ? 2 : 3; // 2 months on mobile, 3 on desktop
    
    for (let i = 0; i < monthsToShow; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset + i, 1);
      months.push(monthDate);
    }
    
    return months;
  };

  // Navigate months
  const navigateMonths = (direction: 'prev' | 'next') => {
    const step = isMobile ? 1 : 2; // Navigate by 1 month on mobile, 2 on desktop
    setCurrentMonthOffset(prev => 
      direction === 'next' ? prev + step : prev - step
    );
  };

  // Render individual month calendar
  const renderSingleMonth = (monthDate: Date, index: number) => {
    const isLastMonth = index === generateMonthsToShow().length - 1;
    
    return (
      <Box
        key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
        sx={{
          flex: { xs: '0 0 auto', md: '0 0 calc(50% - 8px)', lg: '0 0 calc(33.333% - 12px)' },
          width: { xs: '100%', md: 'auto' },
          backgroundColor: 'background.paper',
          borderRadius: '8px',
          padding: { xs: '12px', sm: '16px' },
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative',
          // Subtle month separator
          '&:not(:last-child)': {
            marginRight: { xs: 0, md: '16px', lg: '18px' },
            marginBottom: { xs: '16px', md: 0 },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: { xs: 'auto', md: '20%' },
              right: { xs: 'auto', md: '-8px', lg: '-9px' },
              bottom: { xs: '-8px', md: 'auto' },
              left: { xs: '20%', md: 'auto' },
              width: { xs: '60%', md: '1px' },
              height: { xs: '1px', md: '60%' },
              background: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
              display: isLastMonth ? 'none' : 'block',
            }
          }
        }}
      >
        <DateCalendar
          value={monthDate} // Use month date to control which month is shown
          onChange={(newValue) => {
            if (newValue) {
              const date = new Date(newValue);
              date.setHours(12, 0, 0, 0);
              updateDateRange(date);
            }
          }}
          slots={{
            day: (props) => (
              <CustomPickersDay 
                {...props} 
                selectedDays={[startDate, endDate].filter(Boolean)}
                bookedDates={existingBookings}
              />
            )
          }}
          views={['day']}
          openTo="day"
          sx={{
            width: '100%',
            margin: '0',
            padding: '0',
            '& .MuiDateCalendar-root': {
              maxHeight: 'none',
              height: 'auto',
              width: '100%',
              margin: '0',
              padding: '0',
            },
            '& .MuiPickersCalendarHeader-root': {
              paddingLeft: '8px',
              paddingRight: '8px',
              marginBottom: '8px',
            },
            '& .MuiPickersCalendarHeader-label': {
              textTransform: 'none',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              fontWeight: '600',
              color: 'primary.dark',
              '&::first-letter': {
                textTransform: 'uppercase'
              }
            },
            // Hide navigation arrows on individual month calendars
            '& .MuiPickersArrowSwitcher-root': {
              display: 'none',
            },
            '& .MuiDayCalendar-root': {
              overflow: 'visible',
              paddingLeft: '0',
              '& .MuiPickersSlideTransition-root': {
                overflow: 'visible',
              },
            },
            // Force CSS Grid for perfect alignment between header and body
            '& .MuiDayCalendar-header, & .MuiDayCalendar-weekContainer': {
              display: 'grid',
              gridTemplateColumns: { 
                xs: '28px repeat(7, 28px)', 
                sm: '32px repeat(7, 32px)' 
              },
              gap: { xs: '2px', sm: '4px' },
              justifyItems: 'center',
              alignItems: 'center',
              margin: 0,
              padding: 0,
            },
            // Week number label (# header)
            '& .MuiDayCalendar-weekNumberLabel': {
              width: { xs: '28px', sm: '32px' },
              height: { xs: '28px', sm: '32px' },
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              padding: 0,
            },
            // Week number in each row
            '& .MuiDayCalendar-weekNumber': {
              width: { xs: '28px', sm: '32px' },
              height: { xs: '28px', sm: '32px' },
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              padding: 0,
            },
            // Weekday labels (M, T, O, T, F, L, S)
            '& .MuiDayCalendar-weekDayLabel': {
              width: { xs: '28px', sm: '32px' },
              height: { xs: '28px', sm: '32px' },
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              padding: 0,
            },
            // Day buttons
            '& .MuiPickersDay-root': {
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              width: { xs: '28px', sm: '32px' },
              height: { xs: '28px', sm: '32px' },
              margin: 0,
              padding: 0,
            }
          }}
          showDaysOutsideCurrentMonth={true}
          displayWeekNumber={true}
          reduceAnimations={true}
          fixedWeekNumber={6}
          disableHighlightToday={false}
        />
      </Box>
    );
  };

  // Rendera multi-month kalendern med navigation
  const renderCalendarWithMaxWidth = () => {
    const monthsToShow = generateMonthsToShow();
    
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '100%', md: '900px', lg: '1000px' },
          marginTop: '20px',
          mx: 'auto',
        }}
      >
        {/* Navigation Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            padding: '0 8px',
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigateMonths('prev')}
            sx={{
              minWidth: '40px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              fontSize: '18px',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'primary.lighter',
              }
            }}
          >
            ‹
          </Button>
          
          <Typography
            variant="h6"
            sx={{
              fontWeight: '600',
              color: 'primary.dark',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              textAlign: 'center',
            }}
          >
            {monthsToShow.length > 1 
              ? `${monthsToShow[0].toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })} - ${monthsToShow[monthsToShow.length - 1].toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}`
              : monthsToShow[0]?.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })
            }
          </Typography>
          
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigateMonths('next')}
            sx={{
              minWidth: '40px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              fontSize: '18px',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'primary.lighter',
              }
            }}
          >
            ›
          </Button>
        </Box>

        {/* Multi-Month Layout */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: '0', md: '0' }, // Gap handled by margin in individual months
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {monthsToShow.map((monthDate, index) => renderSingleMonth(monthDate, index))}
        </Box>
      </Box>
    );
  };

  const handleEditClick = (booking: Booking) => {
    setBookingToEdit(booking);
    setEditName(booking.name);
    setEditEmail(booking.email || '');
    setEditPhone(booking.phone || '');
    setEditNotes(booking.notes || '');
    setEditStartDate(booking.startDate);
    setEditEndDate(booking.endDate);
    setEditParking(booking.parking || false);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  // Hjälpfunktion för att hantera bokningsradering
  const handleBookingDeleted = async () => {
    if (!bookingToDelete) return;
    
    try {
      await bookingServiceSupabase.deleteBooking(bookingToDelete.id);
      
      // Uppdatera lokalt state med immuterbar metod
      setExistingBookings(prev => 
        prev.filter(b => b.id !== bookingToDelete.id)
      );
        
      // Stäng raderingsdialogen
      setDeleteDialogOpen(false);
      
      // Visa bekräftelsedialog för lyckad radering
      setDeleteSuccessDialogOpen(true);
        
      // Uppdatera bokningslistan
      setTimeout(() => {
        fetchBookings();
      }, 300);
    } catch (error) {
      console.error('Error deleting booking:', error);
      setDeleteDialogOpen(false);
      if (!(error instanceof SessionExpiredError)) {
        setSnackbarMessage('Ett fel uppstod vid radering av bokningen');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  // Rendera prislistan
  const renderPriceList = () => {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          Priser (kr/dygn)
        </Typography>

        {/* Force 2 columns on mobile, full width with minimal spacing */}
        <Grid container spacing={1}>
          {/* First row */}
          <Grid item xs={6} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    mr: 1
                  }}
                />
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'medium', 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: 'inherit' },
                    lineHeight: { xs: 1.2, sm: 1.4 }
                  }}
                >
                  Högsäsong (v. 24-32)
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mt: 'auto' }}>
                600 kr
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                backgroundColor: 'rgba(244, 67, 54, 0.05)',
                border: '1px solid',
                borderColor: 'error.light',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'error.main',
                    mr: 1
                  }}
                />
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'medium', 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: 'inherit' },
                    lineHeight: { xs: 1.2, sm: 1.4 }
                  }}
                >
                  Tennisveckor (v. 28-29)
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold', mt: 'auto' }}>
                800 kr
              </Typography>
            </Paper>
          </Grid>

          {/* Second row */}
          <Grid item xs={6} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                backgroundColor: 'rgba(158, 158, 158, 0.05)',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'grey.600',
                    mr: 1
                  }}
                />
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'medium', 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: 'inherit' },
                    lineHeight: { xs: 1.2, sm: 1.4 }
                  }}
                >
                  Lågsäsong (v. 1-23, 33-52)
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mt: 'auto' }}>
                400 kr
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                backgroundColor: 'rgba(76, 175, 80, 0.05)',
                border: '1px solid',
                borderColor: 'success.light',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    mr: 1
                  }}
                />
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'medium', 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: 'inherit' },
                    lineHeight: { xs: 1.2, sm: 1.4 }
                  }}
                >
                  Parkering
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold', mt: 'auto' }}>
                75 kr/dygn
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Rendera in/utcheckningstider
  const renderCheckInOutInfo = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            backgroundColor: 'rgba(76, 175, 80, 0.05)',
            border: '1px solid',
            borderColor: 'success.light',
            borderRadius: 2,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  →
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                    Incheckning
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                    kl. 14:00
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  ←
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                    Utcheckning
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                    kl. 11:00
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  // Rendera bokningsstatus
  const renderBookingStatus = () => {
    const groupedBookings = groupBookingsByMonth(existingBookings);
    const sortedMonths = Object.keys(groupedBookings).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      return yearA - yearB || monthA - monthB;
    });

    // Calculate yearly summary for admin
    const renderYearlySummary = () => {
      if (!isAdmin) return null;

      const availableYears = [...new Set(
        existingBookings
          .filter(b => b.startDate)
          .map(b => new Date(b.startDate).getFullYear())
      )].sort((a, b) => b - a);

      if (availableYears.length === 0) return null;

      const yearlyBookings = existingBookings.filter(booking => {
        const bookingYear = new Date(booking.startDate).getFullYear();
        return bookingYear === summaryYear;
      });

      const { apartmentRevenue, parkingRevenue, totalRevenue, totalNights } = calculateTotalRevenue(yearlyBookings);

      return (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            background: 'linear-gradient(135deg, #f5f9ff 0%, #eef6ff 100%)',
            border: '1px solid',
            borderColor: 'primary.light',
            borderRadius: 2,
          }}
        >
          <Box sx={{
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
            <Typography variant="h5" sx={{
              color: 'primary.main',
              fontWeight: 600,
            }}>
              Årssummering
            </Typography>
            <Select
              value={summaryYear}
              onChange={(e) => setSummaryYear(Number(e.target.value))}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '1.2rem',
                color: 'primary.main',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.light',
                },
                '& .MuiSelect-select': {
                  py: 0.5,
                  px: 1.5,
                },
              }}
            >
              {availableYears.map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Statistik
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 1
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {yearlyBookings.length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      bokningar
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 1
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {totalNights}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      nätter totalt
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={8}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Intäkter
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'baseline',
                      mb: 1
                    }}>
                      <Typography variant="body1" color="text.secondary">
                        Lägenhet
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {apartmentRevenue.toLocaleString()} kr
                      </Typography>
                    </Box>
                    {parkingRevenue > 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'baseline',
                        mb: 1
                      }}>
                        <Typography variant="body1" color="text.secondary">
                          Parkering
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                          {parkingRevenue.toLocaleString()} kr
                        </Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'baseline'
                    }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Totalt
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                        {totalRevenue.toLocaleString()} kr
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      );
    };

    return (
      <Box sx={{ mt: 4 }}>
        {renderYearlySummary()}
        
        <Typography variant="h5" component="h2" sx={{ 
          color: 'primary.main', 
          fontWeight: 600,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            display: 'block',
            width: 4,
            height: 24,
            backgroundColor: 'primary.main',
            marginRight: 1.5,
            borderRadius: 1
          }
        }}>
          Bokningsstatus
        </Typography>

        {sortedMonths.map(monthYear => {
          const [year, month] = monthYear.split('-');
          const bookings = groupedBookings[monthYear];
          const monthName = dateFns.format(new Date(Number(year), Number(month) - 1), 'LLLL', { locale: sv });
          const { totalNights, totalRevenue, parkingRevenue } = calculateTotalRevenue(bookings);

          const guestData = bookings.map(booking => {
            const startDate = new Date(booking.startDate);
            const week = dateFns.getISOWeek(startDate);
            
            return {
              id: booking.id,
              name: booking.name,
              arrival: dateFns.format(new Date(booking.startDate), 'E d MMM', { locale: sv }),
              departure: dateFns.format(new Date(booking.endDate), 'E d MMM', { locale: sv }),
              week: `v.${week}`,
              notes: booking.notes,
              parking: booking.parking,
              startDateRaw: booking.startDate,
              endDateRaw: booking.endDate,
            };
          });

          // Check if this is current or future month
          const now = new Date();
          const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const bookingMonth = new Date(Number(year), Number(month) - 1, 1);
          const isCurrentOrFutureMonth = bookingMonth.getTime() >= currentMonth.getTime();

          return (
            <BookingStatus
              key={monthYear}
              month={monthName}
              year={year}
              bookings={bookings.length}
              nights={totalNights}
              revenue={totalRevenue}
              parkingRevenue={parkingRevenue}
              guestData={guestData}
              defaultExpanded={false}
              isCurrentOrFutureMonth={isCurrentOrFutureMonth}
              isAdmin={isAdmin}
              isLoggedIn={isLoggedIn}
              onEditClick={(guest) => {
                // Hitta originalbokningen baserat på guest.id
                const booking = bookings.find(b => b.id === guest.id);
                if (booking) {
                  handleEditClick(booking);
                }
              }}
              onDeleteClick={(guest) => {
                // Hitta originalbokningen baserat på guest.id
                const booking = bookings.find(b => b.id === guest.id);
                if (booking) {
                  handleDeleteClick(booking);
                }
              }}
            />
          );
        })}
      </Box>
    );
  };





  // Helper to update the date range with proper normalization
  const updateDateRange = (newDate: Date | null) => {
    if (!newDate) return;
    
    // Normalize the selected date to midnight UTC
    const normalizedDate = new Date(newDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    
    if (!startDate) {
      // First date selection - this is the start date
      setStartDate(normalizedDate);
    } else if (!endDate) {
      // Second date selection - determine if it's before or after start date
      if (normalizedDate.getTime() < startDate.getTime()) {
        // If selected date is earlier than start date, swap them
        setEndDate(new Date(startDate));
        setStartDate(normalizedDate);
      } else {
        // Normal case - end date is after start date
        setEndDate(normalizedDate);
      }
    } else {
      // Both dates were already selected - start over with just a start date
      setStartDate(normalizedDate);
      setEndDate(null);
    }
  };

  // Add a function to format the date range display
  const formatDateRange = () => {
    if (!startDate) return null;
    
    const formattedStart = dateFns.format(startDate, 'd MMMM', { locale: sv });
    if (!endDate) {
      return `Valt datum: ${formattedStart}`;
    }
    
    const formattedEnd = dateFns.format(endDate, 'd MMMM', { locale: sv });
    const nights = dateFns.differenceInDays(endDate, startDate);
    return `Valt datum: ${formattedStart} - ${formattedEnd} (${nights} nätter)`;
  };

  // Render price summary when dates are selected
  const renderPriceSummary = () => {
    if (!startDate || !endDate) return null;

    const breakdown = calculateBookingPrice(startDate, endDate, parking);

    return (
      <Paper
        elevation={0}
        sx={{
          mt: { xs: 2, sm: 3 },
          mx: 'auto',
          maxWidth: { xs: '100%', sm: '500px' },
          p: { xs: 2, sm: 3 },
          backgroundColor: bastadTheme.colors.ocean[50],
          border: `1px solid ${bastadTheme.colors.ocean[200]}`,
          borderRadius: bastadTheme.borderRadius.lg,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'primary.dark' }}>
          Prisberäkning
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {breakdown.nights} {breakdown.nights === 1 ? 'natt' : 'nätter'} · {breakdown.seasonLabel} (v.{breakdown.weekNumber})  {breakdown.nightlyRate} kr/natt
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">
            Lägenhet ({breakdown.nights} × {breakdown.nightlyRate} kr)
          </Typography>
          <Typography variant="body2">
            {breakdown.apartmentSubtotal.toLocaleString()} kr
          </Typography>
        </Box>

        {parking && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">
              Parkering ({breakdown.nights} × {PRICING.PARKING_RATE} kr)
            </Typography>
            <Typography variant="body2">
              {breakdown.parkingSubtotal.toLocaleString()} kr
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Totalt
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {breakdown.grandTotal.toLocaleString()} kr
          </Typography>
        </Box>
      </Paper>
    );
  };

  // Admin handler functions
  const handleBackupWithFormat = (format: 'json' | 'excel' | 'pdf', sendEmail: boolean = false) => async () => {
    setBackupLoading(true);
    handleBackupMenuClose();
    
    try {
      await adminUtils.createBackupWithFormat(format, sendEmail, { isMobile });
      // Resultat hanteras redan av adminUtils (toast-meddelanden)
    } finally {
      setBackupLoading(false);
    }
  };



  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
      {/* Hero Section removed - only admin toolbar and content */}

        <Container 
          maxWidth="lg"
          sx={{ 
            px: { xs: 1, sm: 3, md: 4 }, // Better padding on mobile for more space
            maxWidth: { xs: '100%', sm: '100%', md: '1200px' },
            pb: bastadTheme.spacing[8], // Bottom padding moved from ModernPageContainer
            pt: 0 // Remove any top padding to bring content closer to hero
          }}
        >
          {/* Compact Admin Toolbar - endast synlig för admins */}
          {isAdmin && (
            <Paper
              elevation={1}
              sx={{
                p: 1.5, // Reduced from 2 to 1.5
                mb: 1.5, // Reduced from 3 to 1.5
                mt: 2, // Add margin-top to separate from header
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AdminPanelSettingsIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    Admin-verktyg
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<BackupIcon fontSize="small" />}
                    onClick={handleBackupMenuClick}
                    disabled={backupLoading}
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, minWidth: 140, minHeight: 32 }}
                  >
                    {backupLoading ? <MinimalLoading size={14} /> : 'Säkerhetskopiera'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DescriptionIcon fontSize="small" />}
                    onClick={() => navigate('/admin/hsb-report')}
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
                  >
                    HSB-rapport
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Backup Menu */}
          <Menu
            anchorEl={backupMenuAnchorEl}
            open={Boolean(backupMenuAnchorEl)}
            onClose={handleBackupMenuClose}
          >
            <MenuItem onClick={handleBackupWithFormat('json', false)}>
              📄 Ladda ner JSON
            </MenuItem>
            <MenuItem onClick={handleBackupWithFormat('excel', false)}>
              📊 Ladda ner Excel (CSV)
            </MenuItem>
            <MenuItem onClick={handleBackupWithFormat('pdf', false)}>
              📝 Ladda ner PDF (Text)
            </MenuItem>
            <MenuItem onClick={handleBackupWithFormat('json', true)}>
              📧 Skicka via e-post
            </MenuItem>
          </Menu>

          <ModernCard sx={{ marginBottom: bastadTheme.spacing[6], mt: 2 }}>

          {renderPriceList()}
          {renderCheckInOutInfo()}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              {loadingBookings ? (
                <Box sx={{ mb: 4 }}>
                  <BookingSkeleton variant="calendar" count={5} />
                </Box>
              ) : (
                <>
                  {startDate && (
                    <Box sx={{ 
                      mb: 2, 
                      p: { xs: 1.5, sm: 2 }, 
                      bgcolor: 'primary.lighter',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'primary.light',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: { sm: 'space-between' }
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: 'primary.dark',
                        fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                      }}>
                        {formatDateRange()}
                      </Typography>
                      {startDate && endDate && (
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          size="small" 
                          onClick={handleReset}
                          sx={{ 
                            mt: { xs: 1, sm: 0 },
                            fontSize: { xs: '0.75rem', sm: '0.8rem' }
                          }}
                        >
                          Rensa val
                        </Button>
                      )}
                    </Box>
                  )}
                  {renderCalendarWithMaxWidth()}
                  {renderPriceSummary()}
                </>
              )}
            </Grid>

            <Grid item xs={12}>
              {renderBookingForm()}
            </Grid>
          </Grid>

          {isLoggedIn && renderBookingStatus()}

          {isAdmin && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              mt: 4,
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 4,
              gap: 2
            }}>


            </Box>
          )}

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
          />

          {/* Bekräftelsedialog för lyckad bokning - MUI standard pattern */}
          <Dialog
            open={confirmationDialogOpen}
            onClose={() => setConfirmationDialogOpen(false)}
            fullScreen={isMobile}
            fullWidth
            maxWidth="xs"
            scroll="paper"
            aria-labelledby="booking-confirmation-dialog"
            PaperProps={{
              sx: isMobile ? {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              } : {}
            }}
          >
            {/* Innehållscontainer */}
            <Box sx={{ 
              width: '100%',
              maxWidth: isMobile ? '320px' : '100%',
            }}>
              <Box sx={{ 
                bgcolor: '#4caf50', 
                py: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: isMobile ? '8px 8px 0 0' : 0,
              }}>
                <Box sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Check sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Box>
              <Box sx={{ 
                bgcolor: 'white',
                borderRadius: isMobile ? '0 0 8px 8px' : 0,
              }}>
                <DialogContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h5" id="booking-confirmation-dialog" sx={{ fontWeight: 'bold', mb: 1, color: '#2e7d32' }}>
                    Bokning bekräftad!
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {confirmationMessage}
                  </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button 
                    onClick={() => setConfirmationDialogOpen(false)}
                    variant="contained"
                    autoFocus
                    sx={{ 
                      bgcolor: '#4caf50',
                      borderRadius: 2,
                      px: 4,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: '#388e3c',
                      }
                    }}
                  >
                    Stäng
                  </Button>
                </DialogActions>
              </Box>
            </Box>
          </Dialog>

          {/* Raderingsdialog - MUI standard pattern */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            fullScreen={isMobile}
            fullWidth
            maxWidth="sm"
            scroll="paper"
            aria-labelledby="delete-dialog-title"
            PaperProps={{
              sx: isMobile ? {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              } : {}
            }}
          >
            <Box sx={{ 
              width: '100%',
              maxWidth: isMobile ? '320px' : '100%',
              bgcolor: 'white',
              borderRadius: isMobile ? 2 : 0,
              overflow: 'hidden',
            }}>
              <DialogTitle sx={{ 
                bgcolor: 'error.lighter', 
                color: 'error.dark',
                fontWeight: 'bold',
                borderBottom: '1px solid',
                borderColor: 'error.light'
              }}>
                Radera bokning
              </DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <DialogContentText>
                  Är du säker på att du vill radera denna bokning?
                  Detta kan inte ångras.
                </DialogContentText>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3 }}>
                <ModernButton 
                  onClick={() => setDeleteDialogOpen(false)} 
                  variant="outlined"
                  sx={{ 
                    color: 'text.primary',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'text.primary',
                      backgroundColor: 'rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  Avbryt
                </ModernButton>
                <ModernButton 
                  onClick={handleBookingDeleted} 
                  variant="contained" 
                  color="error" 
                  autoFocus
                >
                  Radera
                </ModernButton>
              </DialogActions>
            </Box>
          </Dialog>

          {/* Bekräftelsedialog för lyckad radering - MUI standard pattern */}
          <Dialog
            open={deleteSuccessDialogOpen}
            onClose={() => setDeleteSuccessDialogOpen(false)}
            fullScreen={isMobile}
            fullWidth
            maxWidth="xs"
            scroll="paper"
            aria-labelledby="delete-confirmation-dialog"
            PaperProps={{
              sx: isMobile ? {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              } : {}
            }}
          >
            {/* Innehållscontainer */}
            <Box sx={{ 
              width: '100%',
              maxWidth: isMobile ? '320px' : '100%',
            }}>
              <Box sx={{ 
                bgcolor: '#f44336', 
                py: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: isMobile ? '8px 8px 0 0' : 0,
              }}>
                <Box sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Check sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </Box>
              <Box sx={{ 
                bgcolor: 'white',
                borderRadius: isMobile ? '0 0 8px 8px' : 0,
              }}>
                <DialogContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h5" id="delete-confirmation-dialog" sx={{ fontWeight: 'bold', mb: 1, color: '#c62828' }}>
                    Bokning raderad
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Bokningen har tagits bort från systemet.
                  </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button 
                    onClick={() => setDeleteSuccessDialogOpen(false)}
                    variant="contained"
                    autoFocus
                    sx={{ 
                      bgcolor: '#f44336',
                      borderRadius: 2,
                      px: 4,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: '#d32f2f',
                      }
                    }}
                  >
                    Stäng
                  </Button>
                </DialogActions>
              </Box>
            </Box>
          </Dialog>
          
          {/* Redigeringsdialog - MUI standard pattern */}
          <Dialog 
            open={editDialogOpen} 
            onClose={() => setEditDialogOpen(false)}
            fullScreen={isMobile}
            fullWidth
            maxWidth="sm"
            scroll="paper"
            aria-labelledby="edit-dialog-title"
          >
            <DialogTitle sx={{ 
              bgcolor: 'primary.lighter', 
              color: 'primary.dark',
              fontWeight: 'bold',
              borderBottom: '1px solid',
              borderColor: 'primary.light'
            }}>
              Redigera bokning
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Namn"
                    fullWidth
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="E-post"
                    fullWidth
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Telefon"
                    fullWidth
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Ankomstdatum"
                    fullWidth
                    type="date"
                    value={editStartDate ? editStartDate.substring(0, 10) : ''}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Avresedatum"
                    fullWidth
                    type="date"
                    value={editEndDate ? editEndDate.substring(0, 10) : ''}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Anteckningar"
                    fullWidth
                    multiline
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'success.lighter', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'success.light'
                  }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={editParking}
                          onChange={(e) => setEditParking(e.target.checked)}
                          color="success"
                        />
                      }
                      label={
                        <Typography sx={{ color: 'success.dark' }}>
                          Parkeringsplats önskas (75 kr/dygn)
                        </Typography>
                      }
                    />
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => setEditDialogOpen(false)}
                variant="outlined"
                sx={{ 
                  borderRadius: 1,
                  color: 'text.primary',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'text.primary',
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                Avbryt
              </Button>
              <Button 
                onClick={async () => {
                  if (!bookingToEdit) return;
                  
                  setEditLoading(true);
                  
                  try {
                    // Validera formuläret först
                    let valid = true;
                    const errors: Record<string, string> = {};
                    
                    if (!editName.trim()) {
                      errors.name = 'Namn måste anges';
                      valid = false;
                    }
                    
                    if (!editStartDate || !editEndDate) {
                      errors.dates = 'Både ankomst- och avresedatum måste anges';
                      valid = false;
                    } else {
                      const startDateObj = new Date(editStartDate);
                      const endDateObj = new Date(editEndDate);
                      
                      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                        errors.dates = 'Ogiltiga datum';
                        valid = false;
                      } else if (startDateObj >= endDateObj) {
                        errors.dates = 'Avresedatum måste vara efter ankomstdatum';
                        valid = false;
                      }
                    }
                    
                    if (!valid) {
                      // Visa fel
                      setSnackbarMessage(Object.values(errors)[0]);
                      setSnackbarSeverity('error');
                      setSnackbarOpen(true);
                      setEditLoading(false);
                      return;
                    }
                    
                    // Skapa uppdaterat bokningsobjekt
                    const updatedBooking: Booking = {
                      ...bookingToEdit,
                      name: editName,
                      email: editEmail,
                      phone: editPhone,
                      notes: editNotes,
                      startDate: editStartDate,
                      endDate: editEndDate,
                      parking: editParking
                    };
                    
                    // Skicka uppdatering till servern
                    const result = await bookingServiceSupabase.updateBooking(updatedBooking.id, updatedBooking);
                    
                    if (result) {
                      // Uppdatera lokalt state
                      setExistingBookings(prev => 
                        prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)
                      );
                      
                      setSnackbarMessage('Bokningen har uppdaterats');
                      setSnackbarSeverity('success');
                      setEditDialogOpen(false);
                      
                      // Uppdatera bokningslistan
                      fetchBookings();
                    } else {
                      setSnackbarMessage('Kunde inte uppdatera bokningen');
                      setSnackbarSeverity('error');
                    }
                  } catch (error) {
                    console.error('Error updating booking:', error);
                    if (!(error instanceof SessionExpiredError)) {
                      setSnackbarMessage('Ett fel uppstod vid uppdatering av bokningen');
                      setSnackbarSeverity('error');
                      setSnackbarOpen(true);
                    }
                  } finally {
                    setEditLoading(false);
                  }
                }} 
                variant="contained" 
                color="primary"
                disabled={editLoading}
                sx={{
                  borderRadius: 1,
                  boxShadow: 2,
                  minWidth: 100,
                  minHeight: 42,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                {editLoading ? <ButtonLoading /> : "Spara"}
              </Button>
            </DialogActions>
          </Dialog>
        
          </ModernCard>
        </Container>
      </LocalizationProvider>
    </>
  );
};

export default BookingPage; 