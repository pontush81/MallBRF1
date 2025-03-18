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
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('Alla fält måste fyllas i');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Lösenorden matchar inte');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setError(null);
      setLoading(true);
      
      // Skapa användaren med Firebase via userService
      const newUser = await userService.createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'user',
        isActive: true
      });
      
      if (newUser) {
        // Användaren är nu registrerad och inloggad via Firebase
        login(newUser);
        navigate('/pages');
      }
    } catch (err: any) {
      const errorMessage = 
        err.code === 'auth/email-already-in-use' 
          ? 'E-postadressen används redan av ett annat konto' 
          : err.code === 'auth/invalid-email' 
          ? 'Ogiltig e-postadress'
          : err.code === 'auth/weak-password'
          ? 'Lösenordet är för svagt'
          : 'Kunde inte skapa kontot. Försök igen.';
      
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Registrera nytt konto
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
              id="name"
              label="Namn"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-postadress"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Bekräfta lösenord"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Registrera'}
            </Button>
            
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/login" variant="body2">
                  Har du redan ett konto? Logga in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 