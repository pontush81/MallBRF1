import React from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import BookingDetails from './BookingDetails';
import { BookingSummary, GuestData } from '../../types/Booking';
import { formatCurrency, getPlural } from '../../utils/formatting';
import { differenceInDays } from 'date-fns';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import ParkingChip from '../common/ParkingChip';

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
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  onEditClick?: (guest: GuestData) => void;
  onDeleteClick?: (guest: GuestData) => void;
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
  isAdmin = false,
  isLoggedIn = false,
  onEditClick,
  onDeleteClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const renderTableView = () => {
    // Sort guestData by week number
    const sortedGuests = [...guestData].sort((a, b) => {
      // Extract numeric week values (removing 'v.' prefix)
      const weekA = parseInt(a.week.replace('v.', ''), 10);
      const weekB = parseInt(b.week.replace('v.', ''), 10);
      
      // Handle invalid week numbers
      if (isNaN(weekA) && isNaN(weekB)) return 0;
      if (isNaN(weekA)) return 1;
      if (isNaN(weekB)) return -1;
      
      return weekA - weekB; // Sort by week number (ascending)
    });
    
    return (
      <>
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
                <TableCell align="right">Dygnspris</TableCell>
                <TableCell align="right">Totalt</TableCell>
                <TableCell align="center">Åtgärder</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedGuests.map((guest) => (
                <TableRow key={`${guest.name}-${guest.arrival}`}>
                  <TableCell>{guest.name}</TableCell>
                  <TableCell>{guest.arrival}</TableCell>
                  <TableCell>{guest.departure}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      size="small" 
                      label={`v.${guest.week.replace('v.', '')}`} 
                      sx={{ 
                        backgroundColor: guest.parking ? 'success.main' : 'default',
                        minWidth: "50px"
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <ParkingChip hasParking={guest.parking} />
                  </TableCell>
                  <TableCell>
                    {guest.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {guest.notes}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {(() => {
                      let baseRate = 400;
                      if (parseInt(guest.week.replace('v.', ''), 10) >= 24 && parseInt(guest.week.replace('v.', ''), 10) <= 32) {
                        baseRate = [28, 29].includes(parseInt(guest.week.replace('v.', ''), 10)) ? 800 : 600;
                      }
                      return `${baseRate} kr`;
                    })()}
                  </TableCell>
                  <TableCell align="right">
                    {(() => {
                      try {
                        // Konvertera datum från svenska format till Date-objekt
                        const arrivalParts = guest.arrival.split(' ');
                        const departureParts = guest.departure.split(' ');
                        
                        // Extrahera numeriskt datum och månad
                        const arrivalDay = parseInt(arrivalParts[1], 10);
                        const departureDay = parseInt(departureParts[1], 10);
                        
                        // Skapa månadsnummer (0-11) baserat på svenska månadsnamn
                        const getMonthNumber = (monthStr) => {
                          // Ta bort eventuella punkter från månadsnamnet
                          const cleanMonthStr = monthStr.replace(/\./g, '').toLowerCase();
                          const months = {
                            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'maj': 4, 'juni': 5,
                            'juli': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dec': 11
                          };
                          return months[cleanMonthStr] || 0;
                        };
                        
                        const arrivalMonth = getMonthNumber(arrivalParts[2]);
                        const departureMonth = getMonthNumber(departureParts[2]);
                        
                        // Antag nuvarande år om inte specificerat
                        const currentYear = parseInt(year);
                        
                        // Skapa Date-objekt
                        const arrivalDate = new Date(currentYear, arrivalMonth, arrivalDay);
                        const departureDate = new Date(currentYear, departureMonth, departureDay);
                        
                        // Hantera årsskifte
                        if (departureMonth < arrivalMonth) {
                          departureDate.setFullYear(currentYear + 1);
                        }
                        
                        // Beräkna nätter
                        const nights = differenceInDays(departureDate, arrivalDate);
                        
                        // Beräkna pris baserat på vecka
                        let baseRate = 400;
                        const weekNumber = parseInt(guest.week.replace('v.', ''), 10);
                        
                        if (weekNumber >= 24 && weekNumber <= 32) {
                          baseRate = [28, 29].includes(weekNumber) ? 800 : 600;
                        }
                        
                        const baseAmount = nights * baseRate;
                        const parkingAmount = guest.parking ? nights * 75 : 0;
                        const totalAmount = baseAmount + parkingAmount;
                        
                        return (
                          <Box>
                            {guest.parking ? (
                              <>
                                <Typography variant="body2">
                                  {nights} × {baseRate} kr = {baseAmount} kr
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  + {parkingAmount} kr (P)
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                  {totalAmount.toLocaleString()} kr
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography variant="body2">
                                  {nights} × {baseRate} kr = {baseAmount} kr
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {totalAmount.toLocaleString()} kr
                                </Typography>
                              </>
                            )}
                          </Box>
                        );
                      } catch (error) {
                        console.error('Error calculating totals:', error, guest);
                        return <Typography color="error">Beräkningsfel</Typography>;
                      }
                    })()}
                  </TableCell>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Desktop summary (återställd från originalversionen) */}
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
            Totalt: {nights} {getPlural(nights, 'natt', 'nätter')}
            {parkingRevenue > 0 && ` (varav ${Math.round(parkingRevenue / 75)} p-nätter)`}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {formatCurrency(revenue)}
            {parkingRevenue > 0 && ` (varav parkering: ${formatCurrency(parkingRevenue)})`}
          </Typography>
        </Box>
      </>
    );
  };

  const renderMobileView = () => {
    // Sort guestData by week number
    const sortedGuests = [...guestData].sort((a, b) => {
      // Extract numeric week values (removing 'v.' prefix)
      const weekA = parseInt(a.week.replace('v.', ''), 10);
      const weekB = parseInt(b.week.replace('v.', ''), 10);
      
      // Handle invalid week numbers
      if (isNaN(weekA) && isNaN(weekB)) return 0;
      if (isNaN(weekA)) return 1;
      if (isNaN(weekB)) return -1;
      
      return weekA - weekB; // Sort by week number (ascending)
    });
    
    return (
      <>
        <Box>
          {sortedGuests.map((guest) => (
            <BookingDetails
              key={`${guest.name}-${guest.arrival}-${guest.id || ''}`}
              guest={{
                ...guest,
                name: isLoggedIn ? guest.name : 'Bokad'
              }}
              isAdmin={isAdmin}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </Box>
        
        {/* Mobile summary (återställd från originalversionen) */}
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
            <Typography variant="body2">{nights} {getPlural(nights, 'natt', 'nätter')}</Typography>
            {parkingRevenue > 0 && (
              <Typography variant="body2" color="success.main">
                {Math.round(parkingRevenue / 75)} p-nätter ({formatCurrency(parkingRevenue)})
              </Typography>
            )}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {formatCurrency(revenue)}
          </Typography>
        </Box>
      </>
    );
  };

  const bookingText = getPlural(bookings, 'bokning', 'bokningar');
  const nightText = getPlural(nights, 'natt', 'nätter');

  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: isCurrentOrFutureMonth 
            ? 'rgba(0, 150, 136, 0.08)' 
            : 'rgba(0, 0, 0, 0.03)'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            {month} {year}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: { xs: 1, sm: 2 },
            fontSize: '0.875rem',
            mt: 0.5
          }}>
            <Typography variant="body2" color="text.secondary">
              {bookings} {bookingText}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {nights} {nightText}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(revenue)}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {isMobile ? renderMobileView() : renderTableView()}
      </AccordionDetails>
    </Accordion>
  );
};

export default BookingStatus; 