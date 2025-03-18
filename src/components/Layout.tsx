import React, { ReactNode, useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from '../context/AuthContext';

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
  
  const menuItems = [
    { text: 'Hem', icon: <HomeIcon />, path: '/' },
    { text: 'Sidor', icon: <ArticleIcon />, path: '/pages' }
  ];
  
  if (isLoggedIn) {
    if (isAdmin) {
      menuItems.push({ text: 'Admin', icon: <DashboardIcon />, path: '/admin' });
    }
    menuItems.push({ text: 'Profil', icon: <PersonIcon />, path: '/profile' });
  }
  
  const drawer = (
    <Box 
      sx={{ width: 250 }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
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
              <ListItemIcon><ExitToAppIcon /></ListItemIcon>
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
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'white' 
            }}
          >
            React Webapp
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/"
              >
                Hem
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/pages"
              >
                Sidor
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