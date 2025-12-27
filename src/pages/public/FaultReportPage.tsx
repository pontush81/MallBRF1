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
  ReportProblem as ReportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bastadTheme } from '../../theme/bastadTheme';
import CompactHero from '../../components/common/CompactHero';
import {
  createFaultReport,
  CreateFaultReportInput,
  FaultCategory,
  FaultLocation,
  CATEGORY_LABELS,
  LOCATION_LABELS,
} from '../../services/faultReportService';

// Apartment numbers for BRF Gulmåran (11 apartments)
const APARTMENT_NUMBERS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'
];

const FaultReportPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [apartmentNumber, setApartmentNumber] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [category, setCategory] = useState<FaultCategory | ''>('');
  const [location, setLocation] = useState<FaultLocation | ''>('');
  const [description, setDescription] = useState<string>('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!apartmentNumber) {
      newErrors.apartmentNumber = 'Välj lägenhetsnummer';
    }
    if (!category) {
      newErrors.category = 'Välj kategori';
    }
    if (!location) {
      newErrors.location = 'Välj plats';
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
      category: category as FaultCategory,
      location: location as FaultLocation,
      description: description.trim(),
    };
    
    const result = await createFaultReport(input);
    
    setIsSubmitting(false);
    
    if (result.success) {
      setSuccess(true);
      setShowSnackbar(true);
      // Clear form
      setApartmentNumber('');
      setContactEmail('');
      setContactPhone('');
      setCategory('');
      setLocation('');
      setDescription('');
    } else {
      setError(result.error || 'Ett fel uppstod');
    }
  };
  
  const handleNewReport = () => {
    setSuccess(false);
    setError(null);
  };
  
  // Success view
  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: bastadTheme.colors.sand[50] }}>
        <CompactHero subtitle="Rapportera fel i gemensamma utrymmen" />
        
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
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Vi har tagit emot din anmälan och styrelsen kommer att åtgärda felet så snart som möjligt.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleNewReport}
                sx={{
                  bgcolor: bastadTheme.colors.terracotta[500],
                  '&:hover': { bgcolor: bastadTheme.colors.terracotta[600] },
                }}
              >
                Gör en ny anmälan
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{
                  borderColor: bastadTheme.colors.ocean[300],
                  color: bastadTheme.colors.ocean[700],
                }}
              >
                Tillbaka till startsidan
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: bastadTheme.colors.sand[50] }}>
      <CompactHero subtitle="Rapportera fel i gemensamma utrymmen" />
      
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: `1px solid ${bastadTheme.colors.sand[200]}`,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <ReportIcon sx={{ color: bastadTheme.colors.terracotta[500], fontSize: 28 }} />
            <Typography variant="h5" fontWeight={600} color={bastadTheme.colors.ocean[900]}>
              Felanmälan
            </Typography>
          </Box>
          
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Använd detta formulär för att rapportera fel i gemensamma utrymmen. 
            Styrelsen får ett meddelande och kommer att åtgärda felet så snart som möjligt.
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Apartment Number */}
            <FormControl fullWidth error={!!errors.apartmentNumber} sx={{ mb: 3 }}>
              <InputLabel>Lägenhetsnummer *</InputLabel>
              <Select
                value={apartmentNumber}
                label="Lägenhetsnummer *"
                onChange={(e) => setApartmentNumber(e.target.value)}
              >
                {APARTMENT_NUMBERS.map((num) => (
                  <MenuItem key={num} value={num}>
                    Lägenhet {num}
                  </MenuItem>
                ))}
              </Select>
              {errors.apartmentNumber && (
                <FormHelperText>{errors.apartmentNumber}</FormHelperText>
              )}
            </FormControl>
            
            {/* Category */}
            <FormControl fullWidth error={!!errors.category} sx={{ mb: 3 }}>
              <InputLabel>Kategori *</InputLabel>
              <Select
                value={category}
                label="Kategori *"
                onChange={(e) => setCategory(e.target.value as FaultCategory)}
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && (
                <FormHelperText>{errors.category}</FormHelperText>
              )}
            </FormControl>
            
            {/* Location */}
            <FormControl fullWidth error={!!errors.location} sx={{ mb: 3 }}>
              <InputLabel>Plats *</InputLabel>
              <Select
                value={location}
                label="Plats *"
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
              sx={{ mb: 4 }}
            />
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
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
        </Paper>
        
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

