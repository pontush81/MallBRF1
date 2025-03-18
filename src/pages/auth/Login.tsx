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
  ButtonGroup
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

// Förinställda konton för demo
const PRESET_ACCOUNTS = {
  user: {
    id: 'user1',
    email: 'user@example.com',
    password: 'password123',
    role: 'user',
    name: 'Test Användare'
  },
  admin: {
    id: 'admin1',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
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
    
    // TODO: Implementera faktisk inloggningslogik med Firebase
    try {
      setError(null);
      setLoading(true);
      
      // Simulerar en inloggning
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // För demo-syfte, kontrollera med preset accounts
      let user = null;
      
      if (email === PRESET_ACCOUNTS.admin.email && password === PRESET_ACCOUNTS.admin.password) {
        user = {
          id: PRESET_ACCOUNTS.admin.id,
          email: PRESET_ACCOUNTS.admin.email,
          role: 'admin' as const,
          name: PRESET_ACCOUNTS.admin.name
        };
      } else if (email === PRESET_ACCOUNTS.user.email && password === PRESET_ACCOUNTS.user.password) {
        user = {
          id: PRESET_ACCOUNTS.user.id,
          email: PRESET_ACCOUNTS.user.email,
          role: 'user' as const,
          name: PRESET_ACCOUNTS.user.name
        };
      } else {
        // För testning, acceptera alla inloggningar och anta en användarroll
        user = {
          id: 'demo' + Date.now(),
          email: email,
          role: 'user' as const
        };
      }
      
      console.log('Inloggad med:', user);
      
      // Logga in användaren i AuthContext
      if (user) {
        login(user);
      }
      
      // Alla användare omdirigeras till sidlistan
      navigate('/pages');
    } catch (err: any) {
      setError(err.message || 'Kunde inte logga in');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Funktion för att fylla i förinställda konton
  const fillPresetAccount = (type: 'user' | 'admin') => {
    setEmail(PRESET_ACCOUNTS[type].email);
    setPassword(PRESET_ACCOUNTS[type].password);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Logga in
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="E-post"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lösenord"
                  type="password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Loggar in...' : 'Logga in'}
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Testanvändare
                  </Typography>
                </Divider>
                
                <Box display="flex" justifyContent="center" sx={{ mb: 2 }}>
                  <ButtonGroup variant="outlined" size="small">
                    <Button onClick={() => fillPresetAccount('user')}>
                      Användare
                    </Button>
                    <Button onClick={() => fillPresetAccount('admin')}>
                      Admin
                    </Button>
                  </ButtonGroup>
                </Box>
                
                <Box display="flex" justifyContent="center" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Klicka på knapparna ovan för att fylla i förinställda inloggningsuppgifter
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="center">
                  <Typography variant="body2">
                    Har du inget konto?{' '}
                    <Link href="/register" color="primary">
                      Registrera dig här
                    </Link>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 