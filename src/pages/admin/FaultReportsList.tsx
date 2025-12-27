/**
 * FaultReportsList - Admin view for managing fault reports
 * Shows all reports with filtering and status management
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { bastadTheme } from '../../theme/bastadTheme';
import {
  FaultReport,
  FaultStatus,
  getAllFaultReports,
  updateFaultReport,
  getFaultReportStats,
  sendStatusUpdateEmail,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../../services/faultReportService';

const FaultReportsList: React.FC = () => {
  // Data state
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<FaultStatus, number>;
    recentCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<FaultStatus | 'all'>('all');
  
  // Dialog state
  const [selectedReport, setSelectedReport] = useState<FaultReport | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Edit form state
  const [editStatus, setEditStatus] = useState<FaultStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Load data with timeout protection
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout protection (15 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout - försök igen')), 15000)
      );
      
      const fetchPromise = Promise.all([
        getAllFaultReports(statusFilter === 'all' ? undefined : statusFilter),
        getFaultReportStats(),
      ]);
      
      const [reportsResult, statsResult] = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (reportsResult.success && reportsResult.data) {
        setReports(reportsResult.data);
      } else {
        setError(reportsResult.error || 'Kunde inte hämta felanmälningar');
      }
      
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod vid laddning');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, [statusFilter]);
  
  // Handlers
  const handleViewReport = (report: FaultReport) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };
  
  const handleEditReport = (report: FaultReport) => {
    setSelectedReport(report);
    setEditStatus(report.status);
    setEditNotes(report.admin_notes || '');
    setEditDialogOpen(true);
  };
  
  
  const handleSaveEdit = async () => {
    if (!selectedReport) return;
    
    const oldStatus = selectedReport.status;
    const statusChanged = oldStatus !== editStatus;
    
    setSaving(true);
    const result = await updateFaultReport(selectedReport.id, {
      status: editStatus,
      admin_notes: editNotes,
    });
    setSaving(false);
    
    if (result.success) {
      // Send email notification if status changed and reporter has email
      if (statusChanged && selectedReport.contact_email) {
        sendStatusUpdateEmail(selectedReport, editStatus, selectedReport.contact_email)
          .then(emailResult => {
            if (emailResult.success) {
              console.log('✅ Statusuppdatering skickad till:', selectedReport.contact_email);
            }
          })
          .catch(console.error);
      }
      
      setEditDialogOpen(false);
      loadData();
    } else {
      setError(result.error || 'Kunde inte spara');
    }
  };
  
  
  // Filtered reports
  const filteredReports = statusFilter === 'all' 
    ? reports 
    : reports.filter(r => r.status === statusFilter);
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color={bastadTheme.colors.ocean[900]} gutterBottom>
          Felanmälningar
        </Typography>
        <Typography color="text.secondary">
          Hantera felanmälningar från boende
        </Typography>
      </Box>
      
      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card elevation={0} sx={{ border: `1px solid ${bastadTheme.colors.sand[200]}` }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {stats.byStatus.new}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nya
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={0} sx={{ border: `1px solid ${bastadTheme.colors.sand[200]}` }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {stats.byStatus.in_progress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pågår
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={0} sx={{ border: `1px solid ${bastadTheme.colors.sand[200]}` }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {stats.byStatus.resolved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Åtgärdade
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={0} sx={{ border: `1px solid ${bastadTheme.colors.sand[200]}` }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Totalt
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Filter Tabs */}
      <Paper elevation={0} sx={{ mb: 3, border: `1px solid ${bastadTheme.colors.sand[200]}` }}>
        <Tabs
          value={statusFilter}
          onChange={(_, v) => setStatusFilter(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            value="all" 
            label={
              <Badge badgeContent={stats?.total || 0} color="default">
                Alla
              </Badge>
            } 
          />
          <Tab 
            value="new" 
            label={
              <Badge badgeContent={stats?.byStatus.new || 0} color="error">
                Nya
              </Badge>
            } 
          />
          <Tab 
            value="in_progress" 
            label={
              <Badge badgeContent={stats?.byStatus.in_progress || 0} color="primary">
                Pågår
              </Badge>
            } 
          />
          <Tab 
            value="waiting" 
            label={
              <Badge badgeContent={stats?.byStatus.waiting || 0} color="warning">
                Väntar
              </Badge>
            } 
          />
          <Tab 
            value="resolved" 
            label={
              <Badge badgeContent={stats?.byStatus.resolved || 0} color="success">
                Åtgärdade
              </Badge>
            } 
          />
        </Tabs>
      </Paper>
      
      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
        >
          Uppdatera
        </Button>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${bastadTheme.colors.sand[200]}` }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: bastadTheme.colors.sand[100] }}>
              <TableCell>Datum</TableCell>
              <TableCell>Lgh</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Plats</TableCell>
              <TableCell>Beskrivning</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Åtgärder</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Skeleton loading
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Inga felanmälningar att visa
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow 
                  key={report.id}
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: bastadTheme.colors.sand[50] },
                  }}
                  onClick={() => handleViewReport(report)}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(report.created_at), 'd MMM', { locale: sv })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(report.created_at), 'HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {report.apartment_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {CATEGORY_LABELS[report.category]}
                  </TableCell>
                  <TableCell>
                    {LOCATION_LABELS[report.location]}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        maxWidth: 200,
                        color: bastadTheme.colors.ocean[700],
                      }}
                    >
                      {report.description}
                    </Typography>
                    {report.description.length > 50 && (
                      <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                        Klicka för att läsa mer...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[report.status]}
                      size="small"
                      color={STATUS_COLORS[report.status]}
                    />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Visa">
                      <IconButton size="small" onClick={() => handleViewReport(report)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Redigera status">
                      <IconButton size="small" onClick={() => handleEditReport(report)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Felanmälan - Lgh {selectedReport.apartment_number}</span>
                <Chip
                  label={STATUS_LABELS[selectedReport.status]}
                  size="small"
                  color={STATUS_COLORS[selectedReport.status]}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Kategori</Typography>
                  <Typography>{CATEGORY_LABELS[selectedReport.category]}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Plats</Typography>
                  <Typography>{LOCATION_LABELS[selectedReport.location]}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Beskrivning</Typography>
                  <Typography>{selectedReport.description}</Typography>
                </Box>
                {selectedReport.contact_email && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">E-post</Typography>
                    <Typography>{selectedReport.contact_email}</Typography>
                  </Box>
                )}
                {selectedReport.contact_phone && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Telefon</Typography>
                    <Typography>{selectedReport.contact_phone}</Typography>
                  </Box>
                )}
                {selectedReport.admin_notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Anteckningar</Typography>
                    <Typography>{selectedReport.admin_notes}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Skapad</Typography>
                  <Typography>
                    {format(new Date(selectedReport.created_at), "d MMMM yyyy 'kl' HH:mm", { locale: sv })}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Stäng</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleEditReport(selectedReport);
                }}
              >
                Redigera
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>Redigera felanmälan</DialogTitle>
            <DialogContent dividers>
              <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editStatus}
                  label="Status"
                  onChange={(e) => setEditStatus(e.target.value as FaultStatus)}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Anteckningar"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                helperText="Interna anteckningar (syns bara för admin)"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
                Avbryt
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Sparar...' : 'Spara'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
    </Container>
  );
};

export default FaultReportsList;

