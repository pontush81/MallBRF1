import React from 'react';
import { Card, CardProps, CardContent, CardActions, Typography, Box } from '@mui/material';
import { designTokens } from '../../theme/designSystem';

interface GulmaranCardProps extends Omit<CardProps, 'variant'> {
  variant?: 'elevated' | 'flat' | 'outlined';
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  hover?: boolean;
}

const GulmaranCard: React.FC<GulmaranCardProps> = ({
  variant = 'elevated',
  title,
  subtitle,
  actions,
  children,
  hover = true,
  sx,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'flat':
        return {
          boxShadow: 'none',
          border: `1px solid ${designTokens.colors.neutral.outline}`,
        };
      case 'outlined':
        return {
          boxShadow: 'none',
          border: `2px solid ${designTokens.colors.neutral.outline}`,
          backgroundColor: 'transparent',
        };
      case 'elevated':
      default:
        return {
          boxShadow: designTokens.shadows.sm,
          border: `1px solid ${designTokens.colors.neutral.outline}`,
        };
    }
  };

  const hoverStyles = hover ? {
    '&:hover': {
      boxShadow: designTokens.shadows.md,
      transform: 'translateY(-2px)',
      '& .card-title': {
        color: designTokens.colors.primary[600],
      },
    },
  } : {};

  return (
    <Card
      sx={{
        borderRadius: designTokens.borderRadius.lg,
        transition: designTokens.transitions.normal,
        ...getVariantStyles(),
        ...hoverStyles,
        ...sx,
      }}
      {...props}
    >
      {(title || subtitle) && (
        <Box sx={{ p: 3, pb: title && !subtitle ? 3 : 2 }}>
          {title && (
            <Typography 
              variant="h6" 
              component="h3"
              className="card-title"
              sx={{ 
                fontWeight: designTokens.typography.fontWeight.semibold,
                color: designTokens.colors.secondary[800],
                transition: designTokens.transitions.color,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: designTokens.colors.secondary[600],
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      
      <CardContent sx={{ p: 3, pt: title || subtitle ? 0 : 3 }}>
        {children}
      </CardContent>
      
      {actions && (
        <CardActions sx={{ p: 3, pt: 0, justifyContent: 'flex-end' }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default GulmaranCard;
