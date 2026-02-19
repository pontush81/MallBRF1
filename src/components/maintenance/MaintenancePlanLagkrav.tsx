import React, { useMemo } from 'react';
import {
  Box,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import { getLagkravItems } from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MaintenancePlanLagkravProps {
  rows: PlanRow[];
}

type Status = 'ok' | 'warning' | 'unknown';

interface LagkravItem {
  row: PlanRow;
  status: Status;
  nextYear: string | null;
  budget: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function analyze(row: PlanRow): LagkravItem {
  const costs: { year: string; amount: number }[] = [];
  for (const yc of YEAR_COLUMNS) {
    const val = row[yc];
    if (typeof val === 'number' && val > 0) {
      costs.push({ year: yc.replace('year_', ''), amount: val });
    }
  }

  const hasCost = costs.length > 0;
  const hasNote = !!row.utredningspunkter?.trim();
  const status: Status = hasCost ? 'ok' : hasNote ? 'warning' : 'unknown';
  const nextYear = hasCost ? costs[0].year : null;
  const budget = hasCost
    ? costs.map((c) => `${c.amount.toLocaleString('sv-SE')} kr (${c.year})`).join(', ')
    : '–';

  return { row, status, nextYear, budget };
}

const STATUS_ICON: Record<Status, React.ReactElement> = {
  ok: <CheckCircleIcon fontSize="small" color="success" />,
  warning: <WarningIcon fontSize="small" color="warning" />,
  unknown: <ScheduleIcon fontSize="small" color="disabled" />,
};

const STATUS_LABEL: Record<Status, string> = {
  ok: 'Planerad',
  warning: 'Behöver åtgärd',
  unknown: 'Ej schemalagd',
};

const STATUS_COLOR: Record<Status, 'success' | 'warning' | 'default'> = {
  ok: 'success',
  warning: 'warning',
  unknown: 'default',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanLagkrav: React.FC<MaintenancePlanLagkravProps> = ({ rows }) => {
  const items = useMemo(() => getLagkravItems(rows).map(analyze), [rows]);
  const okCount = items.filter((i) => i.status === 'ok').length;
  const actionCount = items.filter((i) => i.status !== 'ok').length;

  return (
    <Box>
      {/* Sammanfattning — en enkel rad */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Lagkrav & obligatoriska kontroller
        </Typography>
        <Chip label={`${okCount} planerade`} color="success" size="small" variant="outlined" />
        {actionCount > 0 && (
          <Chip label={`${actionCount} behöver åtgärd`} color="warning" size="small" variant="outlined" />
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Lagstadgade åtgärder och kontroller som BRF:en måste utföra.
      </Typography>

      {/* Tabell */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: 40 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Åtgärd</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Frekvens</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Nästa</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Budget</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Notering</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.row.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {STATUS_ICON[item.status]}
                    <Chip
                      label={STATUS_LABEL[item.status]}
                      color={STATUS_COLOR[item.status]}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 22 }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{item.row.atgard}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>
                  {item.row.tek_livslangd || '–'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 500 }}>
                  {item.nextYear || '–'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 500 }}>
                  {item.budget}
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', maxWidth: 200 }}>
                  {item.row.utredningspunkter || '–'}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                  Inga lagkravsposter hittades
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MaintenancePlanLagkrav;
