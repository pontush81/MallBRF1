import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { designTokens } from '../../theme/designSystem';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullPage?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullPage = false,
  color = 'primary'
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 64;
      case 'medium':
      default: return 40;
    }
  };

  const getColorValue = () => {
    switch (color) {
      case 'secondary': return designTokens.colors.secondary[500];
      case 'inherit': return 'inherit';
      case 'primary':
      default: return designTokens.colors.primary[500];
    }
  };

  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress 
        size={getSizeValue()} 
        sx={{ 
          color: getColorValue(),
          animation: 'spin 1s linear infinite',
        }} 
      />
      {message && (
        <Typography 
          variant="body2" 
          sx={{ 
            color: designTokens.colors.secondary[600],
            textAlign: 'center',
            maxWidth: '200px',
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: designTokens.zIndex.overlay,
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingSpinner;
