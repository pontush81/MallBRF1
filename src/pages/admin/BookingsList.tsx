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
  Chip
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Email as EmailIcon,
  Backup as BackupIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { Booking } from '../../types/Booking';
import { format, parseISO, getMonth, getYear, isAfter, isBefore, startOfMonth, addMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import bookingService from '../../services/bookingService';

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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/backup/send-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        }
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

  // Kontrollera om månaden är aktuell eller framtida
  const isCurrentOrFutureMonth = (monthKey: string): boolean => {
    try {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return !isBefore(date, currentMonth);
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
        const nights = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return total + (nights > 0 ? nights : 0);
      } catch (error) {
        console.warn('Fel vid beräkning av nätter för bokning:', booking.id);
        return total;
      }
    }, 0);
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Aktuella bokningar</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<BackupIcon />}
              onClick={handleBackup}
              disabled={backupLoading}
            >
              {backupLoading ? <CircularProgress size={24} /> : 'Säkerhetskopiera bokningar'}
            </Button>
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
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Här kan du se alla bokningar som är inplanerade. Tidigare månader är ihopfällda.
          </Typography>

          {sortedMonthKeys.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Inga bokningar hittades</Typography>
            </Paper>
          ) : (
            sortedMonthKeys.map(monthKey => {
              const monthBookings = sortBookingsByDate(groupedBookings[monthKey]);
              const isCurrentFuture = isCurrentOrFutureMonth(monthKey);
              
              return (
                <Accordion 
                  key={monthKey} 
                  defaultExpanded={isCurrentFuture}
                  sx={{ 
                    mb: 2,
                    '&.MuiAccordion-root': {
                      borderRadius: 1,
                      boxShadow: 1,
                    }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': { backgroundColor: 'primary.main' },
                    }}
                  >
                    <Typography variant="h6">
                      {formatMonthName(monthKey)}
                      <Chip 
                        label={`${monthBookings.length} bokningar`} 
                        size="small" 
                        sx={{ ml: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} 
                      />
                      <Chip 
                        label={`${calculateTotalNights(monthBookings)} nätter`} 
                        size="small" 
                        sx={{ ml: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} 
                      />
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Namn</TableCell>
                            <TableCell>Ankomst</TableCell>
                            <TableCell>Avresa</TableCell>
                            <TableCell>E-post</TableCell>
                            <TableCell>Skapad</TableCell>
                            <TableCell align="right">Åtgärder</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {monthBookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>{booking.name}</TableCell>
                              <TableCell>{formatDate(booking.startDate)}</TableCell>
                              <TableCell>{formatDate(booking.endDate)}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {booking.email}
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEmailClick(booking.email)} 
                                    sx={{ ml: 1 }}
                                    title="Skicka e-post"
                                  >
                                    <EmailIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                              <TableCell>{formatDate(booking.createdAt)}</TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleDeleteClick(booking)}
                                  title="Radera bokning"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
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