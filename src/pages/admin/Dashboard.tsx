import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { modernTheme } from '../../theme/modernTheme';
import { 
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  // Determine page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/pages')) return 'Hantera Sidor';
    if (path.includes('/bookings')) return 'Bokningar';
    if (path.includes('/users')) return 'Användare';
    if (path.includes('/allowlist')) return 'Tillåtna användare';
    if (path.includes('/notifications')) return 'Notifikationer';
    if (path.includes('/maintenance')) return 'Underhållsplan';
    if (path.includes('/data-retention')) return 'Data Retention';
    return 'Översikt';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Simple Admin Toolbar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: modernTheme.colors.secondary[500],
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${modernTheme.colors.gray[200]}`
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              cursor: 'pointer',
              color: 'white',
              fontWeight: modernTheme.typography.fontWeight.bold,
              fontSize: { xs: modernTheme.typography.fontSize.lg, md: modernTheme.typography.fontSize.xl },
              transition: modernTheme.transitions.normal,
              '&:hover': {
                opacity: 0.9,
              }
            }}
            onClick={() => navigate('/admin')}
          >
            {getPageTitle()}
          </Typography>
          
          <Button 
            startIcon={<ExitToAppIcon />}
            onClick={() => navigate('/pages')}
            sx={{
              color: 'white',
              fontWeight: modernTheme.typography.fontWeight.medium,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            {isMobile ? '' : 'Lämna admin'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: '64px', // Account for fixed AppBar
          minHeight: '100vh',
          background: modernTheme.colors.gray[50],
        }}
      >
        <Container maxWidth="xl" sx={{ py: modernTheme.spacing[4] }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 