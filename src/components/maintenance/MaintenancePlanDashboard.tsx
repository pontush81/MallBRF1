import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import { bastadTheme } from '../../theme/bastadTheme';
import {
  computeYearlyTotals,
  computeSectionSummaries,
  getTopExpenses,
  getLagkravItems,
  computeRowTotal,
} from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenancePlanDashboardProps {
  rows: PlanRow[];
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatAmount(amount: number): string {
  if (!amount) return '–';
  return amount.toLocaleString('sv-SE');
}

function formatCompact(amount: number): string {
  if (!amount) return '–';
  return (amount / 1000).toFixed(0) + 'k';
}

function formatTkr(amount: number): string {
  if (!amount) return '–';
  return Math.round(amount / 1000).toLocaleString('sv-SE') + ' tkr';
}

// ---------------------------------------------------------------------------
// Shared border radius with fallback
// ---------------------------------------------------------------------------

const borderRadius = bastadTheme.borderRadius?.lg ?? '12px';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanDashboard: React.FC<MaintenancePlanDashboardProps> = ({ rows }) => {
  // Derived data via helper functions
  const yearlyTotals = useMemo(() => computeYearlyTotals(rows), [rows]);
  const sectionSummaries = useMemo(() => computeSectionSummaries(rows), [rows]);
  const topExpenses = useMemo(() => getTopExpenses(rows, 5), [rows]);
  const lagkravItems = useMemo(() => getLagkravItems(rows), [rows]);

  // Grand total across all years
  const grandTotal = useMemo(
    () => Object.values(yearlyTotals).reduce((sum, v) => sum + v, 0),
    [yearlyTotals]
  );

  // Total item count
  const itemCount = useMemo(
    () => rows.filter((r) => r.rowType === 'item').length,
    [rows]
  );

  // Max year for relative bar scaling
  const maxYear = useMemo(
    () => Math.max(...Object.values(yearlyTotals), 1),
    [yearlyTotals]
  );

  // ---------------------------------------------------------------------------
  // 1. Grand total banner
  // ---------------------------------------------------------------------------

  const renderGrandTotalBanner = () => (
    <Box
      sx={{
        background: bastadTheme.gradients.hero,
        borderRadius,
        p: 4,
        mb: 3,
        color: bastadTheme.colors.white,
        boxShadow: bastadTheme.shadows.lg,
      }}
    >
      <Typography
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontSize: bastadTheme.typography.fontSize['3xl'],
          fontWeight: bastadTheme.typography.fontWeight.bold,
          lineHeight: bastadTheme.typography.lineHeight.tight,
          mb: 1,
        }}
      >
        Total planerad kostnad 2026–2035
      </Typography>
      <Typography
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontSize: bastadTheme.typography.fontSize['5xl'],
          fontWeight: bastadTheme.typography.fontWeight.extrabold,
          lineHeight: bastadTheme.typography.lineHeight.tight,
          color: bastadTheme.colors.terracotta[300],
        }}
      >
        {formatTkr(grandTotal)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
        <Typography
          sx={{
            fontFamily: bastadTheme.typography.fontFamily.body,
            fontSize: bastadTheme.typography.fontSize.base,
            color: bastadTheme.colors.ocean[200],
          }}
        >
          {sectionSummaries.length} sektioner
        </Typography>
        <Typography
          sx={{
            fontFamily: bastadTheme.typography.fontFamily.body,
            fontSize: bastadTheme.typography.fontSize.base,
            color: bastadTheme.colors.ocean[200],
          }}
        >
          {itemCount} poster
        </Typography>
      </Box>
    </Box>
  );

  // ---------------------------------------------------------------------------
  // 2. Yearly cost cards
  // ---------------------------------------------------------------------------

  const renderYearlyCostCards = () => (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontSize: bastadTheme.typography.fontSize['2xl'],
          fontWeight: bastadTheme.typography.fontWeight.bold,
          color: bastadTheme.colors.ocean[900],
          mb: 2,
        }}
      >
        Kostnad per ar
      </Typography>
      <Grid container spacing={1.5}>
        {YEAR_COLUMNS.map((yc) => {
          const year = yc.replace('year_', '');
          const amount = yearlyTotals[yc] || 0;
          const isHigh = amount > 200000;

          return (
            <Grid item xs={6} sm={4} md={2.4} lg={1.2} key={yc}>
              <Box
                sx={{
                  border: `2px solid ${isHigh ? bastadTheme.colors.terracotta[500] : bastadTheme.colors.sand[300]}`,
                  borderRadius,
                  p: 1.5,
                  backgroundColor: isHigh
                    ? bastadTheme.colors.terracotta[50]
                    : bastadTheme.colors.white,
                  boxShadow: bastadTheme.shadows.sm,
                  transition: bastadTheme.transitions.fast,
                  '&:hover': {
                    boxShadow: bastadTheme.shadows.md,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    fontSize: bastadTheme.typography.fontSize.sm,
                    fontWeight: bastadTheme.typography.fontWeight.medium,
                    color: bastadTheme.colors.ocean[600],
                    mb: 0.5,
                  }}
                >
                  {year}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.heading,
                    fontSize: bastadTheme.typography.fontSize.xl,
                    fontWeight: bastadTheme.typography.fontWeight.bold,
                    color: isHigh
                      ? bastadTheme.colors.terracotta[700]
                      : bastadTheme.colors.ocean[900],
                    mb: 1,
                  }}
                >
                  {amount ? formatCompact(amount) : '–'}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(amount / maxYear) * 100}
                  sx={{
                    height: 6,
                    borderRadius: bastadTheme.borderRadius?.sm ?? '4px',
                    backgroundColor: bastadTheme.colors.sand[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: bastadTheme.borderRadius?.sm ?? '4px',
                      backgroundColor: isHigh
                        ? bastadTheme.colors.terracotta[500]
                        : bastadTheme.colors.ocean[500],
                    },
                  }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  // ---------------------------------------------------------------------------
  // 3. Section breakdown
  // ---------------------------------------------------------------------------

  const renderSectionBreakdown = () => (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontSize: bastadTheme.typography.fontSize['2xl'],
          fontWeight: bastadTheme.typography.fontWeight.bold,
          color: bastadTheme.colors.ocean[900],
          mb: 2,
        }}
      >
        Sektioner
      </Typography>
      <Grid container spacing={2}>
        {sectionSummaries.map((section) => (
          <Grid item xs={12} sm={6} md={3} key={section.nr}>
            <Box
              sx={{
                border: `1px solid ${bastadTheme.colors.sand[300]}`,
                borderRadius,
                p: 2.5,
                backgroundColor: bastadTheme.colors.sand[50],
                boxShadow: bastadTheme.shadows.card,
                height: '100%',
                transition: bastadTheme.transitions.fast,
                '&:hover': {
                  boxShadow: bastadTheme.shadows.cardHover,
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontSize: bastadTheme.typography.fontSize.sm,
                  fontWeight: bastadTheme.typography.fontWeight.semibold,
                  color: bastadTheme.colors.ocean[500],
                  textTransform: 'uppercase',
                  letterSpacing: bastadTheme.typography.letterSpacing.wider,
                  mb: 0.5,
                }}
              >
                Sektion {section.nr}
              </Typography>
              <Typography
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.heading,
                  fontSize: bastadTheme.typography.fontSize.lg,
                  fontWeight: bastadTheme.typography.fontWeight.bold,
                  color: bastadTheme.colors.ocean[900],
                  mb: 1.5,
                  lineHeight: bastadTheme.typography.lineHeight.snug,
                }}
              >
                {section.name}
              </Typography>
              <Typography
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.heading,
                  fontSize: bastadTheme.typography.fontSize['2xl'],
                  fontWeight: bastadTheme.typography.fontWeight.bold,
                  color: bastadTheme.colors.terracotta[600],
                  mb: 0.5,
                }}
              >
                {formatTkr(section.grandTotal)}
              </Typography>
              <Typography
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontSize: bastadTheme.typography.fontSize.sm,
                  color: bastadTheme.colors.ocean[500],
                }}
              >
                {section.itemCount} {section.itemCount === 1 ? 'post' : 'poster'}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // ---------------------------------------------------------------------------
  // 4. Top 5 expenses table
  // ---------------------------------------------------------------------------

  const renderTopExpenses = () => (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontSize: bastadTheme.typography.fontSize['2xl'],
          fontWeight: bastadTheme.typography.fontWeight.bold,
          color: bastadTheme.colors.ocean[900],
          mb: 2,
        }}
      >
        Topp 5 kostnader
      </Typography>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius,
          boxShadow: bastadTheme.shadows.card,
          border: `1px solid ${bastadTheme.colors.sand[300]}`,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: bastadTheme.colors.ocean[50],
              }}
            >
              {['Atgard', 'Byggdel', 'Ar', 'Belopp'].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    fontWeight: bastadTheme.typography.fontWeight.semibold,
                    color: bastadTheme.colors.ocean[800],
                    fontSize: bastadTheme.typography.fontSize.sm,
                    borderBottom: `2px solid ${bastadTheme.colors.ocean[200]}`,
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {topExpenses.map((item, index) => (
              <TableRow
                key={`${item.row.id}-${item.year}-${index}`}
                sx={{
                  '&:nth-of-type(odd)': {
                    backgroundColor: bastadTheme.colors.sand[50],
                  },
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                <TableCell
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    fontSize: bastadTheme.typography.fontSize.sm,
                    color: bastadTheme.colors.ocean[900],
                  }}
                >
                  {item.row.atgard}
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    fontSize: bastadTheme.typography.fontSize.sm,
                    color: bastadTheme.colors.ocean[700],
                  }}
                >
                  {item.row.byggdel}
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    fontSize: bastadTheme.typography.fontSize.sm,
                    color: bastadTheme.colors.ocean[700],
                  }}
                >
                  {item.year}
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.heading,
                    fontSize: bastadTheme.typography.fontSize.sm,
                    fontWeight: bastadTheme.typography.fontWeight.bold,
                    color: bastadTheme.colors.terracotta[600],
                  }}
                >
                  {formatAmount(item.total)} kr
                </TableCell>
              </TableRow>
            ))}
            {topExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: bastadTheme.colors.ocean[400] }}>
                  Inga kostnader att visa
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // ---------------------------------------------------------------------------
  // 5. Lagkrav status
  // ---------------------------------------------------------------------------

  const renderLagkravStatus = () => (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontSize: bastadTheme.typography.fontSize['2xl'],
          fontWeight: bastadTheme.typography.fontWeight.bold,
          color: bastadTheme.colors.ocean[900],
          mb: 2,
        }}
      >
        Lagkrav
      </Typography>
      <Grid container spacing={1.5}>
        {lagkravItems.map((item) => {
          const total = computeRowTotal(item);
          const hasScheduledCost = total > 0;

          return (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Box
                sx={{
                  border: `1px solid ${hasScheduledCost ? bastadTheme.colors.seagreen[200] : bastadTheme.colors.terracotta[200]}`,
                  borderRadius,
                  p: 2,
                  backgroundColor: hasScheduledCost
                    ? bastadTheme.colors.seagreen[50]
                    : bastadTheme.colors.terracotta[50],
                  boxShadow: bastadTheme.shadows.sm,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                {hasScheduledCost ? (
                  <CheckCircleIcon
                    sx={{
                      color: bastadTheme.colors.seagreen[500],
                      fontSize: 24,
                      mt: 0.25,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <WarningAmberIcon
                    sx={{
                      color: bastadTheme.colors.terracotta[500],
                      fontSize: 24,
                      mt: 0.25,
                      flexShrink: 0,
                    }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.body,
                      fontSize: bastadTheme.typography.fontSize.sm,
                      fontWeight: bastadTheme.typography.fontWeight.semibold,
                      color: bastadTheme.colors.ocean[900],
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.atgard}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.body,
                      fontSize: bastadTheme.typography.fontSize.xs,
                      color: bastadTheme.colors.ocean[500],
                      mb: 1,
                    }}
                  >
                    {item.byggdel}
                  </Typography>
                  <Chip
                    label={hasScheduledCost ? 'Planerad' : 'Ej schemalagd'}
                    size="small"
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.body,
                      fontSize: bastadTheme.typography.fontSize.xs,
                      fontWeight: bastadTheme.typography.fontWeight.semibold,
                      backgroundColor: hasScheduledCost
                        ? bastadTheme.colors.seagreen[100]
                        : bastadTheme.colors.terracotta[100],
                      color: hasScheduledCost
                        ? bastadTheme.colors.seagreen[700]
                        : bastadTheme.colors.terracotta[700],
                      border: 'none',
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          );
        })}
        {lagkravItems.length === 0 && (
          <Grid item xs={12}>
            <Typography
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                color: bastadTheme.colors.ocean[400],
                textAlign: 'center',
                py: 3,
              }}
            >
              Inga lagkravsposter hittades
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {renderGrandTotalBanner()}
      {renderYearlyCostCards()}
      {renderSectionBreakdown()}
      {renderTopExpenses()}
      {renderLagkravStatus()}
    </Box>
  );
};

export default MaintenancePlanDashboard;
