import React, { useState, useEffect, useRef } from 'react';
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
  Stepper,
  Step,
  StepLabel, 
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Link,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  IconButton
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isAfter, differenceInDays, parseISO, isThisMonth, isFuture, isBefore, startOfMonth, endOfMonth, getMonth, getYear, addMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Person, Email, Check, ExpandMore, LockOutlined, Delete as DeleteIcon, Email as EmailIcon, Edit as EditIcon, Backup as BackupIcon } from '@mui/icons-material';
import bookingService from '../../services/bookingService';
import { Booking } from '../../types/Booking';
import pageService from '../../services/pageService';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

// Förenklade steg i bokningsprocessen
const steps = ['Välj datum och dina uppgifter', 'Klar'];

// Custom day component för kalendern
const CustomPickersDay = ({
  selectedDays = [],
  bookedDates = [],
  ...other
}: PickersDayProps<Date> & {
  selectedDays?: Date[];
  bookedDates?: Booking[];
}) => {
  const isSelected = selectedDays.some(
    (date) => date && other.day && date.getDate() === other.day.getDate() &&
    date.getMonth() === other.day.getMonth() &&
    date.getFullYear() === other.day.getFullYear()
  );

  const isBooked = bookedDates.some(
    (booking) => {
      // Create dates with time set to beginning of day for accurate date comparison
      const bookingStart = new Date(booking.startDate);
      bookingStart.setHours(0, 0, 0, 0);
      
      const bookingEnd = new Date(booking.endDate);
      bookingEnd.setHours(0, 0, 0, 0);
      
      // Clone and normalize the day from props for comparison
      const dayToCheck = new Date(other.day);
      dayToCheck.setHours(0, 0, 0, 0);
      
      return dayToCheck >= bookingStart && dayToCheck <= bookingEnd;
    }
  );

  return (
    <Tooltip 
      title={isBooked ? "Upptaget" : "Tillgängligt"} 
      arrow
      placement="top"
    >
      <PickersDay
        {...other}
        selected={isSelected}
        sx={{
          position: 'relative',
          transition: 'background-color 0.2s, transform 0.1s',
          fontWeight: isBooked ? 'bold' : 'normal',
          
          // Highlight selected days
          ...(isSelected && {
            backgroundColor: 'primary.main',
            color: 'white',
            fontWeight: 'bold',
            transform: 'scale(1.05)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }),
          
          // Style booked days 
          ...(isBooked && {
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '3px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: 'error.main',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 0, 0, 0.3)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.4)',
              },
            },
          }),
          
          // Style days that are both selected and booked
          ...(isSelected && isBooked && {
            backgroundColor: 'error.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
          }),
          
          // Add hover effect for available dates
          ...(!isBooked && !isSelected && {
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              transform: 'scale(1.05)',
            },
          }),
        }}
      />
    </Tooltip>
  );
};

const BookingPage: React.FC = () => {
  // State för formulärdata
  const [activeStep, setActiveStep] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [parking, setParking] = useState(false);
  
  // State för valideringsfel
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State för befintliga bokningar
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  // FullCalendar-komponenten
  const calendarRef = useRef<any>(null);

  // Flytta hooks till komponentnivån
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Använd Authentication context
  const { isLoggedIn, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Admin-specific state variables
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [backupLoading, setBackupLoading] = useState(false);
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);

  // Hämta befintliga bokningar när komponenten laddas
  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const bookings = await bookingService.getAllBookings();
      console.log('Hämtade bokningar:', bookings); // Logga bokningarna
      
      if (!bookings || bookings.length === 0) {
        console.log('Inga bokningar hittades');
        setExistingBookings([]);
        setCalendarEvents([]);
        setLoadingBookings(false);
        return;
      }
      
      // Normalisera bokningarna för att se till att de använder kamelnotation 
      const normalizedBookings = bookings.map(booking => ({
        ...booking,
        startDate: booking.startDate || booking.startdate, // Använd startDate om det finns, annars startdate
        endDate: booking.endDate || booking.enddate, // Använd endDate om det finns, annars enddate
      }));
      
      console.log('Normaliserade bokningar:', normalizedBookings);
      setExistingBookings(normalizedBookings);
      
      // Konvertera bokningar till FullCalendar-format
      const events = normalizedBookings
        .map(booking => {
          // Logga varje bokning som konverteras
          console.log('Konverterar bokning till händelse:', booking.id, booking.startDate, booking.endDate);
          
          try {
            // Kontrollera att datumen finns innan vi skapar Date-objekt
            if (!booking.startDate || !booking.endDate) {
              console.warn('Saknar datum i bokning:', booking.id, 'startDate:', booking.startDate, 'endDate:', booking.endDate);
              return null;
            }
            
            const startDateObj = new Date(booking.startDate);
            const endDateObj = new Date(booking.endDate);
            
            // Kontrollera att datumen är giltiga
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
              console.warn('Ogiltiga datum i bokning:', booking.id, booking.startDate, booking.endDate);
              return null;
            }
            
            return {
              title: booking.name,
              start: booking.startDate,
              end: booking.endDate,
              backgroundColor: '#ffcccc',
              borderColor: '#ff8888',
              textColor: '#222222',
              display: 'block',
              extendedProps: {
                bookingId: booking.id,
                bookerName: booking.name,
                bookerEmail: booking.email,
                bookerPhone: booking.phone || '',
                dates: (() => {
                  try {
                    // Försök parsa och formatera datumen, annars använd standardvärden
                    const startFormatted = booking.startDate ? format(startDateObj, 'dd/MM', { locale: sv }) : 'N/A';
                    const endFormatted = booking.endDate ? format(endDateObj, 'dd/MM', { locale: sv }) : 'N/A';
                    return `${startFormatted} - ${endFormatted}`;
                  } catch (error) {
                    console.warn('Invalid date in booking:', booking.id);
                    return 'Ogiltigt datumformat';
                  }
                })()
              }
            };
          } catch (e) {
            console.error('Fel vid konvertering av bokning till kalenderhändelse:', e);
            return null;
          }
        })
        .filter(event => event !== null); // Filtrera bort händelser som är null
        
      console.log('Kalenderhändelser efter filtrering:', events.length); // Logga kalenderhändelserna
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    // Uppdatera FullCalendar när calendarEvents ändras
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(calendarEvents);
      calendarApi.render();
      console.log('FullCalendar uppdaterad med', calendarEvents.length, 'händelser');
    }
  }, [calendarEvents]);

  // Hämta lägenhetsinformation när komponenten monteras
  useEffect(() => {
    const fetchApartmentInfo = async () => {
      try {
        const page = await pageService.getPageBySlug('gastlagenhet');
        // Tyst felhantering - gör inget om sidan inte hittas
      } catch (error) {
        // Tyst felhantering
        console.log('Kunde inte hämta lägenhetsinformation, fortsätter utan den');
      }
    };

    fetchApartmentInfo();
  }, []);

  // Använd användardata om inloggad
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      // Säker åtkomst till phone-egenskapen med typkontroll
      setPhone((currentUser as any).phone || '');
    }
  }, [isLoggedIn, currentUser]);

  // Validering för e-post
  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // Validera datumvalet
  const validateDates = () => {
    const errors: Record<string, string> = {};
    
    if (!startDate) {
      errors.startDate = 'Välj ett ankomstdatum';
    }
    
    if (!endDate) {
      errors.endDate = 'Välj ett avresedatum';
    }
    
    if (startDate && endDate) {
      if (isAfter(startDate, endDate)) {
        errors.dateRange = 'Avresedatum måste vara efter ankomstdatum';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validera kontaktuppgifter
  const validateContactInfo = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Namn krävs';
    }
    
    if (!email.trim()) {
      errors.email = 'E-post krävs';
    } else if (!validateEmail(email)) {
      errors.email = 'Ogiltig e-postadress';
    }
    
    if (!phone.trim()) {
      errors.phone = 'Telefonnummer krävs';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validera hela formuläret
  const validateForm = () => {
    return validateDates() && validateContactInfo();
  };

  // Hantera nästa steg i formuläret - skicka bokning direkt
  const handleNext = async () => {
    if (!validateForm()) return;
    
    await submitBooking();
  };

  // Skicka in bokningen
  const submitBooking = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Kontrollera tillgänglighet först
      const availabilityCheck = await bookingService.checkAvailability(
        startDate.toISOString(), 
        endDate.toISOString()
      );
      
      if (!availabilityCheck.available) {
        setErrorMessage('De valda datumen är inte längre tillgängliga. Vänligen välj andra datum.');
        return;
      }
      
      // Skapa bokningen
      const booking = await bookingService.createBooking({
        name,
        email,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notes: notes,
        phone: phone,
        parking: parking
      });
      
      if (booking) {
        setSuccessMessage('Din bokning har bekräftats!');
        setActiveStep(1); // Gå till bekräftelsesteg
        
        // Ladda om bokningarna så att kalendern uppdateras
        await fetchBookings();
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setErrorMessage('Ett fel uppstod när bokningen skulle skapas. Försök igen senare.');
    } finally {
      setIsLoading(false);
    }
  };

  // Starta om bokningsprocessen
  const handleReset = () => {
    setActiveStep(0);
    setStartDate(null);
    setEndDate(null);
    setSuccessMessage('');
    setErrorMessage('');
    setValidationErrors({});
    setParking(false);
    
    // Återställ användardata enbart om användaren inte är inloggad
    if (!isLoggedIn) {
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
    }
    
    // Ladda om bokningar
    fetchBookings();
  };

  // Ny funktion för att rendera kalendern med maxbredd för desktop
  const renderCalendarWithMaxWidth = () => {
    return (
      <Box 
        sx={{ 
          mt: 2, 
          mb: 4,
          mx: 'auto', // Center the calendar
          maxWidth: { xs: '100%', sm: '100%', md: '600px', lg: '650px' }, // Limit width on larger screens
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2,
            borderRadius: 2,
            background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiDateCalendar-root': {
              width: '100%',
              maxWidth: '100%',
              height: 'auto',
            }
          }}
        >
          <LocalizationProvider 
            dateAdapter={AdapterDateFns} 
            adapterLocale={sv}
            localeText={{
              calendarWeekNumberText: (weekNumber) => `v${weekNumber}`,
              calendarWeekNumberAriaLabelText: (weekNumber) => `Vecka ${weekNumber}`
            }}
          >
            <DateCalendar
              value={startDate}
              onChange={(newDate) => {
                if (newDate) {
                  if (!startDate) {
                    setStartDate(newDate);
                  } else if (!endDate) {
                    // Om det valda datumet är före startDate, byt plats på dem
                    if (newDate < startDate) {
                      setEndDate(startDate);
                      setStartDate(newDate);
                    } else {
                      setEndDate(newDate);
                    }
                  } else {
                    // Om båda datum är satta, börja om med nytt startdatum
                    setStartDate(newDate);
                    setEndDate(null);
                  }
                }
              }}
              displayWeekNumber
              disablePast
              slots={{
                day: (props) => (
                  <CustomPickersDay 
                    {...props} 
                    selectedDays={[startDate, endDate].filter(Boolean)}
                    bookedDates={existingBookings}
                  />
                ),
              }}
              showDaysOutsideCurrentMonth
              sx={{
                width: '100%',
                '& .MuiPickersCalendarHeader-root': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: theme.spacing(1),
                  paddingBottom: 0
                },
                '& .MuiDayCalendar-weekContainer': {
                  justifyContent: 'space-between',
                  margin: '4px 0',
                  minHeight: isMobile ? '32px' : '44px'
                },
                '& .MuiPickersDay-root': {
                  width: isMobile ? '28px' : '40px',
                  height: isMobile ? '28px' : '40px',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  margin: '0',
                  padding: '0',
                  borderRadius: '50%',
                  fontWeight: 'medium',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    transition: 'background-color 0.2s, transform 0.1s',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  },
                  '&.Mui-disabled': {
                    color: theme.palette.text.disabled,
                    opacity: 0.5,
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  width: isMobile ? '28px' : '40px',
                  height: isMobile ? '28px' : '40px',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'primary.main',
                  fontWeight: 'bold',
                  margin: '0',
                  padding: '0',
                  textTransform: 'uppercase'
                },
                '& .MuiDayCalendar-header': {
                  justifyContent: 'space-between',
                  padding: '0 12px'
                },
                '& .MuiDateCalendar-root': {
                  maxHeight: 'none',
                  height: 'auto',
                  width: '100%',
                  margin: '0',
                  padding: '0 0 32px 0'
                },
                '& .MuiPickersCalendarHeader-label': {
                  textTransform: 'none',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'primary.dark',
                  '&.MuiTypography-root': {
                    '&::first-letter': {
                      textTransform: 'uppercase'
                    }
                  }
                },
                '& .MuiDayCalendar-monthContainer': {
                  minHeight: isMobile ? '360px' : '400px',
                  padding: '0 12px',
                  marginBottom: '24px'
                },
                '& .MuiDayCalendar-slideTransition': {
                  minHeight: isMobile ? '360px' : '400px'
                },
                '& .MuiPickersCalendarHeader-switchViewButton': {
                  display: 'none'
                },
                '& .MuiPickersArrowSwitcher-button': {
                  color: 'primary.main',
                },
                '& .MuiPickersArrowSwitcher-spacer': {
                  width: isMobile ? '8px' : '16px'
                },
                '& .MuiDayCalendar-weekNumber': {
                  width: isMobile ? '24px' : '32px',
                  height: isMobile ? '28px' : '40px',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  margin: '0',
                  padding: '0',
                  color: 'text.secondary',
                  fontWeight: 'bold'
                }
              }}
            />
          </LocalizationProvider>
        </Paper>
      </Box>
    );
  };

  // Grupera bokningar efter månad
  const groupBookingsByMonth = (bookings: Booking[]): Record<string, Booking[]> => {
    const groupedBookings: Record<string, Booking[]> = {};
    
    bookings.forEach(booking => {
      if (!booking.startDate) return;
      
      try {
        const date = new Date(booking.startDate);
        const month = format(date, 'yyyy-MM');
        
        if (!groupedBookings[month]) {
          groupedBookings[month] = [];
        }
        
        groupedBookings[month].push(booking);
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    });
    
    return groupedBookings;
  };
  
  // Sortera bokningar efter datum
  const sortBookingsByDate = (bookings: Booking[]): Booking[] => {
    return [...bookings].sort((a, b) => {
      if (!a.startDate || !b.startDate) return 0;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  };
  
  // Formatera månadsnamn
  const formatMonthName = (monthKey: string): string => {
    try {
      const date = parseISO(monthKey + '-01');
      return format(date, 'LLLL yyyy', { locale: sv });
    } catch (error) {
      return monthKey;
    }
  };
  
  // Kontrollera om en månad är i framtiden eller innevarande månad
  const isCurrentOrFutureMonth = (monthKey: string): boolean => {
    try {
      const date = parseISO(monthKey + '-01');
      return isThisMonth(date) || isFuture(date);
    } catch (error) {
      return false;
    }
  };
  
  // Beräkna totalt antal nätter för en månad
  const calculateTotalNights = (bookings: Booking[]): number => {
    return bookings.reduce((total, booking) => {
      if (!booking.startDate || !booking.endDate) return total;
      
      try {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        
        // Kontrollera att datumen är giltiga
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return total;
        }
        
        // Beräkna antal nätter (end date - start date)
        const nights = differenceInDays(endDate, startDate);
        return total + (nights > 0 ? nights : 0);
      } catch (error) {
        console.warn('Fel vid beräkning av nätter för bokning:', booking.id);
        return total;
      }
    }, 0);
  };
  
  // Beräkna intäkter för en bokning
  const calculateRevenueForBooking = (booking: Booking): number => {
    if (!booking.startDate || !booking.endDate) return 0;
    
    try {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      
      // Kontrollera att datumen är giltiga
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 0;
      }
      
      // Beräkna antal nätter
      const totalNights = differenceInDays(endDate, startDate);
      if (totalNights <= 0) return 0;
      
      let revenue = 0;
      
      // Definiera tennisveckorna (exempel - justera efter verkliga tennisveckor)
      const tennisWeeks = [27, 28, 29]; // Justera dessa veckor efter behov
      
      // Gå igenom varje natt och beräkna priset baserat på säsong
      const currentDate = new Date(startDate);
      for (let i = 0; i < totalNights; i++) {
        // Beräkna veckonummer (1-52)
        const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
        const pastDaysOfYear = (currentDate.getTime() - firstDayOfYear.getTime()) / 86400000;
        const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        
        // Pris baserat på säsong
        if (week >= 24 && week <= 32) {
          // Högsäsong
          if (tennisWeeks.includes(week)) {
            // Tennisveckor
            revenue += 800; // 800 kr per dygn under tennisveckorna
          } else {
            // Vanlig högsäsong
            revenue += 600; // 600 kr per dygn under högsäsong
          }
        } else {
          // Lågsäsong - vecka 1-23 samt vecka 33-52
          revenue += 400; // 400 kr per dygn under lågsäsong
        }
        
        // Gå till nästa dag
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Lägg till parkeringsavgift om bokningen inkluderar parkering
      if (booking.parking) {
        revenue += totalNights * 75; // 75 kr per dygn för parkering
      }
      
      return revenue;
    } catch (error) {
      console.warn('Fel vid beräkning av intäkter för bokning:', booking.id);
      return 0;
    }
  };
  
  // Beräkna intäkter för en månad baserat på säsongspriser
  const calculateRevenueForMonth = (bookings: Booking[]): number => {
    return bookings.reduce((total: number, booking: Booking) => {
      return total + calculateRevenueForBooking(booking);
    }, 0);
  };
  
  // Rendering av bokningslistan
  const renderBookingsList = () => {
    if (loadingBookings) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (existingBookings.length === 0) {
      return (
        <Alert severity="info" sx={{ 
          my: 4,
          backgroundColor: 'info.lighter',
          borderColor: 'info.light',
          border: '1px solid',
          borderRadius: 2
        }}>
          Inga bokningar hittades.
        </Alert>
      );
    }

    // Sortera och gruppera bokningar efter månad
    const bookingsToShow = isAdmin && searchTerm 
      ? filteredBookings
      : existingBookings;
    
    const groupedBookings = groupBookingsByMonth(bookingsToShow);
    
    // Sortera månader i kronologisk ordning
    const sortedMonthKeys = Object.keys(groupedBookings).sort();

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" sx={{ 
          mb: 3, 
          fontWeight: 'bold',
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            display: 'block',
            width: 3,
            height: 20,
            backgroundColor: 'primary.main',
            marginRight: 1.5,
            borderRadius: 1
          }
        }}>
          Bokningsstatus
        </Typography>
        
        {sortedMonthKeys.map(monthKey => {
          const bookingsInMonth = [...groupedBookings[monthKey]].sort((a, b) => {
            return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
          });
          
          // Kontrollera om detta är aktuell/framtida månad för att filtrera ut gamla
          const currentOrFuture = isCurrentOrFutureMonth(monthKey);
          if (!currentOrFuture) return null;
          
          const totalNights = calculateTotalNights(bookingsInMonth);
          const totalRevenue = calculateRevenueForMonth(bookingsInMonth);
          const isCurrentMonth = isThisMonth(new Date(monthKey));
          
          return (
            <Accordion
              key={monthKey}
              defaultExpanded={isCurrentMonth}
              sx={{ 
                mb: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderRadius: '8px !important',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: '0 0 24px 0', // Explicit margin to prevent collapsing
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  backgroundColor: isCurrentMonth ? 'primary.lighter' : 'background.default',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  minHeight: '56px',
                  '&.Mui-expanded': {
                    minHeight: '56px',
                    borderBottomColor: isCurrentMonth ? 'primary.light' : 'divider',
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  alignItems: 'center' 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ 
                      color: isCurrentMonth ? 'primary.dark' : 'text.primary',
                      fontWeight: isCurrentMonth ? 'bold' : 'medium',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {formatMonthName(monthKey)}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={`${bookingsInMonth.length} bokningar`} 
                      sx={{ 
                        ml: 1,
                        backgroundColor: isCurrentMonth ? 'primary.main' : 'action.selected',
                        color: isCurrentMonth ? 'white' : 'text.primary'
                      }} 
                    />
                  </Box>
                  
                  {isAdmin && (
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      alignItems: 'center'
                    }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'rgba(0, 0, 0, 0.03)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                          Nätter:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {totalNights}
                        </Typography>
                      </Box>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'rgba(76, 175, 80, 0.08)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                          Intäkt:
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 'bold', 
                          color: isCurrentMonth ? 'primary.dark' : 'success.dark'
                        }}>
                          {totalRevenue.toLocaleString()} kr
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: 'background.paper', p: { xs: 1, sm: 2 } }}>
                {/* Desktop view */}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <TableContainer>
                    <Table size="medium">
                      <TableHead>
                        <TableRow sx={{ 
                          bgcolor: 'rgba(0, 0, 0, 0.02)', 
                          '& th': { 
                            fontWeight: 'bold', 
                            color: 'text.primary' 
                          } 
                        }}>
                          <TableCell>Gäst</TableCell>
                          <TableCell>Ankomst</TableCell>
                          <TableCell>Avresa</TableCell>
                          <TableCell align="center">Vecka</TableCell>
                          <TableCell align="center">Nätter</TableCell>
                          <TableCell align="center">Parkering</TableCell>
                          {isAdmin && (
                            <>
                              <TableCell align="right">Intäkt</TableCell>
                              <TableCell align="right">Åtgärder</TableCell>
                            </>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bookingsInMonth.map(booking => {
                          // Calculate week number
                          const getWeekData = () => {
                            if (!booking.startDate) return { week: 0, bgcolor: "transparent" };
                            
                            const date = new Date(booking.startDate);
                            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                            const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
                            const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                            
                            let bgcolor = "transparent";
                            if (week >= 24 && week <= 32) {
                              if ([27, 28, 29].includes(week)) {
                                bgcolor = "rgba(255, 0, 0, 0.08)"; // Tennis weeks
                              } else {
                                bgcolor = "rgba(0, 128, 255, 0.08)"; // High season
                              }
                            } else {
                              bgcolor = "rgba(0, 0, 0, 0.03)"; // Low season
                            }
                            
                            return { week, bgcolor };
                          };
                          
                          const weekData = getWeekData();
                          const nights = calculateNights(booking);
                          
                          return (
                            <TableRow 
                              key={booking.id}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                  '& .action-buttons': {
                                    opacity: 1
                                  }
                                },
                                borderLeft: '4px solid',
                                borderLeftColor: weekData.bgcolor === 'rgba(255, 0, 0, 0.08)' 
                                  ? 'error.main' 
                                  : weekData.bgcolor === 'rgba(0, 128, 255, 0.08)' 
                                    ? 'primary.main' 
                                    : 'text.disabled'
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body1" component="div" sx={{ fontWeight: 'medium', mr: 1 }}>
                                      {booking.name}
                                    </Typography>
                                    {isAdmin && (
                                      <Tooltip title="Skicka e-post">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleEmailClick(booking.email || '')}
                                          sx={{ p: 0.5 }}
                                        >
                                          <EmailIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                  {isAdmin && (
                                    <Typography variant="caption" color="text.secondary">
                                      {booking.email}
                                    </Typography>
                                  )}
                                  {booking.notes && (
                                    <Tooltip title={booking.notes} placement="top-start">
                                      <Typography 
                                        variant="caption" 
                                        color="text.secondary"
                                        sx={{ 
                                          display: 'block', 
                                          mt: 0.5,
                                          maxWidth: '200px',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          cursor: 'default',
                                          '&:hover': { textDecoration: 'underline' },
                                          fontStyle: 'italic'
                                        }}
                                      >
                                        {booking.notes.substring(0, 30)}{booking.notes.length > 30 ? '...' : ''}
                                      </Typography>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {booking.startDate 
                                  ? format(new Date(booking.startDate), 'E d MMM', { locale: sv })
                                  : 'N/A'
                                }
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {booking.endDate 
                                  ? format(new Date(booking.endDate), 'E d MMM', { locale: sv })
                                  : 'N/A'
                                }
                              </TableCell>
                              <TableCell align="center">
                                {booking.startDate && (
                                  <Chip 
                                    size="small" 
                                    label={`v.${weekData.week}`} 
                                    sx={{ 
                                      backgroundColor: weekData.bgcolor,
                                      fontWeight: 'medium',
                                      minWidth: "50px"
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 'medium' }}>{nights}</TableCell>
                              <TableCell align="center">{renderParkingStatus(booking.parking)}</TableCell>
                              {isAdmin && (
                                <>
                                  <TableCell align="right">
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 'medium', 
                                      color: 'success.dark',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: 1
                                    }}>
                                      {calculateRevenueForBooking(booking).toLocaleString()} kr
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'flex-end',
                                      opacity: { sm: 0.7 },
                                      transition: 'opacity 0.2s',
                                      className: 'action-buttons'
                                    }}>
                                      <Tooltip title="Redigera bokning">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleEditClick(booking)}
                                          sx={{ mr: 1 }}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Radera bokning">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleDeleteClick(booking)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                
                {/* Mobile view */}
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  {bookingsInMonth.map(booking => {
                    // Calculate week number
                    const getWeekData = () => {
                      if (!booking.startDate) return { week: 0, bgcolor: "transparent" };
                      
                      const date = new Date(booking.startDate);
                      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
                      const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                      
                      let bgcolor = "transparent";
                      if (week >= 24 && week <= 32) {
                        if ([27, 28, 29].includes(week)) {
                          bgcolor = "rgba(255, 0, 0, 0.08)"; // Tennis weeks
                        } else {
                          bgcolor = "rgba(0, 128, 255, 0.08)"; // High season
                        }
                      } else {
                        bgcolor = "rgba(0, 0, 0, 0.03)"; // Low season
                      }
                      
                      return { week, bgcolor };
                    };
                    
                    const weekData = getWeekData();
                    const nights = booking.startDate && booking.endDate 
                      ? differenceInDays(new Date(booking.endDate), new Date(booking.startDate))
                      : 0;
                    
                    return (
                      <Paper 
                        key={booking.id} 
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          mb: 2, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 2,
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '4px',
                            backgroundColor: weekData.bgcolor === 'rgba(255, 0, 0, 0.08)' 
                              ? 'error.main' 
                              : weekData.bgcolor === 'rgba(0, 128, 255, 0.08)' 
                                ? 'primary.main' 
                                : 'text.disabled'
                          }
                        }}
                      >
                        <Grid container spacing={1.5}>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="subtitle1" sx={{ mr: 1, fontWeight: 'medium' }}>{booking.name}</Typography>
                                  {isAdmin && (
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEmailClick(booking.email || '')}
                                      sx={{ p: 0.25 }}
                                    >
                                      <EmailIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                                {isAdmin && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {booking.email}
                                  </Typography>
                                )}
                                {/* Add notes display to mobile view */}
                                {booking.notes && (
                                  <Tooltip title={booking.notes}>
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary"
                                      sx={{ 
                                        display: 'block', 
                                        mt: 0.5,
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        cursor: 'default',
                                        '&:hover': { textDecoration: 'underline' },
                                        fontStyle: 'italic'
                                      }}
                                    >
                                      <strong>Kommentar:</strong> {booking.notes.substring(0, 25)}{booking.notes.length > 25 ? '...' : ''}
                                    </Typography>
                                  </Tooltip>
                                )}
                              </Box>
                              {isAdmin && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 'medium', 
                                    color: 'success.dark',
                                    mr: 1.5,
                                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 10,
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {calculateRevenueForBooking(booking).toLocaleString()} kr
                                  </Typography>
                                  <Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditClick(booking)}
                                      sx={{ mr: 0.5 }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteClick(booking)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Box sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 2, 
                              mt: 1, 
                              pt: 1.5,
                              borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                            }}>
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                minWidth: '85px',
                              }}>
                                <Typography variant="caption" color="text.secondary">Ankomst</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {booking.startDate 
                                    ? format(new Date(booking.startDate), 'E d MMM', { locale: sv })
                                    : 'N/A'
                                  }
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                minWidth: '85px'
                              }}>
                                <Typography variant="caption" color="text.secondary">Avresa</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {booking.endDate 
                                    ? format(new Date(booking.endDate), 'E d MMM', { locale: sv })
                                    : 'N/A'
                                  }
                                </Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '50px'
                              }}>
                                <Typography variant="caption" color="text.secondary">Vecka</Typography>
                                <Chip 
                                  size="small" 
                                  label={`v.${weekData.week}`} 
                                  sx={{ 
                                    mt: 0.5,
                                    backgroundColor: weekData.bgcolor,
                                    minWidth: "40px",
                                    height: '20px',
                                    fontSize: '0.7rem'
                                  }}
                                />
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '50px'
                              }}>
                                <Typography variant="caption" color="text.secondary">Nätter</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium', mt: 0.5 }}>{nights}</Typography>
                              </Box>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '70px' 
                              }}>
                                <Typography variant="caption" color="text.secondary">Parkering</Typography>
                                <Box sx={{ mt: 0.5 }}>{renderParkingStatus(booking.parking)}</Box>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    );
                  })}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  // Rendera bokningsformuläret - endast för inloggade användare
  const renderBookingForm = () => {
    if (!isLoggedIn) {
      return (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            mb: 4, 
            background: 'linear-gradient(145deg, #ffffff, #f0f4f8)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Alert 
            severity="info" 
            icon={<LockOutlined />}
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(3, 169, 244, 0.08)',
              '.MuiAlert-icon': {
                color: 'primary.main'
              }
            }}
          >
            Du måste vara inloggad för att kunna boka lägenheten.
          </Alert>
          
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Logga in för att boka
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
              För att boka lägenheten behöver du vara inloggad.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/login"
              sx={{ 
                mt: 1,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              Logga in
            </Button>
          </Box>
        </Paper>
      );
    }
    
    if (activeStep === 0) {
      return (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3,
            borderRadius: 2,
            mb: 4,
            background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}
        >
          {/* Typography heading "Gör din bokning" removed */}
          
          {startDate && endDate && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'primary.lighter', 
              borderRadius: 1, 
              border: '1px solid', 
              borderColor: 'primary.light', 
              mb: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.dark' }}>
                <strong>Bokningsöversikt:</strong>
              </Typography>
              <Typography variant="body2">
                <strong>Ankomst:</strong> {format(startDate, 'PPP', { locale: sv })}
              </Typography>
              <Typography variant="body2">
                <strong>Avresa:</strong> {format(endDate, 'PPP', { locale: sv })}
              </Typography>
              <Typography variant="body2">
                <strong>Antal nätter:</strong> {differenceInDays(endDate, startDate)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ 
            my: 2,
            "&::before, &::after": {
              borderColor: "primary.light",
            }
          }}>
            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
              Dina uppgifter
            </Typography>
          </Divider>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Namn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                variant="outlined"
                required
                error={!!validationErrors.name}
                helperText={validationErrors.name || ''}
                InputProps={{
                  startAdornment: <Person color="primary" sx={{ mr: 1 }} />,
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
            
            <Grid item xs={12} md={6}>
              <TextField
                label="E-post"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                variant="outlined"
                required
                error={!!validationErrors.email}
                helperText={validationErrors.email || ''}
                InputProps={{
                  startAdornment: <Email color="primary" sx={{ mr: 1 }} />,
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
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Telefon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
                variant="outlined"
                required
                error={!!validationErrors.phone}
                helperText={validationErrors.phone || ''}
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
                label="Meddelande (valfritt)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                variant="outlined"
                multiline
                rows={4}
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
                display: 'flex', 
                alignItems: 'center', 
                mt: 2,
                p: 2,
                bgcolor: 'success.lighter',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.light'
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={parking}
                      onChange={(e) => setParking(e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Typography sx={{ color: 'success.dark', fontWeight: 'medium' }}>
                      Jag vill boka parkering (75 kr/dygn)
                    </Typography>
                  }
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  Bekräfta bokning
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {errorMessage && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error" 
                sx={{ 
                  backgroundColor: 'error.lighter',
                  borderColor: 'error.light',
                  border: '1px solid'
                }}
              >
                {errorMessage}
              </Alert>
            </Box>
          )}
        </Paper>
      );
    } else {
      return (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            textAlign: 'center', 
            mb: 4,
            background: 'linear-gradient(145deg, #e8f5e9, #f1f8e9)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}
        >
          {successMessage && (
            <Alert 
              severity="success" 
              icon={<Check fontSize="inherit" />} 
              sx={{ 
                mb: 3,
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                borderColor: 'success.light',
                border: '1px solid'
              }}
            >
              {successMessage}
            </Alert>
          )}
          
          <Typography variant="h5" gutterBottom sx={{ color: 'success.dark', fontWeight: 'bold' }}>
            Bokning klar!
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            Din bokning har bekräftats.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleReset}
            sx={{ 
              mt: 2,
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            Gör en ny bokning
          </Button>
        </Paper>
      );
    }
  };

  // Hjälpfunktion för att visa parkeringsstatus
  const renderParkingStatus = (parkingValue: any) => {
    console.log(`Parkering:`, parkingValue, typeof parkingValue);
    
    // Om det är ett booleskt värde
    if (parkingValue === true) {
      return <Chip color="success" label="Ja" size="small" />;
    }
    
    if (parkingValue === false) {
      return <Chip color="error" label="Nej" size="small" />;
    }
    
    // Om det är en sträng
    if (typeof parkingValue === 'string') {
      const val = parkingValue.toLowerCase().trim();
      if (val === 'ja' || val === 'yes' || val === 'true' || val === 't') {
        return <Chip color="success" label="Ja" size="small" />;
      }
      if (val === 'nej' || val === 'no' || val === 'false' || val === 'f') {
        return <Chip color="error" label="Nej" size="small" />;
      }
    }
    
    // Om inget av ovanstående matchar
    return <Chip color="default" label="Ej angivet" size="small" />;
  };

  // Admin functionality
  
  // Öppna dialog för att radera bokning
  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  // Stäng raderingsdialogrutan
  const handleDeleteCancel = () => {
    setBookingToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Bekräfta radering av bokning
  const handleDeleteConfirm = async () => {
    if (!bookingToDelete) return;
    
    try {
      const success = await bookingService.deleteBooking(bookingToDelete.id);
      
      if (success) {
        // Uppdatera listan
        setExistingBookings(prevBookings => 
          prevBookings.filter(b => b.id !== bookingToDelete.id)
        );
        
        setSnackbarMessage('Bokningen har raderats');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Kunde inte radera bokningen');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      setSnackbarMessage('Ett fel uppstod vid radering av bokningen');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
      setBookingToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Stäng snackbaren
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Skicka e-post till gästen
  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Hantera backup
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/backup/send-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Kunde inte skicka backup');
      }

      const data = await response.json();
      setSnackbarMessage(`Backup skickad! ${data.bookingCount} bokningar exporterades.`);
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Fel vid backup:', error);
      setSnackbarMessage('Kunde inte skicka backup');
      setSnackbarSeverity('error');
    } finally {
      setBackupLoading(false);
      setSnackbarOpen(true);
    }
  };

  const handleEditClick = (booking: Booking) => {
    setBookingToEdit(booking);
    // Populera formuläret med bokningsdata
    setEditName(booking.name || '');
    setEditEmail(booking.email || '');
    setEditPhone(booking.phone || '');
    setEditNotes(booking.notes || '');
    setEditStartDate(booking.startDate || '');
    setEditEndDate(booking.endDate || '');
    setEditParking(booking.parking || false);
    setEditDialogOpen(true);
  };

  const handleEditCancel = () => {
    setBookingToEdit(null);
    setEditDialogOpen(false);
  };

  const handleEditConfirm = async () => {
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
      
      // Remove email validation requirement
      // Email can now be empty or not formatted as an email
      
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
      const result = await bookingService.updateBooking(updatedBooking.id, updatedBooking);
      
      if (result) {
        // Uppdatera lokalt state
        setExistingBookings(prev => 
          prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)
        );
        
        setSnackbarMessage('Bokningen har uppdaterats');
        setSnackbarSeverity('success');
        setEditDialogOpen(false);
        
        // Uppdatera filtrerade bokningar om de används (för admin)
        setFilteredBookings(prev => 
          prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)
        );
      } else {
        setSnackbarMessage('Kunde inte uppdatera bokningen');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      setSnackbarMessage('Ett fel uppstod vid uppdatering av bokningen');
      setSnackbarSeverity('error');
    } finally {
      setEditLoading(false);
      setSnackbarOpen(true);
    }
  };

  const calculateYearlyTotalRevenue = (): number => {
    return existingBookings.reduce((total, booking) => {
      return total + calculateRevenueForBooking(booking);
    }, 0);
  };

  const calculateYearlyTotalNights = (): number => {
    return existingBookings.reduce((total, booking) => {
      return total + (calculateNights(booking) || 0);
    }, 0);
  };

  const calculateNights = (booking: Booking): number => {
    if (!booking.startDate || !booking.endDate) return 0;
    
    try {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 0;
      }
      
      const nights = differenceInDays(endDate, startDate);
      return nights > 0 ? nights : 0;
    } catch (error) {
      console.warn('Error calculating nights for booking:', booking.id);
      return 0;
    }
  };

  // Uppdatera filtrerade bokningar när söktermen ändras
  useEffect(() => {
    if (isAdmin) {
      const filtered = existingBookings.filter(booking => 
        booking.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBookings(filtered);
    }
  }, [searchTerm, existingBookings, isAdmin]);

  // In the render method for the admin section at the appropriate place
  const renderAdminControls = () => {
    if (!isAdmin) return null;
    
    const currentYear = new Date().getFullYear();
    
    return (
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ 
          p: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'rgba(255,255,255,0.3)'
          }}>
            <Typography variant="h6" sx={{ 
              color: 'primary.dark',
              fontWeight: 'bold',
            }}>
              Bokningsöversikt {currentYear}
            </Typography>
            <Box>
              <Tooltip title="Skicka backup-export">
                <IconButton 
                  onClick={handleBackup}
                  disabled={backupLoading}
                  color="primary"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.8)'
                    }
                  }}
                >
                  {backupLoading ? <CircularProgress size={24} /> : <BackupIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(145deg, #ffffff, #f0f4f8)'
                }}>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                    Antal bokade nätter
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    mt: 1,
                    color: 'primary.dark',
                    fontWeight: 'bold'
                  }}>
                    {calculateYearlyTotalNights()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(145deg, #ffffff, #f0f4f8)'
                }}>
                  <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 'medium' }}>
                    Totala intäkter {currentYear}
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    mt: 1,
                    color: 'success.dark',
                    fontWeight: 'bold'
                  }}>
                    {calculateYearlyTotalRevenue().toLocaleString()} kr
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          <TextField
            label="Sök bokningar"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sök på namn eller e-post"
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}
          />
        </Paper>
      </Box>
    );
  };

  // Add back the booking list section at the bottom of the page
  return (
    <Container maxWidth="lg">
      {/* Admin controls rendered conditionally based on isAdmin - moved to top */}
      {renderAdminControls()}
      
      <Box sx={{ 
        mb: 5, 
        mt: 3,
        background: 'linear-gradient(to bottom, rgba(240,248,255,0.8), rgba(230,240,250,0.4))',
        borderRadius: 3,
        p: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          color: 'primary.dark', 
          fontWeight: 600,
          borderBottom: '2px solid',
          borderColor: 'primary.light',
          pb: 1 
        }}>
          Boka boende
        </Typography>
         
        <Box sx={{ mt: 3, mb: 4 }}>
          <Stepper 
            activeStep={activeStep}
            sx={{
              '.MuiStepConnector-line': {
                borderColor: 'primary.light'
              },
              '.MuiStepIcon-root': {
                color: 'primary.light'
              },
              '.MuiStepIcon-root.Mui-active': {
                color: 'primary.main'
              },
              '.MuiStepIcon-root.Mui-completed': {
                color: 'success.main'
              }
            }}
          >
            {steps.map((label, index) => (
              <Step key={label} completed={activeStep > index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            {loadingBookings ? (
              <Alert severity="info" icon={<CircularProgress size={24} />} 
                sx={{ 
                  backgroundColor: 'info.lighter',
                  border: '1px solid',
                  borderColor: 'info.light',
                  borderRadius: 2
                }}
              >
                Laddar tillgänglighet...
              </Alert>
            ) : (
              <Alert severity="info" 
                sx={{ 
                  backgroundColor: 'info.lighter',
                  border: '1px solid',
                  borderColor: 'info.light',
                  borderRadius: 2
                }}
              >
                Välj ditt ankomst- och avresedatum. Redan bokade datum visas i rött.
              </Alert>
            )}
          </Grid>
          
          <Grid item xs={12}>
            {loadingBookings ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : renderCalendarWithMaxWidth()}
          </Grid>
          
          {/* Bokningsformulär - endast för inloggade */}
          <Grid item xs={12}>
            {renderBookingForm()}
          </Grid>
        </Grid>
        
        {/* Visa bokningslistan längst ner på sidan */}
        <Box sx={{ mt: 6, mb: 2 }}>
          <Divider sx={{ mb: 5 }} />
          
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 2, md: 4 }, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)'
            }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom 
              sx={{ 
                mb: 3, 
                color: 'primary.dark',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  display: 'block',
                  width: 4,
                  height: 24,
                  backgroundColor: 'primary.main',
                  marginRight: 2,
                  borderRadius: 1
                }
              }}
            >
              Aktuella bokningar
            </Typography>
            
            {/* Prisinfo */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: 'background.paper', 
              borderRadius: 1, 
              border: '1px solid rgba(0, 0, 0, 0.12)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <Typography variant="subtitle2" gutterBottom sx={{ 
                fontWeight: 'bold',
                color: 'text.primary',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 1
              }}>
                Priser (kr/dygn)
              </Typography>
              
              {/* Desktop view */}
              <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      height: '100%',
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      bgcolor: 'rgba(0, 128, 255, 0.05)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                        bgcolor: 'rgba(0, 128, 255, 0.08)'
                      }
                    }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', mr: 1.5, bgcolor: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" noWrap>
                          Högsäsong (v. 24-32)
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
                          600 kr
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      height: '100%',
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      bgcolor: 'rgba(255, 0, 0, 0.05)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                        bgcolor: 'rgba(255, 0, 0, 0.08)'
                      }
                    }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', mr: 1.5, bgcolor: 'error.main' }} />
                      <Box>
                        <Typography variant="body2" noWrap>
                          Tennisveckor (v. 27-29)
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'error.dark', fontWeight: 'bold' }}>
                          800 kr
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      height: '100%',
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      bgcolor: 'rgba(100, 100, 100, 0.05)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                        bgcolor: 'rgba(100, 100, 100, 0.08)'
                      }
                    }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', mr: 1.5, bgcolor: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" noWrap>
                          Lågsäsong (v. 1-23, 33-52)
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          400 kr
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      height: '100%',
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      bgcolor: 'rgba(76, 175, 80, 0.05)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                        bgcolor: 'rgba(76, 175, 80, 0.08)'
                      }
                    }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', mr: 1.5, bgcolor: 'success.main' }} />
                      <Box>
                        <Typography variant="body2" noWrap>
                          Parkering
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: 'success.dark', fontWeight: 'bold' }}>
                          75 kr/dygn
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Mobile view price table */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ border: 0, p: 1, pl: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', mr: 1, bgcolor: 'rgba(0, 128, 255, 0.2)' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Högsäsong</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: 0, p: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>v. 24-32</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 0, p: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>600 kr</Typography>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell sx={{ border: 0, p: 1, pl: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', mr: 1, bgcolor: 'rgba(255, 0, 0, 0.2)' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Tennisveckor</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: 0, p: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>v. 27-29</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 0, p: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>800 kr</Typography>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell sx={{ border: 0, p: 1, pl: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', mr: 1, bgcolor: 'rgba(0, 0, 0, 0.1)' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Lågsäsong</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: 0, p: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>v. 1-23, 33-52</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 0, p: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>400 kr</Typography>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell sx={{ border: 0, p: 1, pl: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', mr: 1, bgcolor: 'rgba(76, 175, 80, 0.2)' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Parkering</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ border: 0, p: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>per dygn</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 0, p: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>75 kr</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
            
            {renderBookingsList()}
          </Paper>
        </Box>
      </Box>
      
      {/* Admin Dialogs */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'error.lighter', 
          color: 'error.dark',
          fontWeight: 'bold',
          borderBottom: '1px solid',
          borderColor: 'error.light'
        }}>
          Radera bokning
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            Är du säker på att du vill radera bokningen för {bookingToDelete?.name}?
            Detta kan inte ångras.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleDeleteCancel} 
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
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error" 
            autoFocus
            sx={{ 
              borderRadius: 1,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            Radera
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditCancel}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
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
            onClick={handleEditCancel}
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
            onClick={handleEditConfirm} 
            variant="contained" 
            color="primary"
            disabled={editLoading}
            sx={{ 
              borderRadius: 1,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            {editLoading ? <CircularProgress size={24} /> : "Spara"}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BookingPage; 