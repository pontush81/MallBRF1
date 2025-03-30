import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  AppBar,
  Toolbar,
  IconButton,
  useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  Article as ArticleIcon,
  Event as EventIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import { useNavigate, Route, Routes, useLocation } from 'react-router-dom';

import PagesList from './PagesList';
import PageEditor from './PageEditor';
import BookingsList from './BookingsList';
import DashboardHome from './DashboardHome';
import UsersList from './UsersList';

// Huvudkomponent för admin-dashboarden med navigering via tabs
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  // Uppdatera vald menypunkt baserat på nuvarande sökväg
  const getSelectedItem = () => {
    const path = location.pathname;
    if (path.includes('/admin/pages')) {
      return 'pages';
    } else if (path.includes('/admin/users')) {
      return 'users';
    } else if (path.includes('/admin/bookings')) {
      return 'bookings';
    } else {
      return 'dashboard';
    }
  };

  const handleNavItemClick = (item: string) => {
    switch (item) {
      case 'dashboard':
        navigate('/admin');
        break;
      case 'pages':
        navigate('/admin/pages');
        break;
      case 'bookings':
        navigate('/admin/bookings');
        break;
      case 'users':
        navigate('/admin/users');
        break;
    }
  };

  const selectedItem = getSelectedItem();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          boxShadow: 0,
          borderBottom: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Toolbar variant="dense" sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" noWrap component="div">
              {selectedItem === 'dashboard' && 'Översikt'}
              {selectedItem === 'pages' && 'Hantera Sidor'}
              {selectedItem === 'bookings' && 'Bokningar'}
              {selectedItem === 'users' && 'Användare'}
            </Typography>
          </Box>
          
          {/* Lämna admin-knapp */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              startIcon={<ExitToAppIcon />}
              onClick={() => navigate('/pages')}
            >
              Lämna admin
            </Button>
          </Box>
        </Toolbar>
        
        {/* Navigation Tabs */}
        <Box sx={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
          <Container>
            <Box sx={{ display: 'flex', overflow: 'auto' }}>
              <Button 
                color="inherit"
                onClick={() => handleNavItemClick('dashboard')}
                sx={{ 
                  py: 1.5, 
                  px: 2,
                  borderBottom: selectedItem === 'dashboard' ? '2px solid white' : 'none',
                  borderRadius: 0,
                  opacity: selectedItem === 'dashboard' ? 1 : 0.8
                }}
              >
                <DashboardIcon sx={{ mr: 1 }} />
                Översikt
              </Button>
              
              <Button 
                color="inherit"
                onClick={() => handleNavItemClick('pages')}
                sx={{ 
                  py: 1.5, 
                  px: 2,
                  borderBottom: selectedItem === 'pages' ? '2px solid white' : 'none',
                  borderRadius: 0,
                  opacity: selectedItem === 'pages' ? 1 : 0.8
                }}
              >
                <ArticleIcon sx={{ mr: 1 }} />
                Hantera sidor
              </Button>
              
              <Button 
                color="inherit"
                onClick={() => handleNavItemClick('bookings')}
                sx={{ 
                  py: 1.5, 
                  px: 2,
                  borderBottom: selectedItem === 'bookings' ? '2px solid white' : 'none',
                  borderRadius: 0,
                  opacity: selectedItem === 'bookings' ? 1 : 0.8
                }}
              >
                <EventIcon sx={{ mr: 1 }} />
                Bokningar
              </Button>
              
              <Button 
                color="inherit"
                onClick={() => handleNavItemClick('users')}
                sx={{ 
                  py: 1.5, 
                  px: 2,
                  borderBottom: selectedItem === 'users' ? '2px solid white' : 'none',
                  borderRadius: 0,
                  opacity: selectedItem === 'users' ? 1 : 0.8
                }}
              >
                <PeopleIcon sx={{ mr: 1 }} />
                Användare
              </Button>
            </Box>
          </Container>
        </Box>
      </AppBar>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, 
          pt: { xs: 1, md: 2 },
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
          userSelect: 'none',
          WebkitUserSelect: 'text',  // Tillåt endast texturval
          mt: 11 // Lägg till margin-top för att kompensera för AppBar
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Container maxWidth="xl" sx={{ mt: { xs: 1, md: 2 }, mb: 4 }}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/pages" element={<PagesList />} />
            <Route path="/pages/new" element={<PageEditor />} />
            <Route path="/pages/edit/:id" element={<PageEditor />} />
            <Route path="/bookings" element={<BookingsList />} />
            <Route path="/users" element={<UsersList />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 