import React from 'react';
import { Card, CardProps, CardContent, CardActions, Typography, Box } from '@mui/material';
import { bastadTheme } from '../../theme/bastadTheme';

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
          border: `1px solid ${bastadTheme.colors.sand[300]}`,
          backgroundColor: bastadTheme.colors.white,
        };
      case 'outlined':
        return {
          boxShadow: 'none',
          border: `2px solid ${bastadTheme.colors.sand[400]}`,
          backgroundColor: 'transparent',
        };
      case 'elevated':
      default:
        return {
          boxShadow: bastadTheme.shadows.card,
          border: `1px solid ${bastadTheme.colors.sand[300]}`,
          backgroundColor: bastadTheme.colors.white,
        };
    }
  };

  const hoverStyles = hover ? {
    '&:hover': {
      boxShadow: bastadTheme.shadows.cardHover,
      transform: 'translateY(-4px)',
      borderColor: bastadTheme.colors.terracotta[500],
      '& .card-title': {
        color: bastadTheme.colors.terracotta[600],
      },
    },
  } : {};

  return (
    <Card
      sx={{
        borderRadius: bastadTheme.borderRadius.xl,
        transition: bastadTheme.transitions.normal,
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
                fontFamily: bastadTheme.typography.fontFamily.heading,
                fontWeight: 600,
                color: bastadTheme.colors.ocean[900],
                transition: bastadTheme.transitions.fast,
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
                fontFamily: bastadTheme.typography.fontFamily.body,
                color: bastadTheme.colors.ocean[600],
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
