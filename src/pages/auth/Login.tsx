import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // Check for Google sign-in redirect result when component mounts
  useEffect(() => {
    console.log('Login component mounted, checking for Google redirect');
    const checkGoogleRedirect = async () => {
      try {
        const user = await userService.handleGoogleRedirect();
        if (user) {
          console.log('Successfully logged in with Google redirect, user:', user.email);
          authLogin(user);
          navigate('/pages');
        } else {
          console.log('No Google redirect result found or login was not completed');
        }
      } catch (err: any) {
        console.error('Error handling Google redirect:', err.code, err.message);
        setError('Kunde inte slutföra Google-inloggningen: ' + (err.message || 'Okänt fel'));
      }
    };
    
    checkGoogleRedirect();
  }, [authLogin, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setGoogleLoading(true);
      
      // Använd popup istället för redirect
      const user = await userService.loginWithGoogle();
      
      if (user) {
        console.log('Successfully logged in with Google, user:', user.email);
        authLogin(user);
        navigate('/pages');
      } else {
        setError('Kunde inte slutföra Google-inloggningen');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      const errorMessage = err.code === 'auth/popup-closed-by-user' 
        ? 'Popup-fönstret stängdes. Försök igen.' 
        : err.code === 'auth/popup-blocked'
        ? 'Popup-fönstret blockerades av webbläsaren. Kontrollera dina inställningar.'
        : 'Kunde inte slutföra Google-inloggningen: ' + (err.message || 'Okänt fel');
      
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setError(null);
      setFacebookLoading(true);
      
      const user = await userService.loginWithFacebook();
      
      if (user) {
        console.log('Successfully logged in with Facebook, user:', user.email);
        authLogin(user);
        navigate('/pages');
      } else {
        setError('Kunde inte slutföra Facebook-inloggningen');
      }
    } catch (err: any) {
      console.error('Facebook login error:', err);
      const errorMessage = err.code === 'auth/popup-closed-by-user' 
        ? 'Popup-fönstret stängdes. Försök igen.' 
        : err.code === 'auth/popup-blocked'
        ? 'Popup-fönstret blockerades av webbläsaren. Kontrollera dina inställningar.'
        : 'Kunde inte slutföra Facebook-inloggningen: ' + (err.message || 'Okänt fel');
      
      setError(errorMessage);
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Logga in
          </Typography>
          
          <Box component="form" noValidate sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              sx={{ mb: 2, py: 1.2 }}
            >
              {googleLoading ? <CircularProgress size={24} /> : 'Logga in med Google'}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FacebookIcon />}
              onClick={handleFacebookSignIn}
              disabled={facebookLoading}
              sx={{ mb: 2, py: 1.2 }}
              style={{ backgroundColor: '#1877F2', color: 'white', borderColor: '#1877F2' }}
            >
              {facebookLoading ? <CircularProgress size={24} /> : 'Logga in med Facebook'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 