import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  Article as ArticleIcon,
  Event as EventIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, Route, Routes, useLocation } from 'react-router-dom';

import PagesList from './PagesList';
import PageEditor from './PageEditor';
import DashboardHome from './DashboardHome';
import UsersList from './UsersList';

// Huvudkomponent för admin-dashboarden med navigering via tabs
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  
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
        navigate('/booking');  // Redirect to public booking page instead of admin/bookings
        break;
      case 'users':
        navigate('/admin/users');
        break;
    }
    
    // Stäng drawer om mobilvy
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const selectedItem = getSelectedItem();
  
  // Funktion för att öppna/stänga drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

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
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
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
              {isMobile ? '' : 'Lämna admin'}
            </Button>
          </Box>
        </Toolbar>
        
        {/* Navigation Tabs - endast på desktop */}
        {!isMobile && (
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
        )}
      </AppBar>
      
      {/* Mobil drawer navigation */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ py: 2, px: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Admin
          </Typography>
        </Box>
        <Divider />
        <List>
          <ListItem 
            button 
            selected={selectedItem === 'dashboard'}
            onClick={() => handleNavItemClick('dashboard')}
            sx={{ minHeight: '56px' }} // Touch-friendly size
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Översikt" />
          </ListItem>
          
          <ListItem 
            button 
            selected={selectedItem === 'pages'}
            onClick={() => handleNavItemClick('pages')}
            sx={{ minHeight: '56px' }} // Touch-friendly size
          >
            <ListItemIcon>
              <ArticleIcon />
            </ListItemIcon>
            <ListItemText primary="Hantera sidor" />
          </ListItem>
          
          <ListItem 
            button 
            selected={selectedItem === 'bookings'}
            onClick={() => handleNavItemClick('bookings')}
            sx={{ minHeight: '56px' }} // Touch-friendly size
          >
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="Bokningar" />
          </ListItem>
          
          <ListItem 
            button 
            selected={selectedItem === 'users'}
            onClick={() => handleNavItemClick('users')}
            sx={{ minHeight: '56px' }} // Touch-friendly size
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Användare" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem 
            button 
            onClick={() => navigate('/pages')}
            sx={{ minHeight: '56px' }} // Touch-friendly size
          >
            <ListItemIcon>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Lämna admin" />
          </ListItem>
        </List>
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, 
          pt: { xs: 1, md: 2 },
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
          mt: isMobile ? 7 : 11 // Anpassa marginal baserat på skärmstorlek
        }}
      >
        <Container maxWidth="xl" sx={{ mt: { xs: 1, md: 2 }, mb: 4 }}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/pages" element={<PagesList />} />
            <Route path="/pages/new" element={<PageEditor />} />
            <Route path="/pages/edit/:id" element={<PageEditor />} />
            <Route path="/users" element={<UsersList />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 