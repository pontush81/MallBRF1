import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Check as CheckIcon,
  Close as CloseIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

import { Booking } from '../../types/Booking';
import bookingService from '../../services/bookingService';

const BookingsList: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [bookingToUpdate, setBookingToUpdate] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  
  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Hämta alla bokningar vid komponentmontering
  useEffect(() => {
    fetchBookings();
  }, []);

  // Uppdatera filtrerade bokningar när filter eller sökterm ändras
  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchTerm]);

  // Funktion för att hämta bokningar
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await bookingService.getAllBookings();
      // Sortera bokningarna efter startdatum (nyaste först)
      allBookings.sort((a, b) => {
        // Safely handle potential undefined values
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });
      setBookings(allBookings);
      setError(null);
    } catch (err) {
      setError('Ett fel uppstod vid hämtning av bokningar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrera bokningar baserat på status och sökterm
  const filterBookings = () => {
    let filtered = [...bookings];
    
    // Filtrera efter status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Filtrera efter sökterm
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        booking => 
          booking.name.toLowerCase().includes(term) || 
          booking.email.toLowerCase().includes(term)
      );
    }
    
    setFilteredBookings(filtered);
  };

  // Formatera datum
  const formatDate = (dateString: string | undefined) => {
    try {
      if (!dateString) return 'Ogiltigt datum';
      return format(new Date(dateString), 'd MMM yyyy', { locale: sv });
    } catch (error) {
      return 'Ogiltigt datum';
    }
  };

  // Visa statuschip med rätt färg
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Chip size="small" color="success" icon={<CheckIcon />} label="Bekräftad" />;
      case 'cancelled':
        return <Chip size="small" color="error" icon={<CloseIcon />} label="Avbokad" />;
      case 'pending':
      default:
        return <Chip size="small" color="warning" label="Väntar" />;
    }
  };

  // Öppna dialog för att radera bokning
  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  // Öppna dialog för att ändra status
  const handleStatusClick = (booking: Booking) => {
    setBookingToUpdate(booking);
    setNewStatus(booking.status);
    setStatusDialogOpen(true);
  };

  // Stäng raderingsdialogrutan
  const handleDeleteCancel = () => {
    setBookingToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Stäng statusdialogrutan
  const handleStatusCancel = () => {
    setBookingToUpdate(null);
    setStatusDialogOpen(false);
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

  // Uppdatera status på bokning
  const handleStatusUpdate = async () => {
    if (!bookingToUpdate) return;
    
    try {
      const updatedBooking = await bookingService.updateBooking(
        bookingToUpdate.id, 
        { status: newStatus }
      );
      
      if (updatedBooking) {
        // Uppdatera listan
        setBookings(prevBookings => 
          prevBookings.map(b => 
            b.id === updatedBooking.id ? updatedBooking : b
          )
        );
        
        setSnackbarMessage(`Bokningens status är nu ${newStatus === 'confirmed' ? 'bekräftad' : newStatus === 'cancelled' ? 'avbokad' : 'väntande'}`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Kunde inte uppdatera bokningen');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      setSnackbarMessage('Ett fel uppstod vid uppdatering av bokningen');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
      setBookingToUpdate(null);
      setStatusDialogOpen(false);
    }
  };

  // Stäng snackbaren
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Skicka e-post till gästen (simuleras)
  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        Bokningshantering
      </Typography>
      
      {/* Filter och sökfält */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              label="Filtrera efter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            >
              <MenuItem value="all">Alla bokningar</MenuItem>
              <MenuItem value="pending">Väntande</MenuItem>
              <MenuItem value="confirmed">Bekräftade</MenuItem>
              <MenuItem value="cancelled">Avbokade</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Sök namn/e-post"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4} sx={{ textAlign: { md: 'right' } }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={fetchBookings}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
              disabled={loading}
            >
              Uppdatera listan
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Fel */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Visa bokningarna i en tabell */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Namn</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Kontakt</TableCell>
              <TableCell>Bokning skapad</TableCell>
              <TableCell align="right">Åtgärder</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Inga bokningar matchar filtren
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    {getStatusChip(booking.status)}
                  </TableCell>
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
                      onClick={() => handleStatusClick(booking)}
                      title="Ändra status"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
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
      
      {/* Dialogruta för att uppdatera status */}
      <Dialog
        open={statusDialogOpen}
        onClose={handleStatusCancel}
      >
        <DialogTitle>Uppdatera bokningsstatus</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Uppdatera status för bokningen av{' '}
            <strong>{bookingToUpdate?.name}</strong> med ankomst{' '}
            {bookingToUpdate && bookingToUpdate.startDate ? formatDate(bookingToUpdate.startDate) : ''}.
          </DialogContentText>
          
          <TextField
            select
            label="Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as 'pending' | 'confirmed' | 'cancelled')}
            fullWidth
            variant="outlined"
            margin="dense"
          >
            <MenuItem value="pending">Väntande</MenuItem>
            <MenuItem value="confirmed">Bekräftad</MenuItem>
            <MenuItem value="cancelled">Avbokad</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusCancel}>Avbryt</Button>
          <Button onClick={handleStatusUpdate} color="primary">
            Uppdatera
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