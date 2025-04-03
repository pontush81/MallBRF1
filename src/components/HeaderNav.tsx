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
  navigateToSection: (sectionId: string) => void;
  onMenuToggle: () => void;
  isAuthLoaded: boolean;
}

const HeaderNav: React.FC<HeaderNavProps> = ({ 
  pages, 
  navigateToSection, 
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
            navigateToSection={navigateToSection} 
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