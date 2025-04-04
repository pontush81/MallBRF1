import React from 'react';
import { Chip } from '@mui/material';

interface WeekChipProps {
  week: string | number;
  size?: 'small' | 'medium';
}

const WeekChip: React.FC<WeekChipProps> = ({ week, size = 'small' }) => {
  const weekNumber = typeof week === 'string' ? parseInt(week) : week;
  
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
  
  const bgcolor = getWeekStyle(weekNumber);
  
  return (
    <Chip 
      size={size} 
      label={`v.${weekNumber}`} 
      sx={{ 
        backgroundColor: bgcolor,
        minWidth: size === 'small' ? "40px" : "50px"
      }}
    />
  );
};

export default WeekChip; 