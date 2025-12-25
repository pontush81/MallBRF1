import React, { useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Alert,
} from '@mui/material';
import { StandardLoading } from '../components/common/StandardLoading';
import { useNavigate } from 'react-router-dom';
import ModernPagesListProfessional from '../components/modern/ModernPagesListProfessional';
import CompactHero from '../components/common/CompactHero';
import { bastadTheme } from '../theme/bastadTheme';
import { usePages } from '../context/PageContext';
import { Page } from '../types/Page';

const ModernPublicPages: React.FC = (): JSX.Element => {
  const { pages, loading, error } = usePages();
  const navigate = useNavigate();

  // Clean up hash fragments in URL when component loads
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Handle page click
  const handlePageClick = (page: Page) => {
    navigate(`/page/${page.id}`);
  };

  // Loading state
  if (loading && pages.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: bastadTheme.colors.sand[50],
      }}>
        <CompactHero />
        <Container maxWidth="lg">
          <StandardLoading 
            variant="fullPage" 
            size={40} 
            message="Laddar sidor..." 
          />
        </Container>
      </Box>
    );
  }

  // Error state
  if (error && pages.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: bastadTheme.colors.sand[50],
      }}>
        <CompactHero />
        <Container maxWidth="lg">
          <Box sx={{ 
            my: { xs: 2, md: 4 },
            px: { xs: 2, sm: 0 },
          }}>
            <Alert 
              severity="error"
              sx={{
                borderRadius: bastadTheme.borderRadius.lg,
                fontFamily: bastadTheme.typography.fontFamily.body,
              }}
            >
              {error}
            </Alert>
          </Box>
        </Container>
      </Box>
    );
  }

  // Empty state
  if (pages.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: bastadTheme.colors.sand[50],
      }}>
        <CompactHero />
        <Container maxWidth="lg">
          <Box sx={{ 
            my: { xs: 3, md: 4 },
            textAlign: 'center',
            padding: { xs: 4, md: 6 },
            minHeight: '30vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Typography 
              variant="h5" 
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.heading,
                color: bastadTheme.colors.ocean[700],
                marginBottom: 2,
                fontSize: { xs: '1.25rem', md: '1.5rem' },
              }}
            >
              Inga sidor tillgängliga
            </Typography>
            <Typography 
              variant="body1" 
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                color: bastadTheme.colors.ocean[500],
                fontSize: { xs: '0.9375rem', md: '1rem' },
              }}
            >
              Det finns inga publicerade sidor att visa för tillfället.
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  // Main content
  return (
    <Box sx={{ 
      background: bastadTheme.colors.sand[50],
      // Säkerställ utrymme mellan innehåll och footer
      pb: { xs: 8, md: 12 },
    }}>
      {/* Kompakt Hero - Ljus & Ren */}
      <CompactHero />
      
      {/* Huvudinnehåll - Handboken */}
      <ModernPagesListProfessional 
        pages={pages}
        onPageClick={handlePageClick}
        isLoading={loading && pages.length === 0}
      />
    </Box>
  );
};

export default ModernPublicPages;
