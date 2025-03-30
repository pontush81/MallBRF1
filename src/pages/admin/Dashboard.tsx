import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  List,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  Article as ArticleIcon,
  Event as EventIcon,
  Menu as MenuIcon,
  AccountCircle,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import PagesList from './PagesList';
import PageEditor from './PageEditor';
import BookingsList from './BookingsList';
import DashboardHome from './DashboardHome';
import UsersList from './UsersList';

// Konstant för drawer-bredden
const drawerWidth = 240;

// Huvudkomponent för admin-dashboarden med sidebar och routing
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  
  // State för användarmenyn
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);
  
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
    if (isMobile) {
      setMobileOpen(false);
    }
    
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const selectedItem = getSelectedItem();

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/login');
  };

  // Innehåll för sidpanelen
  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItemButton 
          selected={selectedItem === 'dashboard'} 
          onClick={() => handleNavItemClick('dashboard')}
        >
          <ListItemIcon>
            <DashboardIcon color={selectedItem === 'dashboard' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Översikt" />
        </ListItemButton>
        
        <ListItemButton 
          selected={selectedItem === 'pages'} 
          onClick={() => handleNavItemClick('pages')}
        >
          <ListItemIcon>
            <ArticleIcon color={selectedItem === 'pages' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Hantera Sidor" />
        </ListItemButton>
        
        <ListItemButton 
          selected={selectedItem === 'bookings'} 
          onClick={() => handleNavItemClick('bookings')}
        >
          <ListItemIcon>
            <EventIcon color={selectedItem === 'bookings' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Bokningar" />
        </ListItemButton>
        
        <ListItemButton 
          selected={selectedItem === 'users'} 
          onClick={() => handleNavItemClick('users')}
        >
          <ListItemIcon>
            <PeopleIcon color={selectedItem === 'users' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Användare" />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 0,
          borderBottom: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Toolbar variant="dense" sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {selectedItem === 'dashboard' && 'Översikt'}
              {selectedItem === 'pages' && 'Hantera Sidor'}
              {selectedItem === 'bookings' && 'Bokningar'}
              {selectedItem === 'users' && 'Användare'}
            </Typography>
          </Box>
          
          {/* Navigeringslänkar till höger */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.href = '/pages'}
            >
              Sidor
            </Button>
            <Button 
              color="inherit" 
              size="small"
              onClick={() => window.location.href = '/booking'}
            >
              Boka
            </Button>
            <Button 
              color="inherit" 
              size="small"
              variant="outlined"
              onClick={() => window.location.href = '/admin'}
              sx={{ 
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.5)'
                }
              }}
            >
              Admin
            </Button>
            
            {/* Användarikon och meny */}
            <IconButton
              color="inherit"
              onClick={handleUserMenuClick}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={userMenuOpen ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={userMenuOpen}
              onClose={handleUserMenuClose}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: 180 }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled>
                {currentUser?.name || currentUser?.email || 'Användare'}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logga ut
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer för mobil */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Bättre prestanda på mobila enheter
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Permanent drawer för desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, 
          pt: { xs: 1, md: 2 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
          userSelect: 'none',
          WebkitUserSelect: 'text'  // Tillåt endast texturval
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Toolbar variant="dense" sx={{ mb: { xs: -2, md: -1 } }} /> {/* Tomt utrymme under app bar */}
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