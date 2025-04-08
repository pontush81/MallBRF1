import React, { ReactNode, useState, useEffect } from 'react';
import { Container, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import pageService from '../services/pageService';
import HeaderNav from './HeaderNav';
import MobileMenu from './MobileMenu';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Auth state
  const { isLoggedIn } = useAuth();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  
  // Pages data
  const [pages, setPages] = useState<Array<{id: string, title: string}>>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Get current location to check if we're on the login page
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Fetch pages for navigation
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const allPages = await pageService.getPublishedPages();
        const navPages = allPages
          .filter(page => page.show)
          .map(page => ({ id: page.id, title: page.title }));
        setPages(navPages);
      } catch (error) {
        console.error('Error fetching pages for navigation:', error);
      }
    };
    
    fetchPages();
    setIsAuthLoaded(true);
  }, []);

  // Handlers
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
      {/* Only show navigation if not on auth pages */}
      {!isAuthPage && (
        <>
          <HeaderNav 
            pages={pages}
            onMenuToggle={handleDrawerToggle}
            isAuthLoaded={isAuthLoaded}
          />
          
          <MobileMenu
            isOpen={drawerOpen}
            onClose={handleDrawerToggle}
            pages={pages}
          />
        </>
      )}
      
      <Container maxWidth="lg" sx={{ 
        mt: 4, 
        mb: { xs: 10, sm: 6, md: 4 },
        px: { xs: 0.5, sm: 2, md: 3 } // Reduce padding on mobile
      }}>
        {children}
      </Container>
    </>
  );
};

export default Layout; 