import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { Booking } from '../../types/Booking';
import { API_URL } from '../../config';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Check as CheckIcon,
  Close as CloseIcon,
  Email as EmailIcon
} from '@mui/icons-material';
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Bokningar
          </Typography>
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Namn</TableCell>
                  <TableCell>Datum</TableCell>
                  <TableCell>E-post</TableCell>
                  <TableCell>Skapad</TableCell>
                  <TableCell align="right">Åtgärder</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Inga bokningar hittades
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.name}</TableCell>
                      <TableCell>
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
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