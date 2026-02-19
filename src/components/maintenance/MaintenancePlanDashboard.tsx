import React, { useState, useMemo } from 'react';
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
  IconButton,
  Collapse,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  computeYearlyTotals,
  computeSectionSummaries,
  getTopExpenses,
  getLagkravItems,
  buildByggdelMap,
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

function getItemsForYear(rows: PlanRow[], yearCol: string, byggdelMap: Map<string, string>): { row: PlanRow; amount: number; byggdel: string }[] {
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

const MaintenancePlanDashboard: React.FC<MaintenancePlanDashboardProps> = ({ rows }) => {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const byggdelMap = useMemo(() => buildByggdelMap(rows), [rows]);
  const yearlyTotals = useMemo(() => computeYearlyTotals(rows), [rows]);
  const sections = useMemo(() => computeSectionSummaries(rows), [rows]);
  const topExpenses = useMemo(() => getTopExpenses(rows, 5), [rows]);
  const grandTotal = useMemo(() => Object.values(yearlyTotals).reduce((a, b) => a + b, 0), [yearlyTotals]);
  const maxYear = useMemo(() => Math.max(...Object.values(yearlyTotals), 1), [yearlyTotals]);

  // Lagkrav
  const lagkravItems = useMemo(() => getLagkravItems(rows).map(analyzeLagkrav), [rows]);

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
      {/* Total */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {fmtKr(grandTotal)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          total planerad kostnad 2026–2035
        </Typography>
      </Box>

      {/* Kostnad per år — klickbara kort */}
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
                    bgcolor: isSelected ? 'primary.main' : 'primary.main',
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

      {/* Sektioner */}
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
                <TableCell>{e.byggdel}</TableCell>
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

      {/* Lagkrav & obligatoriska kontroller */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        Lagkrav & obligatoriska kontroller
      </Typography>

      {lagkravItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Inga lagkravsposter hittades
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Items needing attention */}
          {lagkravItems.filter(i => i.status !== 'ok').length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {lagkravItems.filter(i => i.status !== 'ok').map((item) => (
                <Box
                  key={item.row.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'warning.50',
                    border: '1px solid',
                    borderColor: 'warning.200',
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
          )}

          {/* Planned items — simple checklist */}
          {lagkravItems.filter(i => i.status === 'ok').length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {lagkravItems.filter(i => i.status === 'ok').map((item) => (
                <Box
                  key={item.row.id}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.75 }}
                >
                  <CheckCircleIcon fontSize="small" color="success" />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {item.row.atgard}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.nextYear}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MaintenancePlanDashboard;
