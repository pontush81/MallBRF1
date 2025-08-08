import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,

  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  Grid,
  Divider,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationIcon,
  Email as EmailIcon,

} from '@mui/icons-material';
import supabaseClient from '../../services/supabaseClient';

interface NotificationSettingsData {
  id?: string;
  email_notifications: boolean;
  booking_confirmations: boolean;
  maintenance_reminders: boolean;
  system_alerts: boolean;
  admin_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  created_at?: string;
  updated_at?: string;
}

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettingsData>({
    email_notifications: true,
    booking_confirmations: true,
    maintenance_reminders: true,
    system_alerts: true,
    admin_email: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: ''
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
      const { data, error } = await supabaseClient
        .from('notification_settings')
        .select('*')
        .single();

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === '42P01') {
          setError('Notifikationstabellen behöver skapas i databasen. Kontakta administratör för att köra migrationen.');
          return;
        }
        // If no rows returned, that's fine - use defaults
        if (error.code !== 'PGRST116') {
          throw error;
        }
      }

      if (data) {
        setSettings(data);
      }
      setError(null);
    } catch (err: any) {
      setError('Kunde inte ladda notifikationsinställningar: ' + err.message);
      console.error('Error loading notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const { data, error } = await supabaseClient
        .from('notification_settings')
        .upsert([{
          ...settings,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      setSuccess('Notifikationsinställningar sparade');
    } catch (err: any) {
      setError('Kunde inte spara inställningar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof NotificationSettingsData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleTextChange = (field: keyof NotificationSettingsData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'smtp_port' ? parseInt(event.target.value) || 587 : event.target.value;
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notifikationsinställningar
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSettings}
          disabled={loading}
        >
          Uppdatera
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notification Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Notifikationstyper"
              avatar={<NotificationIcon />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.email_notifications}
                      onChange={handleToggle('email_notifications')}
                    />
                  }
                  label="E-postnotifikationer"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.booking_confirmations}
                      onChange={handleToggle('booking_confirmations')}
                    />
                  }
                  label="Bokningsbekräftelser"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenance_reminders}
                      onChange={handleToggle('maintenance_reminders')}
                    />
                  }
                  label="Underhållspåminnelser"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.system_alerts}
                      onChange={handleToggle('system_alerts')}
                    />
                  }
                  label="Systemvarningar"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Email Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="E-postkonfiguration"
              avatar={<EmailIcon />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Admin e-postadress"
                  value={settings.admin_email}
                  onChange={handleTextChange('admin_email')}
                  fullWidth
                  type="email"
                  helperText="E-postadress för administrativa meddelanden"
                />
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="subtitle2" color="text.secondary">
                  SMTP-inställningar
                </Typography>
                
                <TextField
                  label="SMTP Server"
                  value={settings.smtp_host}
                  onChange={handleTextChange('smtp_host')}
                  fullWidth
                  placeholder="smtp.gmail.com"
                />
                
                <TextField
                  label="SMTP Port"
                  value={settings.smtp_port}
                  onChange={handleTextChange('smtp_port')}
                  fullWidth
                  type="number"
                  placeholder="587"
                />
                
                <TextField
                  label="SMTP Användarnamn"
                  value={settings.smtp_user}
                  onChange={handleTextChange('smtp_user')}
                  fullWidth
                  placeholder="ditt-email@domain.se"
                />
                
                <TextField
                  label="SMTP Lösenord"
                  value={settings.smtp_password}
                  onChange={handleTextChange('smtp_password')}
                  fullWidth
                  type="password"
                  placeholder="Ditt lösenord eller app-specifikt lösenord"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Sparar...' : 'Spara inställningar'}
        </Button>
      </Box>

      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={success}
      />
    </Box>
  );
};

export default NotificationSettings;