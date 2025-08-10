import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Fade,
  useTheme
} from '@mui/material';

interface StandardLoadingProps {
  size?: number;
  message?: string;
  variant?: 'minimal' | 'standard' | 'fullPage';
  color?: 'primary' | 'secondary' | 'inherit';
}

export const StandardLoading: React.FC<StandardLoadingProps> = ({
  size = 40,
  message = 'Laddar...',
  variant = 'standard',
  color = 'primary'
}) => {
  const theme = useTheme();

  // Minimal version - just the spinner
  if (variant === 'minimal') {
    return (
      <Fade in timeout={300}>
        <CircularProgress 
          size={size} 
          color={color}
          thickness={4}
        />
      </Fade>
    );
  }

  // Full page version - centered with message
  if (variant === 'fullPage') {
    return (
      <Fade in timeout={300}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2,
          }}
        >
          <CircularProgress 
            size={size} 
            color={color}
            thickness={4}
          />
          {message && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                textAlign: 'center',
                fontSize: '0.875rem',
              }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Fade>
    );
  }

  // Standard version - compact with optional message
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          py: 2,
        }}
      >
        <CircularProgress 
          size={size} 
          color={color}
          thickness={4}
        />
        {message && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: '0.875rem' }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

// Convenience components for common use cases
export const MinimalLoading: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <StandardLoading variant="minimal" size={size} />
);

export const PageLoading: React.FC<{ message?: string }> = ({ 
  message = 'Laddar sida...' 
}) => (
  <StandardLoading variant="fullPage" size={48} message={message} />
);

export const ButtonLoading: React.FC = () => (
  <StandardLoading variant="minimal" size={20} />
);

export default StandardLoading;
