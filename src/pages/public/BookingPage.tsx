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
  Tooltip
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, isAfter, differenceInDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Person, Email, Check } from '@mui/icons-material';
// FullCalendar-komponenter
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import svLocale from '@fullcalendar/core/locales/sv';

import bookingService from '../../services/bookingService';
import { Booking } from '../../types/Booking';
import pageService from '../../services/pageService';

// Förenklade steg i bokningsprocessen
const steps = ['Välj datum och dina uppgifter', 'Klar'];

const BookingPage: React.FC = () => {
  // State för formulärdata
  const [activeStep, setActiveStep] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // State för valideringsfel
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // State för befintliga bokningar
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  // FullCalendar-komponenten
  const calendarRef = useRef<any>(null);

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
        .filter(booking => {
          if (booking.status === 'cancelled') {
            console.log('Filtrerar bort avbokad bokning:', booking.id);
            return false;
          }
          return true;
        })
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
              title: `${booking.name}`,
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
        // setLoadingInfo(true);
        const page = await pageService.getPageBySlug('lagenhet-info');
        if (page) {
          // setApartmentInfo({
          //   title: page.title,
          //   content: page.content,
          //   files: page.files || []
          // });
        }
      } catch (error) {
        console.error('Failed to fetch apartment info:', error);
      } finally {
        // setLoadingInfo(false);
      }
    };
    
    fetchApartmentInfo();
  }, []);

  // Funktion för att kontrollera om ett datum är upptaget
  const isDateBooked = (date: Date) => {
    if (!existingBookings.length || !date) return false;
    
    console.log('Checking availability for date:', format(date, 'yyyy-MM-dd'));
    
    return existingBookings.some(booking => {
      // Ignorera avbokade bokningar
      if (booking.status === 'cancelled') return false;
      
      try {
        if (!booking.startDate || !booking.endDate) return false;
        
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        
        // Kontrollera att datumen är giltiga
        if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
          console.warn('Ogiltiga datum i bokning vid kontroll:', booking.id, booking.startDate, booking.endDate);
          return false;
        }
        
        // Justera datum för att jämföra enbart datum (inte tid)
        const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startDate = new Date(bookingStart.getFullYear(), bookingStart.getMonth(), bookingStart.getDate());
        const endDate = new Date(bookingEnd.getFullYear(), bookingEnd.getMonth(), bookingEnd.getDate());
        
        // Kontrollera om datum är inom intervallet (inklusive start- och slutdatum)
        const result = dateToCheck >= startDate && dateToCheck <= endDate;
        
        if (result) {
          console.log('Date is booked:', format(date, 'yyyy-MM-dd'), 'by booking:', booking.id);
        }
        return result;
      } catch (error) {
        console.error('Error checking date availability:', error, booking);
        return false;
      }
    });
  };
  
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
        phone: phone
      });
      
      if (booking) {
        setBookingId(booking.id);
      }
      setSuccessMessage('Din bokning har bekräftats!');
      setActiveStep(1); // Gå till bekräftelsesteg
      
      // Ladda om bokningarna så att kalendern uppdateras
      await fetchBookings();
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
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setSuccessMessage('');
    setBookingId(null);
    setValidationErrors({});
    setErrorMessage('');
  };

  // Hantera val av datumintervall i kalendern
  const handleDateRangeSelect = (dateRange: Date[]) => {
    if (dateRange.length < 2) return;
    
    // Första datumet är startdatum, andra är slutdatum (exklusive)
    const startDateSelected = dateRange[0];
    // Slutdatumet som kommer från FullCalendar är exklusivt, så vi subtraherar en dag
    const endDateSelected = new Date(dateRange[1]);
    endDateSelected.setDate(endDateSelected.getDate() - 1);
    
    console.log('Datumintervall valt:', format(startDateSelected, 'yyyy-MM-dd'), 'till', format(endDateSelected, 'yyyy-MM-dd'));
    
    // Uppdatera datumväljarna
    setStartDate(startDateSelected);
    setEndDate(endDateSelected);
    
    // Rensa eventuella felmeddelanden
    setValidationErrors(prev => ({ ...prev, dates: '' }));
  };

  // Visa olika innehåll beroende på aktivt steg
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
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
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
                <DatePicker
                  label="Ankomstdatum"
                  value={startDate}
                  onChange={setStartDate}
                  disablePast
                  shouldDisableDate={isDateBooked}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      variant: "outlined",
                      error: !!validationErrors.startDate,
                      helperText: validationErrors.startDate || '',
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
                <DatePicker
                  label="Avresedatum"
                  value={endDate}
                  onChange={setEndDate}
                  disablePast
                  shouldDisableDate={isDateBooked}
                  minDate={startDate ? addDays(startDate, 1) : undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      variant: "outlined",
                      error: !!validationErrors.endDate,
                      helperText: validationErrors.endDate || '',
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            {validationErrors.dateRange && (
              <Grid item xs={12}>
                <Alert severity="error">{validationErrors.dateRange}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Dina uppgifter
                </Typography>
              </Divider>
            </Grid>

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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
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

            {startDate && endDate && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
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
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Bokningskalender
                </Typography>
              </Divider>
              <Typography variant="h6" sx={{ mt: 5, mb: 2 }}>
                Nedan kan du se alla bokade datum (markerade i rött). Veckonummer visas till vänster. Klicka på kalendern för att välja datum.
              </Typography>

              {loadingBookings ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ mt: 2, mb: 4 }}>
                  <Paper elevation={3} sx={{ p: 2 }}>
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      locale={svLocale}
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth'
                      }}
                      height="auto"
                      events={calendarEvents}
                      weekNumbers={true}
                      weekNumberCalculation="ISO"
                      selectable={true}
                      select={(info) => {
                        // Hantera klick i kalendern
                        handleDateRangeSelect([info.start, info.end]);
                      }}
                      eventContent={(eventInfo) => {
                        return (
                          <Tooltip title={`${eventInfo.event.extendedProps.bookerName}: ${eventInfo.event.extendedProps.dates}`}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <b>{eventInfo.timeText}</b>
                              <i>{eventInfo.event.title}</i>
                            </div>
                          </Tooltip>
                        );
                      }}
                    />
                  </Paper>
                </Box>
              )}
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} textAlign="center">
              {successMessage && (
                <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ mb: 3 }}>
                  {successMessage}
                </Alert>
              )}
              
              <Typography variant="h5" gutterBottom color="primary">
                Tack för din bokning!
              </Typography>
              
              <Typography variant="body1" paragraph>
                Din bokning har registrerats och vi har skickat en bekräftelse till din e-post.
                {bookingId && (
                  <Box component="span" sx={{ display: 'block', mt: 1 }}>
                    Bokningsnummer: <strong>{bookingId}</strong>
                  </Box>
                )}
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleReset}
                sx={{ mt: 2 }}
              >
                Gör en ny bokning
              </Button>
            </Grid>
          </Grid>
        );
      
      default:
        return 'Okänt steg';
    }
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
          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
              {getStepContent(activeStep)}
              
              {errorMessage && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="error">{errorMessage}</Alert>
                </Box>
              )}
            </Paper>
          </Grid>
          
          
        </Grid>
      </Box>
    </Container>
  );
};

export default BookingPage; 