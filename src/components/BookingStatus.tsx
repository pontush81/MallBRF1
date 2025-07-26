import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
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
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  LocalParking,
  Edit as EditIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface GuestData {
  name: string;
  arrival: string;
  departure: string;
  week: string;
  notes?: string;
  parking?: boolean;
  id?: string; // Lägg till id för att identifiera bokningen vid redigering/radering
}

interface BookingStatusProps {
  month: string;
  year: string;
  bookings: number;
  nights: number;
  revenue: number;
  parkingRevenue: number;
  guestData: GuestData[];
  defaultExpanded?: boolean;
  isCurrentOrFutureMonth?: boolean;
  isLoggedIn?: boolean; // Ny prop för att kontrollera inloggningsstatus
  isAdmin?: boolean; // Ny prop för att kontrollera admin-status
  onEditClick?: (guest: GuestData) => void; // Ny prop för att hantera redigeringsklick
  onDeleteClick?: (guest: GuestData) => void; // Ny prop för att hantera raderingsklick
}

const BookingStatus: React.FC<BookingStatusProps> = ({
  month,
  year,
  bookings,
  nights,
  revenue,
  parkingRevenue,
  guestData,
  defaultExpanded = false,
  isCurrentOrFutureMonth = false,
  isLoggedIn = false,
  isAdmin = false,
  onEditClick,
  onDeleteClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getWeekStyle = (week: number) => {
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
    return bgcolor;
  };

  const renderParkingStatus = (hasParking?: boolean) => {
    if (hasParking === undefined) return null;
    
    return (
      <Chip
        icon={<LocalParking />}
        label={hasParking ? "P-plats bokad" : "Ingen p-plats"}
        size="small"
        color={hasParking ? "success" : "default"}
        sx={{ 
          '& .MuiChip-icon': {
            color: hasParking ? 'success.main' : 'text.secondary'
          }
        }}
      />
    );
  };

  const renderBookingItem = (guest: GuestData) => {
    // Extract week number from the string
    const weekNumber = parseInt(guest.week);
    const bgcolor = getWeekStyle(weekNumber);

    // Mobile view with card
    if (isMobile) {
      return (
        <Paper
          key={`${guest.name}-${guest.arrival}`}
          variant="outlined"
          sx={{ 
            mb: 2, 
            p: 2,
            borderLeft: '4px solid',
            borderLeftColor: bgcolor === "transparent" ? 'grey.300' : bgcolor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {isLoggedIn ? guest.name : "Gäst"}
                </Typography>
                {isAdmin && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {onEditClick && (
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => onEditClick(guest)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDeleteClick && (
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => onDeleteClick(guest)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Ankomst:
              </Typography>
              <Typography variant="body2">
                {guest.arrival}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Avresa:
              </Typography>
              <Typography variant="body2">
                {guest.departure}
              </Typography>
            </Grid>
            
            {guest.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Anteckningar:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {guest.notes}
                </Typography>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                pt: 1,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    size="small" 
                    label={`v.${weekNumber}`} 
                    sx={{ 
                      backgroundColor: bgcolor,
                      minWidth: "40px"
                    }}
                  />
                  {renderParkingStatus(guest.parking)}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      );
    }

    // Desktop view with table row
    return (
      <TableRow key={`${guest.name}-${guest.arrival}`}>
        <TableCell>{isLoggedIn ? guest.name : "Gäst"}</TableCell>
        <TableCell>{guest.arrival}</TableCell>
        <TableCell>{guest.departure}</TableCell>
        <TableCell align="center">
          <Chip 
            size="small" 
            label={`v.${weekNumber}`} 
            sx={{ 
              backgroundColor: bgcolor,
              minWidth: "50px"
            }}
          />
        </TableCell>
        <TableCell align="center">
          {renderParkingStatus(guest.parking)}
        </TableCell>
        <TableCell>
          {guest.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {guest.notes}
            </Typography>
          )}
        </TableCell>
        {/* Kolumnen för åtgärder */}
        <TableCell align="center">
          {isAdmin && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              {onEditClick && (
                <Tooltip title="Redigera bokning">
                  <span>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => onEditClick(guest)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {onDeleteClick && (
                <Tooltip title="Radera bokning">
                  <span>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => onDeleteClick(guest)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // Separate rendering function for mobile view
  const renderMobileBookings = () => {
    return guestData.map(guest => {
      const weekNumber = parseInt(guest.week);
      const bgcolor = getWeekStyle(weekNumber);
      
      return (
        <Paper
          key={`${guest.name}-${guest.arrival}`}
          variant="outlined"
          sx={{ 
            mb: 2, 
            p: 2,
            borderLeft: '4px solid',
            borderLeftColor: bgcolor === "transparent" ? 'grey.300' : bgcolor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {isLoggedIn ? guest.name : "Gäst"}
                </Typography>
                {isAdmin && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {onEditClick && (
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => onEditClick(guest)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDeleteClick && (
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => onDeleteClick(guest)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Ankomst:
              </Typography>
              <Typography variant="body2">
                {guest.arrival}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Avresa:
              </Typography>
              <Typography variant="body2">
                {guest.departure}
              </Typography>
            </Grid>
            
            {guest.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Anteckningar:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {guest.notes}
                </Typography>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                pt: 1,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    size="small" 
                    label={`v.${weekNumber}`} 
                    sx={{ 
                      backgroundColor: bgcolor,
                      minWidth: "40px"
                    }}
                  />
                  {renderParkingStatus(guest.parking)}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      );
    });
  };

  return (
    <Accordion 
      defaultExpanded={defaultExpanded}
      sx={{ 
        mb: 2,
        '&.MuiAccordion-root': {
          borderRadius: 1,
          boxShadow: 1,
        },
        ...(isCurrentOrFutureMonth ? {} : {
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
          backgroundColor: isCurrentOrFutureMonth ? 'primary.light' : 'grey.300',
          color: isCurrentOrFutureMonth ? 'primary.contrastText' : 'text.primary',
          '&:hover': { 
            backgroundColor: isCurrentOrFutureMonth ? 'primary.main' : 'grey.400' 
          },
        }}
      >
        <Typography variant="h6">
          {month} {year}
          <Chip 
            label={`${bookings} ${bookings === 1 ? 'bokning' : 'bokningar'}`} 
            size="small" 
            sx={{ 
              ml: 1, 
              backgroundColor: isCurrentOrFutureMonth 
                ? 'rgba(255,255,255,0.3)' 
                : 'rgba(0,0,0,0.08)'
            }} 
          />
          <Chip 
            label={`${nights} nätter`} 
            size="small" 
            sx={{ 
              ml: 1, 
              backgroundColor: isCurrentOrFutureMonth 
                ? 'rgba(255,255,255,0.3)' 
                : 'rgba(0,0,0,0.08)'
            }}
          />
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {/* Desktop view */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                <TableRow>
                  <TableCell>Namn</TableCell>
                  <TableCell>Ankomst</TableCell>
                  <TableCell>Avresa</TableCell>
                  <TableCell align="center">Vecka</TableCell>
                  <TableCell align="center">Parkering</TableCell>
                  <TableCell>Anteckningar</TableCell>
                  <TableCell align="center">Åtgärder</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {guestData.map(guest => renderBookingItem(guest))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Desktop summary */}
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="subtitle1">
              Totalt: {nights} nätter (varav parkering: {parkingRevenue > 0 ? `${Math.round(parkingRevenue / 75)} nätter` : '0'})
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {revenue.toLocaleString()} kr {parkingRevenue > 0 && `(varav parkering: ${parkingRevenue.toLocaleString()} kr)`}
            </Typography>
          </Box>
        </Box>
        
        {/* Mobile view */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
          {renderMobileBookings()}
          
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
              <Typography variant="body2">{nights} nätter</Typography>
              {parkingRevenue > 0 && (
                <Typography variant="body2" color="success.main">
                  {Math.round(parkingRevenue / 75)} p-nätter ({parkingRevenue.toLocaleString()} kr)
                </Typography>
              )}
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {revenue.toLocaleString()} kr
            </Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default BookingStatus; 