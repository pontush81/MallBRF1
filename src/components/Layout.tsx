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
      minHeight: '100vh',
      background: modernTheme.colors.gray[50],
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
          paddingTop: isAuthPage ? 0 : '80px', // Increased spacing from header
          paddingBottom: modernTheme.spacing[8],
          // REMOVED: minHeight constraint that was preventing scrolling
          overflow: 'auto', // CRITICAL: Allow scrolling
          width: '100%', // Ensure full width
          height: 'auto', // CRITICAL: Auto height
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            px: { xs: modernTheme.spacing[2], sm: modernTheme.spacing[4], md: modernTheme.spacing[6] },
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