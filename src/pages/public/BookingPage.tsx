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
  Checkbox
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isAfter, differenceInDays, parseISO, isThisMonth, isFuture, isBefore, startOfMonth, endOfMonth, getMonth, getYear, addMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Person, Email, Check, ExpandMore, LockOutlined } from '@mui/icons-material';
import bookingService from '../../services/bookingService';
import { Booking } from '../../types/Booking';
import pageService from '../../services/pageService';
import { useAuth } from '../../context/AuthContext';

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
    >
      <PickersDay
        {...other}
        selected={isSelected}
        sx={{
          ...(isBooked && {
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 0, 0, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.4)',
              },
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
  const { isLoggedIn, currentUser } = useAuth();
  const navigate = useNavigate();

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
                  color: theme.palette.text.secondary,
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
                  fontWeight: 500,
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
                '& .MuiPickersArrowSwitcher-spacer': {
                  width: isMobile ? '8px' : '16px'
                },
                '& .MuiDayCalendar-weekNumber': {
                  width: isMobile ? '24px' : '32px',
                  height: isMobile ? '28px' : '40px',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  margin: '0',
                  padding: '0',
                  color: theme.palette.text.secondary
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
  
  // Rendering av bokningslistan
  const renderBookingsList = () => {
    if (loadingBookings) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (existingBookings.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 4, mb: 4 }}>
          Inga bokningar hittades.
        </Alert>
      );
    }
    
    const sortedBookings = sortBookingsByDate(existingBookings);
    const groupedBookings = groupBookingsByMonth(sortedBookings);
    
    // Sortera månadsnycklarna så att aktuell månad kommer först, 
    // sedan framtida månader i kronologisk ordning, 
    // sedan tidigare månader i omvänd kronologisk ordning
    const sortedMonthKeys = Object.keys(groupedBookings).sort((a, b) => {
      const dateA = parseISO(a + '-01');
      const dateB = parseISO(b + '-01');
      const now = new Date();
      const currentMonth = startOfMonth(now);
      
      // Om en månad är aktuell, prioritera den
      if (a === format(currentMonth, 'yyyy-MM')) return -1;
      if (b === format(currentMonth, 'yyyy-MM')) return 1;
      
      // Annars sortera framtida först, sedan tidigare
      const aIsFuture = isAfter(dateA, currentMonth);
      const bIsFuture = isAfter(dateB, currentMonth);
      
      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;
      
      // För framtida månader, sortera i kronologisk ordning
      if (aIsFuture && bIsFuture) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // För tidigare månader, sortera i omvänd kronologisk ordning
      return dateB.getTime() - dateA.getTime();
    });
    
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Här kan du se alla bokningar som är inplanerade. Tidigare månader är ihopfällda.
        </Typography>
        
        {sortedMonthKeys.map(monthKey => {
          const bookingsInMonth = [...groupedBookings[monthKey]].sort((a, b) => {
            if (!a.startDate || !b.startDate) return 0;
            
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            const now = new Date();
            
            // Om båda bokningarna är i framtiden, visa den närmast i tiden först
            if (dateA > now && dateB > now) {
              return dateA.getTime() - dateB.getTime();
            }
            
            // Om en är i framtiden, visa den först
            if (dateA > now) return -1;
            if (dateB > now) return 1;
            
            // Annars visa den senaste först
            return dateB.getTime() - dateA.getTime();
          });
          
          const isExpanded = isCurrentOrFutureMonth(monthKey);
          const isPastMonth = !isExpanded;
          
          return (
            <Accordion 
              key={monthKey} 
              defaultExpanded={isExpanded}
              sx={{ 
                mb: 2,
                '&.MuiAccordion-root': {
                  borderRadius: 1,
                  boxShadow: 1,
                },
                ...(isPastMonth && {
                  opacity: 0.85,
                  '& .MuiAccordionSummary-root': {
                    backgroundColor: 'grey.300',
                    color: 'text.primary'
                  }
                })
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ 
                  backgroundColor: isExpanded ? 'primary.light' : 'grey.300',
                  color: isExpanded ? 'primary.contrastText' : 'text.primary',
                  '&:hover': { 
                    backgroundColor: isExpanded ? 'primary.main' : 'grey.400' 
                  },
                }}
              >
                <Typography sx={{ fontWeight: isExpanded ? 'bold' : 'normal' }}>
                  {formatMonthName(monthKey)}
                  <Chip 
                    label={`${bookingsInMonth.length} bokning${bookingsInMonth.length !== 1 ? 'ar' : ''}`} 
                    size="small" 
                    sx={{ 
                      ml: 1, 
                      backgroundColor: isExpanded 
                        ? 'rgba(255,255,255,0.3)' 
                        : 'rgba(0,0,0,0.08)'
                    }}
                    color={isExpanded ? "primary" : "default"}
                    variant={isExpanded ? "filled" : "outlined"}
                  />
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ankomst</TableCell>
                        <TableCell>Avresa</TableCell>
                        <TableCell>Namn</TableCell>
                        <TableCell align="center">Nätter</TableCell>
                        <TableCell align="center">Parkering</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookingsInMonth.map(booking => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            {booking.startDate 
                              ? format(new Date(booking.startDate), 'E d MMM', { locale: sv })
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            {booking.endDate 
                              ? format(new Date(booking.endDate), 'E d MMM', { locale: sv })
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>{booking.name}</TableCell>
                          <TableCell align="center">
                            {booking.startDate && booking.endDate
                              ? differenceInDays(new Date(booking.endDate), new Date(booking.startDate))
                              : '-'
                            }
                          </TableCell>
                          <TableCell align="center">
                            {renderParkingStatus(booking.parking)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Alert 
            severity="info" 
            icon={<LockOutlined />}
            sx={{ mb: 3 }}
          >
            Du måste vara inloggad för att kunna boka lägenheten.
          </Alert>
          
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="h6" gutterBottom>
              Logga in för att boka
            </Typography>
            <Typography variant="body1" paragraph>
              För att boka lägenheten behöver du vara inloggad.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/login"
              sx={{ mt: 1 }}
            >
              Logga in
            </Button>
          </Box>
        </Paper>
      );
    }
    
    if (activeStep === 0) {
      return (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Gör din bokning
          </Typography>
          
          {startDate && endDate && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0', mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
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

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
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
                  startAdornment: <Person color="action" sx={{ mr: 1 }} />,
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
                  startAdornment: <Email color="action" sx={{ mr: 1 }} />,
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
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={parking}
                      onChange={(e) => setParking(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Jag vill boka parkering"
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
                >
                  Bekräfta bokning
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {errorMessage && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">{errorMessage}</Alert>
            </Box>
          )}
        </Paper>
      );
    } else {
      return (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, textAlign: 'center', mb: 4 }}>
          {successMessage && (
            <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}
          
          <Typography variant="h5" gutterBottom color="primary">
            Bokning klar!
          </Typography>
          
          <Typography variant="body1" paragraph>
            Din bokning har bekräftats.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleReset}
            sx={{ mt: 2 }}
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 5, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Boka boende
        </Typography>
         
        <Box sx={{ mt: 3, mb: 4 }}>
          <Stepper activeStep={activeStep}>
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
              <Alert severity="info" icon={<CircularProgress size={24} />}>
                Laddar tillgänglighet...
              </Alert>
            ) : (
              <Alert severity="info">
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
          
          <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
              Aktuella bokningar
            </Typography>
            {renderBookingsList()}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default BookingPage; 