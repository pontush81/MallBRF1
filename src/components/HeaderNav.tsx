import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import DesktopMenu from './DesktopMenu';

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
        {isMobile ? (
          /* Mobile view - Hamburger menu */
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuToggle}
            sx={{ mr: 2 }}
            aria-label="öppna meny"
          >
            <MenuIcon />
          </IconButton>
        ) : null}
        
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/pages" 
          sx={{ 
            flexGrow: isMobile ? 1 : 0,
            mr: isMobile ? 0 : 3,
            textDecoration: 'none', 
            color: 'white' 
          }}
        >
          Gulmåran
        </Typography>
        
        {/* Desktop navigation - Show only when auth has loaded */}
        {!isMobile && isAuthLoaded && (
          <DesktopMenu 
            pages={pages} 
            navigateToSection={navigateToSection} 
          />
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderNav; 