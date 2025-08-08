import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  Button,
  Box,
  alpha,
  useTheme as useMuiTheme,
  Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon
} from '@mui/icons-material';
import DesktopMenu from './DesktopMenu';
import { useAuth } from '../context/AuthContextNew';

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
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'), {
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
        zIndex: muiTheme.zIndex.drawer + 1
        // Gradient och shadow hanteras nu av theme.ts
      }}
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/pages" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          sx={{ 
            flexGrow: 1,
            textDecoration: 'none', 
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textShadow: `1px 1px 2px ${alpha(muiTheme.palette.common.black, 0.3)}`
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
              bgcolor: alpha(muiTheme.palette.secondary.main, 0.8),
              mr: 2,
              px: 3,
              py: 0.8,
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: muiTheme.palette.secondary.main,
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 8px ${alpha(muiTheme.palette.common.black, 0.2)}`
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
                  px: 2,
                  py: 0.8,
                  bgcolor: alpha(muiTheme.palette.common.white, 0.15),
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(muiTheme.palette.common.white, 0.25),
                  }
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
              sx={{
                bgcolor: alpha(muiTheme.palette.common.white, 0.1),
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(muiTheme.palette.common.white, 0.2),
                  transform: 'rotate(90deg)'
                }
              }}
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