import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField,
  Typography, 
  Container, 
  Paper, 
  Divider,
  Grid,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  Microsoft as MicrosoftIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingApproval(false);
    
    if (!name || !email || !password) {
      setError('Vänligen fyll i alla fält');
      return;
    }
    
    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken');
      return;
    }
    
    try {
      setLoading(true);
      const user = await userService.register(email, password, name);
      if (user) {
        login(user);
        navigate('/pages');
      }
    } catch (err: any) {
      console.error('Register error:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
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
      console.error('Google register error:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMicrosoftSignUp = async () => {
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
      console.error('Microsoft register error:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAuthError = (err: any) => {
    let errorMessage = 'Ett fel uppstod vid registrering';
    
    // Check if the error message indicates pending approval
    if (err.message && err.message.includes('väntar på godkännande')) {
      setPendingApproval(true);
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
        case 'auth/weak-password':
          errorMessage = 'Lösenordet är för svagt';
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
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Ansökan mottagen</AlertTitle>
            Tack för din ansökan! Ditt konto har skapats men behöver godkännas av en administratör innan du kan logga in.
            <Typography variant="body2" sx={{ mt: 1 }}>
              Du kommer att kunna logga in så snart ditt konto har godkänts.
            </Typography>
          </Alert>
        )}
        
        {!pendingApproval && (
          <>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Namn"
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="E-post"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Lösenord"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                Registrera
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                eller
              </Typography>
            </Divider>
            
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