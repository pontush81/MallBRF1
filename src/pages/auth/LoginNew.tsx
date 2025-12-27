// Login component - Google only (Swedish)
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert
} from '@mui/material';
import { StandardLoading } from '../../components/common/StandardLoading';
import { Google as GoogleIcon } from '@mui/icons-material';
import { loginWithGoogle } from '../../services/supabaseAuthNew';

export const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      // Redirect will happen automatically
    } catch (error: unknown) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod';
      setError(errorMessage || 'Inloggning misslyckades. Försök igen.');
      setLoading(false);
    }
  };

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      p={2}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Logga in
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" mb={3}>
          BRF Gulmåran - Admin
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="outlined"
          startIcon={!loading ? <GoogleIcon /> : undefined}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StandardLoading size={20} variant="minimal" />
              <span>Loggar in...</span>
            </Box>
          ) : (
            'Logga in med Google'
          )}
        </Button>

        <Typography variant="body2" align="center" sx={{ mt: 3 }} color="text.secondary">
          Kontakta styrelsen för att få tillgång till systemet
        </Typography>
      </Paper>
    </Box>
  );
};