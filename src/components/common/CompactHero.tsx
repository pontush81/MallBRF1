import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { bastadTheme } from '../../theme/bastadTheme';

interface CompactHeroProps {
  title?: string;
  subtitle?: string;
}

/**
 * Kompakt Hero-sektion - LJUS & PROFESSIONELL
 * Ren design som matchar resten av sidan
 */
const CompactHero: React.FC<CompactHeroProps> = ({
  title = 'Din handbok',
  subtitle = 'Allt du behöver veta som boende i föreningen',
}) => {
  return (
    <Box
      component="section"
      sx={{
        // LJUS bakgrund - samma som resten av sidan
        background: bastadTheme.colors.sand[50],
        borderBottom: `1px solid ${bastadTheme.colors.sand[200]}`,
        // Kompakt padding - tightare mot header
        pt: { xs: '72px', sm: '76px', md: '80px' }, // Space for header (64px + lite luft)
        pb: { xs: 2.5, sm: 3, md: 4 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ px: { xs: 0, sm: 2 } }}
      >
        <Box sx={{ textAlign: 'center' }}>
          {/* Pre-title badge */}
          <Typography
            component="span"
            sx={{
              display: 'inline-block',
              color: bastadTheme.colors.terracotta[500],
              fontFamily: bastadTheme.typography.fontFamily.body,
              fontSize: { xs: '0.625rem', sm: '0.6875rem' },
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              mb: 1,
            }}
          >
            BRF i Båstad
          </Typography>

          {/* Main title - MÖRKBLÅ text på ljus bakgrund */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.heading,
              fontSize: { xs: '1.375rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 700,
              color: bastadTheme.colors.ocean[900],
              lineHeight: 1.2,
              mb: 0.75,
            }}
          >
            {title}
          </Typography>

          {/* Subtitle - grå text */}
          <Typography
            variant="body1"
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.body,
              fontSize: { xs: '0.9375rem', sm: '1rem', md: '1.0625rem' },
              color: bastadTheme.colors.ocean[500],
              maxWidth: { xs: '300px', sm: '450px', md: '550px' },
              mx: 'auto',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default CompactHero;

