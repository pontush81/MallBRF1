import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  Grid,
  Link,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  Microsoft as MicrosoftIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { loginWithGoogle } from '../../services/supabaseAuthNew';
import { useAuth } from '../../context/AuthContextNew';
import Logo from '../../components/Logo';

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  
  const handleGoogleSignUp = async () => {
    setError(null);
    setPendingApproval(false);
    try {
      setLoading(true);
      await loginWithGoogle();
      // OAuth will redirect automatically, no need to call login() here
      console.log('✅ Google OAuth initiated successfully - redirecting...');
    } catch (err: any) {
      console.error('Google register error:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMicrosoftSignUp = async () => {
    setError('Microsoft login is not implemented yet. Please use Google login.');
    // TODO: Implement Microsoft OAuth with Supabase when needed
  };
  
  const handleAuthError = (err: any) => {
    let errorMessage = 'Ett fel uppstod vid registrering';
    
    // Check if the error message indicates pending approval
    if (err.message && (
      err.message.includes('väntar på godkännande') || 
      err.message.includes('behöver godkännas') ||
      err.message.includes('tagits emot')
    )) {
      setPendingApproval(true);
      setError(null); // Clear any existing error
      return;
    }
    
    // Handle different Firebase auth error codes
    if (err.code) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'E-postadressen används redan';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Ogiltig e-postadress';
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
            Registrera
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {pendingApproval && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              backgroundColor: 'info.lighter',
              border: '1px solid',
              borderColor: 'info.light',
              borderRadius: 2
            }}
          >
            <AlertTitle>Registrering mottagen</AlertTitle>
            Din registrering har tagits emot och väntar på godkännande. Du kommer att kunna logga in så snart ditt konto har godkänts av en administratör.
            <Typography variant="body2" sx={{ mt: 1 }}>
              Vi kommer att meddela dig via e-post när ditt konto är aktiverat.
            </Typography>
          </Alert>
        )}
        
        {!pendingApproval && (
          <>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              Registrera dig med ditt sociala konto:
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleSignUp}
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
                  onClick={handleMicrosoftSignUp}
                  disabled={loading}
                  sx={{ py: 1 }}
                >
                  Microsoft
                </Button>
              </Grid>
            </Grid>
          </>
        )}
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Har du redan ett konto?{' '}
            <Link component={RouterLink} to="/login">
              Logga in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;