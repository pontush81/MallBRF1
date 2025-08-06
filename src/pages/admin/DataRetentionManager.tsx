import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Storage as StorageIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  PlayArrow as RunIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { getAuthenticatedSupabaseClient } from '../../services/supabaseClient';

interface RetentionAnalysis {
  table: string;
  description: string;
  retentionDays: number;
  candidateCount: number;
  sampleChecked: number;
  safeToDeleteCount: number;
  cutoffDate: string;
  safetyChecks: string[];
  exceptions: string[];
}

interface CleanupResult {
  table: string;
  description?: string;
  candidates_found: number;
  safe_to_delete: number;
  actually_deleted: number;
  errors: string[];
  dry_run: boolean;
}

const DataRetentionManager: React.FC = () => {
  const [analysis, setAnalysis] = useState<RetentionAnalysis[]>([]);
  const [cleanupResults, setCleanupResults] = useState<CleanupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [retentionStatus, setRetentionStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Add reminder state
  const [lastRunDate, setLastRunDate] = useState<string | null>(null);
  const [nextRecommendedRun, setNextRecommendedRun] = useState<string>('');

  useEffect(() => {
    loadRetentionStatus();
    // Check when analysis was last run
    const lastRun = localStorage.getItem('last_retention_analysis');
    if (lastRun) {
      setLastRunDate(lastRun);
      // Calculate next recommended run (monthly)
      const nextRun = new Date(lastRun);
      nextRun.setMonth(nextRun.getMonth() + 1);
      setNextRecommendedRun(nextRun.toLocaleDateString('sv-SE'));
    } else {
      setNextRecommendedRun('Kör analys nu för första gången');
    }
  }, []);

  const loadRetentionStatus = async () => {
    try {
      const supabase = await getAuthenticatedSupabaseClient();
      const { data, error } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'get_retention_status' }
      });

      if (error) throw error;
      setRetentionStatus(data);
    } catch (err) {
      console.error('Error loading retention status:', err);
      setError('Kunde inte ladda retention-status');
    }
  };

  const handleAnalyzeRetention = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = await getAuthenticatedSupabaseClient();
      const { data, error } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'analyze_retention' }
      });

      if (error) throw error;
      
      setAnalysis(data.analysis || []);
      
      // After successful analysis, update last run date
      const now = new Date().toISOString();
      localStorage.setItem('last_retention_analysis', now);
      setLastRunDate(now);
      
      // Calculate next run
      const nextRun = new Date();
      nextRun.setMonth(nextRun.getMonth() + 1);
      setNextRecommendedRun(nextRun.toLocaleDateString('sv-SE'));
    } catch (err) {
      console.error('Error running analysis:', err);
      setError('Kunde inte köra retention-analys');
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = await getAuthenticatedSupabaseClient();
      const { data, error } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { 
          action: 'cleanup_data',
          dryRun: isDryRun
        }
      });

      if (error) throw error;
      
      setCleanupResults(data.cleanup_results || []);
      setShowConfirmDialog(false);
    } catch (err) {
      console.error('Error running cleanup:', err);
      setError('Kunde inte köra data cleanup');
    } finally {
      setLoading(false);
    }
  };

  const getTotalCandidates = () => {
    return (analysis || []).reduce((sum, item) => sum + (item.candidateCount || 0), 0);
  };

  const getTotalSafeToDelete = () => {
    return (analysis || []).reduce((sum, item) => sum + (item.safeToDeleteCount || 0), 0);
  };

  const getStatusColor = (candidateCount: number, safeCount: number) => {
    if (candidateCount === 0) return 'success';
    if (safeCount === 0) return 'warning';
    if (safeCount < candidateCount) return 'warning';
    return 'info';
  };

  // Check if analysis is overdue
  const isOverdue = () => {
    if (!lastRunDate) return true;
    const lastRun = new Date(lastRunDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return lastRun < oneMonthAgo;
  };

  return (
    <>
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Retention Manager
      </Typography>

      {/* Reminder Alert */}
      {isOverdue() && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Påminnelse: Data Retention Analys</AlertTitle>
          {lastRunDate 
            ? `Senaste analys kördes ${new Date(lastRunDate).toLocaleDateString('sv-SE')}. Rekommenderat att köra ny analys månadsvis.`
            : 'Ingen analys har körts ännu. Kör din första analys för att kontrollera GDPR-compliance.'
          }
        </Alert>
      )}

      {/* Schedule Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" color="primary.main">
                📅 Retention Schema
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lastRunDate 
                  ? `Senaste analys: ${new Date(lastRunDate).toLocaleDateString('sv-SE')}`
                  : 'Ingen analys utförd'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nästa rekommenderad analys: {nextRecommendedRun}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={isOverdue() ? 'error.main' : 'success.main'}>
                {isOverdue() ? '⚠️ Försenad' : '✅ Uppdaterad'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <StorageIcon sx={{ mr: 2, fontSize: 32 }} color="primary" />
        <Typography variant="h4" component="h1">
          Data Retention Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Säkerhetsläge</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                AKTIVT
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Alla säkerhetskontroller aktiva
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Tabeller</Typography>
              </Box>
              <Typography variant="h4">
                {retentionStatus?.total_tables_managed?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hanterade tabeller
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Kandidater</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {getTotalCandidates()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Poster över retention-tid
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Säkra att radera</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {getTotalSafeToDelete()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Godkända för radering
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={handleAnalyzeRetention}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Analysera Retention'}
        </Button>

        <FormControlLabel
          control={
            <Switch
              checked={isDryRun}
              onChange={(e) => setIsDryRun(e.target.checked)}
              color="warning"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">
                {isDryRun ? '🧪 Test-läge (Dry Run)' : '⚠️ Live-läge (Raderar data!)'}
              </Typography>
            </Box>
          }
        />

        <Button
          variant="contained"
          startIcon={<RunIcon />}
          onClick={() => setShowConfirmDialog(true)}
          disabled={loading || (analysis || []).length === 0}
          color={isDryRun ? 'primary' : 'error'}
        >
          {isDryRun ? 'Kör Test-rensning' : 'Kör LIVE Rensning'}
        </Button>
      </Box>

      {/* Warning for retention rules */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <AlertTitle>Så fungerar vårt säkra retention-system</AlertTitle>
        <Typography variant="body2" paragraph>
          <strong>Medlemsdata:</strong> Raderas endast 2 år EFTER att medlemskapet avslutas OCH användaren inte har aktiva bokningar.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Bokningsdata:</strong> Sparas i 3 år för ekonomisk redovisning, sedan automatisk radering.
        </Typography>
        <Typography variant="body2">
          <strong>Säkerhetsloggar:</strong> Sparas i 1 år, undantag för säkerhetskritiska händelser.
        </Typography>
      </Alert>

      {/* Analysis Results */}
      {(analysis || []).length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Retention-analys
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tabell</strong></TableCell>
                  <TableCell><strong>Beskrivning</strong></TableCell>
                  <TableCell align="center"><strong>Retention</strong></TableCell>
                  <TableCell align="center"><strong>Kandidater</strong></TableCell>
                  <TableCell align="center"><strong>Säkra att radera</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell><strong>Säkerhetskontroller</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(analysis || []).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {row.table}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`${row.retentionDays} dagar`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" color="warning.main">
                        {row.candidateCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="h6" color="info.main">
                        {row.safeToDeleteCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        icon={
                          row.candidateCount === 0 ? <CheckIcon /> :
                          row.safeToDeleteCount === 0 ? <WarningIcon /> : 
                          <SecurityIcon />
                        }
                        label={
                          row.candidateCount === 0 ? 'Inga kandidater' :
                          row.safeToDeleteCount === 0 ? 'Ej säkert' :
                          'Säkert'
                        }
                        color={getStatusColor(row.candidateCount, row.safeToDeleteCount)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(row.safetyChecks || []).map((check, i) => (
                          <Chip 
                            key={i} 
                            label={check} 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                          />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Cleanup Results */}
      {(cleanupResults || []).length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {cleanupResults[0]?.dry_run ? 'Test-körning Resultat' : 'Live-körning Resultat'}
          </Typography>
          
          {cleanupResults[0]?.dry_run && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Test-körning genomförd</AlertTitle>
              Ingen data raderades. Detta var endast en simulering för att visa vad som skulle hända.
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tabell</strong></TableCell>
                  <TableCell align="center"><strong>Kandidater</strong></TableCell>
                  <TableCell align="center"><strong>Säkra</strong></TableCell>
                  <TableCell align="center"><strong>Raderade</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(cleanupResults || []).map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {result.table}
                      </Typography>
                      {result.description && (
                        <Typography variant="caption" color="text.secondary">
                          {result.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{result.candidates_found}</TableCell>
                    <TableCell align="center">{result.safe_to_delete}</TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="h6" 
                        color={result.actually_deleted > 0 ? 'error.main' : 'text.primary'}
                      >
                        {result.actually_deleted}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(result.errors || []).length > 0 ? (
                        <Chip label={`${(result.errors || []).length} fel`} color="error" size="small" />
                      ) : (
                        <Chip label="Framgång" color="success" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Information */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h6" gutterBottom>
        Viktiga säkerhetsegenskaper
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
          <ListItemText 
            primary="Soft Delete för medlemsdata"
            secondary="Användardata 'anonymiseras' först innan permanent radering efter 2 år"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
          <ListItemText 
            primary="Automatiska säkerhetskontroller"
            secondary="Kontrollerar aktiva bokningar, medlemskap och rättslig spärr innan radering"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><StorageIcon color="primary" /></ListItemIcon>
          <ListItemText 
            primary="Fullständig loggning"
            secondary="Alla raderingar loggas med snapshot för efterlevnad och forensik"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
          <ListItemText 
            primary="Juridiska undantag"
            secondary="Data som krävs enligt Bostadsrättslagen eller bokföringslag skyddas automatiskt"
          />
        </ListItem>
      </List>
    </Container>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="md">
        <DialogTitle>
          {isDryRun ? '🧪 Bekräfta Test-körning' : '⚠️ BEKRÄFTA LIVE RADERING'}
        </DialogTitle>
        <DialogContent>
          {isDryRun ? (
            <Typography>
              Du är på väg att köra en test-simulering av data retention cleanup. 
              Ingen data kommer att raderas, men du får se exakt vad som skulle hända.
            </Typography>
          ) : (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>VARNING: LIVE RADERING</AlertTitle>
                Du är på väg att radera data permanent! Detta kan inte ångras.
              </Alert>
              <Typography>
                Säkerhetskontroller är aktiverade, men kontrollera analysen noga innan du fortsätter.
              </Typography>
              <Typography sx={{ mt: 2 }}>
                <strong>Totalt {getTotalSafeToDelete()} poster</strong> kommer att raderas från {(analysis || []).length} tabeller.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={runCleanup} 
            variant="contained" 
            color={isDryRun ? 'primary' : 'error'}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 
             isDryRun ? 'Kör Test' : 'RADERA DATA'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataRetentionManager; 