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

  // Rendera bokning beroende på skärmstorlek
  const renderBookingItem = (booking: Booking) => {
    if (isMobile) {
      // Card-based mobile view
      return (
        <Paper 
          key={booking.id} 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2, 
            borderLeft: '4px solid', 
            borderColor: 'primary.main' 
          }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6">{booking.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {booking.email}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => handleEmailClick(booking.email)}
              aria-label="Skicka e-post"
            >
              <EmailIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {booking.phone && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tel: {booking.phone}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Nätter: {calculateNights(booking)}
          </Typography>
          
          {booking.notes && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Anteckning: {booking.notes}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Parkering:
            </Typography>
            {renderParkingStatus(booking.parking)}
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              startIcon={<EditIcon />}
              color="primary"
              onClick={() => handleEditClick(booking)}
              size="small"
              sx={{ minWidth: '44px', minHeight: '44px' }} // Touch-friendly size
            >
              Redigera
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={() => handleDeleteClick(booking)}
              size="small"
              sx={{ minWidth: '44px', minHeight: '44px' }} // Touch-friendly size
            >
              Ta bort
            </Button>
          </Box>
        </Paper>
      );
    }
    
    // Standard table row for desktop
    return (
      <TableRow key={booking.id}>
        <TableCell>{booking.name}</TableCell>
        <TableCell>{formatDate(booking.startDate)}</TableCell>
        <TableCell>{formatDate(booking.endDate)}</TableCell>
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
        <TableCell>{booking.notes || '-'}</TableCell>
        <TableCell align="center">{renderParkingStatus(booking.parking)}</TableCell>
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
                              <TableCell align="center">Nätter</TableCell>
                              <TableCell>E-post</TableCell>
                              <TableCell>Telefon</TableCell>
                              <TableCell>Anteckningar</TableCell>
                              <TableCell align="center">Parkering</TableCell>
                              <TableCell align="right">Åtgärder</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {monthBookings.map(booking => (
                              renderBookingItem(booking)
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    
                    {/* Mobil vy med cards */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                      {monthBookings.map(booking => (
                        renderBookingItem(booking)
                      ))}
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