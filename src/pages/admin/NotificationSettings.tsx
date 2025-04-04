import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { userService } from '../../services/userService';
import { NotificationSettings as NotificationSettingsType } from '../../types/Settings';

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettingsType>({
    newUserNotifications: false,
    notificationEmail: '',
    lastUpdated: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await userService.getNotificationSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError('Kunde inte ladda notifikationsinställningar');
      console.error('Error loading notification settings:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Validera e-postadressen om notifikationer är aktiverade
      if (settings.newUserNotifications && !settings.notificationEmail) {
        setError('Ange en e-postadress för notifikationer');
        setSaving(false);
        return;
      }
      
      // Validera e-postformat
      if (settings.newUserNotifications && 
          settings.notificationEmail && 
          !settings.notificationEmail.includes('@')) {
        setError('Ange en giltig e-postadress');
        setSaving(false);
        return;
      }
      
      // Spara inställningar till Firestore
      await userService.updateNotificationSettings(settings);
      
      setSuccess('Notifikationsinställningar har sparats');
      setError(null);
    } catch (err) {
      setError('Kunde inte spara notifikationsinställningar: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error saving notification settings:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggleNotifications = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      newUserNotifications: event.target.checked
    }));
  };
  
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      notificationEmail: event.target.value
    }));
  };
  
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Notifikationsinställningar
      </Typography>
      
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
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" gutterBottom>
              E-postnotifikationer för nya användare
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              När denna inställning är aktiverad skickas ett e-postmeddelande till den angivna adressen 
              varje gång en ny användare registrerar sig och behöver godkännas.
            </Typography>
            
            <Box sx={{ mt: 3, mb: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.newUserNotifications}
                    onChange={handleToggleNotifications}
                    color="primary"
                  />
                }
                label="Aktivera e-postnotifikationer för nya användare"
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mt: 3 }}>
              <TextField
                label="Notifikations-e-postadress"
                value={settings.notificationEmail}
                onChange={handleEmailChange}
                disabled={!settings.newUserNotifications}
                fullWidth
                margin="normal"
                placeholder="admin@exempel.se"
                helperText={
                  settings.newUserNotifications 
                    ? "Notifikationer om nya användare skickas till denna adress" 
                    : "Aktivera notifikationer ovan för att ange e-postadress"
                }
              />
            </Box>
          </>
        )}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={loading || saving}
        >
          {saving ? 'Sparar...' : 'Spara inställningar'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationSettings; 