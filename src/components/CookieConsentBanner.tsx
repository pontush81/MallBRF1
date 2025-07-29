import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
  Link,
  Alert
} from '@mui/material';
import { Cookie as CookieIcon } from '@mui/icons-material';
import { cookieConsentService, CookiePreferences } from '../services/cookieConsent';

interface CookieConsentBannerProps {
  onConsentChange?: (preferences: CookiePreferences) => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onConsentChange }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    authentication: false,
    analytics: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = cookieConsentService.hasConsent();
    const currentPreferences = cookieConsentService.getPreferences();
    
    if (!hasConsent) {
      setShowBanner(true);
    } else if (currentPreferences) {
      setPreferences(currentPreferences);
      onConsentChange?.(currentPreferences);
    }
  }, [onConsentChange]);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      authentication: true,
      analytics: false // Currently not used
    };
    savePreferences(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      authentication: false,
      analytics: false
    };
    savePreferences(necessaryOnly);
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    cookieConsentService.updatePreferences(prefs);
    setPreferences(prefs);
    setShowBanner(false);
    setShowDetails(false);
    onConsentChange?.(prefs);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Simple Banner */}
      {!showDetails && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            boxShadow: 3,
            p: 2,
            zIndex: 9999,
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <CookieIcon color="primary" />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Vi använder cookies för att webbplatsen ska fungera och för att förbättra din upplevelse. 
              {' '}
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => setShowDetails(true)}
                sx={{ textDecoration: 'underline' }}
              >
                Anpassa inställningar
              </Link>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleAcceptNecessary}
              >
                Endast nödvändiga
              </Button>
              <Button 
                variant="contained" 
                size="small" 
                onClick={handleAcceptAll}
              >
                Acceptera alla
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Detailed Settings Dialog */}
      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CookieIcon />
            <Typography variant="h6">Cookie-inställningar</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography paragraph>
            Vi använder cookies för att webbplatsen ska fungera och för att förbättra din upplevelse. 
            Du kan själv välja vilka cookies du vill tillåta.
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Genom att använda vår tjänst accepterar du vår{' '}
            <Link href="/privacy-policy" target="_blank">integritetspolicy</Link>.
          </Alert>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={preferences.necessary} 
                  disabled 
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Nödvändiga cookies</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dessa cookies krävs för att webbplatsen ska fungera och kan inte stängas av. 
                    De inkluderar grundläggande funktioner som säkerhet och åtkomst till skyddade områden.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={preferences.authentication} 
                  onChange={handlePreferenceChange('authentication')}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Inloggning och autentisering</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Krävs för att logga in med Google eller skapa ett konto. 
                    Hanteras säkert av Google/Firebase enligt deras integritetspolicy.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={preferences.analytics} 
                  onChange={handlePreferenceChange('analytics')}
                  disabled // Currently not used
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Analys och statistik</Typography>
                  <Typography variant="body2" color="text.secondary">
                    För närvarande används inga analysverktyg på denna webbplats.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            <strong>Tredjepartstjänster som används:</strong>
            <br />• Firebase (Google) - Autentisering och datalagring
            <br />• Supabase - Databas och lagring
            <br />• Google OAuth - Social inloggning
            <br />• Vercel - Hosting
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleAcceptNecessary}>
            Endast nödvändiga
          </Button>
          <Button onClick={handleSaveCustom} variant="contained">
            Spara inställningar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CookieConsentBanner; 