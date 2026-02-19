import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';

import { PlanRow, YEAR_COLUMNS } from '../../services/maintenancePlanService';
import { getLagkravItems } from './maintenancePlanHelpers';
import { bastadTheme } from '../../theme/bastadTheme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MaintenancePlanLagkravProps {
  rows: PlanRow[];
}

type ComplianceStatus = 'ok' | 'warning' | 'unknown';

interface LagkravItemAnalysis {
  row: PlanRow;
  status: ComplianceStatus;
  scheduledYears: { year: string; amount: number }[];
  totalBudget: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const borderRadius = bastadTheme.borderRadius?.lg ?? '12px';

function determineStatus(row: PlanRow): ComplianceStatus {
  const hasCost = YEAR_COLUMNS.some((yc) => {
    const val = row[yc];
    return typeof val === 'number' && val > 0;
  });
  if (hasCost) return 'ok';

  const hasUtredning = row.utredningspunkter && row.utredningspunkter.trim().length > 0;
  if (hasUtredning) return 'warning';

  return 'unknown';
}

function getScheduledYears(row: PlanRow): { year: string; amount: number }[] {
  const years: { year: string; amount: number }[] = [];
  for (const yc of YEAR_COLUMNS) {
    const val = row[yc];
    if (typeof val === 'number' && val > 0) {
      years.push({ year: yc.replace('year_', ''), amount: val });
    }
  }
  return years;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('sv-SE') + ' kr';
}

const STATUS_STYLES: Record<ComplianceStatus, {
  bg: string;
  border: string;
  iconColor: string;
}> = {
  ok: {
    bg: bastadTheme.colors.seagreen[50],
    border: bastadTheme.colors.seagreen[200],
    iconColor: bastadTheme.colors.success,
  },
  warning: {
    bg: bastadTheme.colors.terracotta[50],
    border: bastadTheme.colors.terracotta[200],
    iconColor: bastadTheme.colors.warning,
  },
  unknown: {
    bg: bastadTheme.colors.sand[50],
    border: bastadTheme.colors.sand[300],
    iconColor: bastadTheme.colors.ocean[500],
  },
};

const STATUS_CHIP: Record<ComplianceStatus, { label: string; color: 'success' | 'warning' | 'default' }> = {
  ok: { label: 'Planerad', color: 'success' },
  warning: { label: 'Behöver åtgärd', color: 'warning' },
  unknown: { label: 'Ej schemalagd', color: 'default' },
};

function StatusIcon({ status }: { status: ComplianceStatus }) {
  const iconSx = { fontSize: 28, color: STATUS_STYLES[status].iconColor };
  switch (status) {
    case 'ok':
      return <CheckCircleIcon sx={iconSx} />;
    case 'warning':
      return <WarningIcon sx={iconSx} />;
    default:
      return <ScheduleIcon sx={iconSx} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MaintenancePlanLagkrav: React.FC<MaintenancePlanLagkravProps> = ({ rows }) => {
  const analyses = useMemo<LagkravItemAnalysis[]>(() => {
    const lagkravItems = getLagkravItems(rows);
    return lagkravItems.map((row) => {
      const status = determineStatus(row);
      const scheduledYears = getScheduledYears(row);
      const totalBudget = scheduledYears.reduce((sum, sy) => sum + sy.amount, 0);
      return { row, status, scheduledYears, totalBudget };
    });
  }, [rows]);

  const plannedCount = useMemo(
    () => analyses.filter((a) => a.status === 'ok').length,
    [analyses],
  );

  const needsActionCount = useMemo(
    () => analyses.filter((a) => a.status !== 'ok').length,
    [analyses],
  );

  return (
    <Box>
      {/* ── Summary banner ────────────────────────────────────── */}
      <Card
        sx={{
          mb: 3,
          borderRadius,
          border: `1px solid ${bastadTheme.colors.ocean[200]}`,
          background: bastadTheme.colors.ocean[50],
          boxShadow: bastadTheme.shadows.card,
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 2 }}>
          <GavelIcon
            sx={{
              fontSize: 40,
              color: bastadTheme.colors.ocean[700],
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.heading,
                fontWeight: bastadTheme.typography.fontWeight.bold,
                color: bastadTheme.colors.ocean[900],
                mb: 0.5,
              }}
            >
              Lagkrav &amp; obligatoriska kontroller
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                color: bastadTheme.colors.ocean[700],
              }}
            >
              Översikt av lagstadgade underhållsåtgärder och obligatoriska kontroller
              enligt gällande regelverk. Kontrollera att samtliga krav är planerade och
              budgeterade.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Chip
              label={`${plannedCount} planerade`}
              color="success"
              size="small"
              sx={{ fontWeight: bastadTheme.typography.fontWeight.semibold }}
            />
            <Chip
              label={`${needsActionCount} behöver åtgärd`}
              color="warning"
              size="small"
              sx={{ fontWeight: bastadTheme.typography.fontWeight.semibold }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ── No items fallback ─────────────────────────────────── */}
      {analyses.length === 0 && (
        <Typography
          sx={{
            textAlign: 'center',
            color: bastadTheme.colors.ocean[500],
            fontFamily: bastadTheme.typography.fontFamily.body,
            py: 6,
          }}
        >
          Inga lagkravsposter hittades i underhållsplanen.
        </Typography>
      )}

      {/* ── Individual compliance cards ───────────────────────── */}
      <Grid container spacing={2}>
        {analyses.map((item) => {
          const style = STATUS_STYLES[item.status];
          const chip = STATUS_CHIP[item.status];
          const firstYear = item.scheduledYears.length > 0 ? item.scheduledYears[0] : null;

          return (
            <Grid item xs={12} sm={6} key={item.row.id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius,
                  border: `1px solid ${style.border}`,
                  backgroundColor: style.bg,
                  boxShadow: bastadTheme.shadows.sm,
                  transition: bastadTheme.transitions.normal,
                  '&:hover': {
                    boxShadow: bastadTheme.shadows.md,
                  },
                }}
              >
                <CardContent>
                  {/* Header row: icon + title + chip */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                    <StatusIcon status={item.status} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: bastadTheme.typography.fontFamily.heading,
                          fontWeight: bastadTheme.typography.fontWeight.semibold,
                          color: bastadTheme.colors.ocean[900],
                          lineHeight: bastadTheme.typography.lineHeight.snug,
                        }}
                      >
                        {item.row.atgard}
                      </Typography>
                      {item.row.byggdel && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: bastadTheme.typography.fontFamily.body,
                            color: bastadTheme.colors.ocean[600],
                            mt: 0.25,
                          }}
                        >
                          {item.row.byggdel}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={chip.label}
                      color={chip.color}
                      size="small"
                      sx={{
                        flexShrink: 0,
                        fontWeight: bastadTheme.typography.fontWeight.medium,
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Details section */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 1,
                      fontFamily: bastadTheme.typography.fontFamily.body,
                    }}
                  >
                    <DetailField
                      label="Frekvens"
                      value={item.row.tek_livslangd || '\u2013'}
                    />
                    <DetailField
                      label="Nästa planerad"
                      value={firstYear ? firstYear.year : '\u2013'}
                    />
                    <DetailField
                      label="Budget"
                      value={
                        item.scheduledYears.length > 0
                          ? item.scheduledYears
                              .map((sy) => `${formatCurrency(sy.amount)} (${sy.year})`)
                              .join(', ')
                          : '\u2013'
                      }
                      fullWidth
                    />
                    {item.row.utredningspunkter && item.row.utredningspunkter.trim().length > 0 && (
                      <DetailField
                        label="Notering"
                        value={item.row.utredningspunkter}
                        fullWidth
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: DetailField
// ---------------------------------------------------------------------------

interface DetailFieldProps {
  label: string;
  value: string;
  fullWidth?: boolean;
}

function DetailField({ label, value, fullWidth }: DetailFieldProps) {
  return (
    <Box sx={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <Typography
        variant="caption"
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.body,
          fontWeight: bastadTheme.typography.fontWeight.semibold,
          color: bastadTheme.colors.ocean[600],
          textTransform: 'uppercase',
          letterSpacing: bastadTheme.typography.letterSpacing.wider,
          fontSize: bastadTheme.typography.fontSize.xs,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.body,
          color: bastadTheme.colors.ocean[800],
          mt: 0.25,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default MaintenancePlanLagkrav;
