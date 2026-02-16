/**
 * FaultReportPage - Public fault reporting form
 * No login required - anyone can submit
 */

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  FormHelperText,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Turnstile } from '@marsidev/react-turnstile';
import { useNavigate } from 'react-router-dom';
import { bastadTheme } from '../../theme/bastadTheme';
import { TURNSTILE_SITE_KEY } from '../../config';
import CompactHero from '../../components/common/CompactHero';
import {
  createFaultReport,
  CreateFaultReportInput,
  FaultReport,
  FaultLocation,
  LOCATION_LABELS,
} from '../../services/faultReportService';

// Apartments for BRF Gulmåran (Köpmansgatan 80)
const APARTMENT_NUMBERS = [
  '80A', '80B', '80C', '80D', '80E', '80F', '80G', '80H', '80I', '80J', '80K'
];

const FaultReportPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [apartmentNumber, setApartmentNumber] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [location, setLocation] = useState<FaultLocation | ''>('');
  const [description, setDescription] = useState<string>('');

  // Spam protection
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<FaultReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!apartmentNumber) {
      newErrors.apartmentNumber = 'Välj din adress';
    }
    if (!location) {
      newErrors.location = 'Välj var felet finns';
    }
    if (!description.trim()) {
      newErrors.description = 'Beskriv felet';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Beskrivningen måste vara minst 10 tecken';
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Ogiltig e-postadress';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const input: CreateFaultReportInput = {
      apartment_number: apartmentNumber,
      contact_email: contactEmail || undefined,
      contact_phone: contactPhone || undefined,
      location: location as FaultLocation,
      description: description.trim(),
      turnstileToken: turnstileToken || undefined,
      honeypot,
    };

    const result = await createFaultReport(input);
    
    setIsSubmitting(false);
    
    if (result.success && result.data) {
      setSubmittedReport(result.data);
      setSuccess(true);
      setShowSnackbar(true);

      // Emails are now sent server-side by the Edge Function

      // Clear form
      setApartmentNumber('');
      setContactEmail('');
      setContactPhone('');
      setLocation('');
      setDescription('');
      setTurnstileToken(null);
    } else {
      setError(result.error || 'Ett fel uppstod');
    }
  };
  
  const handleNewReport = () => {
    setSuccess(false);
    setError(null);
  };
  
  // Success view
  if (success && submittedReport) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: bastadTheme.colors.sand[50] }}>
        <CompactHero subtitle="Rapportera fel" />
        
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              border: `1px solid ${bastadTheme.colors.sand[200]}`,
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 64,
                color: 'success.main',
                mb: 2,
              }}
            />
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Tack för din felanmälan!
            </Typography>
            
            {/* Reference number box */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                bgcolor: bastadTheme.colors.ocean[50],
                borderRadius: 2,
                border: `1px solid ${bastadTheme.colors.ocean[200]}`,
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ditt referensnummer:
              </Typography>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                color={bastadTheme.colors.ocean[700]}
                sx={{ fontFamily: 'monospace', letterSpacing: 1 }}
              >
                {submittedReport.reference_number}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Spara detta nummer för att följa din anmälan
              </Typography>
            </Paper>
            
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Vi har tagit emot din anmälan och styrelsen kommer att åtgärda felet så snart som möjligt.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate(`/felanmalan/status?ref=${submittedReport.reference_number}`)}
                sx={{
                  bgcolor: bastadTheme.colors.ocean[600],
                  '&:hover': { bgcolor: bastadTheme.colors.ocean[700] },
                }}
              >
                Följ din anmälan
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setSuccess(false);
                  setSubmittedReport(null);
                }}
                sx={{
                  borderColor: bastadTheme.colors.terracotta[300],
                  color: bastadTheme.colors.terracotta[600],
                }}
              >
                Gör en ny anmälan
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: bastadTheme.colors.sand[50] }}>
      <CompactHero subtitle="Rapportera fel" />
      
      <Container maxWidth="sm" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" fontWeight={600} color={bastadTheme.colors.ocean[900]} sx={{ mb: 1 }}>
            Felanmälan
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Rapportera fel så åtgärdar styrelsen det så snart som möjligt.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Apartment Number */}
            <FormControl fullWidth error={!!errors.apartmentNumber} sx={{ mb: 3 }}>
              <InputLabel>Din adress *</InputLabel>
              <Select
                value={apartmentNumber}
                label="Din adress *"
                onChange={(e) => setApartmentNumber(e.target.value)}
              >
                {APARTMENT_NUMBERS.map((num) => (
                  <MenuItem key={num} value={num}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
              {errors.apartmentNumber && (
                <FormHelperText>{errors.apartmentNumber}</FormHelperText>
              )}
            </FormControl>
            
            {/* Location */}
            <FormControl fullWidth error={!!errors.location} sx={{ mb: 3 }}>
              <InputLabel>Var finns felet? *</InputLabel>
              <Select
                value={location}
                label="Var finns felet? *"
                onChange={(e) => setLocation(e.target.value as FaultLocation)}
              >
                {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              {errors.location && (
                <FormHelperText>{errors.location}</FormHelperText>
              )}
            </FormControl>
            
            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Beskrivning *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={!!errors.description}
              helperText={errors.description || 'Beskriv felet så detaljerat som möjligt'}
              sx={{ mb: 3 }}
            />
            
            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Valfria uppgifter
              </Typography>
            </Divider>
            
            {/* Contact Email */}
            <TextField
              fullWidth
              type="email"
              label="E-post (för återkoppling)"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              error={!!errors.contactEmail}
              helperText={errors.contactEmail || 'Om du vill ha besked när felet är åtgärdat'}
              sx={{ mb: 3 }}
            />
            
            {/* Contact Phone */}
            <TextField
              fullWidth
              type="tel"
              label="Telefon (för frågor)"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              helperText="Om vi behöver kontakta dig för mer information"
              sx={{ mb: 3 }}
            />

            {/* Honeypot - hidden from humans, bots auto-fill */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden' }}
            />

            {/* Turnstile CAPTCHA */}
            {TURNSTILE_SITE_KEY && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token: string) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: 'light', size: 'normal' }}
                />
              </Box>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{
                py: 1.5,
                bgcolor: bastadTheme.colors.terracotta[500],
                '&:hover': { bgcolor: bastadTheme.colors.terracotta[600] },
                '&:disabled': { bgcolor: bastadTheme.colors.sand[300] },
              }}
            >
              {isSubmitting ? 'Skickar...' : 'Skicka felanmälan'}
            </Button>
          </form>
        
        {/* Info box */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mt: 3,
            borderRadius: 2,
            bgcolor: bastadTheme.colors.ocean[50],
            border: `1px solid ${bastadTheme.colors.ocean[100]}`,
          }}
        >
          <Typography variant="body2" color={bastadTheme.colors.ocean[700]}>
            <strong>Tips:</strong> Vid akuta fel som påverkar säkerheten (vattenläcka, strömavbrott, etc.), 
            kontakta styrelsen direkt på telefon utöver att göra en anmälan här.
          </Typography>
        </Paper>
      </Container>
      
      {/* Success Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSnackbar(false)}>
          Felanmälan skickad!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FaultReportPage;

