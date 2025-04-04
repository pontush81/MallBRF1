import React from 'react';
import { Typography, Box } from '@mui/material';

interface LogoProps {
  size?: number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 100, color = 'primary.main' }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'background.paper',
        boxShadow: 2,
        border: 2,
        borderColor: color,
        p: 2
      }}
    >
      <Typography 
        variant="h4" 
        component="span" 
        sx={{ 
          fontWeight: 'bold',
          color,
          fontSize: size * 0.5
        }}
      >
        G
      </Typography>
    </Box>
  );
};

export default Logo; 