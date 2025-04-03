import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from '@mui/material';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Array<{id: string, title: string}>;
  navigateToSection: (sectionId: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, 
  onClose, 
  pages, 
  navigateToSection 
}) => {
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const drawerContent = (
    <Box 
      sx={{ 
        width: '100vw',
        height: '100vh',
        backgroundColor: theme.palette.background.paper,
        pt: 8, // Space for logo
        pb: 4,
        display: 'flex',
        flexDirection: 'column'
      }}
      role="navigation"
    >
      {/* Close button in top right corner */}
      <IconButton
        onClick={onClose}
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
      
      {/* Show all pages directly without expandable submenu */}
      <List sx={{ 
        width: '100%',
        maxWidth: '100%',
        py: 2,
        px: 4
      }}>
        {/* List all available pages in main menu */}
        {pages.map(page => (
          <ListItem
            key={page.id}
            component="div"
            onClick={() => {
              navigateToSection(page.id);
              onClose();
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
              primary={page.title}
              primaryTypographyProps={{
                variant: 'h6',
                fontWeight: 'bold'
              }}
            />
          </ListItem>
        ))}
        
        {/* Booking link only for logged in users */}
        {isLoggedIn && (
          <ListItem 
            component="div"
            onClick={() => {
              onClose();
              navigate('/booking');
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
              primary="BOKA" 
              primaryTypographyProps={{
                variant: 'h6',
                fontWeight: 'bold'
              }}
            />
          </ListItem>
        )}
        
        {/* Admin link only for administrators */}
        {isAdmin && (
          <ListItem 
            component="div"
            onClick={() => {
              onClose();
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
        
        {/* Logout button if logged in */}
        {isLoggedIn && (
          <ListItem 
            component="div"
            onClick={handleLogout}
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
        
        {/* Login button if not logged in */}
        {!isLoggedIn && (
          <ListItem 
            component="div"
            onClick={() => {
              onClose();
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
        )}
      </List>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
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
  );
};

export default MobileMenu; 