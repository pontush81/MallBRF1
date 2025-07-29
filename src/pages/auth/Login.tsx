import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  Grid,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  Microsoft as MicrosoftIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  
  // Add a useEffect to catch any unhandled GDPR errors
  useEffect(() => {
    const handleUnhandledRejection = (event: any) => {
      console.log('🚨 Unhandled promise rejection:', event.reason);
      if (event.reason && typeof event.reason === 'object' && event.reason.message) {
        const errorMsg = event.reason.message;
        if (errorMsg.includes('GDPR erasure request') || errorMsg.includes('permanently deleted')) {
          console.log('🚨 Catching unhandled GDPR error in global handler');
          handleAuthError(event.reason);
          event.preventDefault(); // Prevent default error logging
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      navigate('/pages');
    }
  }, [navigate]);
  
  const handleGoogleLogin = async () => {
    setError(null);
    setPendingApproval(false);
    setLoading(true);
    
    try {
      console.log('🔍 Starting Google login...');
      const user = await userService.loginWithGoogle();
      console.log('✅ Google auth successful, user:', user?.email);
      
      if (user) {
        try {
          console.log('🔍 Calling login function for user:', user.email);
          await login(user);
          console.log('✅ Login successful, navigating...');
          navigate('/pages');
        } catch (loginError: any) {
          console.error('❌ Login error after Google auth:', loginError);
          console.error('❌ Error message:', loginError.message);
          console.error('❌ Full error object:', loginError);
          handleAuthError(loginError);
        }
      }
    } catch (err: any) {
      console.error('❌ Google login service error:', err);
      console.error('❌ Service error message:', err.message);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMicrosoftLogin = async () => {
    setError(null);
    setPendingApproval(false);
    setLoading(true);
    
    try {
      console.log('🔍 Starting Microsoft login...');
      const user = await userService.loginWithMicrosoft();
      console.log('✅ Microsoft auth successful, user:', user?.email);
      
      if (user) {
        try {
          console.log('🔍 Calling login function for user:', user.email);
          await login(user);
          console.log('✅ Login successful, navigating...');
          navigate('/pages');
        } catch (loginError: any) {
          console.error('❌ Login error after Microsoft auth:', loginError);
          console.error('❌ Error message:', loginError.message);
          console.error('❌ Full error object:', loginError);
          handleAuthError(loginError);
        }
      }
    } catch (err: any) {
      console.error('❌ Microsoft login service error:', err);
      console.error('❌ Service error message:', err.message);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAuthError = (err: any) => {
    console.log('🔍 Handling auth error in UI:', err);
    console.log('🔍 Error message:', err.message);
    console.log('🔍 Error type:', typeof err);
    console.log('🔍 Error keys:', Object.keys(err));
    
    let errorMessage = 'Ett fel uppstod vid inloggning';
    
    // Check for GDPR deletion error - show appropriate message
    const errorMsg = err.message || err.toString();
    
    if (errorMsg.includes('GDPR erasure request') || errorMsg.includes('permanently deleted')) {
      console.log('🚨 GDPR error detected in UI:', errorMsg);
      
      if (errorMsg.includes('same_user_attempting_restoration')) {
        console.log('✅ Setting GDPR restoration error message');
        setError('🚫 Ditt konto har raderats permanent enligt din GDPR-begäran om radering. Du kan inte återställa samma konto. Om du vill använda tjänsten igen kan du skapa ett nytt konto med en annan Google/Microsoft-inloggning.');
      } else {
        console.log('✅ Setting GDPR general error message');
        setError('🚫 Ditt konto har raderats permanent enligt din GDPR-begäran om radering. Du kan inte längre logga in i systemet. Kontakta administratören om du har frågor.');
      }
      return;
    }
    
    // Check if the error message indicates pending approval
    if (errorMsg.includes('väntar på godkännande')) {
      console.log('✅ Setting pending approval state');
      setPendingApproval(true);
      return;
    }
    
    // Handle different Firebase auth error codes
    if (err.code) {
      switch (err.code) {
        case 'auth/too-many-requests':
          errorMessage = 'För många misslyckade inloggningsförsök. Försök igen senare.';
          break;
        default:
          errorMessage = err.message || errorMessage;
      }
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    console.log('✅ Setting general error message:', errorMessage);
    setError(errorMessage);
  };
  
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 4 },
          borderRadius: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 4
        }}>
          <Logo size={isMobile ? 70 : 100} />
          <Typography variant="h5" component="h1" sx={{ mt: 2 }}>
            Logga in
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {pendingApproval && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Väntar på godkännande</AlertTitle>
            Ditt konto väntar på godkännande från administratören. Du kommer få tillgång när ditt konto har godkänts.
            <Typography variant="body2" sx={{ mt: 1 }}>
              Om du tror att detta är ett misstag, vänligen kontakta administratören.
            </Typography>
          </Alert>
        )}
        
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Logga in med ditt sociala konto:
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{ py: 1 }}
            >
              Google
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MicrosoftIcon />}
              onClick={handleMicrosoftLogin}
              disabled={loading}
              sx={{ py: 1 }}
            >
              Microsoft
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={() => navigate('/')}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: 'primary.main',
              }
            }}
          >
            Tillbaka till startsidan
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 