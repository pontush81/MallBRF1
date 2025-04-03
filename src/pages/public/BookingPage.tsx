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
  IconButton,
  Card,
  CardContent,
  Stack
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
      const bookingStart = new Date(booking.startDate);
      bookingStart.setHours(0, 0, 0, 0);
      
      const bookingEnd = new Date(booking.endDate);
      bookingEnd.setHours(0, 0, 0, 0);
      
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
          transition: 'all 0.2s ease',
          fontWeight: isBooked ? 'bold' : 'normal',
          
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
          
          ...(isSelected && isBooked && {
            backgroundColor: 'error.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
          }),
          
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
      
      if (!bookings || bookings.length === 0) {
        setExistingBookings([]);
        setCalendarEvents([]);
        setLoadingBookings(false);
        return;
      }
      
      const normalizedBookings = bookings.map(booking => ({
        ...booking,
        startDate: booking.startDate || booking.startdate,
        endDate: booking.endDate || booking.enddate,
      }));
      
      setExistingBookings(normalizedBookings);
      
      const events = normalizedBookings
        .map(booking => {
          try {
            if (!booking.startDate || !booking.endDate) {
              return null;
            }
            
            const startDateObj = new Date(booking.startDate);
            const endDateObj = new Date(booking.endDate);
            
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
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
                    const startFormatted = booking.startDate ? format(startDateObj, 'dd/MM', { locale: sv }) : 'N/A';
                    const endFormatted = booking.endDate ? format(endDateObj, 'dd/MM', { locale: sv }) : 'N/A';
                    return `${startFormatted} - ${endFormatted}`;
                  } catch (error) {
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
        .filter(event => event !== null);
        
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
        const page = await pageService.getPageBySlug('gastlagenhet');
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

  // Skicka in bokningen
  const submitBooking = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const availabilityCheck = await bookingService.checkAvailability(
        startDate.toISOString(), 
        endDate.toISOString()
      );
      
      if (!availabilityCheck.available) {
        setErrorMessage('De valda datumen är inte längre tillgängliga. Vänligen välj andra datum.');
        return;
      }
      
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
    setStartDate(null);
    setEndDate(null);
    setSuccessMessage('');
    setErrorMessage('');
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
      <Card 
        elevation={0}
        sx={{ 
          mt: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Stack spacing={2}>
                <TextField
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
                <TextField
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
                <TextField
                  fullWidth
                  label="Telefon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
                />
                <TextField
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
                    />
                  }
                  label="Jag behöver parkering"
                />
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'flex-end',
                mt: 2
              }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={submitBooking}
                  disabled={isLoading}
                  sx={{
                    py: 2,
                    px: 4,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
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
        </CardContent>
      </Card>
    );
  };

  // Rendera kalendern med maxbredd för desktop
  const renderCalendarWithMaxWidth = () => {
    return (
      <Card 
        elevation={0}
        sx={{ 
          mt: 2, 
          mb: 4,
          mx: 'auto',
          maxWidth: { xs: '100%', sm: '100%', md: '600px', lg: '650px' },
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <CardContent>
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
                    if (newDate < startDate) {
                      setEndDate(startDate);
                      setStartDate(newDate);
                    } else {
                      setEndDate(newDate);
                    }
                  } else {
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
        </CardContent>
      </Card>
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

  // Rendera prislistan
  const renderPriceList = () => {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          Priser (kr/dygn)
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 2,
                height: '100%'
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
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  Högsäsong (v. 24-32)
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                600 kr
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'rgba(244, 67, 54, 0.05)',
                border: '1px solid',
                borderColor: 'error.light',
                borderRadius: 2,
                height: '100%'
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
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  Tennisveckor (v. 27-29)
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                800 kr
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'rgba(158, 158, 158, 0.05)',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 2,
                height: '100%'
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
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  Lågsäsong (v. 1-23, 33-52)
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                400 kr
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'rgba(76, 175, 80, 0.05)',
                border: '1px solid',
                borderColor: 'success.light',
                borderRadius: 2,
                height: '100%'
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
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  Parkering
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                75 kr/dygn
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Rendera bokningsstatus
  const renderBookingStatus = () => {
    // Sortera bokningar i kronologisk ordning först
    const sortedBookings = [...existingBookings].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Gruppera sorterade bokningar efter månad
    const groupedBookings = sortedBookings.reduce((acc, booking) => {
      const date = new Date(booking.startDate);
      const monthYear = format(date, 'MMMM yyyy', { locale: sv });
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);

    // Sortera månader i kronologisk ordning baserat på faktiska datum
    const sortedMonths = Object.keys(groupedBookings).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      // Konvertera svenska månadsnamn till nummer (1-12)
      const getMonthNumber = (monthName: string): number => {
        const months: { [key: string]: number } = {
          'januari': 1, 'februari': 2, 'mars': 3, 'april': 4,
          'maj': 5, 'juni': 6, 'juli': 7, 'augusti': 8,
          'september': 9, 'oktober': 10, 'november': 11, 'december': 12
        };
        return months[monthName.toLowerCase()] || 0;
      };

      const monthNumA = getMonthNumber(monthA);
      const monthNumB = getMonthNumber(monthB);
      
      const dateA = new Date(parseInt(yearA), monthNumA - 1, 1);
      const dateB = new Date(parseInt(yearB), monthNumB - 1, 1);
      
      return dateA.getTime() - dateB.getTime();
    });

    return (
      <Box sx={{ mt: 4 }}>
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
          const bookings = groupedBookings[monthYear];
          const totalNights = bookings.reduce((sum, booking) => {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            return sum + differenceInDays(end, start);
          }, 0);

          const totalRevenue = bookings.reduce((sum, booking) => {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const nights = differenceInDays(end, start);
            const weekNumber = parseInt(format(start, 'w'));
            
            let nightlyRate = 400;
            if (weekNumber >= 24 && weekNumber <= 32) {
              nightlyRate = weekNumber >= 27 && weekNumber <= 29 ? 800 : 600;
            }
            
            const parkingFee = booking.parking ? nights * 75 : 0;
            return sum + (nights * nightlyRate) + parkingFee;
          }, 0);

          return (
            <Accordion
              key={monthYear}
              defaultExpanded={true}
              sx={{
                mb: 2,
                backgroundColor: 'background.paper',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px !important',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'grey.50'
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  mr: 2,
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  gap: { xs: 1, sm: 0 }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    gap: 1
                  }}>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {monthYear}
                    </Typography>
                    <Chip 
                      label={`${bookings.length} bokningar`}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 3,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                    <Typography variant="body1">
                      Nätter: <strong>{totalNights}</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'success.main' }}>
                      Intäkt: <strong>{totalRevenue} kr</strong>
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  width: '100%'
                }}>
                  {bookings.map((booking) => {
                    const start = new Date(booking.startDate);
                    const end = new Date(booking.endDate);
                    const nights = differenceInDays(end, start);
                    const weekNumber = parseInt(format(start, 'w'));
                    
                    let nightlyRate = 400;
                    if (weekNumber >= 24 && weekNumber <= 32) {
                      nightlyRate = weekNumber >= 27 && weekNumber <= 29 ? 800 : 600;
                    }
                    
                    const parkingFee = booking.parking ? nights * 75 : 0;
                    const totalFee = (nights * nightlyRate) + parkingFee;

                    return (
                      <Paper
                        key={booking.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'grey.50'
                          }
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {booking.name}
                              </Typography>
                              {booking.notes && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                                  {booking.notes}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography variant="body2" color="text.secondary">
                              Ankomst
                            </Typography>
                            <Typography variant="body1">
                              {format(start, 'E d MMM', { locale: sv })}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography variant="body2" color="text.secondary">
                              Avresa
                            </Typography>
                            <Typography variant="body1">
                              {format(end, 'E d MMM', { locale: sv })}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sm={1}>
                            <Chip 
                              label={`v.${weekNumber}`}
                              size="small"
                              color={weekNumber >= 27 && weekNumber <= 29 ? 'error' : weekNumber >= 24 && weekNumber <= 32 ? 'primary' : 'default'}
                              sx={{ minWidth: 60 }}
                            />
                          </Grid>
                          <Grid item xs={4} sm={1}>
                            <Typography variant="body2" align="center">
                              {nights} {nights === 1 ? 'natt' : 'nätter'}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sm={1}>
                            <Box display="flex" justifyContent="center">
                              <Chip
                                label={booking.parking ? 'P' : '-'}
                                size="small"
                                color={booking.parking ? 'success' : 'default'}
                                variant={booking.parking ? 'filled' : 'outlined'}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={8} sm={1}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main', textAlign: { xs: 'left', sm: 'right' } }}>
                              {totalFee} kr
                            </Typography>
                          </Grid>
                          {isAdmin && (
                            <Grid item xs={4} sm={1}>
                              <Box display="flex" justifyContent={{ xs: 'flex-end', sm: 'flex-end' }} gap={1}>
                                <IconButton size="small" onClick={() => handleEditClick(booking)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDeleteClick(booking)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Grid>
                          )}
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

  const handleBackupClick = async () => {
    try {
      setBackupLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/backup/send-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-vercel-protection-bypass': 'true'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbarMessage(`Backup skickad! ${data.bookingCount} bokningar exporterades.`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Kunde inte skapa backup');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setSnackbarMessage('Ett fel uppstod vid backup');
      setSnackbarSeverity('error');
    } finally {
      setBackupLoading(false);
      setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        mb: 5, 
        mt: 3,
        background: 'linear-gradient(to bottom, rgba(240,248,255,0.8), rgba(230,240,250,0.4))',
        borderRadius: 3,
        p: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Typography variant="h4" component="h1" sx={{ 
            color: 'primary.dark', 
            fontWeight: 600,
            borderBottom: '2px solid',
            borderColor: 'primary.light',
            pb: 1 
          }}>
            Boka boende
          </Typography>
          
          {isAdmin && (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBackupClick}
              disabled={backupLoading}
              startIcon={backupLoading ? <CircularProgress size={20} /> : <BackupIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Backup
            </Button>
          )}
        </Box>

        {renderPriceList()}

        <Grid container spacing={4}>
          <Grid item xs={12}>
            {loadingBookings && (
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
            )}
          </Grid>
          
          <Grid item xs={12}>
            {loadingBookings ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : renderCalendarWithMaxWidth()}
          </Grid>
          
          <Grid item xs={12}>
            {renderBookingForm()}
          </Grid>
        </Grid>

        {renderBookingStatus()}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </Container>
  );
};

export default BookingPage; 