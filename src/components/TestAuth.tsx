// Quick test component for new Supabase Auth
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, Paper } from '@mui/material';
import { getCurrentUser, logout, loginWithGoogle } from '../services/supabaseAuthNew';
import type { AuthUser } from '../services/supabaseAuthNew';

export const TestAuth: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-load current user when component mounts
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setMessage(`✅ User found: ${currentUser.email}`);
        }
      } catch (error) {
        console.log('No user logged in initially');
      }
    };
    
    loadCurrentUser();
  }, []);

  const testGetCurrentUser = async () => {
    setLoading(true);
    setMessage('');
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setMessage(currentUser ? `✅ User found: ${currentUser.email}` : '❌ No user logged in');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogout = async () => {
    setLoading(true);
    setMessage('');
    try {
      await logout();
      setUser(null);
      setMessage('✅ Logout successful');
    } catch (error: any) {
      setMessage(`❌ Logout error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      await loginWithGoogle();
      setMessage('🚀 Redirecting to Google...');
      // Redirect happens automatically - user will come back via callback
    } catch (error: any) {
      setMessage(`❌ Google login error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>
        🧪 Supabase Auth Test Component
      </Typography>
      
      {message && (
        <Alert 
          severity={message.startsWith('✅') ? 'success' : 'error'} 
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Button 
          onClick={testGetCurrentUser} 
          disabled={loading}
          variant="outlined"
          sx={{ mr: 2, mb: 1 }}
        >
          Test getCurrentUser()
        </Button>
        
        <Button 
          onClick={testLogout} 
          disabled={loading || !user}
          variant="outlined"
          color="secondary"
          sx={{ mr: 2, mb: 1 }}
          data-testid="logout-btn"
        >
          Test logout()
        </Button>
        
        <Button 
          onClick={testGoogleLogin} 
          disabled={loading}
          variant="contained"
          color="primary"
          sx={{ mb: 1 }}
          data-testid="google-login-btn"
        >
          🎯 Test Google OAuth
        </Button>
      </Box>

      {user && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }} data-testid="user-info">
          <Typography variant="h6">Current User:</Typography>
          <Typography><strong>ID:</strong> {user.id}</Typography>
          <Typography data-testid="user-email"><strong>Email:</strong> {user.email}</Typography>
          <Typography><strong>Name:</strong> {user.name}</Typography>
          <Typography><strong>Role:</strong> {user.role}</Typography>
          <Typography><strong>Active:</strong> {user.isActive ? 'Yes' : 'No'}</Typography>
        </Box>
      )}

      <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
        🔧 Remove this component after successful migration testing
      </Typography>
    </Paper>
  );
};