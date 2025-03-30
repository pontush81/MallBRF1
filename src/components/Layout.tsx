import React, { ReactNode, useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Link as ScrollLink, scroller } from 'react-scroll';
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
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Divider,
  Collapse,
  ListItemButton
} from '@mui/material';
import {
  Menu as MenuIcon,
  Event as EventIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Article as ArticleIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import pageService from '../services/pageService';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isLoggedIn, isAdmin, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State för sidomenyn på mobil
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // State för att visa/dölja sidor i menyn
  const [pagesOpen, setPagesOpen] = useState(false);
  const [pages, setPages] = useState<Array<{id: string, title: string}>>([]);
  
  // Funktion för att navigera till en sektion med react-scroll
  const navigateToSection = (sectionId: string) => {
    // Stäng drawer först
    setDrawerOpen(false);
    
    if (location.pathname === '/pages') {
      // Om vi redan är på /pages, uppdatera URL hash och skrolla manuellt
      window.history.pushState(null, '', `#${sectionId}`);
      
      // Kort timeout för att säkerställa att DOM har uppdaterats
      setTimeout(() => {
        scroller.scrollTo(sectionId, {
          duration: 500, // Snabbare scrollning (500ms istället för 800ms)
          delay: 0,
          smooth: 'easeInOutQuart',
          offset: -70, // Kompensera för headern
        });
      }, 50); // Kortare timeout (50ms istället för 100ms)
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
      }, 300); // Kortare timeout (300ms istället för 500ms)
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

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handlePagesClick = () => {
    setPagesOpen(!pagesOpen);
  };
  
  const navItems = [
    { label: 'Sidor', path: '/pages', icon: <ArticleIcon />, clickHandler: handlePagesClick, hasSubmenu: true },
    { label: 'Boka', path: '/booking', icon: <EventIcon /> }
  ];
  
  if (isLoggedIn) {
    if (isAdmin) {
      navItems.push({ label: 'Admin', path: '/admin', icon: <DashboardIcon /> });
    }
    navItems.push({ label: 'Profil', path: '/profile', icon: <AccountCircle /> });
  }
  
  // Komponent för drawer-innehållet
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
        
        {/* Admin-länk endast för administratörer */}
        {isAdmin && (
          <ListItem 
            component="div"
            onClick={() => {
              setDrawerOpen(false);
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
        )}
        
        {/* Logga ut-knapp om inloggad */}
        {isLoggedIn && (
          <ListItem 
            component="div"
            onClick={() => {
              handleLogout();
              setDrawerOpen(false);
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
        )}
        
        {/* Logga in-knapp om inte inloggad */}
        {!isLoggedIn && (
          <>
            <ListItem 
              component="div"
              onClick={() => {
                setDrawerOpen(false);
                navigate('/login');
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
                primary="LOGGA IN" 
                primaryTypographyProps={{
                  variant: 'h6',
                  fontWeight: 'bold'
                }}
              />
            </ListItem>
            
            <ListItem 
              component="div"
              onClick={() => {
                setDrawerOpen(false);
                navigate('/register');
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
                primary="REGISTRERA" 
                primaryTypographyProps={{
                  variant: 'h6',
                  fontWeight: 'bold'
                }}
              />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
            aria-label="öppna meny"
          >
            <MenuIcon />
          </IconButton>
          
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
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        variant="temporary"
        ModalProps={{
          keepMounted: true,
          disableScrollLock: true,
          hideBackdrop: false
        }}
        sx={{
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
      
      {/* Tomt Toolbar-element för att kompensera för fixed AppBar */}
      <Toolbar />
      
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {children}
      </Container>
    </>
  );
};

export default Layout; 