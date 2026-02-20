import React, { useState, useMemo } from 'react';
import {
  Box,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  computeYearlyTotals,
  getLagkravItems,
  buildByggdelMap,
} from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenancePlanSummaryProps {
  rows: PlanRow[];
  onNavigateToRow?: (rowId: string) => void;
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

// ---------------------------------------------------------------------------
// Lagkrav helpers
// ---------------------------------------------------------------------------

type LagkravStatus = 'ok' | 'warning' | 'unknown';

interface LagkravItem {
  row: PlanRow;
  status: LagkravStatus;
  nextYear: string | null;
  budget: string;
}

function analyzeLagkrav(row: PlanRow): LagkravItem {
  const costs: { year: string; amount: number }[] = [];
  for (const yc of YEAR_COLUMNS) {
    const val = row[yc];
    if (typeof val === 'number' && val > 0) {
      costs.push({ year: yc.replace('year_', ''), amount: val });
    }
  }

  const hasCost = costs.length > 0;
  const hasNote = !!row.utredningspunkter?.trim();
  const status: LagkravStatus = hasCost ? 'ok' : hasNote ? 'warning' : 'unknown';
  const nextYear = hasCost ? costs[0].year : null;
  const budget = hasCost
    ? costs.map((c) => `${c.amount.toLocaleString('sv-SE')} kr (${c.year})`).join(', ')
    : '–';

  return { row, status, nextYear, budget };
}

// ---------------------------------------------------------------------------
// Year detail: items for a selected year
// ---------------------------------------------------------------------------

function getItemsForYear(
  rows: PlanRow[],
  yearCol: string,
  byggdelMap: Map<string, string>,
): { row: PlanRow; amount: number; byggdel: string }[] {
  const items: { row: PlanRow; amount: number; byggdel: string }[] = [];
  for (const r of rows) {
    if (r.rowType !== 'item') continue;
    const val = r[yearCol as keyof PlanRow];
    if (typeof val === 'number' && val > 0) {
      items.push({ row: r, amount: val, byggdel: byggdelMap.get(r.id) || '–' });
    }
  }
  items.sort((a, b) => b.amount - a.amount);
  return items;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanSummary: React.FC<MaintenancePlanSummaryProps> = ({ rows, onNavigateToRow }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [lagkravExpanded, setLagkravExpanded] = useState(false);

  const byggdelMap = useMemo(() => buildByggdelMap(rows), [rows]);
  const yearlyTotals = useMemo(() => computeYearlyTotals(rows), [rows]);
  const grandTotal = useMemo(() => Object.values(yearlyTotals).reduce((a, b) => a + b, 0), [yearlyTotals]);
  const maxYear = useMemo(() => Math.max(...Object.values(yearlyTotals), 1), [yearlyTotals]);

  // Lagkrav — only warning/unknown items
  const lagkravWarnings = useMemo(
    () => getLagkravItems(rows).map(analyzeLagkrav).filter((i) => i.status !== 'ok'),
    [rows],
  );

  // Year detail
  const yearDetailItems = useMemo(
    () => (selectedYear ? getItemsForYear(rows, selectedYear, byggdelMap) : []),
    [rows, selectedYear, byggdelMap],
  );
  const yearDetailTotal = useMemo(
    () => yearDetailItems.reduce((sum, i) => sum + i.amount, 0),
    [yearDetailItems],
  );

  const handleYearClick = (yearCol: string) => {
    setSelectedYear((prev) => (prev === yearCol ? null : yearCol));
  };

  return (
    <Box>
      {/* Grand total + collapse toggle — always visible */}
      <Box
        onClick={() => setIsCollapsed((prev) => !prev)}
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1, mb: isCollapsed ? 0 : 3 }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {fmtKr(grandTotal)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          total planerad kostnad 2026–2035
        </Typography>
      </Box>

      {/* Collapsible content */}
      <Collapse in={!isCollapsed}>
        {/* Kostnad per år — clickable year cards */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Kostnad per år
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
          {YEAR_COLUMNS.map((yc) => {
            const year = yc.replace('year_', '');
            const amount = yearlyTotals[yc] || 0;
            const pct = (amount / maxYear) * 100;
            const isSelected = selectedYear === yc;

            return (
              <Box
                key={yc}
                onClick={() => handleYearClick(yc)}
                sx={{
                  flex: '1 0 80px',
                  maxWidth: 100,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 1,
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  {year}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: isSelected ? 'primary.main' : 'text.primary' }}
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
                      bgcolor: 'primary.main',
                      borderRadius: 1,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Year detail — expandable */}
        <Collapse in={!!selectedYear} unmountOnExit>
          <Paper variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Planerade åtgärder {selectedYear?.replace('year_', '')} — {fmtKr(yearDetailTotal)}
              </Typography>
              <IconButton size="small" onClick={() => setSelectedYear(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            {yearDetailItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Inga planerade kostnader detta år.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Åtgärd</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Byggdel</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Belopp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {yearDetailItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.row.atgard || '–'}</TableCell>
                      <TableCell>{item.byggdel}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtKr(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Collapse>

        {!selectedYear && <Box sx={{ mb: 3 }} />}
      </Collapse>

      {/* Lagkrav warnings — compact, collapsed by default, below everything */}
      {lagkravWarnings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box
            onClick={() => setLagkravExpanded((prev) => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              py: 0.5,
            }}
          >
            <IconButton size="small" sx={{ p: 0 }}>
              {lagkravExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <WarningIcon fontSize="small" color="warning" />
            <Typography variant="body2" color="text.secondary">
              {lagkravWarnings.length} lagkrav behöver åtgärd
            </Typography>
          </Box>
          <Collapse in={lagkravExpanded}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {lagkravWarnings.map((item) => (
                <Box
                  key={item.row.id}
                  onClick={() => onNavigateToRow?.(item.row.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'warning.50',
                    border: '1px solid',
                    borderColor: 'warning.200',
                    cursor: onNavigateToRow ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    '&:hover': onNavigateToRow ? { borderColor: 'warning.main', bgcolor: 'warning.100' } : {},
                  }}
                >
                  <WarningIcon fontSize="small" color="warning" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.row.atgard}
                    </Typography>
                    {item.row.utredningspunkter?.trim() && (
                      <Typography variant="caption" color="text.secondary">
                        {item.row.utredningspunkter}
                      </Typography>
                    )}
                  </Box>
                  <Chip label="Behöver åtgärd" color="warning" size="small" variant="outlined" />
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default MaintenancePlanSummary;
