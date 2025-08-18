import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { designTokens } from '../../theme/designSystem';

interface StatusChipProps extends Omit<ChipProps, 'variant' | 'color'> {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending';
  variant?: 'filled' | 'outlined' | 'soft';
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  variant = 'soft',
  sx,
  ...props
}) => {
  const getStatusStyles = () => {
    const statusConfig = {
      success: {
        filled: {
          backgroundColor: designTokens.colors.success[500],
          color: designTokens.colors.neutral.white,
        },
        outlined: {
          backgroundColor: 'transparent',
          color: designTokens.colors.success[700],
          border: `1px solid ${designTokens.colors.success[500]}`,
        },
        soft: {
          backgroundColor: designTokens.colors.success[50],
          color: designTokens.colors.success[700],
          border: `1px solid ${designTokens.colors.success[200]}`,
        },
      },
      warning: {
        filled: {
          backgroundColor: designTokens.colors.warning[500],
          color: designTokens.colors.neutral.white,
        },
        outlined: {
          backgroundColor: 'transparent',
          color: designTokens.colors.warning[700],
          border: `1px solid ${designTokens.colors.warning[500]}`,
        },
        soft: {
          backgroundColor: designTokens.colors.warning[50],
          color: designTokens.colors.warning[700],
          border: `1px solid ${designTokens.colors.warning[200]}`,
        },
      },
      error: {
        filled: {
          backgroundColor: designTokens.colors.error[500],
          color: designTokens.colors.neutral.white,
        },
        outlined: {
          backgroundColor: 'transparent',
          color: designTokens.colors.error[700],
          border: `1px solid ${designTokens.colors.error[500]}`,
        },
        soft: {
          backgroundColor: designTokens.colors.error[50],
          color: designTokens.colors.error[700],
          border: `1px solid ${designTokens.colors.error[200]}`,
        },
      },
      info: {
        filled: {
          backgroundColor: designTokens.colors.primary[500],
          color: designTokens.colors.neutral.white,
        },
        outlined: {
          backgroundColor: 'transparent',
          color: designTokens.colors.primary[700],
          border: `1px solid ${designTokens.colors.primary[500]}`,
        },
        soft: {
          backgroundColor: designTokens.colors.primary[50],
          color: designTokens.colors.primary[700],
          border: `1px solid ${designTokens.colors.primary[200]}`,
        },
      },
      neutral: {
        filled: {
          backgroundColor: designTokens.colors.secondary[500],
          color: designTokens.colors.neutral.white,
        },
        outlined: {
          backgroundColor: 'transparent',
          color: designTokens.colors.secondary[700],
          border: `1px solid ${designTokens.colors.secondary[500]}`,
        },
        soft: {
          backgroundColor: designTokens.colors.secondary[50],
          color: designTokens.colors.secondary[700],
          border: `1px solid ${designTokens.colors.secondary[200]}`,
        },
      },
      pending: {
        filled: {
          backgroundColor: designTokens.colors.secondary[400],
          color: designTokens.colors.neutral.white,
        },
        outlined: {
          backgroundColor: 'transparent',
          color: designTokens.colors.secondary[600],
          border: `1px solid ${designTokens.colors.secondary[400]}`,
        },
        soft: {
          backgroundColor: designTokens.colors.secondary[100],
          color: designTokens.colors.secondary[700],
          border: `1px solid ${designTokens.colors.secondary[300]}`,
        },
      },
    };

    return statusConfig[status][variant];
  };

  return (
    <Chip
      sx={{
        borderRadius: designTokens.borderRadius.full,
        fontWeight: designTokens.typography.fontWeight.medium,
        fontSize: designTokens.typography.fontSize.xs,
        height: 'auto',
        padding: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
        ...getStatusStyles(),
        ...sx,
      }}
      {...props}
    />
  );
};

export default StatusChip;
