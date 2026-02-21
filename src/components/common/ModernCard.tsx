import React from 'react';
import { styled } from '@mui/material/styles';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { bastadTheme } from '../../theme/bastadTheme';

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
    borderRadius: bastadTheme.borderRadius['2xl'],
    background: gradient 
      ? bastadTheme.gradients.cardHover 
      : bastadTheme.colors.white,
    boxShadow: bastadTheme.shadows.md,
    border: `1px solid ${bastadTheme.colors.sand[200]}`,
    transition: bastadTheme.transitions.normal,
    cursor: hover ? 'pointer' : 'default',
    
    '&:hover': hover ? {
      transform: 'translateY(-4px)',
      boxShadow: bastadTheme.shadows.xl,
      borderColor: bastadTheme.colors.ocean[300],
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
        ? 'linear-gradient(145deg, #243b53 0%, #334e68 100%)' 
        : bastadTheme.colors.ocean[800],
      border: `1px solid ${bastadTheme.colors.ocean[700]}`,
      color: bastadTheme.colors.white,
    },
  })
);

const CardHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: bastadTheme.spacing[3],
  marginBottom: bastadTheme.spacing[4],
});

const IconWrapper = styled(Box)<{ color?: string }>(({ color }) => ({
  width: '48px',
  height: '48px',
  borderRadius: bastadTheme.borderRadius.xl,
  background: color || bastadTheme.gradients.ctaButton,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: bastadTheme.colors.white,
  fontSize: '24px',
  boxShadow: bastadTheme.shadows.md,
}));

const TitleText = styled(Typography)({
  fontFamily: bastadTheme.typography.fontFamily.body,
  fontSize: bastadTheme.typography.fontSize['2xl'],
  fontWeight: bastadTheme.typography.fontWeight.semibold,
  color: bastadTheme.colors.ocean[900],
  lineHeight: bastadTheme.typography.lineHeight.tight,
});

const SubtitleText = styled(Typography)({
  fontFamily: bastadTheme.typography.fontFamily.body,
  fontSize: bastadTheme.typography.fontSize.sm,
  fontWeight: bastadTheme.typography.fontWeight.normal,
  color: bastadTheme.colors.ocean[600],
  lineHeight: bastadTheme.typography.lineHeight.normal,
});

const ContentWrapper = styled(CardContent)({
  padding: bastadTheme.spacing[6],
  '&:last-child': {
    paddingBottom: bastadTheme.spacing[6],
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
      case 'up': return bastadTheme.colors.success;
      case 'down': return bastadTheme.colors.error;
      default: return bastadTheme.colors.ocean[500];
    }
  };

  return (
    <ModernCard hover>
      <Box sx={{ textAlign: 'center' }}>
        {icon && (
          <IconWrapper sx={{ 
            margin: '0 auto',
            marginBottom: bastadTheme.spacing[3],
            background: bastadTheme.gradients.ctaButton,
          }}>
            {icon}
          </IconWrapper>
        )}
        <Typography
          sx={{
            fontSize: bastadTheme.typography.fontSize['3xl'],
            fontWeight: bastadTheme.typography.fontWeight.bold,
            color: bastadTheme.colors.ocean[900],
            marginBottom: bastadTheme.spacing[1],
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            fontSize: bastadTheme.typography.fontSize.lg,
            fontWeight: bastadTheme.typography.fontWeight.medium,
            color: bastadTheme.colors.ocean[700],
            marginBottom: bastadTheme.spacing[1],
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              fontSize: bastadTheme.typography.fontSize.sm,
              color: getTrendColor(),
              fontWeight: bastadTheme.typography.fontWeight.medium,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </ModernCard>
  );
}; 