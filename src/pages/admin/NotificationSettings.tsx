import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Snackbar,
  Grid,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { StandardLoading } from '../../components/common/StandardLoading';
import supabaseClient from '../../services/supabaseClient';

interface NotificationSettingsData {
  id?: string;
  email_notifications: boolean;
  booking_confirmations: boolean;
  maintenance_reminders: boolean;
  system_alerts: boolean;
  fault_report_notifications: boolean;
  admin_email: string;
  fault_report_emails: string[];
  created_at?: string;
  updated_at?: string;
}

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettingsData>({
    email_notifications: true,
    booking_confirmations: true,
    maintenance_reminders: true,
    system_alerts: true,
    fault_report_notifications: true,
    admin_email: '',
    fault_report_emails: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    console.log('🔄 Loading notification settings...');
    setLoading(true);
    setError(null);
    
    // Use AbortController for proper timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout triggered');
      controller.abort();
    }, 30000);
    
    try {
      const { data, error } = await supabaseClient
        .from('notification_settings')
        .select('*')
        .abortSignal(controller.signal)
        .single();
      
      clearTimeout(timeoutId);

      if (error) {
        console.log('❌ Supabase error:', error.code, error.message);
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
        console.log('✅ Settings loaded successfully');
        setSettings({
          ...data,
          fault_report_emails: data.fault_report_emails || [],
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Laddningen tog för lång tid. Klicka Uppdatera för att försöka igen.');
      } else {
        setError('Kunde inte ladda notifikationsinställningar: ' + err.message);
      }
      console.error('Error loading notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('💾 Sparar notifikationsinställningar:', settings);
      
      // Use update if we have an ID, otherwise insert
      let result;
      if (settings.id) {
        // Update existing row
        result = await supabaseClient
          .from('notification_settings')
          .update({
            email_notifications: settings.email_notifications,
            booking_confirmations: settings.booking_confirmations,
            maintenance_reminders: settings.maintenance_reminders,
            system_alerts: settings.system_alerts,
            fault_report_notifications: settings.fault_report_notifications,
            admin_email: settings.admin_email,
            fault_report_emails: settings.fault_report_emails,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)
          .select()
          .single();
      } else {
        // Insert new row
        result = await supabaseClient
          .from('notification_settings')
          .insert({
            email_notifications: settings.email_notifications,
            booking_confirmations: settings.booking_confirmations,
            maintenance_reminders: settings.maintenance_reminders,
            system_alerts: settings.system_alerts,
            fault_report_notifications: settings.fault_report_notifications,
            admin_email: settings.admin_email,
            fault_report_emails: settings.fault_report_emails,
          })
          .select()
          .single();
      }
      
      const { data, error } = result;

      if (error) {
        console.error('❌ Databasfel:', error);
        throw error;
      }

      setSettings(data);
      console.log('✅ Inställningar sparade:', data);
      setSuccess(`✅ Sparade! Admin e-post: ${data.admin_email || settings.admin_email}`);
    } catch (err: any) {
      console.error('❌ Sparfel:', err);
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
    setSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ogiltig e-postadress.');
      return;
    }
    if (settings.fault_report_emails.includes(email)) {
      setError('E-postadressen finns redan i listan.');
      return;
    }
    setSettings(prev => ({
      ...prev,
      fault_report_emails: [...prev.fault_report_emails, email],
    }));
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    setSettings(prev => ({
      ...prev,
      fault_report_emails: prev.fault_report_emails.filter(e => e !== email),
    }));
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <StandardLoading message="Loading notification settings..." />
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
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.email_notifications}
                        onChange={handleToggle('email_notifications')}
                      />
                    }
                    label="E-postnotifikationer"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5, mb: 1 }}>
                    🔑 Huvudswitch - Stänger av ALLA e-postnotifikationer från systemet
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.booking_confirmations}
                        onChange={handleToggle('booking_confirmations')}
                        disabled={!settings.email_notifications}
                      />
                    }
                    label="Bokningsbekräftelser"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5, mb: 1 }}>
                    📅 Skickar e-post till admin när någon gör en ny bokning av gästlägenheten
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.maintenance_reminders}
                        onChange={handleToggle('maintenance_reminders')}
                        disabled={!settings.email_notifications}
                      />
                    }
                    label="Underhållspåminnelser"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5, mb: 1 }}>
                    🔧 Skickar e-post när underhållsuppgifter behöver utföras eller är försenade
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.system_alerts}
                        onChange={handleToggle('system_alerts')}
                        disabled={!settings.email_notifications}
                      />
                    }
                    label="Systemvarningar"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5, mb: 1 }}>
                    🚨 Skickar e-post vid systemfel, säkerhetsproblem eller viktiga uppdateringar
                  </Typography>
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.fault_report_notifications}
                        onChange={handleToggle('fault_report_notifications')}
                        disabled={!settings.email_notifications}
                      />
                    }
                    label="Felanmälningar"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5, mb: 1 }}>
                    🔧 Skickar e-post till admin när boende rapporterar fel
                  </Typography>
                </Box>
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
                  helperText="E-postadress för allmänna administrativa meddelanden"
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle1" fontWeight="bold">
                  Mottagare av felanmälningar
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
                  Dessa e-postadresser får notis när en ny felanmälan skickas in.
                </Typography>

                {settings.fault_report_emails.length > 0 && (
                  <List dense disablePadding>
                    {settings.fault_report_emails.map((email) => (
                      <ListItem key={email} disableGutters>
                        <ListItemText primary={email} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveEmail(email)}
                            aria-label={`Ta bort ${email}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Lägg till e-postadress"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
                    fullWidth
                    type="email"
                    size="small"
                    placeholder="namn@exempel.se"
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddEmail}
                    startIcon={<AddIcon />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Lägg till
                  </Button>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Alert severity="info">
                  <Typography variant="body2">
                    E-post skickas via Gmail SMTP (gulmaranbrf@gmail.com).
                  </Typography>
                </Alert>
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