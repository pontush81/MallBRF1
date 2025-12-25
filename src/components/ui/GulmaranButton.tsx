import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { bastadTheme } from '../../theme/bastadTheme';

interface GulmaranButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'link';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  to?: string;
  [key: string]: unknown;
}

const GulmaranButton: React.FC<GulmaranButtonProps> = ({
  variant = 'primary',
  loading = false,
  icon,
  iconPosition = 'start',
  children,
  disabled,
  sx,
  ...props
}) => {
  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: bastadTheme.borderRadius.lg,
      fontFamily: bastadTheme.typography.fontFamily.body,
      fontWeight: 600,
      textTransform: 'none' as const,
      transition: bastadTheme.transitions.normal,
      boxShadow: 'none',
      
      '&:hover': {
        transform: 'translateY(-2px)',
      },
      
      '&:active': {
        transform: 'translateY(0)',
      },
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          background: bastadTheme.gradients.ctaButton,
          color: bastadTheme.colors.ocean[950],
          '&:hover': {
            ...baseStyles['&:hover'],
            boxShadow: bastadTheme.shadows.warmGlow,
          },
          '&:active': {
            ...baseStyles['&:active'],
            background: `linear-gradient(135deg, ${bastadTheme.colors.terracotta[600]} 0%, ${bastadTheme.colors.terracotta[700]} 100%)`,
          },
        };
        
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: bastadTheme.colors.sand[200],
          color: bastadTheme.colors.ocean[800],
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: bastadTheme.colors.sand[300],
            boxShadow: bastadTheme.shadows.sm,
          },
          '&:active': {
            ...baseStyles['&:active'],
            backgroundColor: bastadTheme.colors.sand[400],
          },
        };
        
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: bastadTheme.colors.seagreen[500],
          color: bastadTheme.colors.white,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: bastadTheme.colors.seagreen[600],
            boxShadow: `0 10px 40px -10px ${bastadTheme.colors.seagreen[500]}60`,
          },
        };
        
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: bastadTheme.colors.warning,
          color: bastadTheme.colors.white,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: '#b45309',
            boxShadow: `0 10px 40px -10px ${bastadTheme.colors.warning}60`,
          },
        };
        
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: bastadTheme.colors.error,
          color: bastadTheme.colors.white,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: '#9f1239',
            boxShadow: `0 10px 40px -10px ${bastadTheme.colors.error}60`,
          },
        };
        
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: bastadTheme.colors.ocean[700],
          border: `1px solid ${bastadTheme.colors.sand[400]}`,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: bastadTheme.colors.sand[100],
            borderColor: bastadTheme.colors.ocean[300],
          },
        };
        
      case 'link':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: bastadTheme.colors.twilight[500],
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: bastadTheme.colors.ocean[50],
            boxShadow: 'none',
            transform: 'none',
            textDecoration: 'underline',
          },
          '&:active': {
            transform: 'none',
          },
        };
        
      default:
        return baseStyles;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <CircularProgress 
            size={16} 
            sx={{ 
              mr: 1,
              color: variant === 'primary' || variant === 'success' || variant === 'warning' || variant === 'error' 
                ? bastadTheme.colors.white 
                : 'inherit'
            }} 
          />
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'start') {
      return (
        <>
          <span style={{ marginRight: bastadTheme.spacing[2], display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'end') {
      return (
        <>
          {children}
          <span style={{ marginLeft: bastadTheme.spacing[2], display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        </>
      );
    }

    return children;
  };

  return (
    <Button
      disabled={disabled || loading}
      sx={{
        ...getVariantStyles(),
        ...sx,
      }}
      {...props}
    >
      {renderContent()}
    </Button>
  );
};

export default GulmaranButton;
