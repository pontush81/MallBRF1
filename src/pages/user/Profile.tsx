import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Avatar,
  Divider,
  Alert
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

// Simulated user data
const userData = {
  id: '1',
  name: 'John Doe',
  email: 'user@example.com',
  role: 'user',
  createdAt: '2023-01-15'
};

const Profile: React.FC = () => {
  const [name, setName] = useState(userData.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSuccess('Profilen har uppdaterats!');
      setLoading(false);
    }, 1000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSuccess('Lösenordet har ändrats!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }, 1000);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Min Profil
        </Typography>
        
        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: 'primary.main',
                  margin: '0 auto 16px'
                }}
              >
                <PersonIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6">{userData.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {userData.email}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Roll: {userData.role}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Medlem sedan: {userData.createdAt}
              </Typography>
            </Paper>
          </Grid>
          
          {/* Profile Edit Forms */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              
              <Typography variant="h6" gutterBottom>
                Uppdatera profil
              </Typography>
              
              <form onSubmit={handleProfileUpdate}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Namn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="E-post"
                      value={userData.email}
                      disabled
                      margin="normal"
                      helperText="E-post kan inte ändras"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? 'Uppdaterar...' : 'Uppdatera profil'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Ändra lösenord
              </Typography>
              
              <form onSubmit={handlePasswordChange}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nuvarande lösenord"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      margin="normal"
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nytt lösenord"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      margin="normal"
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bekräfta nytt lösenord"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      margin="normal"
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? 'Ändrar lösenord...' : 'Ändra lösenord'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Profile; 