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
  ListItem,
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
import { scroller } from 'react-scroll';
import { useAuth } from '../../context/AuthContext';
import pageService from '../../services/pageService';

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
  
  // State för sidor i menyn (samma som i Layout)
  const [pages, setPages] = useState<Array<{id: string, title: string}>>([]);
  
  // Funktion för att navigera till en sektion med react-scroll
  const navigateToSection = (sectionId: string) => {
    // Stäng drawer först
    setMobileOpen(false);
    
    if (location.pathname === '/pages') {
      // Om vi redan är på /pages, uppdatera URL hash och skrolla manuellt
      window.history.pushState(null, '', `#${sectionId}`);
      
      // Kort timeout för att säkerställa att DOM har uppdaterats
      setTimeout(() => {
        scroller.scrollTo(sectionId, {
          duration: 500, // Snabbare scrollning
          delay: 0,
          smooth: 'easeInOutQuart',
          offset: -70, // Kompensera för headern
        });
      }, 50); // Kortare timeout
    } else {
      // Om vi inte är på /pages, navigera dit först med hash
      navigate(`/pages#${sectionId}`);
    }
  };
  
  // Kontrollera om det finns en hash i URL:en vid inladdning
  useEffect(() => {
    if (location.pathname === '/pages' && location.hash) {
      const sectionId = location.hash.substring(1); // Ta bort #
      
      // Använd react-scroll med timeout
      setTimeout(() => {
        scroller.scrollTo(sectionId, {
          duration: 500, // Snabbare scrollning
          delay: 0,
          smooth: 'easeInOutQuart',
          offset: -70,
        });
      }, 300); // Kortare timeout
    }
  }, [location.pathname, location.hash]);
  
  // Hämta sidor vid inläsning
  useEffect(() => {
    const fetchPublicPages = async () => {
      try {
        const visiblePages = await pageService.getVisiblePages();
        setPages(visiblePages.map(page => ({ id: page.id, title: page.title })));
      } catch (err) {
        console.error('Kunde inte hämta sidor:', err);
      }
    };
    
    fetchPublicPages();
  }, []);
  
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Global drawer-innehåll som används i både Layout och Dashboard
  const drawerContent = (
    <Box 
      sx={{ 
        width: '100vw',
        height: '100vh',
        backgroundColor: theme.palette.background.paper,
        pt: 8, // Utrymme för logotypen
        pb: 4,
        display: 'flex',
        flexDirection: 'column'
      }}
      role="navigation"
    >
      {/* Stängknapp i övre högra hörnet */}
      <IconButton
        onClick={handleDrawerToggle}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'text.primary',
          fontSize: '2rem'
        }}
        aria-label="stäng meny"
      >
        ×
      </IconButton>
      
      {/* Visa alla sidor direkt utan expanderbar undermeny */}
      <List sx={{ 
        width: '100%',
        maxWidth: '100%',
        py: 2,
        px: 4
      }}>
        {/* Lista alla tillgängliga sidor direkt i huvudmenyn */}
        {pages.map(page => (
          <ListItem
            key={page.id}
            component="div"
            onClick={() => navigateToSection(page.id)}
            sx={{
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              },
              cursor: 'pointer'
            }}
          >
            <ListItemText 
              primary={page.title}
              primaryTypographyProps={{
                variant: 'h6',
                fontWeight: 'bold'
              }}
            />
          </ListItem>
        ))}
        
        {/* Admin-specifika menyalternativ - visas alltid i admin-vyn */}
        <ListItem 
          component="div"
          onClick={() => {
            setMobileOpen(false);
            navigate('/admin');
          }}
          sx={{
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            cursor: 'pointer'
          }}
        >
          <ListItemText 
            primary="ADMIN" 
            primaryTypographyProps={{
              variant: 'h6',
              fontWeight: 'bold'
            }}
          />
        </ListItem>
        
        {/* Logga ut-knapp */}
        <ListItem 
          component="div"
          onClick={() => {
            handleLogout();
            setMobileOpen(false);
          }}
          sx={{
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            cursor: 'pointer'
          }}
        >
          <ListItemText 
            primary="LOGGA UT" 
            primaryTypographyProps={{
              variant: 'h6',
              fontWeight: 'bold'
            }}
          />
        </ListItem>
      </List>
    </Box>
  );

  // Permanent drawer för desktop-vyn (minimal version)
  const permanentDrawer = (
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
        </Toolbar>
      </AppBar>
      
      {/* Drawer för mobil */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Använd samma fullskärmsdesign som i Layout för mobil */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Bättre prestanda på mobila enheter
            disableScrollLock: true,
            hideBackdrop: false
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              width: '100%', 
              height: '100%',
              boxSizing: 'border-box',
              borderRight: 'none'
            }
          }}
        >
          {drawerContent}
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
          {permanentDrawer}
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