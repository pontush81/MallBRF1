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
  Menu as MenuIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate, Route, Routes, useLocation } from 'react-router-dom';

import PagesList from './PagesList';
import PageEditor from './PageEditor';
import DashboardHome from './DashboardHome';
import UsersList from './UsersList';
import AllowlistManager from './AllowlistManager';
import NotificationSettings from './NotificationSettings';

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
    } else if (path.includes('/admin/allowlist')) {
      return 'allowlist';
    } else if (path.includes('/admin/notifications')) {
      return 'notifications';
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
      case 'allowlist':
        navigate('/admin/allowlist');
        break;
      case 'notifications':
        navigate('/admin/notifications');
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
        color="primary"
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
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
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/admin')}
          >
            {selectedItem === 'dashboard' && 'Översikt'}
            {selectedItem === 'pages' && 'Hantera Sidor'}
            {selectedItem === 'bookings' && 'Bokningar'}
            {selectedItem === 'users' && 'Användare'}
            {selectedItem === 'allowlist' && 'Tillåtna användare'}
            {selectedItem === 'notifications' && 'Notifikationer'}
          </Typography>
          
          <Button 
            color="inherit"
            startIcon={<ExitToAppIcon />}
            onClick={() => navigate('/pages')}
          >
            {isMobile ? '' : 'Lämna admin'}
          </Button>
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
                
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('allowlist')}
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    borderBottom: selectedItem === 'allowlist' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'allowlist' ? 1 : 0.8
                  }}
                >
                  <SecurityIcon sx={{ mr: 1 }} />
                  Tillåtna användare
                </Button>
                
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('notifications')}
                  sx={{ 
                    py: 1.5, 
                    px: 2,
                    borderBottom: selectedItem === 'notifications' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'notifications' ? 1 : 0.8
                  }}
                >
                  <NotificationsIcon sx={{ mr: 1 }} />
                  Notifikationer
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
        ModalProps={{
          keepMounted: true, // Bättre prestanda vid öppning/stängning
        }}
      >
        <Box sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            height: '56px', // Samma höjd som AppBar
            display: 'flex',
            alignItems: 'center',
            px: 2,
            bgcolor: 'primary.main',
            color: 'white'
          }}>
            <Typography variant="h6" component="div">
              Admin
            </Typography>
          </Box>
          
          <List sx={{ flex: 1, pt: 0 }}>
            <ListItem 
              button 
              selected={selectedItem === 'dashboard'}
              onClick={() => handleNavItemClick('dashboard')}
              sx={{ 
                minHeight: '56px',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white'
                  }
                }
              }}
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
              sx={{ 
                minHeight: '56px',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white'
                  }
                }
              }}
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
              sx={{ 
                minHeight: '56px',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white'
                  }
                }
              }}
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
              sx={{ 
                minHeight: '56px',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white'
                  }
                }
              }}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Användare" />
            </ListItem>
            
            <ListItem 
              button 
              selected={selectedItem === 'allowlist'}
              onClick={() => handleNavItemClick('allowlist')}
              sx={{ 
                minHeight: '56px',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white'
                  }
                }
              }}
            >
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText primary="Tillåtna användare" />
            </ListItem>
            
            <ListItem 
              button 
              selected={selectedItem === 'notifications'}
              onClick={() => handleNavItemClick('notifications')}
              sx={{ 
                minHeight: '56px',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white'
                  }
                }
              }}
            >
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText primary="Notifikationer" />
            </ListItem>
          </List>
          
          <Divider />
          
          <List>
            <ListItem 
              button 
              onClick={() => {
                navigate('/pages');
                setDrawerOpen(false);
              }}
              sx={{ minHeight: '56px' }}
            >
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Lämna admin" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: isMobile ? '56px' : '104px', 
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          width: '100%'
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/pages" element={<PagesList />} />
            <Route path="/pages/new" element={<PageEditor />} />
            <Route path="/pages/:id" element={<PageEditor />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/allowlist" element={<AllowlistManager />} />
            <Route path="/notifications" element={<NotificationSettings />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 