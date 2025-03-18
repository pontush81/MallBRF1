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
  Divider,
  ButtonGroup,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';

// Förinställda konton för demo
// (Vid användning av Firebase kommer dessa konton att skapas automatiskt i Firebase Auth)
const PRESET_ACCOUNTS = {
  user: {
    email: 'user@example.com',
    password: 'password123'
  },
  admin: {
    email: 'admin@example.com',
    password: 'admin123'
  }
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

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
      const user = await userService.loginUser(email, password);
      
      if (user) {
        // Användaren är inloggad via Firebase, uppdatera kontexten
        login(user);
        
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

  // Funktion för att fylla i demo-användarkonton
  const fillDemoCredentials = (type: 'user' | 'admin') => {
    const account = PRESET_ACCOUNTS[type];
    setEmail(account.email);
    setPassword(account.password);
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
            
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Glömt lösenord?
                </Link>
              </Grid>
              <Grid item>
                <Link href="/register" variant="body2">
                  {"Har du inget konto? Registrera dig"}
                </Link>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Demo-konton
              </Typography>
            </Divider>
            
            <ButtonGroup variant="outlined" fullWidth>
              <Button 
                onClick={() => fillDemoCredentials('user')}
                sx={{ py: 1 }}
                disabled={loading}
              >
                Användare
              </Button>
              <Button 
                onClick={() => fillDemoCredentials('admin')}
                sx={{ py: 1 }}
                disabled={loading}
              >
                Administratör
              </Button>
            </ButtonGroup>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 