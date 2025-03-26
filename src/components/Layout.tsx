import React, { ReactNode, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Event as EventIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isLoggedIn, isAdmin, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State för menyknappen för användarprofil
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  // State för sidomenyn på mobil
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };
  
  const navItems = [
    { label: 'Boka', path: '/booking', icon: <EventIcon /> }
  ];
  
  if (isLoggedIn) {
    if (isAdmin) {
      navItems.push({ label: 'Admin', path: '/admin', icon: <DashboardIcon /> });
    }
    navItems.push({ label: 'Profil', path: '/profile', icon: <AccountCircle /> });
  }
  
  const drawer = (
    <Box 
      sx={{ width: 250 }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
    >
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.label} 
            component={RouterLink} 
            to={item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      {isLoggedIn && (
        <>
          <Divider />
          <List>
            <ListItem 
              onClick={handleLogout}
            >
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logga ut" />
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/pages" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'white' 
            }}
          >
            Gulmåran
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/pages"
              >
                Sidor
              </Button>
              
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/booking"
              >
                Boka
              </Button>
              
              {isAdmin && (
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/admin"
                >
                  Admin
                </Button>
              )}
            </Box>
          )}
          
          <Box>
            {isLoggedIn ? (
              <>
                <IconButton
                  size="large"
                  edge="end"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                >
                  <MenuItem disabled>{currentUser?.name || currentUser?.email}</MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>Min profil</MenuItem>
                  {isAdmin && (
                    <MenuItem onClick={() => { handleClose(); navigate('/admin'); }}>Admin panel</MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>Logga ut</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/login"
                >
                  Logga in
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/register"
                >
                  Registrera
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {children}
      </Container>
    </>
  );
};

export default Layout; 