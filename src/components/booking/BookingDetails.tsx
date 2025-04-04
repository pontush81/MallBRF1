import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import WeekChip from '../common/WeekChip';
import ParkingChip from '../common/ParkingChip';
import { GuestData } from '../../types/Booking';

interface BookingDetailsProps {
  guest: GuestData;
  isAdmin?: boolean;
  onEditClick?: (guest: GuestData) => void;
  onDeleteClick?: (guest: GuestData) => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({
  guest,
  isAdmin = false,
  onEditClick,
  onDeleteClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          borderLeftColor: theme => theme.palette.grey[300],
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                {guest.name}
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
                <WeekChip week={guest.week} />
                <ParkingChip hasParking={guest.parking} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  }

  // Desktop view - Table row to be used in a TableBody
  return (
    <TableRow key={`${guest.name}-${guest.arrival}`}>
      <TableCell>{guest.name}</TableCell>
      <TableCell>{guest.arrival}</TableCell>
      <TableCell>{guest.departure}</TableCell>
      <TableCell align="center">
        <WeekChip week={guest.week} />
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
      <TableCell align="center">
        {isAdmin && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            {onEditClick && (
              <Tooltip title="Redigera bokning">
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={() => onEditClick(guest)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDeleteClick && (
              <Tooltip title="Radera bokning">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onDeleteClick(guest)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
};

export default BookingDetails; 