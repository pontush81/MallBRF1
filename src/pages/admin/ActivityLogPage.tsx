/**
 * ActivityLogPage - Admin view for browsing system activity logs
 * Shows all logged events with filtering by action type and pagination
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { bastadTheme } from '../../theme/bastadTheme';
import { getActivityLog, ActivityLogEntry } from '../../services/activityLogService';

// ---------------------------------------------------------------------------
// Action labels (Swedish)
// ---------------------------------------------------------------------------
const ACTION_LABELS: Record<string, string> = {
  login: 'Inloggning',
  logout: 'Utloggning',
  booking_created: 'Bokning skapad',
  booking_updated: 'Bokning ändrad',
  booking_cancelled: 'Bokning avbokad',
  fault_report_created: 'Felanmälan skapad',
  fault_report_status_changed: 'Felanmälan uppdaterad',
  page_created: 'Sida skapad',
  page_updated: 'Sida uppdaterad',
  user_created: 'Användare skapad',
  user_updated: 'Användare ändrad',
  hsb_report_sent: 'HSB-rapport skickad',
};

// ---------------------------------------------------------------------------
// Chip color mapping by category
// ---------------------------------------------------------------------------
function getActionColor(action: string): string {
  if (action === 'login' || action === 'logout') {
    return bastadTheme.colors.ocean[500];
  }
  if (action.startsWith('booking_')) {
    return bastadTheme.colors.twilight[500];
  }
  if (action.startsWith('fault_')) {
    return bastadTheme.colors.terracotta[500];
  }
  // Admin actions: page_*, user_*, hsb_*
  if (
    action.startsWith('page_') ||
    action.startsWith('user_') ||
    action.startsWith('hsb_')
  ) {
    return bastadTheme.colors.seagreen[500];
  }
  return bastadTheme.colors.ocean[500];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ActivityLogPage: React.FC = () => {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & pagination state
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 25;

  // Fetch data whenever filter or page changes
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getActivityLog({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        action: actionFilter || undefined,
      });

      setEntries(result.data);
      setTotalCount(result.count);
    } catch (err: any) {
      setError(err.message || 'Kunde inte hämta aktivitetsloggen');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filter changes
  const handleFilterChange = (value: string) => {
    setActionFilter(value);
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          color={bastadTheme.colors.ocean[900]}
          gutterBottom
        >
          Aktivitetslogg
        </Typography>
        <Typography color="text.secondary">
          Systemhändelser och användaraktivitet
        </Typography>
      </Box>

      {/* Filter */}
      <Paper
        elevation={0}
        sx={{
          p: bastadTheme.spacing[4],
          mb: 3,
          borderRadius: bastadTheme.borderRadius.lg,
          border: `1px solid ${bastadTheme.colors.sand[200]}`,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Händelsetyp</InputLabel>
          <Select
            value={actionFilter}
            label="Händelsetyp"
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <MenuItem value="">Alla händelser</MenuItem>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: bastadTheme.borderRadius.lg,
          border: `1px solid ${bastadTheme.colors.sand[200]}`,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: bastadTheme.colors.sand[100] }}>
              <TableCell
                sx={{ fontWeight: 700, color: bastadTheme.colors.ocean[800] }}
              >
                Tid
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, color: bastadTheme.colors.ocean[800] }}
              >
                Användare
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, color: bastadTheme.colors.ocean[800] }}
              >
                Händelse
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, color: bastadTheme.colors.ocean[800] }}
              >
                Beskrivning
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    Inga händelser att visa
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, index) => (
                <TableRow
                  key={entry.id}
                  sx={{
                    bgcolor:
                      index % 2 === 1
                        ? bastadTheme.colors.sand[50]
                        : undefined,
                  }}
                >
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2">
                      {format(new Date(entry.created_at), 'd MMM HH:mm', {
                        locale: sv,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {entry.user_name || entry.user_email || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ACTION_LABELS[entry.action] || entry.action}
                      size="small"
                      sx={{
                        bgcolor: getActionColor(entry.action),
                        color: '#fff',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {entry.description || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[25]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} av ${count !== -1 ? count : `fler än ${to}`}`
          }
        />
      </TableContainer>
    </Container>
  );
};

export default ActivityLogPage;
