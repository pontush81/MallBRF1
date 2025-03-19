import React, { useState, useEffect } from 'react';
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
import { format, addDays, isAfter, differenceInDays, isWithinInterval, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarMonth, Person, Email, Check } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
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
  
  // State för lägenhetsinformation
  const [apartmentInfo, setApartmentInfo] = useState<{
    title: string;
    content: string;
    files: any[];
  } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Hämta befintliga bokningar när komponenten laddas
  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const bookings = await bookingService.getAllBookings();
      setExistingBookings(bookings);
      
      // Konvertera bokningar till FullCalendar-format
      const events = bookings
        .filter(booking => booking.status !== 'cancelled')
        .map(booking => ({
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
            dates: `${format(new Date(booking.startDate), 'dd/MM', { locale: sv })} - ${format(new Date(booking.endDate), 'dd/MM', { locale: sv })}`
          }
        }));
        
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

  // Hämta lägenhetsinformation när komponenten monteras
  useEffect(() => {
    const fetchApartmentInfo = async () => {
      try {
        setLoadingInfo(true);
        const page = await pageService.getPageBySlug('lagenhet-info');
        if (page) {
          setApartmentInfo({
            title: page.title,
            content: page.content,
            files: page.files || []
          });
        }
      } catch (error) {
        console.error('Failed to fetch apartment info:', error);
      } finally {
        setLoadingInfo(false);
      }
    };
    
    fetchApartmentInfo();
  }, []);

  // Funktion för att kontrollera om ett datum är upptaget
  const isDateBooked = (date: Date) => {
    if (!existingBookings.length || !date) return false;
    
    return existingBookings.some(booking => {
      // Ignorera avbokade bokningar
      if (booking.status === 'cancelled') return false;
      
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return isWithinInterval(date, { start: bookingStart, end: bookingEnd });
    });
  };
  
  // Funktion för att hantera klick på kalender
  const handleDateClick = (info: {date: Date}) => {
    const clickedDate = new Date(info.date);
    
    // Om datumet redan är bokat, gör ingenting
    if (isDateBooked(clickedDate)) {
      return;
    }
    
    if (!startDate || (startDate && endDate)) {
      // Om ingen start-datum finns eller båda datum finns, sätt ett nytt start-datum
      setStartDate(clickedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Om start-datum finns men inte slut-datum
      if (isAfter(clickedDate, startDate)) {
        setEndDate(clickedDate);
      } else {
        // Om användaren klickar på ett datum före start-datumet, byt plats
        setEndDate(startDate);
        setStartDate(clickedDate);
      }
    }
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

  // Rendera valda datum som selected i kalendern
  const getSelectedDateEvents = () => {
    const selectedEvents = [];
    
    if (startDate) {
      selectedEvents.push({
        title: 'Ankomst',
        start: startDate,
        display: 'block',
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        textColor: '#ffffff'
      });
    }
    
    if (endDate) {
      selectedEvents.push({
        title: 'Avresa',
        start: endDate,
        display: 'block',
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        textColor: '#ffffff'
      });
    }
    
    // Om både start och slut är valda, lägg till alla dagar däremellan
    if (startDate && endDate) {
      const dayAfterStart = addDays(startDate, 1);
      const dayBeforeEnd = addDays(endDate, -1);
      
      if (isAfter(dayBeforeEnd, dayAfterStart)) {
        selectedEvents.push({
          title: 'Vald period',
          start: dayAfterStart,
          end: addDays(dayBeforeEnd, 1), // FullCalendar behöver exklusivt slutdatum
          display: 'background',
          backgroundColor: 'rgba(25, 118, 210, 0.2)'
        });
      }
    }
    
    return selectedEvents;
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
              <Typography variant="body2" gutterBottom>
                Nedan kan du se alla bokade datum (markerade i rött). Veckonummer visas till vänster. Klicka på kalendern för att välja datum.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ 
                p: { xs: 0.5, sm: 1 }, 
                boxShadow: 2,
                borderRadius: 2,
                '.fc-view-harness': {
                  minHeight: { xs: '300px', sm: '400px', md: '500px' }
                },
                '.fc-day-today': {
                  backgroundColor: 'rgba(25, 118, 210, 0.05) !important'
                },
                '.fc-day-today.fc-day-other': {
                  backgroundColor: 'rgba(25, 118, 210, 0.02) !important'
                },
                '.fc .fc-col-header-cell-cushion': {
                  color: 'inherit',
                  textDecoration: 'none'
                },
                '.fc .fc-daygrid-day-number': {
                  color: 'inherit',
                  textDecoration: 'none',
                  padding: '4px 8px'
                },
                '.fc .fc-daygrid-day.fc-day-today': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                },
                // Responsiva stilar för mobil
                '.fc .fc-toolbar': {
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 }
                },
                '.fc .fc-toolbar-title': {
                  fontSize: { xs: '1.2rem', sm: '1.5rem' }
                },
                // Stil för bokningsevent
                '.fc-event': {
                  borderRadius: '4px',
                  padding: '2px 4px',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                },
                // Hover effekt för event
                '.fc-event:hover': {
                  filter: 'brightness(0.9)'
                }
              }}>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale={svLocale}
                  headerToolbar={{
                    left: 'prev,next',
                    center: 'title',
                    right: ''
                  }}
                  events={[...calendarEvents, ...getSelectedDateEvents()]}
                  dateClick={handleDateClick}
                  weekNumbers={true}
                  weekNumberFormat={{ week: 'numeric' }}
                  firstDay={1} // Måndag som första dag
                  height="auto"
                  fixedWeekCount={false}
                  eventContent={(eventInfo) => {
                    if (eventInfo.event.display === 'background') {
                      return null; // Bakgrundsevents visar ingen text
                    }
                    
                    // Hämta utökad information från event
                    const extendedProps = eventInfo.event.extendedProps || {};
                    
                    // Om det är ett bokningsevent (har bookerName)
                    if (extendedProps.bookerName) {
                      return (
                        <Tooltip 
                          title={
                            <React.Fragment>
                              <Typography variant="subtitle2">{extendedProps.bookerName}</Typography>
                              <Typography variant="body2">
                                {extendedProps.dates}
                              </Typography>
                              {extendedProps.bookerPhone && (
                                <Typography variant="body2">
                                  Tel: {extendedProps.bookerPhone}
                                </Typography>
                              )}
                            </React.Fragment>
                          } 
                          arrow
                          placement="top"
                        >
                          <Box sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%'
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {extendedProps.bookerName}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    }
                    
                    // För valda datum (Ankomst/Avresa)
                    return (
                      <Tooltip title={eventInfo.event.title} arrow>
                        <div className="fc-event-title">{eventInfo.event.title}</div>
                      </Tooltip>
                    );
                  }}
                  // Gör kalendern mer responsiv
                  windowResize={(view) => {
                    const calendarEl = document.querySelector('.fc');
                    if (calendarEl && window.innerWidth < 768) {
                      const fc = calendarEl as HTMLElement;
                      fc.style.fontSize = '0.8rem';
                    } else if (calendarEl) {
                      const fc = calendarEl as HTMLElement;
                      fc.style.fontSize = '1rem';
                    }
                  }}
                />
              </Box>
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