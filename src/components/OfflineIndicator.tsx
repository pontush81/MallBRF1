import React, { useState, useEffect } from 'react';
import { Box, Typography, Fade, Alert } from '@mui/material';
import { CloudOff } from '@mui/icons-material';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Alert - Only show when offline */}
      {!isOnline && (
        <Fade in={!isOnline}>
          <Alert
            severity="warning"
            icon={<CloudOff />}
            sx={{
              position: 'fixed',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              minWidth: 300,
              maxWidth: 500,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
              border: '1px solid #ffc107',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              <strong>Du är offline</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#856404' }}>
              Kontrollera din internetanslutning. Vissa funktioner kanske inte fungerar korrekt.
            </Typography>
          </Alert>
        </Fade>
      )}

      {/* Subtle offline indicator in bottom-right corner */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'rgba(255, 193, 7, 0.9)',
            color: '#856404',
            padding: '8px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <CloudOff sx={{ fontSize: 16 }} />
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Offline
          </Typography>
        </Box>
      )}
    </>
  );
};

export default OfflineIndicator; 