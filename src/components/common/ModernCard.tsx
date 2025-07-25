import React from 'react';
import { styled } from '@mui/material/styles';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { modernTheme } from '../../theme/modernTheme';

interface ModernCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: boolean;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'gradient' && prop !== 'hover',
})<{ gradient?: boolean; hover?: boolean }>(
  ({ theme, gradient, hover }) => ({
    borderRadius: modernTheme.borderRadius['2xl'],
    background: gradient 
      ? modernTheme.gradients.card 
      : modernTheme.colors.white,
    boxShadow: modernTheme.shadows.md,
    border: `1px solid ${modernTheme.colors.gray[200]}`,
    transition: modernTheme.transitions.normal,
    cursor: hover ? 'pointer' : 'default',
    
    '&:hover': hover ? {
      transform: 'translateY(-4px)',
      boxShadow: modernTheme.shadows.xl,
      borderColor: modernTheme.colors.primary[300],
    } : {},

    // Glass morphism effect
    '&.glass': {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
    },

    // Dark mode support
    '&.dark': {
      background: gradient 
        ? modernTheme.gradients.darkCard 
        : modernTheme.colors.gray[800],
      border: `1px solid ${modernTheme.colors.gray[700]}`,
      color: modernTheme.colors.white,
    },
  })
);

const CardHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: modernTheme.spacing[3],
  marginBottom: modernTheme.spacing[4],
});

const IconWrapper = styled(Box)<{ color?: string }>(({ color }) => ({
  width: '48px',
  height: '48px',
  borderRadius: modernTheme.borderRadius.xl,
  background: color || modernTheme.gradients.accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: modernTheme.colors.white,
  fontSize: '24px',
  boxShadow: modernTheme.shadows.md,
}));

const TitleText = styled(Typography)({
  fontFamily: modernTheme.typography.fontFamily.primary,
  fontSize: modernTheme.typography.fontSize['2xl'],
  fontWeight: modernTheme.typography.fontWeight.semibold,
  color: modernTheme.colors.gray[900],
  lineHeight: modernTheme.typography.lineHeight.tight,
});

const SubtitleText = styled(Typography)({
  fontFamily: modernTheme.typography.fontFamily.primary,
  fontSize: modernTheme.typography.fontSize.sm,
  fontWeight: modernTheme.typography.fontWeight.normal,
  color: modernTheme.colors.gray[600],
  lineHeight: modernTheme.typography.lineHeight.normal,
});

const ContentWrapper = styled(CardContent)({
  padding: modernTheme.spacing[6],
  '&:last-child': {
    paddingBottom: modernTheme.spacing[6],
  },
});

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  gradient = false,
  hover = false,
  className = '',
  onClick,
}) => {
  return (
    <StyledCard 
      gradient={gradient} 
      hover={hover} 
      className={className}
      onClick={onClick}
    >
      <ContentWrapper>
        {(title || subtitle || icon) && (
          <CardHeader>
            {icon && (
              <IconWrapper>
                {icon}
              </IconWrapper>
            )}
            <Box>
              {title && (
                <TitleText variant="h6">
                  {title}
                </TitleText>
              )}
              {subtitle && (
                <SubtitleText variant="body2">
                  {subtitle}
                </SubtitleText>
              )}
            </Box>
          </CardHeader>
        )}
        {children}
      </ContentWrapper>
    </StyledCard>
  );
};

// Specialiserade korttyper
export const FeatureCard: React.FC<ModernCardProps & { iconColor?: string }> = ({
  iconColor,
  ...props
}) => (
  <ModernCard {...props} gradient hover>
    <Box sx={{ textAlign: 'center' }}>
      {props.children}
    </Box>
  </ModernCard>
);

export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}> = ({ title, value, subtitle, trend, icon }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return modernTheme.colors.success[500];
      case 'down': return modernTheme.colors.error[500];
      default: return modernTheme.colors.gray[500];
    }
  };

  return (
    <ModernCard hover>
      <Box sx={{ textAlign: 'center' }}>
        {icon && (
          <IconWrapper sx={{ 
            margin: '0 auto',
            marginBottom: modernTheme.spacing[3],
            background: modernTheme.gradients.accent,
          }}>
            {icon}
          </IconWrapper>
        )}
        <Typography
          sx={{
            fontSize: modernTheme.typography.fontSize['3xl'],
            fontWeight: modernTheme.typography.fontWeight.bold,
            color: modernTheme.colors.gray[900],
            marginBottom: modernTheme.spacing[1],
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            fontSize: modernTheme.typography.fontSize.lg,
            fontWeight: modernTheme.typography.fontWeight.medium,
            color: modernTheme.colors.gray[700],
            marginBottom: modernTheme.spacing[1],
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              fontSize: modernTheme.typography.fontSize.sm,
              color: getTrendColor(),
              fontWeight: modernTheme.typography.fontWeight.medium,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </ModernCard>
  );
}; 