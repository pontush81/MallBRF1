import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { scroller } from 'react-scroll';

interface ScrollNavigationOptions {
  scrollOffset?: number;
  scrollDuration?: number;
  scrollDelay?: number;
  pages?: Array<{ id: string; title: string }>;
}

export function useScrollNavigation(options: ScrollNavigationOptions = {}) {
  const {
    scrollOffset = -70,
    scrollDuration = 500,
    scrollDelay = 50,
    pages = []
  } = options;
  
  const navigate = useNavigate();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Navigate to a section with react-scroll
  const navigateToSection = async (sectionId: string) => {
    if (location.pathname === '/pages') {
      // Om redan på /pages, uppdatera URL hash och scrolla manuellt
      window.history.pushState(null, '', `#${sectionId}`);
      
      // Kontrollera om sidan finns i pages
      const targetPage = pages.find(page => page.id === sectionId);
      if (!targetPage) {
        console.error('Sidan hittades inte:', sectionId);
        return;
      }

      // Vänta på att elementet ska finnas i DOM:en
      const waitForElement = (elementId: string, maxAttempts = 50): Promise<void> => {
        return new Promise((resolve, reject) => {
          let attempts = 0;
          
          const checkElement = () => {
            attempts++;
            const element = document.getElementById(elementId);
            
            if (element) {
              resolve();
            } else if (attempts >= maxAttempts) {
              reject(new Error(`Element ${elementId} not found after ${maxAttempts} attempts`));
            } else {
              setTimeout(checkElement, 100);
            }
          };
          
          checkElement();
        });
      };

      try {
        // Vänta på att elementet ska finnas
        await waitForElement(sectionId);
        
        // Scrolla till elementet
        scroller.scrollTo(sectionId, {
          duration: scrollDuration,
          delay: 0,
          smooth: 'easeInOutQuart',
          offset: scrollOffset,
        });
      } catch (error) {
        console.error('Kunde inte hitta målelementet:', error);
      }
    } else {
      // Om inte på /pages, navigera dit först med hash
      navigate(`/pages#${sectionId}`);
    }
  };
  
  // Handle initial hash in URL
  useEffect(() => {
    if (location.pathname === '/pages' && location.hash && pages.length > 0) {
      const sectionId = location.hash.substring(1); // Remove #
      
      // Use react-scroll with timeout
      setTimeout(() => {
        navigateToSection(sectionId);
      }, 300);
    }
  }, [location.pathname, location.hash, pages]);
  
  // Track scroll position for "scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowScrollTop(scrollPosition > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return {
    navigateToSection,
    showScrollTop,
    scrollToTop
  };
} 