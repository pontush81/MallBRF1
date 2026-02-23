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
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { StandardLoading } from '../../components/common/StandardLoading';
import { authenticatedRestCall } from '../../services/supabaseClient';

interface NotificationSettingsData {
  id?: string;
  email_notifications: boolean;
  booking_confirmations: boolean;
  maintenance_reminders: boolean;
  system_alerts: boolean;
  fault_report_notifications: boolean;
  admin_email: string;
  fault_report_emails: string[];
  whatsapp_notifications: boolean;
  whatsapp_phones: string[];
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
    whatsapp_notifications: false,
    whatsapp_phones: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await authenticatedRestCall('GET', 'notification_settings?select=*&limit=1');
      if (Array.isArray(data) && data.length > 0) {
        setSettings({
          ...data[0],
          fault_report_emails: data[0].fault_report_emails || [],
          whatsapp_notifications: data[0].whatsapp_notifications || false,
          whatsapp_phones: data[0].whatsapp_phones || [],
        });
      }
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
      setError(null);

      const payload = {
        email_notifications: settings.email_notifications,
        booking_confirmations: settings.booking_confirmations,
        maintenance_reminders: settings.maintenance_reminders,
        system_alerts: settings.system_alerts,
        fault_report_notifications: settings.fault_report_notifications,
        admin_email: settings.admin_email,
        fault_report_emails: settings.fault_report_emails,
        whatsapp_notifications: settings.whatsapp_notifications,
        whatsapp_phones: settings.whatsapp_phones,
      };

      let data;
      if (settings.id) {
        data = await authenticatedRestCall('PATCH', `notification_settings?id=eq.${settings.id}&select=*`, {
          ...payload,
          updated_at: new Date().toISOString(),
        });
      } else {
        data = await authenticatedRestCall('POST', 'notification_settings?select=*', payload);
      }

      const row = Array.isArray(data) && data.length > 0 ? data[0] : data;
      if (row) {
        setSettings(row);
        setSuccess(`Sparade! Admin e-post: ${row.admin_email || settings.admin_email}`);
      }
    } catch (err: any) {
      console.error('Save error:', err);
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

  const handleAddPhone = () => {
    const phone = newPhone.trim();
    if (!phone) return;
    if (!/^\+46\d{8,11}$/.test(phone)) {
      setError('Telefonnumret måste vara i formatet +46XXXXXXXXX');
      return;
    }
    if (settings.whatsapp_phones.includes(phone)) {
      setError('Telefonnumret finns redan i listan.');
      return;
    }
    setSettings(prev => ({
      ...prev,
      whatsapp_phones: [...prev.whatsapp_phones, phone],
    }));
    setNewPhone('');
  };

  const handleRemovePhone = (phone: string) => {
    setSettings(prev => ({
      ...prev,
      whatsapp_phones: prev.whatsapp_phones.filter(p => p !== phone),
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
        {/* WhatsApp Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="WhatsApp-konfiguration"
              avatar={<WhatsAppIcon />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.whatsapp_notifications}
                        onChange={handleToggle('whatsapp_notifications')}
                        disabled={!settings.email_notifications}
                      />
                    }
                    label="WhatsApp-notiser vid felanmälan"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5, mb: 1 }}>
                    Skickar WhatsApp-meddelande till styrelsen när en ny felanmälan inkommer
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle1" fontWeight="bold">
                  Mottagare (telefonnummer)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
                  Dessa telefonnummer får WhatsApp-notis vid ny felanmälan.
                </Typography>

                {settings.whatsapp_phones.length > 0 && (
                  <List dense disablePadding>
                    {settings.whatsapp_phones.map((phone) => (
                      <ListItem key={phone} disableGutters>
                        <ListItemText primary={phone} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemovePhone(phone)}
                            aria-label={`Ta bort ${phone}`}
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
                    label="Lägg till telefonnummer"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhone(); } }}
                    fullWidth
                    size="small"
                    placeholder="+46701234567"
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddPhone}
                    startIcon={<AddIcon />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Lägg till
                  </Button>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Alert severity="info">
                  <Typography variant="body2">
                    Kräver WhatsApp Business Cloud API. Kontakta admin för att sätta upp API-nyckel.
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