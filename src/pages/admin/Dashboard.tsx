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
import { modernTheme } from '../../theme/modernTheme';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  Article as ArticleIcon,
  Event as EventIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  BuildCircle as MaintenanceIcon
} from '@mui/icons-material';
import { useNavigate, Route, Routes, useLocation } from 'react-router-dom';

import PagesList from './PagesList';
import PageEditor from './PageEditor';
import DashboardHome from './DashboardHome';
import UsersList from './UsersList';
import AllowlistManager from './AllowlistManager';
import NotificationSettings from './NotificationSettings';
import MaintenancePlanPage from './MaintenancePlanPage';

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
    } else if (path.includes('/admin/maintenance')) {
      return 'maintenance';
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
      case 'maintenance':
        navigate('/admin/maintenance');
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
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          background: modernTheme.gradients.header,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${modernTheme.colors.gray[200]}`,
          boxShadow: modernTheme.shadows.lg,
        }}
      >
        <Toolbar sx={{ 
          px: { xs: modernTheme.spacing[2], md: modernTheme.spacing[4] },
          minHeight: { xs: '64px', md: '72px' }
        }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ 
                mr: modernTheme.spacing[2],
                color: modernTheme.colors.primary[800]
              }}
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
              color: modernTheme.colors.primary[800],
              fontWeight: modernTheme.typography.fontWeight.bold,
              fontSize: { xs: modernTheme.typography.fontSize.lg, md: modernTheme.typography.fontSize.xl },
              textShadow: 'none',
              transition: modernTheme.transitions.normal,
              '&:hover': {
                opacity: 0.9,
              }
            }}
            onClick={() => navigate('/admin')}
          >
            {selectedItem === 'dashboard' && 'Översikt'}
            {selectedItem === 'pages' && 'Hantera Sidor'}
            {selectedItem === 'bookings' && 'Bokningar'}
            {selectedItem === 'users' && 'Användare'}
            {selectedItem === 'allowlist' && 'Tillåtna användare'}
            {selectedItem === 'notifications' && 'Notifikationer'}
            {selectedItem === 'maintenance' && 'Underhållsplan'}
          </Typography>
          
          <Button 
            startIcon={<ExitToAppIcon />}
            onClick={() => navigate('/pages')}
            sx={{
              color: modernTheme.colors.primary[800],
              fontWeight: modernTheme.typography.fontWeight.medium,
              '&:hover': {
                backgroundColor: modernTheme.colors.primary[100],
              }
            }}
          >
            {isMobile ? '' : 'Lämna admin'}
          </Button>
        </Toolbar>
        
        {/* Navigation Tabs - endast på desktop */}
        {!isMobile && (
          <Box sx={{ 
            background: modernTheme.gradients.accent, 
            color: 'white',
            borderTop: `1px solid ${modernTheme.colors.gray[200]}`
          }}>
            <Container>
              <Box sx={{ display: 'flex', overflow: 'auto' }}>
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('dashboard')}
                  sx={{ 
                    py: modernTheme.spacing[3], 
                    px: modernTheme.spacing[4],
                    borderBottom: selectedItem === 'dashboard' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'dashboard' ? 1 : 0.85,
                    fontWeight: selectedItem === 'dashboard' ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
                    transition: modernTheme.transitions.normal,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <DashboardIcon sx={{ mr: 1 }} />
                  Översikt
                </Button>
                
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('pages')}
                  sx={{ 
                    py: modernTheme.spacing[3], 
                    px: modernTheme.spacing[4],
                    borderBottom: selectedItem === 'pages' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'pages' ? 1 : 0.85,
                    fontWeight: selectedItem === 'pages' ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
                    transition: modernTheme.transitions.normal,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <ArticleIcon sx={{ mr: 1 }} />
                  Hantera sidor
                </Button>
                
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('bookings')}
                  sx={{ 
                    py: modernTheme.spacing[3], 
                    px: modernTheme.spacing[4],
                    borderBottom: selectedItem === 'bookings' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'bookings' ? 1 : 0.85,
                    fontWeight: selectedItem === 'bookings' ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
                    transition: modernTheme.transitions.normal,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <EventIcon sx={{ mr: 1 }} />
                  Bokningar
                </Button>
                
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('maintenance')}
                  sx={{ 
                    py: modernTheme.spacing[3], 
                    px: modernTheme.spacing[4],
                    borderBottom: selectedItem === 'maintenance' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'maintenance' ? 1 : 0.85,
                    fontWeight: selectedItem === 'maintenance' ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
                    transition: modernTheme.transitions.normal,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <MaintenanceIcon sx={{ mr: 1 }} />
                  Underhållsplan
                </Button>
                
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('users')}
                  sx={{ 
                    py: modernTheme.spacing[3], 
                    px: modernTheme.spacing[4],
                    borderBottom: selectedItem === 'users' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'users' ? 1 : 0.85,
                    fontWeight: selectedItem === 'users' ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
                    transition: modernTheme.transitions.normal,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <PeopleIcon sx={{ mr: 1 }} />
                  Användare
                </Button>
                
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('allowlist')}
                  sx={{ 
                    py: modernTheme.spacing[3], 
                    px: modernTheme.spacing[4],
                    borderBottom: selectedItem === 'allowlist' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'allowlist' ? 1 : 0.85,
                    fontWeight: selectedItem === 'allowlist' ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
                    transition: modernTheme.transitions.normal,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <SecurityIcon sx={{ mr: 1 }} />
                  Tillåtna användare
                </Button>
                
                <Button 
                  color="inherit"
                  onClick={() => handleNavItemClick('notifications')}
                  sx={{ 
                    py: modernTheme.spacing[3], 
                    px: modernTheme.spacing[4],
                    borderBottom: selectedItem === 'notifications' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    opacity: selectedItem === 'notifications' ? 1 : 0.85,
                    fontWeight: selectedItem === 'notifications' ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
                    transition: modernTheme.transitions.normal,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
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
            backgroundColor: modernTheme.colors.white,
            borderRight: `1px solid ${modernTheme.colors.gray[200]}`,
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
            px: modernTheme.spacing[4],
            background: modernTheme.gradients.accent,
            color: 'white'
          }}>
            <Typography 
              variant="h6" 
              component="div"
              sx={{
                fontWeight: modernTheme.typography.fontWeight.bold,
                fontSize: modernTheme.typography.fontSize.lg
              }}
            >
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
                px: modernTheme.spacing[4],
                py: modernTheme.spacing[2],
                '&.Mui-selected': {
                  backgroundColor: modernTheme.colors.primary[100],
                  color: modernTheme.colors.primary[800],
                  '& .MuiListItemIcon-root': {
                    color: modernTheme.colors.primary[600]
                  }
                },
                '&:hover': {
                  backgroundColor: modernTheme.colors.gray[100],
                },
                transition: modernTheme.transitions.normal
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
                px: modernTheme.spacing[4],
                py: modernTheme.spacing[2],
                '&.Mui-selected': {
                  backgroundColor: modernTheme.colors.primary[100],
                  color: modernTheme.colors.primary[800],
                  '& .MuiListItemIcon-root': {
                    color: modernTheme.colors.primary[600]
                  }
                },
                '&:hover': {
                  backgroundColor: modernTheme.colors.gray[100],
                },
                transition: modernTheme.transitions.normal
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
                px: modernTheme.spacing[4],
                py: modernTheme.spacing[2],
                '&.Mui-selected': {
                  backgroundColor: modernTheme.colors.primary[100],
                  color: modernTheme.colors.primary[800],
                  '& .MuiListItemIcon-root': {
                    color: modernTheme.colors.primary[600]
                  }
                },
                '&:hover': {
                  backgroundColor: modernTheme.colors.gray[100],
                },
                transition: modernTheme.transitions.normal
              }}
            >
              <ListItemIcon>
                <EventIcon />
              </ListItemIcon>
              <ListItemText primary="Bokningar" />
            </ListItem>
            
            <ListItem 
              button 
              selected={selectedItem === 'maintenance'}
              onClick={() => handleNavItemClick('maintenance')}
              sx={{ 
                minHeight: '56px',
                px: modernTheme.spacing[4],
                py: modernTheme.spacing[2],
                '&.Mui-selected': {
                  backgroundColor: modernTheme.colors.primary[100],
                  color: modernTheme.colors.primary[800],
                  '& .MuiListItemIcon-root': {
                    color: modernTheme.colors.primary[600]
                  }
                },
                '&:hover': {
                  backgroundColor: modernTheme.colors.gray[100],
                },
                transition: modernTheme.transitions.normal
              }}
            >
              <ListItemIcon>
                <MaintenanceIcon />
              </ListItemIcon>
              <ListItemText primary="Underhållsplan" />
            </ListItem>
            
            <ListItem 
              button 
              selected={selectedItem === 'users'}
              onClick={() => handleNavItemClick('users')}
              sx={{ 
                minHeight: '56px',
                px: modernTheme.spacing[4],
                py: modernTheme.spacing[2],
                '&.Mui-selected': {
                  backgroundColor: modernTheme.colors.primary[100],
                  color: modernTheme.colors.primary[800],
                  '& .MuiListItemIcon-root': {
                    color: modernTheme.colors.primary[600]
                  }
                },
                '&:hover': {
                  backgroundColor: modernTheme.colors.gray[100],
                },
                transition: modernTheme.transitions.normal
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
                px: modernTheme.spacing[4],
                py: modernTheme.spacing[2],
                '&.Mui-selected': {
                  backgroundColor: modernTheme.colors.primary[100],
                  color: modernTheme.colors.primary[800],
                  '& .MuiListItemIcon-root': {
                    color: modernTheme.colors.primary[600]
                  }
                },
                '&:hover': {
                  backgroundColor: modernTheme.colors.gray[100],
                },
                transition: modernTheme.transitions.normal
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
                px: modernTheme.spacing[4],
                py: modernTheme.spacing[2],
                '&.Mui-selected': {
                  backgroundColor: modernTheme.colors.primary[100],
                  color: modernTheme.colors.primary[800],
                  '& .MuiListItemIcon-root': {
                    color: modernTheme.colors.primary[600]
                  }
                },
                '&:hover': {
                  backgroundColor: modernTheme.colors.gray[100],
                },
                transition: modernTheme.transitions.normal
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
          background: modernTheme.colors.gray[50],
          width: '100%'
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            py: modernTheme.spacing[4],
            px: { 
              xs: modernTheme.spacing[2], 
              sm: modernTheme.spacing[4], 
              md: modernTheme.spacing[6] 
            },
            maxWidth: { xs: '100%', sm: '100%', md: '1200px' }
          }}
        >
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/pages" element={<PagesList />} />
            <Route path="/pages/new" element={<PageEditor />} />
            <Route path="/pages/edit/:id" element={<PageEditor />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/allowlist" element={<AllowlistManager />} />
            <Route path="/notifications" element={<NotificationSettings />} />
            <Route path="/maintenance" element={<MaintenancePlanPage />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 