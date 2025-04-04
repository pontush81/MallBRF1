import React from 'react';
import { Chip } from '@mui/material';
import { LocalParking } from '@mui/icons-material';

interface ParkingChipProps {
  hasParking?: boolean;
}

const ParkingChip: React.FC<ParkingChipProps> = ({ hasParking }) => {
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

export default ParkingChip; 