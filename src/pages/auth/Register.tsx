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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

// User role options
type UserRole = 'user' | 'admin';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Vänligen fyll i alla fält');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }
    
    // TODO: Implementera faktisk registreringslogik med Firebase
    try {
      setError(null);
      setLoading(true);
      
      // Simulerar en registrering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // För demo-syfte, acceptera alla registreringar
      console.log('Registrerad med:', { email, role });
      
      // Navigera till login-sidan efter registrering
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Kunde inte registrera konto');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Registrera konto
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
                  autoComplete="new-password"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bekräfta lösenord"
                  type="password"
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="role-select-label">Roll</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role-select"
                    value={role}
                    label="Roll"
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <MenuItem value="user">Användare</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
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
                  {loading ? 'Registrerar...' : 'Registrera'}
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center">
                  <Typography variant="body2">
                    Har du redan ett konto?{' '}
                    <Link href="/login" color="primary">
                      Logga in här
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

export default Register; 