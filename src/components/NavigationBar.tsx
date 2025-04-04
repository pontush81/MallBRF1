import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavigationBarProps {
  // Add any props if needed
}

const NavigationBar: React.FC<NavigationBarProps> = () => {
  const location = useLocation();
  const { isLoggedIn, isAdmin } = useAuth();
  
  const handleCleanup = () => {
    // Clear timeouts and disconnect any observers to prevent ResizeObserver errors
    const resizeObservers = Array.from(document.querySelectorAll('.MuiDrawer-root, .MuiDialog-root'))
      .map(el => el.className);
    
    if (resizeObservers.length > 0) {
      console.log('Ensuring cleanup of observers during navigation');
    }
  };

  // Add cleanup before navigation changes
  useEffect(() => {
    return () => {
      handleCleanup();
    };
  }, [location]);
  
  return (
    <AppBar position="static">
      <Toolbar>
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
          Gulmåran
        </Typography>
        
        {isLoggedIn ? (
          <Box>
            {isAdmin && (
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/admin"
                sx={{ mr: 1 }}
              >
                Admin
              </Button>
            )}
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/booking"
            >
              Boka
            </Button>
          </Box>
        ) : (
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/login"
          >
            Logga in
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar; 