// OAuth callback handler for Supabase Auth
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { StandardLoading } from '../../components/common/StandardLoading';
import { handleAuthCallback } from '../../services/supabaseAuthNew';
import { useAuth } from '../../context/AuthContextNew';

export const AuthCallback: React.FC = () => {
  console.log('🚨 AuthCallback: Component is rendering!');
  console.log('🔧 Current URL:', window.location.href);
  console.log('🔧 Hash:', window.location.hash);
  console.log('🔧 Pathname:', window.location.pathname);
  
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Show that component is actually rendering
  console.log('✅ AuthCallback component mounted and running!');

  useEffect(() => {
    const handleCallback = async () => {
      // If user is already logged in and trying to access another route
      if (isLoggedIn && window.location.hash) {
        console.log('🔄 User already logged in, redirecting to hash route:', window.location.hash);
        const hashRoute = window.location.hash.substring(1); // Remove #
        window.location.replace(hashRoute);
        return;
      }
      
      // If user is already logged in but no hash, go to pages
      if (isLoggedIn) {
        console.log('🔄 User already logged in, redirecting to /pages');
        window.location.replace('/pages');
        return;
      }
      // Prevent double execution
      if (isProcessing) {
        console.log('⚠️ OAuth callback already processing, skipping...');
        return;
      }
      
      setIsProcessing(true);
      
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
          
          // CRITICAL: Wait for state to propagate before navigation
          console.log('⏳ Waiting for auth state to propagate...');
          setTimeout(() => {
            console.log('🚀 Redirecting to /pages after state update');
            // CRITICAL: Use window.location.replace for clean URL after OAuth
            window.location.replace('/pages');
          }, 100); // Small delay to ensure state updates
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
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, login, isLoggedIn, isProcessing]);

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
          <StandardLoading size={48} message="Completing login..." />
          <Typography variant="body2" color="text.secondary" align="center">
            Please wait while we finish setting up your session
          </Typography>
        </>
      )}
    </Box>
  );
};