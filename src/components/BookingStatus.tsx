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
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, LocalParking } from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface BookingStatusProps {
  month: string;
  year: string;
  bookings: number;
  nights: number;
  revenue: number;
  parkingRevenue: number;
  guestData: Array<{
    name: string;
    arrival: string;
    departure: string;
    week: string;
    notes?: string;
    parking?: boolean;
  }>;
  defaultExpanded?: boolean;
  isCurrentOrFutureMonth?: boolean;
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

  const renderBookingItem = (guest: BookingStatusProps['guestData'][0]) => {
    const weekNumber = parseInt(guest.week);
    const bgcolor = getWeekStyle(weekNumber);

    // Mobile view with cards
    if (isMobile) {
      return (
        <Paper
          key={`${guest.name}-${guest.arrival}`}
          sx={{ 
            p: 2, 
            mb: 2, 
            borderLeft: '4px solid',
            borderLeftColor: bgcolor,
          }}
          variant="outlined"
        >
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="subtitle2">{guest.name}</Typography>
              {guest.notes && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                    Kommentar:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {guest.notes}
                  </Typography>
                </>
              )}
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
        <TableCell>{guest.name}</TableCell>
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
        {guest.notes && (
          <TableCell>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {guest.notes}
            </Typography>
          </TableCell>
        )}
      </TableRow>
    );
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
      <AccordionDetails>
        {/* Desktop view with table */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {guestData.map(guest => renderBookingItem(guest))}
                <TableRow 
                  sx={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    '& td': { fontWeight: 'bold' } 
                  }}
                >
                  <TableCell colSpan={3}>Totalt för månaden</TableCell>
                  <TableCell align="center">{nights} nätter</TableCell>
                  <TableCell align="center">
                    {parkingRevenue > 0 ? `${parkingRevenue.toLocaleString()} kr` : '-'}
                  </TableCell>
                  <TableCell align="right">{revenue.toLocaleString()} kr</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile view with cards */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {guestData.map(guest => renderBookingItem(guest))}
          <Paper
            sx={{ 
              p: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              mt: 2
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Totalt antal nätter
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {nights}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Total intäkt
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {revenue.toLocaleString()} kr
                </Typography>
                {parkingRevenue > 0 && (
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    mt: 0.5
                  }}>
                    varav parkering: {parkingRevenue.toLocaleString()} kr
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default BookingStatus; 