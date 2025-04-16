import React from 'react';
import { Chip, Box, Typography } from '@mui/material';

interface ParkingChipProps {
  hasParking?: boolean;
}

const ParkingChip: React.FC<ParkingChipProps> = ({ hasParking }) => {
  if (hasParking === undefined) return null;
  
  const CustomParkingIcon = () => (
    <Box
      sx={{
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        bgcolor: hasParking ? 'rgba(76, 175, 80, 0.15)' : 'rgba(0, 0, 0, 0.08)',
        border: hasParking ? '1.5px solid #4CAF50' : '1.5px solid rgba(0, 0, 0, 0.23)',
        mr: -0.5
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: hasParking ? '#2E7D32' : 'rgba(0, 0, 0, 0.6)',
          fontWeight: 'bold',
          fontSize: '0.75rem',
          lineHeight: 1
        }}
      >
        P
      </Typography>
    </Box>
  );
  
  return (
    <Chip
      icon={<CustomParkingIcon />}
      label={hasParking ? "Ja" : "Nej"}
      size="small"
      color={hasParking ? "success" : "default"}
      sx={{
        bgcolor: hasParking ? 'rgba(76, 175, 80, 0.08)' : undefined,
        borderColor: hasParking ? '#4CAF50' : undefined,
        '& .MuiChip-label': {
          color: 'rgba(0, 0, 0, 0.87)'
        }
      }}
    />
  );
};

export default ParkingChip; 