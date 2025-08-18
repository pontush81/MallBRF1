import React, { memo } from 'react';
import { Container, Box } from '@mui/material';
import ModernHeader from './modern/ModernHeader';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';
import { modernTheme } from '../theme/modernTheme';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  // Get current location to check if we're on the login page
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  


  return (
    <Box sx={{ 
      // Only use minHeight for auth pages that need centering
      minHeight: isAuthPage ? '100vh' : 'auto',
      background: modernTheme.colors.white, // Clean white background instead of gray
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto', // CRITICAL: Allow scrolling
      height: 'auto', // CRITICAL: Don't constrain height
    }}>
      {/* Only show navigation if not on auth pages */}
      {!isAuthPage && <ModernHeader />}
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          paddingTop: isAuthPage ? 0 : '64px', // Match exact header height (64px)
          paddingBottom: isAuthPage ? modernTheme.spacing[4] : '0px', // Remove bottom padding for regular pages
          // REMOVED: minHeight constraint that was preventing scrolling
          overflow: 'auto', // CRITICAL: Allow scrolling
          width: '100%', // Ensure full width
          height: 'auto', // CRITICAL: Auto height
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            px: { xs: modernTheme.spacing[2], sm: modernTheme.spacing[3], md: modernTheme.spacing[4] },
            py: 0, // Remove vertical padding from top
            pb: 8, // Add bottom padding to prevent footer overlap
            maxWidth: { xs: '100%', sm: '100%', md: '1200px' },
            overflow: 'visible', // Allow content to be scrollable
            width: '100%',
          }}
        >
          {children}
        </Container>
      </Box>
      
      {/* Footer - shown on all pages except auth pages */}
      {!isAuthPage && <Footer />}
    </Box>
  );
});

export default Layout; 