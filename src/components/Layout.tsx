import React, { ReactNode, useState, useEffect } from 'react';
import { Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import pageService from '../services/pageService';
import { useScrollNavigation } from '../hooks/useScrollNavigation';
import HeaderNav from './HeaderNav';
import MobileMenu from './MobileMenu';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Auth state
  const { isLoggedIn } = useAuth();
  
  // State
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pages, setPages] = useState<Array<{id: string, title: string}>>([]);
  
  // Scroll navigation hook
  const { navigateToSection } = useScrollNavigation();
  
  // Handlers
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Load pages on initial render
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

  // Handle auth loaded state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HeaderNav 
        pages={pages}
        navigateToSection={navigateToSection}
        onMenuToggle={handleDrawerToggle}
        isAuthLoaded={isAuthLoaded}
      />
      
      <MobileMenu
        isOpen={drawerOpen}
        onClose={handleDrawerToggle}
        pages={pages}
        navigateToSection={navigateToSection}
      />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: { xs: 10, sm: 6, md: 4 } }}>
        {children}
      </Container>
    </>
  );
};

export default Layout; 