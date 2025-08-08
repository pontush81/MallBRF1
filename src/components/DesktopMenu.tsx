import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextNew';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Fade
} from '@mui/material';
import {
  KeyboardArrowDown,
  Logout as LogoutIcon
} from '@mui/icons-material';

interface DesktopMenuProps {
  pages: Array<{id: string, title: string}>;
  navigateToSection: (sectionId: string) => void;
}

const DesktopMenu: React.FC<DesktopMenuProps> = ({ pages, navigateToSection }) => {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [pagesMenuAnchorEl, setPagesMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  const handlePagesMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPagesMenuAnchorEl(event.currentTarget);
  };
  
  const handlePagesMenuClose = () => {
    setPagesMenuAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/pages');
  };

  const handlePageNavigation = (pageId: string) => {
    // Stäng menyn först
    handlePagesMenuClose();
    
    // Kontrollera om vi redan är på /pages-sidan innan navigering
    const currentPath = window.location.pathname;
    if (currentPath === '/pages') {
      // Vi är redan på rätt sida, använd direkt scrollning 
      const element = document.getElementById(pageId);
      if (element) {
        const yOffset = -80;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      // Uppdatera URL utan att ladda om sidan
      window.history.pushState(null, '', `#${pageId}`);
    } else {
      // Navigera till /pages med hash
      navigateToSection(pageId);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexGrow: 1 }}>
      {/* Pages dropdown menu */}
      <Box>
        <Button 
          color="inherit"
          onClick={handlePagesMenuOpen}
          aria-controls="pages-menu"
          aria-haspopup="true"
          endIcon={<KeyboardArrowDown />}
          sx={{ textTransform: 'none', fontSize: '1rem' }}
        >
          Sidor
        </Button>
        <Menu
          id="pages-menu"
          anchorEl={pagesMenuAnchorEl}
          keepMounted
          open={Boolean(pagesMenuAnchorEl)}
          onClose={handlePagesMenuClose}
          TransitionComponent={Fade}
          PaperProps={{
            elevation: 3,
            sx: {
              maxHeight: '65vh',
              width: '220px',
              overflow: 'auto'
            }
          }}
        >
          {[...pages]
            .sort((a, b) => a.title.localeCompare(b.title, 'sv'))
            .map(page => (
              <MenuItem 
                key={page.id}
                onClick={() => handlePageNavigation(page.id)}
              >
                {page.title}
              </MenuItem>
            ))}
        </Menu>
      </Box>
      
      {/* Booking link - Only for logged in users */}
      {isLoggedIn && (
        <Button 
          color="inherit" 
          onClick={() => {
            navigate('/booking');
            window.scrollTo(0, 0);
          }}
          sx={{ textTransform: 'none', fontSize: '1rem' }}
        >
          Boka
        </Button>
      )}
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* User menu on the right */}
      {isLoggedIn ? (
        <Box>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ textTransform: 'none', fontSize: '1rem' }}
          >
            Logga ut
          </Button>
        </Box>
      ) : (
        <Box>
          <Button 
            color="inherit" 
            onClick={() => {
              navigate('/login');
              window.scrollTo(0, 0);
            }}
            sx={{ textTransform: 'none', fontSize: '1rem' }}
          >
            Logga in
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DesktopMenu; 