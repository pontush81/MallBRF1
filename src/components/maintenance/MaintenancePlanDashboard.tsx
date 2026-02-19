import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  computeYearlyTotals,
  computeSectionSummaries,
  getTopExpenses,
} from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenancePlanDashboardProps {
  rows: PlanRow[];
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function fmtKr(amount: number): string {
  if (!amount) return '–';
  return amount.toLocaleString('sv-SE') + ' kr';
}

function fmtCompact(amount: number): string {
  if (!amount) return '–';
  return (amount / 1000).toFixed(0) + 'k';
}

function fmtTkr(amount: number): string {
  if (!amount) return '–';
  return Math.round(amount / 1000).toLocaleString('sv-SE') + ' tkr';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanDashboard: React.FC<MaintenancePlanDashboardProps> = ({ rows }) => {
  const yearlyTotals = useMemo(() => computeYearlyTotals(rows), [rows]);
  const sections = useMemo(() => computeSectionSummaries(rows), [rows]);
  const topExpenses = useMemo(() => getTopExpenses(rows, 5), [rows]);
  const grandTotal = useMemo(() => Object.values(yearlyTotals).reduce((a, b) => a + b, 0), [yearlyTotals]);
  const maxYear = useMemo(() => Math.max(...Object.values(yearlyTotals), 1), [yearlyTotals]);

  return (
    <Box>
      {/* Total — en enkel rad */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {fmtTkr(grandTotal)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          total planerad kostnad 2026–2035
        </Typography>
      </Box>

      {/* Kostnad per år — kompakt tabell */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Kostnad per år
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 3, flexWrap: 'wrap' }}>
        {YEAR_COLUMNS.map((yc) => {
          const year = yc.replace('year_', '');
          const amount = yearlyTotals[yc] || 0;
          const pct = (amount / maxYear) * 100;
          const isHigh = amount > 200000;

          return (
            <Box
              key={yc}
              sx={{
                flex: '1 0 80px',
                maxWidth: 100,
                border: '1px solid',
                borderColor: isHigh ? 'warning.main' : 'divider',
                borderRadius: 1,
                p: 1,
                bgcolor: isHigh ? 'warning.50' : 'background.paper',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                {year}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: isHigh ? 'warning.dark' : 'text.primary' }}
              >
                {fmtCompact(amount)}
              </Typography>
              <Box
                sx={{
                  mt: 0.5,
                  height: 3,
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${pct}%`,
                    bgcolor: isHigh ? 'warning.main' : 'primary.main',
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Sektioner — enkel lista */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Per sektion
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableBody>
            {sections.map((s) => (
              <TableRow key={s.nr}>
                <TableCell sx={{ fontWeight: 600, width: 40 }}>{s.nr}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {fmtTkr(s.grandTotal)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary', width: 80 }}>
                  {s.itemCount} poster
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Topp 5 kostnader */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Största kommande utgifter
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Åtgärd</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Byggdel</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">År</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Belopp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topExpenses.map((e, i) => (
              <TableRow key={i}>
                <TableCell>{e.row.atgard || '–'}</TableCell>
                <TableCell>{e.row.byggdel || '–'}</TableCell>
                <TableCell align="right">{e.year}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtKr(e.total)}</TableCell>
              </TableRow>
            ))}
            {topExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                  Inga kostnader att visa
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MaintenancePlanDashboard;
