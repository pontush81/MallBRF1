/**
 * FaultReportStatus - Public page to track fault report status
 * Users can enter their reference number to see status
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  Done as DoneIcon,
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { bastadTheme } from '../../theme/bastadTheme';
import CompactHero from '../../components/common/CompactHero';
import {
  getFaultReportByReference,
  FaultReport,
  FaultStatus,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../services/faultReportService';

// Status steps for the stepper
const STATUS_STEPS: { status: FaultStatus; label: string; icon: React.ReactElement }[] = [
  { status: 'new', label: 'Mottagen', icon: <CheckCircleIcon /> },
  { status: 'in_progress', label: 'Under arbete', icon: <BuildIcon /> },
  { status: 'resolved', label: 'Åtgärdad', icon: <DoneIcon /> },
];

const getStatusStep = (status: FaultStatus): number => {
  if (status === 'new') return 0;
  if (status === 'in_progress' || status === 'waiting') return 1;
  if (status === 'resolved' || status === 'closed') return 2;
  return 0;
};

const FaultReportStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [referenceNumber, setReferenceNumber] = useState(searchParams.get('ref') || '');
  const [report, setReport] = useState<FaultReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  
  // Auto-search if ref is in URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferenceNumber(ref);
      handleSearch(ref);
    }
  }, [searchParams]);
  
  const handleSearch = async (ref?: string) => {
    const searchRef = ref || referenceNumber.trim();
    if (!searchRef) {
      setError('Ange ett referensnummer');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSearched(true);
    
    const result = await getFaultReportByReference(searchRef);
    
    setLoading(false);
    
    if (result.success && result.data) {
      setReport(result.data);
      // Update URL with ref
      navigate(`/felanmalan/status?ref=${result.data.reference_number}`, { replace: true });
    } else {
      setReport(null);
      setError(result.error || 'Kunde inte hitta felanmälan');
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: bastadTheme.colors.sand[50] }}>
      <CompactHero subtitle="Följ status på din felanmälan" />
      
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {/* Search Form */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: `1px solid ${bastadTheme.colors.sand[200]}`,
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Sök felanmälan
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Ange referensnumret du fick när du skickade in din felanmälan.
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
              placeholder="FEL-2024-0001"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                bgcolor: bastadTheme.colors.ocean[600],
                '&:hover': { bgcolor: bastadTheme.colors.ocean[700] },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sök'}
            </Button>
          </form>
        </Paper>
        
        {/* Error */}
        {error && searched && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Report Details */}
        {report && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: `1px solid ${bastadTheme.colors.sand[200]}`,
            }}
          >
            {/* Reference and Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Referensnummer
                </Typography>
                <Typography 
                  variant="h5" 
                  fontWeight={700}
                  sx={{ fontFamily: 'monospace' }}
                >
                  {report.reference_number}
                </Typography>
              </Box>
              <Chip
                label={STATUS_LABELS[report.status]}
                color={STATUS_COLORS[report.status]}
                size="medium"
              />
            </Box>
            
            {/* Progress Stepper */}
            <Box sx={{ mb: 4 }}>
              <Stepper activeStep={getStatusStep(report.status)} alternativeLabel>
                {STATUS_STEPS.map((step) => (
                  <Step key={step.status}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Lägenhet
                </Typography>
                <Typography>{report.apartment_number}</Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Kategori
                </Typography>
                <Typography>{CATEGORY_LABELS[report.category]}</Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Plats
                </Typography>
                <Typography>{LOCATION_LABELS[report.location]}</Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Beskrivning
                </Typography>
                <Typography>{report.description}</Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Inskickad
                </Typography>
                <Typography>
                  {format(new Date(report.created_at), "d MMMM yyyy 'kl' HH:mm", { locale: sv })}
                </Typography>
              </Box>
              
              {report.resolved_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Åtgärdad
                  </Typography>
                  <Typography>
                    {format(new Date(report.resolved_at), "d MMMM yyyy 'kl' HH:mm", { locale: sv })}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Waiting status info */}
            {report.status === 'waiting' && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Vi väntar på leverantör eller material för att kunna åtgärda felet.
              </Alert>
            )}
          </Paper>
        )}
        
        {/* New report link */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="text"
            onClick={() => navigate('/felanmalan')}
            sx={{ color: bastadTheme.colors.ocean[600] }}
          >
            Gör en ny felanmälan
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default FaultReportStatus;

