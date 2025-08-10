import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { StandardLoading } from './common/StandardLoading';
import {
  PersonSearch as AccessIcon,
  Edit as RectifyIcon,
  Delete as DeleteIcon,
  CloudDownload as PortabilityIcon,
  Security as SecurityIcon,
  Pause as RestrictionIcon,
  Block as ObjectionIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContextNew';

type RequestType = 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';

interface GDPRRequestResponse {
  success?: boolean;
  message?: string;
  personalData?: any;
  error?: string;
}

const GDPRRequestForm: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [requestType, setRequestType] = useState<RequestType>('access');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GDPRRequestResponse | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const [rectificationData, setRectificationData] = useState({
    name: '',
    phone: ''
  });

  const requestTypes = [
    {
      value: 'access',
      label: 'Åtkomst till mina data',
      icon: <AccessIcon />,
      description: 'Få en kopia av all personlig data vi har om dig',
      color: 'primary' as const
    },
    {
      value: 'rectification',
      label: 'Korrigera mina data',
      icon: <RectifyIcon />,
      description: 'Begär att felaktig eller ofullständig data rättas',
      color: 'warning' as const
    },
    {
      value: 'erasure',
      label: 'Radera mina data',
      icon: <DeleteIcon />,
      description: 'Begär att all personlig data raderas permanent',
      color: 'error' as const
    },
    {
      value: 'portability',
      label: 'Exportera mina data',
      icon: <PortabilityIcon />,
      description: 'Få dina data i ett portabelt format för överföring',
      color: 'info' as const
    },
    {
      value: 'restriction',
      label: 'Begränsa behandling',
      icon: <RestrictionIcon />,
      description: 'Begär att vi pausar behandlingen av dina uppgifter tillfälligt',
      color: 'secondary' as const
    },
    {
      value: 'objection',
      label: 'Invända mot behandling',
      icon: <ObjectionIcon />,
      description: 'Invända mot behandling baserad på berättigat intresse eller marknadsföring',
      color: 'error' as const
    }
  ];

  const selectedRequest = requestTypes.find(r => r.value === requestType);

  const handleSubmit = async () => {
    if (!email) {
      setResponse({ error: 'E-postadress krävs' });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const requestBody: any = {
        type: requestType,
        email: email.toLowerCase().trim()
      };

      if (requestType === 'rectification') {
        requestBody.requestData = rectificationData;
      }

      // Use dynamic import to get config
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../config');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gdpr-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      // Handle erasure request specially
      if (requestType === 'erasure' && data.success) {
        // Show user-friendly success message for data deletion
        setResponse({
          success: true,
          message: `✅ Dina personuppgifter har raderats permanent från systemet enligt GDPR. Du kommer att loggas ut automatiskt om några sekunder. Tack för att du använt vår tjänst.`
        });
        setShowConfirmDialog(false);
        
        // Start countdown
        let countdown = 5;
        setLogoutCountdown(countdown);
        
        const countdownInterval = setInterval(() => {
          countdown--;
          setLogoutCountdown(countdown);
          
          if (countdown <= 0) {
            clearInterval(countdownInterval);
            logout();
            // Redirect to home page with goodbye message
            window.location.href = '/?gdpr_deleted=true';
          }
        }, 1000);
        
        return; // Don't process other response handling
      } else {
        // Handle other request types normally
        setResponse(data);
        setShowConfirmDialog(false);

        // If it's an access request, we might want to show the data in a nicer format
        if (requestType === 'access' && data.personalData) {
          console.log('Personal data received:', data.personalData);
        }
      }

    } catch (error) {
      console.error('GDPR Request Error:', error);
      setResponse({
        error: error instanceof Error ? error.message : 'Ett fel uppstod vid begäran'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRectificationDataChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setRectificationData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const downloadData = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SecurityIcon sx={{ mr: 2, fontSize: 32 }} color="primary" />
            <Typography variant="h5" component="h2">
              GDPR-begäran
            </Typography>
          </Box>

          <Typography variant="body1" paragraph color="text.secondary">
            Enligt GDPR har du rätt att begära åtkomst till, korrigering av, eller radering av dina personuppgifter. 
            Välj typ av begäran nedan.
          </Typography>

          {/* Request Type Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Typ av begäran</InputLabel>
            <Select
              value={requestType}
              label="Typ av begäran"
              onChange={(e) => setRequestType(e.target.value as RequestType)}
            >
              {requestTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedRequest && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              icon={selectedRequest.icon}
            >
              <Typography variant="body2">
                <strong>{selectedRequest.label}:</strong> {selectedRequest.description}
              </Typography>
            </Alert>
          )}

          {/* Email Field */}
          <TextField
            fullWidth
            label="E-postadress"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!currentUser} // Disable if user is logged in
            helperText={currentUser ? 'Använder din inloggade e-postadress' : 'Ange den e-postadress som är kopplad till ditt konto'}
            sx={{ mb: 3 }}
          />

          {/* Rectification Fields */}
          {requestType === 'rectification' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ange korrigerad information
              </Typography>
              <TextField
                fullWidth
                label="Namn"
                value={rectificationData.name}
                onChange={handleRectificationDataChange('name')}
                sx={{ mb: 2 }}
                helperText="Lämna tomt om du inte vill ändra detta fält"
              />
              <TextField
                fullWidth
                label="Telefonnummer"
                value={rectificationData.phone}
                onChange={handleRectificationDataChange('phone')}
                helperText="Lämna tomt om du inte vill ändra detta fält"
              />
            </Box>
          )}

          {/* Submit Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => setShowConfirmDialog(true)}
            disabled={loading || !email}
            color={selectedRequest?.color}
            startIcon={loading ? <StandardLoading size={20} variant="minimal" /> : selectedRequest?.icon}
            sx={{ mb: 2 }}
          >
            {loading ? 'Bearbetar...' : `Skicka ${selectedRequest?.label.toLowerCase()}`}
          </Button>

          {/* Response Display */}
          {response && (
            <Box sx={{ mt: 3 }}>
              {response.error ? (
                <Alert severity="error">
                  <Typography variant="body2">
                    <strong>Fel:</strong> {response.error}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Framgång:</strong> {response.message || 'Begäran behandlades framgångsrikt'}
                  </Typography>
                  
                  {logoutCountdown !== null && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                        🚪 Loggar ut om {logoutCountdown} sekunder...
                      </Typography>
                    </Box>
                  )}
                  
                  {response.personalData && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => downloadData(response, `personal-data-${new Date().toISOString().split('T')[0]}.json`)}
                        startIcon={<PortabilityIcon />}
                      >
                        Ladda ner mina data
                      </Button>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Data inkluderar: 
                          {response.personalData.userProfile && <Chip size="small" label="Profil" sx={{ ml: 0.5 }} />}
                          {response.personalData.bookings?.length > 0 && <Chip size="small" label={`${response.personalData.bookings.length} bokningar`} sx={{ ml: 0.5 }} />}
                          {response.personalData.pages?.length > 0 && <Chip size="small" label={`${response.personalData.pages.length} sidor`} sx={{ ml: 0.5 }} />}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => !loading && setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bekräfta {selectedRequest?.label.toLowerCase()}
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Du håller på att skicka en begäran om <strong>{selectedRequest?.label.toLowerCase()}</strong> för e-postadressen <strong>{email}</strong>.
          </Typography>
          
          {requestType === 'erasure' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Varning:</strong> Denna åtgärd kommer att radera all din personliga data permanent och kan inte ångras.
              </Typography>
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary">
            Din begäran kommer att behandlas inom 30 dagar enligt GDPR.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} disabled={loading}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            color={selectedRequest?.color}
          >
            {loading ? 'Skickar...' : 'Bekräfta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GDPRRequestForm; 