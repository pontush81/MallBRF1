import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  DialogContentText,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme,
  useMediaQuery,
  Tooltip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Email as EmailIcon,
  Backup as BackupIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { Booking } from '../../types/Booking';
import { format, parseISO, getMonth, getYear, isAfter, isBefore, startOfMonth, addMonths, differenceInDays } from 'date-fns';
import { sv } from 'date-fns/locale';
import bookingService from '../../services/bookingService';
import { API_BASE_URL } from '../../config';
import { auth } from '../../services/firebase';

const BookingsList: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  
  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [backupLoading, setBackupLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Edit dialog state
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

  // Hämta alla bokningar vid komponentmontering
  useEffect(() => {
    fetchBookings();
  }, []);

  // Hämta bokningar från API
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedBookings = await bookingService.getAllBookings();
      setBookings(fetchedBookings);
      setFilteredBookings(fetchedBookings);
    } catch (err) {
      setError('Kunde inte hämta bokningar');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Uppdatera filtrerade bokningar när söktermen ändras
  useEffect(() => {
    const filtered = bookings.filter(booking => 
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBookings(filtered);
  }, [searchTerm, bookings]);

  // Formatera datum
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP', { locale: sv });
    } catch (error) {
      console.warn('Invalid date:', dateString);
      return 'Ogiltigt datum';
    }
  };

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
        setBookings(prevBookings => 
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
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/backup/send-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  // Gruppera bokningar efter månad
  const groupBookingsByMonth = (bookings: Booking[]): Record<string, Booking[]> => {
    const groups: Record<string, Booking[]> = {};
    
    bookings.forEach(booking => {
      if (!booking.startDate) return;
      
      try {
        const date = parseISO(booking.startDate);
        const monthKey = `${getYear(date)}-${getMonth(date) + 1}`;
        
        if (!groups[monthKey]) {
          groups[monthKey] = [];
        }
        
        groups[monthKey].push(booking);
      } catch (error) {
        console.warn('Invalid date in booking:', booking.id);
      }
    });
    
    return groups;
  };

  // Sortera bokningar efter ankomstdatum
  const sortBookingsByDate = (bookings: Booking[]): Booking[] => {
    return [...bookings].sort((a, b) => {
      return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
    });
  };

  // Formatera månadsnamn
  const formatMonthName = (monthKey: string): string => {
    try {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return format(date, 'LLLL yyyy', { locale: sv }).charAt(0).toUpperCase() + format(date, 'LLLL yyyy', { locale: sv }).slice(1);
    } catch (error) {
      return 'Okänd månad';
    }
  };

  // Modify the isCurrentOrFutureMonth function to correctly identify current and future months
  const isCurrentOrFutureMonth = (monthKey: string): boolean => {
    try {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // Compare if the provided month is the current month or in the future
      return date.getTime() >= currentMonth.getTime();
    } catch (error) {
      console.error('Error checking month status:', error);
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
        const nights = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return total + (nights > 0 ? nights : 0);
      } catch (error) {
        console.warn('Fel vid beräkning av nätter för bokning:', booking.id);
        return total;
      }
    }, 0);
  };

  // Calculate nights for a booking
  const calculateNights = (booking: Booking): number => {
    if (!booking.startDate || !booking.endDate) return 0;
    
    try {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 0;
      }
      
      // Calculate nights (end date - start date)
      return differenceInDays(endDate, startDate);
    } catch (error) {
      console.warn('Error calculating nights for booking:', booking.id);
      return 0;
    }
  };

  // Hjälpfunktion för att visa parkeringsstatus
  const renderParkingStatus = (parkingValue: any) => {
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

  // Öppna dialog för att redigera bokning
  const handleEditClick = (booking: Booking) => {
    setBookingToEdit(booking);
    setEditName(booking.name || '');
    setEditEmail(booking.email || '');
    setEditPhone(booking.phone || '');
    setEditNotes(booking.notes || '');
    
    // Format dates properly for the edit form
    try {
      if (booking.startDate) {
        const startDate = new Date(booking.startDate);
        if (!isNaN(startDate.getTime())) {
          // For the date input field, we need YYYY-MM-DD format
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, '0');
          const day = String(startDate.getDate()).padStart(2, '0');
          setEditStartDate(`${year}-${month}-${day}`);
        } else {
          console.error('Invalid startDate:', booking.startDate);
          setEditStartDate('');
        }
      } else {
        setEditStartDate('');
      }
      
      if (booking.endDate) {
        const endDate = new Date(booking.endDate);
        if (!isNaN(endDate.getTime())) {
          // For the date input field, we need YYYY-MM-DD format
          const year = endDate.getFullYear();
          const month = String(endDate.getMonth() + 1).padStart(2, '0');
          const day = String(endDate.getDate()).padStart(2, '0');
          setEditEndDate(`${year}-${month}-${day}`);
        } else {
          console.error('Invalid endDate:', booking.endDate);
          setEditEndDate('');
        }
      } else {
        setEditEndDate('');
      }
    } catch (error) {
      console.error('Error formatting dates:', error);
      setEditStartDate('');
      setEditEndDate('');
    }
    
    setEditParking(booking.parking || false);
    setEditDialogOpen(true);
  };

  // Stäng redigeringsdialogrutan
  const handleEditCancel = () => {
    setBookingToEdit(null);
    setEditDialogOpen(false);
  };

  // Bekräfta redigering av bokning
  const handleEditConfirm = async () => {
    if (!bookingToEdit) return;
    
    setEditLoading(true);
    
    try {
      // Format dates into ISO format for the API
      let startDateFormatted = '';
      let endDateFormatted = '';
      
      if (editStartDate) {
        try {
          // Add time to make sure it's properly parsed as UTC
          startDateFormatted = new Date(`${editStartDate}T12:00:00Z`).toISOString();
        } catch (error) {
          console.error('Error formatting start date:', error);
          setSnackbarMessage('Ogiltigt ankomstdatum format');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setEditLoading(false);
          return;
        }
      }
      
      if (editEndDate) {
        try {
          // Add time to make sure it's properly parsed as UTC
          endDateFormatted = new Date(`${editEndDate}T12:00:00Z`).toISOString();
        } catch (error) {
          console.error('Error formatting end date:', error);
          setSnackbarMessage('Ogiltigt avresedatum format');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setEditLoading(false);
          return;
        }
      }
      
      console.log('Editing booking with formatted dates:', {
        startDate: startDateFormatted,
        endDate: endDateFormatted
      });
      
      const updatedBooking = {
        ...bookingToEdit,
        name: editName,
        email: editEmail,
        phone: editPhone,
        notes: editNotes,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        parking: editParking
      };
      
      console.log('Attempting to update booking:', bookingToEdit.id);
      const updatedBookingResponse = await bookingService.updateBooking(bookingToEdit.id, updatedBooking);
      
      if (updatedBookingResponse) {
        // Successfully updated - update UI
        console.log('Update successful, updating UI');
        setBookings(prevBookings => 
          prevBookings.map(b => b.id === bookingToEdit.id ? updatedBookingResponse : b)
        );
        
        setSnackbarMessage('Bokningen har uppdaterats');
        setSnackbarSeverity('success');
      } else {
        // 404 error - booking not found
        console.log('Booking not found (404)');
        setSnackbarMessage('Kunde inte uppdatera bokningen - bokningen hittades inte');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      console.error('Fel vid uppdatering:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ett fel uppstod vid uppdatering av bokningen';
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
      setBookingToEdit(null);
      setEditDialogOpen(false);
      setEditLoading(false);
    }
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

  // Calculate total revenue for all bookings (yearly summary)
  const calculateYearlyTotalRevenue = (): number => {
    return filteredBookings.reduce((total, booking) => {
      return total + calculateRevenueForBooking(booking);
    }, 0);
  };

  // Calculate total nights for all bookings (yearly summary)
  const calculateYearlyTotalNights = (): number => {
    return filteredBookings.reduce((total, booking) => {
      return total + calculateNights(booking);
    }, 0);
  };

  // Rendera bokning beroende på skärmstorlek
  const renderBookingItem = (booking: Booking) => {
    if (isMobile) {
      const nights = calculateNights(booking);
      
      // Beräkna veckonummer och bestäm färg
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
      
      return (
        <Paper
          key={booking.id}
          sx={{ 
            p: 2, 
            mb: 2, 
            borderLeft: '4px solid',
            borderLeftColor: weekData.bgcolor,
          }}
          variant="outlined"
        >
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="subtitle2">{booking.name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Ankomst:
              </Typography>
              <Typography variant="body2">
                {booking.startDate 
                  ? format(new Date(booking.startDate), 'E d MMM', { locale: sv })
                  : 'N/A'
                }
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Avresa:
              </Typography>
              <Typography variant="body2">
                {booking.endDate 
                  ? format(new Date(booking.endDate), 'E d MMM', { locale: sv })
                  : 'N/A'
                }
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mt: 1,
                pt: 1,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    size="small" 
                    label={`v.${weekData.week}`} 
                    sx={{ 
                      backgroundColor: weekData.bgcolor,
                      minWidth: "40px",
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">
                    {nights} {nights === 1 ? 'natt' : 'nätter'}
                  </Typography>
                </Box>
                <Typography variant="subtitle2">
                  {calculateRevenueForBooking(booking).toLocaleString()} kr
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      );
    }
    
    // Standard table row for desktop
    return (
      <TableRow key={booking.id}>
        <TableCell>{booking.name}</TableCell>
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
        <TableCell align="center">
          {booking.startDate && (
            (() => {
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
              
              return (
                <Chip 
                  size="small" 
                  label={`v.${week}`} 
                  sx={{ 
                    backgroundColor: bgcolor,
                    minWidth: "50px"
                  }}
                />
              );
            })()
          )}
        </TableCell>
        <TableCell align="center">{calculateNights(booking)}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {booking.email}
            <IconButton 
              size="small" 
              onClick={() => handleEmailClick(booking.email)}
              aria-label="Skicka e-post"
            >
              <EmailIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
        <TableCell>{booking.phone || '-'}</TableCell>
        <TableCell align="center">{renderParkingStatus(booking.parking)}</TableCell>
        <TableCell align="right">
          {booking.startDate && booking.endDate
            ? `${calculateRevenueForBooking(booking).toLocaleString()} kr`
            : '-'
          }
        </TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton 
              color="primary" 
              size="small" 
              onClick={() => handleEditClick(booking)}
              aria-label="Redigera bokning"
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              color="error" 
              size="small" 
              onClick={() => handleDeleteClick(booking)}
              aria-label="Ta bort bokning"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Gruppera och sortera bokningar
  const groupedBookings = groupBookingsByMonth(filteredBookings);
  const sortedMonthKeys = Object.keys(groupedBookings).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    
    // Sortera efter år och månad
    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' }, mb: { xs: 2, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
              Aktuella bokningar
            </Typography>
            <Tooltip title={isMobile ? "Säkerhetskopiera alla bokningar" : ""}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<BackupIcon />}
                onClick={handleBackup}
                disabled={backupLoading}
                size="small"
                sx={{ 
                  whiteSpace: 'nowrap',
                  minHeight: '44px',
                  px: { xs: 1.5, sm: 3 },
                  minWidth: { xs: 'auto', sm: '180px' }
                }}
              >
                {backupLoading ? <CircularProgress size={20} /> : (
                  isMobile ? 'Backup' : 'Säkerhetskopiera'
                )}
              </Button>
            </Tooltip>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Sök bokningar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 3 }}
          />
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          {/* Prisinfo */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', mr: 1.5, bgcolor: 'rgba(0, 128, 255, 0.2)' }} />
                    <Box>
                      <Typography variant="body2" noWrap>
                        Högsäsong (v. 24-32)
                      </Typography>
                      <Typography variant="subtitle2">
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
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', mr: 1.5, bgcolor: 'rgba(255, 0, 0, 0.2)' }} />
                    <Box>
                      <Typography variant="body2" noWrap>
                        Tennisveckor (v. 27-29)
                      </Typography>
                      <Typography variant="subtitle2">
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
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', mr: 1.5, bgcolor: 'rgba(0, 0, 0, 0.1)' }} />
                    <Box>
                      <Typography variant="body2" noWrap>
                        Lågsäsong (v. 1-23, 33-52)
                      </Typography>
                      <Typography variant="subtitle2">
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
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', mr: 1.5, bgcolor: 'rgba(76, 175, 80, 0.2)' }} />
                    <Box>
                      <Typography variant="body2" noWrap>
                        Parkering
                      </Typography>
                      <Typography variant="subtitle2">
                        75 kr/dygn
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            
            {/* Mobile view */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Table size="small" sx={{ mt: 1 }}>
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

          {/* Yearly Summary */}
          <Box sx={{ 
            mb: 3, 
            mt: 2, 
            p: 2, 
            bgcolor: 'primary.light', 
            color: 'primary.contrastText', 
            borderRadius: 1, 
            boxShadow: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Summering av året
              </Typography>
              <Typography variant="body1">
                {filteredBookings.length} bokningar, {calculateYearlyTotalNights()} nätter
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {calculateYearlyTotalRevenue().toLocaleString()} kr
              </Typography>
              <Typography variant="body2">Total intäkt</Typography>
            </Box>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            <strong> Aktuell månad och framtida månader visas automatiskt</strong>, medan tidigare månader är ihopfällda 
            (klicka på respektive månad för att expandera och se historiska bokningar).
          </Typography>

          {sortedMonthKeys.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Inga bokningar hittades</Typography>
            </Paper>
          ) : (
            sortedMonthKeys.map(monthKey => {
              const monthBookings = sortBookingsByDate(groupedBookings[monthKey]);
              
              return (
                <Accordion 
                  key={monthKey} 
                  defaultExpanded={isCurrentOrFutureMonth(monthKey)}
                  sx={{ 
                    mb: 2,
                    '&.MuiAccordion-root': {
                      borderRadius: 1,
                      boxShadow: 1,
                    },
                    ...(isCurrentOrFutureMonth(monthKey) ? {} : {
                      opacity: 0.85,
                      '& .MuiAccordionSummary-root': {
                        backgroundColor: 'grey.300',
                        color: 'text.primary'
                      }
                    })
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      backgroundColor: isCurrentOrFutureMonth(monthKey) ? 'primary.light' : 'grey.300',
                      color: isCurrentOrFutureMonth(monthKey) ? 'primary.contrastText' : 'text.primary',
                      '&:hover': { 
                        backgroundColor: isCurrentOrFutureMonth(monthKey) ? 'primary.main' : 'grey.400' 
                      },
                    }}
                  >
                    <Typography variant="h6">
                      {formatMonthName(monthKey)}
                      <Chip 
                        label={`${monthBookings.length} bokningar`} 
                        size="small" 
                        sx={{ 
                          ml: 1, 
                          backgroundColor: isCurrentOrFutureMonth(monthKey) 
                            ? 'rgba(255,255,255,0.3)' 
                            : 'rgba(0,0,0,0.08)'
                        }} 
                      />
                      <Chip 
                        label={`${calculateTotalNights(monthBookings)} nätter`} 
                        size="small" 
                        sx={{ 
                          ml: 1, 
                          backgroundColor: isCurrentOrFutureMonth(monthKey) 
                            ? 'rgba(255,255,255,0.3)' 
                            : 'rgba(0,0,0,0.08)'
                        }}
                      />
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Desktop vy med tabell */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Namn</TableCell>
                              <TableCell>Ankomst</TableCell>
                              <TableCell>Avresa</TableCell>
                              <TableCell align="center">Vecka</TableCell>
                              <TableCell align="center">Nätter</TableCell>
                              <TableCell>E-post</TableCell>
                              <TableCell>Telefon</TableCell>
                              <TableCell align="center">Parkering</TableCell>
                              <TableCell align="right">Intäkt</TableCell>
                              <TableCell align="right">Åtgärder</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {monthBookings.map(booking => (
                              renderBookingItem(booking)
                            ))}
                            <TableRow 
                              sx={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                '& td': { fontWeight: 'bold' } 
                              }}
                            >
                              <TableCell colSpan={4}>Totalt för månaden</TableCell>
                              <TableCell align="center">{calculateTotalNights(monthBookings)}</TableCell>
                              <TableCell colSpan={3}></TableCell>
                              <TableCell align="right">{calculateRevenueForMonth(monthBookings).toLocaleString()} kr</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    
                    {/* Mobil vy med cards */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      {monthBookings.map(booking => (
                        renderBookingItem(booking)
                      ))}
                      
                      {/* Mobile summary */}
                      <Box 
                        sx={{ 
                          mt: 2, 
                          p: 2, 
                          bgcolor: 'rgba(0, 0, 0, 0.05)',
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2">Totalt:</Typography>
                          <Typography variant="body2">{calculateTotalNights(monthBookings)} nätter</Typography>
                        </Box>
                        <Typography variant="subtitle1">
                          {calculateRevenueForMonth(monthBookings).toLocaleString()} kr
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </Grid>
      </Grid>
      
      {/* Dialogruta för att bekräfta radering */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Radera bokning</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Är du säker på att du vill radera bokningen för{' '}
            <strong>{bookingToDelete?.name}</strong> med ankomst{' '}
            {bookingToDelete ? formatDate(bookingToDelete.startDate) : ''}?
            <br /><br />
            Denna åtgärd kan inte ångras.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Avbryt</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Radera
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogruta för att redigera bokning */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Redigera bokning</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Namn"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="E-post"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Telefon"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editParking}
                    onChange={(e) => setEditParking(e.target.checked)}
                    color="primary"
                  />
                }
                label="Parkering"
                sx={{ mt: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Ankomstdatum"
                type="date"
                value={editStartDate || ''}
                onChange={(e) => setEditStartDate(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Avresedatum"
                type="date"
                value={editEndDate || ''}
                onChange={(e) => setEditEndDate(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Anteckningar"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Avbryt</Button>
          <Button 
            onClick={handleEditConfirm} 
            color="primary" 
            variant="contained"
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={20} /> : null}
          >
            Spara ändringar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Meddelande om utförd åtgärd */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookingsList; 