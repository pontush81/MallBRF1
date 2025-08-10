import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { ModernPagesList } from '../components/modern/ModernPagesList';
import { ModernCard } from '../components/common/ModernCard';
import { modernTheme } from '../theme/modernTheme';
import { usePages } from '../context/PageContext';
import { Page } from '../types/Page';
import ReactMarkdown from 'react-markdown';
// Removed remarkGfm to reduce bundle size

const ModernPublicPages: React.FC = (): JSX.Element => {
  const { pages, loading, error } = usePages();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);

  // DEBUG: Log the state values
  console.log('🔍 ModernPublicPages state:', { 
    pagesCount: pages.length, 
    loading, 
    error,
    selectedPage: selectedPage?.title || null 
  });

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

  // Handle page click - either show in modal or navigate
  const handlePageClick = (page: Page) => {
    // For now, let's show the page content in a modal-like view
    setSelectedPage(page);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedPage(null);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading && pages.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh' 
        }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
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
          my: 8, 
          textAlign: 'center',
          padding: modernTheme.spacing[12],
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

  // Show individual page view
  if (selectedPage) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          padding: modernTheme.spacing[6],
          minHeight: '100vh',
        }}>
          {/* Back button */}
          <Box sx={{ 
            marginBottom: modernTheme.spacing[6],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <Fab
              variant="extended"
              size="medium"
              onClick={handleBackToList}
              sx={{
                background: modernTheme.gradients.accent,
                color: modernTheme.colors.white,
                boxShadow: modernTheme.shadows.md,
                '&:hover': {
                  boxShadow: modernTheme.shadows.xl,
                },
              }}
            >
              ← Tillbaka till alla sidor
            </Fab>
          </Box>

          {/* Page content */}
          <ModernCard>
            <Box>
              {/* Page header */}
              <Box sx={{ 
                marginBottom: modernTheme.spacing[6],
                textAlign: 'center',
              }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: modernTheme.typography.fontSize['4xl'],
                    fontWeight: modernTheme.typography.fontWeight.bold,
                    background: modernTheme.gradients.accent,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: modernTheme.spacing[3],
                  }}
                >
                  {selectedPage.title}
                </Typography>
                
                {selectedPage.updatedAt && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: modernTheme.colors.gray[600],
                      fontSize: modernTheme.typography.fontSize.sm,
                    }}
                  >
                    Uppdaterad: {formatDate(selectedPage.updatedAt)}
                  </Typography>
                )}
              </Box>

              {/* Page content */}
              <Box sx={{
                '& h1': {
                  fontSize: modernTheme.typography.fontSize['3xl'],
                  fontWeight: modernTheme.typography.fontWeight.bold,
                  marginBottom: modernTheme.spacing[4],
                  color: modernTheme.colors.gray[900],
                },
                '& h2': {
                  fontSize: modernTheme.typography.fontSize['2xl'],
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                  marginBottom: modernTheme.spacing[3],
                  color: modernTheme.colors.gray[800],
                },
                '& h3': {
                  fontSize: modernTheme.typography.fontSize.xl,
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                  marginBottom: modernTheme.spacing[3],
                  color: modernTheme.colors.gray[800],
                },
                '& p': {
                  marginBottom: modernTheme.spacing[4],
                  lineHeight: modernTheme.typography.lineHeight.relaxed,
                  color: modernTheme.colors.gray[700],
                  fontSize: modernTheme.typography.fontSize.base,
                },
                '& ul, & ol': {
                  marginBottom: modernTheme.spacing[4],
                  paddingLeft: modernTheme.spacing[6],
                  '& li': {
                    marginBottom: modernTheme.spacing[2],
                    color: modernTheme.colors.gray[700],
                  },
                },
                '& a': {
                  color: modernTheme.colors.primary[600],
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: modernTheme.borderRadius.lg,
                  marginBottom: modernTheme.spacing[4],
                },
                '& blockquote': {
                  borderLeft: `4px solid ${modernTheme.colors.primary[300]}`,
                  paddingLeft: modernTheme.spacing[4],
                  fontStyle: 'italic',
                  marginBottom: modernTheme.spacing[4],
                  color: modernTheme.colors.gray[600],
                  background: modernTheme.colors.gray[50],
                  padding: modernTheme.spacing[4],
                  borderRadius: modernTheme.borderRadius.lg,
                },
              }}>
                <ReactMarkdown>
                  {selectedPage.content}
                </ReactMarkdown>
              </Box>
            </Box>
          </ModernCard>
        </Box>

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
      </Container>
    );
  }

  // Show pages list (default view)
  return (
    <Box>
      <ModernPagesList 
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