import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface BookingStatusProps {
  month: string;
  year: string;
  bookings: number;
  nights: number;
  revenue: number;
  guestData: Array<{
    name: string;
    arrival: string;
    departure: string;
    week: string;
    notes?: string;
  }>;
}

const BookingStatus: React.FC<BookingStatusProps> = ({
  month,
  year,
  bookings,
  nights,
  revenue,
  guestData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = React.useState(true);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card 
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: theme.palette.primary.main,
          color: 'white',
        }}
      >
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            {month} {year}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`${bookings} ${bookings === 1 ? 'bokning' : 'bokningar'}`}
            color="secondary"
            size={isMobile ? 'small' : 'medium'}
            sx={{ fontWeight: 'bold' }}
          />
          <IconButton
            onClick={handleExpandClick}
            sx={{ color: 'white' }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.success.light,
                  color: theme.palette.success.contrastText,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2">Nätter</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {nights}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.info.light,
                  color: theme.palette.info.contrastText,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2">Intäkt</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {revenue.toLocaleString()} kr
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ overflowX: 'auto' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {guestData.map((guest, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: theme.palette.background.default,
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {guest.name}
                      </Typography>
                      {guest.notes && (
                        <Typography variant="body2" color="text.secondary">
                          {guest.notes}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2,
                        alignItems: isMobile ? 'flex-start' : 'center',
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      <Box sx={{ minWidth: 120 }}>
                        <Typography variant="body2" color="text.secondary">
                          Ankomst
                        </Typography>
                        <Typography variant="body1">
                          {guest.arrival}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: 120 }}>
                        <Typography variant="body2" color="text.secondary">
                          Avresa
                        </Typography>
                        <Typography variant="body1">
                          {guest.departure}
                        </Typography>
                      </Box>
                      <Chip
                        label={`v.${guest.week}`}
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.grey[200],
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default BookingStatus; 