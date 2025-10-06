import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Alert,
  Fab,
} from '@mui/material';
import { StandardLoading } from '../components/common/StandardLoading';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useNavigate } from 'react-router-dom';
import ModernPagesListProfessional from '../components/modern/ModernPagesListProfessional';
import { modernTheme } from '../theme/modernTheme';
import { usePages } from '../context/PageContext';
import { Page } from '../types/Page';

const ModernPublicPages: React.FC = (): JSX.Element => {
  const { pages, loading, error } = usePages();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

  // Clean up hash fragments in URL when component loads
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle page click - navigate to individual page (not used with current expand/collapse behavior)
  const handlePageClick = (page: Page) => {
    navigate(`/page/${page.id}`);
  };

  // Loading state
  if (loading && pages.length === 0) {
    return (
      <Container maxWidth="lg">
        <StandardLoading 
          variant="fullPage" 
          size={40} 
          message="Laddar sidor..." 
        />
      </Container>
    );
  }

  // Error state
  if (error && pages.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert 
            severity="error"
            sx={{
              borderRadius: modernTheme.borderRadius.xl,
              '& .MuiAlert-icon': {
                color: modernTheme.colors.error[500],
              },
            }}
          >
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  // Empty state
  if (pages.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          my: 4, // Reducerat från 8 till 4
          textAlign: 'center',
          padding: modernTheme.spacing[6], // Reducerat från 12 till 6
          minHeight: '40vh', // La till minHeight istället för stora paddings
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Typography 
            variant="h5" 
            sx={{
              color: modernTheme.colors.gray[600],
              marginBottom: modernTheme.spacing[2],
            }}
          >
            Inga sidor tillgängliga
          </Typography>
          <Typography 
            variant="body1" 
            sx={{
              color: modernTheme.colors.gray[500],
            }}
          >
            Det finns inga publicerade sidor att visa för tillfället.
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show pages list (default view)
  return (
    <Box>
      <ModernPagesListProfessional 
        pages={pages}
        onPageClick={handlePageClick}
        isLoading={loading && pages.length === 0}
      />

      {/* Scroll to top button */}
      {showScrollTop && (
        <Fab
          color="primary"
          aria-label="scroll back to top"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: modernTheme.gradients.accent,
            boxShadow: modernTheme.shadows.xl,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: modernTheme.shadows['2xl'],
            },
            transition: modernTheme.transitions.normal,
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}
    </Box>
  );
};

export default ModernPublicPages;