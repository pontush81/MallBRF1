import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  Box,
  Alert,
  Link,
  CircularProgress,
  Divider
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Vänligen fyll i både e-post och lösenord');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      // Logga in med Firebase via userService
      const user = await userService.login(email, password);
      
      if (user) {
        // Användaren är inloggad via Firebase, uppdatera kontexten
        authLogin(user);
        
        // Navigera till sidlistan
        navigate('/pages');
      } else {
        setError('Felaktig e-post eller lösenord');
      }
    } catch (err: any) {
      const errorMessage = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Felaktig e-post eller lösenord'
        : err.code === 'auth/too-many-requests'
        ? 'För många försök. Försök igen senare.'
        : 'Kunde inte logga in. Kontrollera dina uppgifter.';
        
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setGoogleLoading(true);
      
      // Logga in med Google via userService
      const user = await userService.loginWithGoogle();
      
      if (user) {
        // Användaren är inloggad via Google, uppdatera kontexten
        authLogin(user);
        
        // Navigera till sidlistan
        navigate('/pages');
      } else {
        setError('Kunde inte logga in med Google');
      }
    } catch (err: any) {
      let errorMessage = 'Kunde inte logga in med Google';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Inloggning avbruten';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Inloggningsfönstret stängdes för snabbt, försök igen';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup-fönstret blockerades. Tillåt popup-fönster och försök igen';
      }
      
      setError(errorMessage);
      console.error('Google login error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Logga in
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-postadress"
              name="email"
              autoComplete="email"
              autoFocus
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
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Logga in'}
            </Button>
            
            <Divider sx={{ my: 2 }}>eller</Divider>
            
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
            
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Glömt lösenord?
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 