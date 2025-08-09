// OAuth callback handler for Supabase Auth
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { handleAuthCallback } from '../../services/supabaseAuthNew';
import { useAuth } from '../../context/AuthContextNew';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Handling OAuth callback...');
        
        const user = await handleAuthCallback();
        
        if (user) {
          console.log('OAuth callback successful:', user.email);
          console.log('🔧 User role:', user.role, '| isActive:', user.isActive);
          
          // CRITICAL: Save to localStorage immediately for persistence
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('isLoggedIn', 'true');
          
          // CRITICAL: Update the AuthContext state explicitly
          login(user);
          
          // Redirect to main pages after successful login (same as original behavior)
          navigate('/pages');
        } else {
          throw new Error('No user data received from authentication callback');
        }
        
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setError(error.message || 'Authentication callback failed');
        
        // Redirect to login page after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, login]);

  return (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      p={2}
    >
      {error ? (
        <>
          <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary" align="center">
            Redirecting to login page...
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Completing login...
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Please wait while we finish setting up your session
          </Typography>
        </>
      )}
    </Box>
  );
};