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
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import BookingDetails from './BookingDetails';
import { BookingSummary, GuestData } from '../../types/Booking';
import { formatCurrency, getPlural } from '../../utils/formatting';

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
  onEditClick,
  onDeleteClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const renderTableView = () => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Namn</TableCell>
            <TableCell>Ankomst</TableCell>
            <TableCell>Avresa</TableCell>
            <TableCell align="center">Vecka</TableCell>
            <TableCell align="center">Parkering</TableCell>
            <TableCell>Anteckningar</TableCell>
            {isAdmin && <TableCell align="center">Åtgärder</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {guestData.map((guest) => (
            <BookingDetails
              key={`${guest.name}-${guest.arrival}-${guest.id || ''}`}
              guest={guest}
              isAdmin={isAdmin}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderMobileView = () => (
    <Box>
      {guestData.map((guest) => (
        <BookingDetails
          key={`${guest.name}-${guest.arrival}-${guest.id || ''}`}
          guest={guest}
          isAdmin={isAdmin}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </Box>
  );

  const bookingText = getPlural(bookings, 'bokning', 'bokningar');
  const nightText = getPlural(nights, 'natt', 'nätter');
  const totalRevenue = revenue + parkingRevenue;

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
              {formatCurrency(totalRevenue)}
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