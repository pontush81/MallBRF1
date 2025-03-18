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
  CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, isAfter, differenceInDays, isWithinInterval, isWeekend } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CalendarMonth, Person, Email, Check } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

import bookingService from '../../services/bookingService';
import { Booking } from '../../types/Booking';
import pageService from '../../services/pageService';

// Stegen i bokningsprocessen
const steps = ['Välj datum', 'Dina uppgifter', 'Bekräftelse', 'Klar'];

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
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  // State för lägenhetsinformation
  const [apartmentInfo, setApartmentInfo] = useState<{
    title: string;
    content: string;
    files: any[];
  } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Hämta befintliga bokningar när komponenten laddas
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        const bookings = await bookingService.getAllBookings();
        setExistingBookings(bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };
    
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
      
      const daysDiff = differenceInDays(endDate, startDate);
      if (daysDiff < 2) {
        errors.dateRange = 'Bokningen måste vara minst 2 nätter';
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

  // Hantera nästa steg i formuläret
  const handleNext = async () => {
    // Validera olika steg
    if (activeStep === 0) {
      if (!validateDates()) return;
    } else if (activeStep === 1) {
      if (!validateContactInfo()) return;
    } else if (activeStep === 2) {
      await submitBooking();
      return;
    }
    
    setActiveStep(prevStep => prevStep + 1);
  };

  // Hantera föregående steg i formuläret
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
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
        setActiveStep(0); // Gå tillbaka till datumvalet
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
      setActiveStep(3); // Gå till bekräftelsesteg
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
                  Välj ditt ankomst- och avresedatum. Redan bokade datum är inaktiverade.
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
          </Grid>
        );
      
      case 1:
        return (
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
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Bekräfta din bokning
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Datum:</strong>
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Ankomst: {startDate && format(startDate, 'PPP', { locale: sv })}
                  <br />
                  Avresa: {endDate && format(endDate, 'PPP', { locale: sv })}
                  <br />
                  {startDate && endDate && (
                    <>Antal nätter: {differenceInDays(endDate, startDate)}</>
                  )}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Kontaktuppgifter:</strong>
                </Typography>
                <Typography variant="body1">
                  <strong>Namn:</strong> {name}
                </Typography>
                <Typography variant="body1">
                  <strong>E-post:</strong> {email}
                </Typography>
                <Typography variant="body1">
                  <strong>Telefon:</strong> {phone}
                </Typography>
                {notes && (
                  <>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      <strong>Meddelande:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      {notes}
                    </Typography>
                  </>
                )}
              </Box>
              
              <Alert severity="info" sx={{ mt: 3 }}>
                Genom att klicka på "Bekräfta bokning" går du med på våra bokningsvillkor.
              </Alert>
            </Grid>
          </Grid>
        );
      
      case 3:
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
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button 
                  onClick={handleBack}
                  disabled={activeStep === 0 || activeStep === 3}
                >
                  Tillbaka
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={isLoading || activeStep === 3}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {activeStep === steps.length - 2 ? 'Bekräfta bokning' : activeStep === steps.length - 1 ? '' : 'Nästa'}
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Information om boendet
              </Typography>
              
              {loadingInfo ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : apartmentInfo ? (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    <ReactMarkdown>{apartmentInfo.content}</ReactMarkdown>
                  </Box>
                  
                  {apartmentInfo.files && apartmentInfo.files.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>Bilder</Typography>
                      <Grid container spacing={2}>
                        {apartmentInfo.files
                          .filter(file => file.mimetype && file.mimetype.startsWith('image/'))
                          .map(file => (
                            <Grid item xs={12} sm={6} key={file.id}>
                              <Box
                                component="img"
                                src={file.path}
                                alt={file.originalName}
                                sx={{
                                  width: '100%',
                                  borderRadius: 1,
                                  height: 'auto',
                                  objectFit: 'cover',
                                }}
                              />
                            </Grid>
                          ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  <Box sx={{ mt: 2, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Pris högsäsong</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>600</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Pris Lågsäsong</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>300</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Pris tennisveckor</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>800</td>
                        </tr>
                      </tbody>
                    </table>
                  </Box>
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default BookingPage; 