import React from 'react';
import { Container, Box } from '@mui/material';
import ModernHeader from './modern/ModernHeader';
import { useLocation } from 'react-router-dom';
import { modernTheme } from '../theme/modernTheme';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Get current location to check if we're on the login page
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: modernTheme.colors.gray[50],
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Only show navigation if not on auth pages */}
      {!isAuthPage && <ModernHeader />}
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          paddingTop: isAuthPage ? 0 : modernTheme.spacing[4],
          paddingBottom: modernTheme.spacing[8],
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            px: { xs: modernTheme.spacing[2], sm: modernTheme.spacing[4], md: modernTheme.spacing[6] },
            maxWidth: { xs: '100%', sm: '100%', md: '1200px' },
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 