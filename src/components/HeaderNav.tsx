import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Button,
  Box
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import DesktopMenu from './DesktopMenu';
import { useAuth } from '../context/AuthContext';

interface HeaderNavProps {
  pages: Array<{id: string, title: string}>;
  onMenuToggle: () => void;
  isAuthLoaded: boolean;
}

const HeaderNav: React.FC<HeaderNavProps> = ({ 
  pages, 
  onMenuToggle, 
  isAuthLoaded 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), {
    noSsr: true,
    defaultMatches: false
  });
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin } = useAuth();

  // Hantera klick på en sida
  const handlePageClick = (pageId: string) => {
    // Kontrollera om vi är på en annan sida än /pages
    const currentPath = window.location.pathname;
    if (currentPath !== '/pages') {
      // Om vi är på en annan sida, navigera till /pages med hash
      navigate(`/pages#${pageId}`);
    } else {
      // Om vi redan är på /pages-sidan, använd bara hash
      window.location.hash = pageId;
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={3}
      sx={{ 
        top: 0,
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
      }}
    >
      <Toolbar>
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
        
        {/* Admin länk som alltid visas för admin-användare */}
        {isAdmin && (
          <Button
            color="inherit"
            component={RouterLink}
            to="/admin"
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              mr: 2,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)'
              }
            }}
          >
            Admin
          </Button>
        )}
        
        {/* Desktop navigation - Show only when auth has loaded */}
        {!isMobile && isAuthLoaded && (
          <DesktopMenu 
            pages={pages} 
            navigateToSection={handlePageClick} 
          />
        )}

        {/* Visa BOKA-knappen endast i desktop-vy */}
        {!isMobile && isLoggedIn && (
          <Button
            component="button"
            onClick={() => {
              navigate('/booking');
              window.scrollTo(0, 0);
            }}
            sx={{
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1rem',
              lineHeight: 1.5,
              letterSpacing: '0.00938em',
              textTransform: 'uppercase',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                textDecoration: 'none',
              },
            }}
          >
            BOKA
          </Button>
        )}

        {isMobile ? (
          /* Mobile view - Login button and Hamburger menu */
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isLoggedIn && (
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  minWidth: 'auto',
                  px: 2
                }}
              >
                Logga in
              </Button>
            )}
            <IconButton
              color="inherit"
              edge="end"
              onClick={onMenuToggle}
              aria-label="öppna meny"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        ) : null}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderNav; 