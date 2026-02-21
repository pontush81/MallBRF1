import React, { useState, useMemo } from 'react';
import {
  Box,
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
import CloseIcon from '@mui/icons-material/Close';
import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import {
  computeYearlyTotals,
  buildByggdelMap,
} from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenancePlanSummaryProps {
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

const MaintenancePlanSummary: React.FC<MaintenancePlanSummaryProps> = ({ rows }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const byggdelMap = useMemo(() => buildByggdelMap(rows), [rows]);
  const yearlyTotals = useMemo(() => computeYearlyTotals(rows), [rows]);
  const grandTotal = useMemo(() => Object.values(yearlyTotals).reduce((a, b) => a + b, 0), [yearlyTotals]);
  const totalInklOsakerhet = useMemo(() => {
    const totaltRow = rows.find(r => r.rowType === 'summary' && (r.byggdel === 'Totalt inkl osäkerhet' || r.byggdel === 'Totalt inkl moms'));
    if (!totaltRow) return grandTotal;
    let sum = 0;
    for (const yc of YEAR_COLUMNS) {
      const val = totaltRow[yc];
      if (typeof val === 'number') sum += val;
    }
    return sum || grandTotal;
  }, [rows, grandTotal]);
  const maxYear = useMemo(() => Math.max(...Object.values(yearlyTotals), 1), [yearlyTotals]);

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
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1, mb: isCollapsed ? 0 : 3, flexWrap: 'wrap' }}
      >
        <IconButton size="small" sx={{ p: 0 }}>
          {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          {fmtKr(totalInklOsakerhet)}
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            2026–2035
          </Typography>
          <Typography variant="caption" color="text.disabled">
            exkl. osäkerhet: {fmtKr(grandTotal)}
          </Typography>
        </Box>
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
                  flex: { xs: '1 0 55px', sm: '1 0 80px' },
                  maxWidth: { xs: 70, sm: 100 },
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
                    height: 4,
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
                    <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Byggdel</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Belopp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {yearDetailItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.row.atgard || '–'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{item.byggdel}</TableCell>
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

    </Box>
  );
};

export default MaintenancePlanSummary;
