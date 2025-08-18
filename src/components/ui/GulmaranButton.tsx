import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { designTokens } from '../../theme/designSystem';

interface GulmaranButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'link';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  // Support router props
  to?: string;
  [key: string]: any; // Allow additional props for router links
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
      borderRadius: designTokens.borderRadius.lg,
      fontWeight: designTokens.typography.fontWeight.medium,
      textTransform: 'none' as const,
      transition: designTokens.transitions.normal,
      boxShadow: 'none',
      
      '&:hover': {
        boxShadow: designTokens.shadows.sm,
        transform: 'translateY(-1px)',
      },
      
      '&:active': {
        transform: 'translateY(0)',
      },
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.primary[500],
          color: designTokens.colors.neutral.white,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: designTokens.colors.primary[600],
          },
          '&:active': {
            ...baseStyles['&:active'],
            backgroundColor: designTokens.colors.primary[700],
          },
        };
        
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.secondary[100],
          color: designTokens.colors.secondary[700],
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: designTokens.colors.secondary[200],
          },
          '&:active': {
            ...baseStyles['&:active'],
            backgroundColor: designTokens.colors.secondary[300],
          },
        };
        
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.success[500],
          color: designTokens.colors.neutral.white,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: designTokens.colors.success[600],
          },
        };
        
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.warning[500],
          color: designTokens.colors.neutral.white,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: designTokens.colors.warning[600],
          },
        };
        
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.error[500],
          color: designTokens.colors.neutral.white,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: designTokens.colors.error[600],
          },
        };
        
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: designTokens.colors.secondary[700],
          border: `1px solid ${designTokens.colors.neutral.outline}`,
          '&:hover': {
            ...baseStyles['&:hover'],
            backgroundColor: designTokens.colors.secondary[50],
            borderColor: designTokens.colors.secondary[300],
          },
        };
        
      case 'link':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: designTokens.colors.primary[600],
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: designTokens.colors.primary[50],
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
                ? designTokens.colors.neutral.white 
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
          <span style={{ marginRight: designTokens.spacing[2], display: 'flex', alignItems: 'center' }}>
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
          <span style={{ marginLeft: designTokens.spacing[2], display: 'flex', alignItems: 'center' }}>
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
