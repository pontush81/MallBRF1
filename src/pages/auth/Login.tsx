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
    try {
      setLoading(true);
      const user = await userService.loginWithGoogle();
      if (user) {
        login(user);
        navigate('/pages');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMicrosoftLogin = async () => {
    setError(null);
    setPendingApproval(false);
    try {
      setLoading(true);
      const user = await userService.loginWithMicrosoft();
      if (user) {
        login(user);
        navigate('/pages');
      }
    } catch (err: any) {
      console.error('Microsoft login error:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAuthError = (err: any) => {
    let errorMessage = 'Ett fel uppstod vid inloggning';
    
    // Check if the error message indicates pending approval
    if (err.message && err.message.includes('väntar på godkännande')) {
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