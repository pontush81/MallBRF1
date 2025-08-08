/**
 * Audit Log Viewer Component
 * =========================
 * 
 * Admin dashboard component to view and analyze audit logs
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { auditLogger } from '../../services/auditLogger';
import supabase from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContextNew';

interface AuditLogEntry {
  id: string;
  event_type: string;
  user_email: string;
  ip_address: string;
  action_details: any;
  risk_level: string;
  success: boolean;
  created_at: string;
}

interface AuditStats {
  total_events: number;
  auth_events: number;
  admin_actions: number;
  security_incidents: number;
  failed_events: number;
  high_risk_events: number;
}

export const AuditLogViewer: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setError('Unauthorized - Admin access required');
      setLoading(false);
      return;
    }

    loadAuditData();
  }, [isAdmin, timeframe]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get audit stats
      const auditStats = await auditLogger.getAuditStats(timeframe);
      setStats(auditStats);

      // Get recent audit logs
      const timeframeDays = { day: 1, week: 7, month: 30 };
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - timeframeDays[timeframe]);

      const { data: auditLogs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        throw logsError;
      }

      setLogs(auditLogs || []);
    } catch (err: any) {
      console.error('Failed to load audit data:', err);
      setError(err.message || 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isAdmin) {
    return (
      <Alert severity="error">
        Unauthorized - This section requires administrator privileges.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        🔍 Audit Log Viewer
      </Typography>

      {/* Time Range Selector */}
      <Box mb={3}>
        <FormControl variant="outlined" size="small">
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            label="Time Range"
          >
            <MenuItem value="day">Last 24 Hours</MenuItem>
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {stats.total_events}
                </Typography>
                <Typography variant="body2">
                  Total Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {stats.auth_events}
                </Typography>
                <Typography variant="body2">
                  Auth Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {stats.admin_actions}
                </Typography>
                <Typography variant="body2">
                  Admin Actions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {stats.security_incidents}
                </Typography>
                <Typography variant="body2">
                  Security Incidents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {stats.failed_events}
                </Typography>
                <Typography variant="body2">
                  Failed Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {stats.high_risk_events}
                </Typography>
                <Typography variant="body2">
                  High Risk Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Audit Events
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Success</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {formatEventType(log.event_type)}
                    </TableCell>
                    <TableCell>
                      {log.user_email || 'System'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.risk_level}
                        color={getRiskLevelColor(log.risk_level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.success ? 'Success' : 'Failed'}
                        color={log.success ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                        {JSON.stringify(log.action_details).substring(0, 50)}...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {logs.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No audit events found for the selected timeframe.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};