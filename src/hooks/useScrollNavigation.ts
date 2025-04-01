import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { scroller } from 'react-scroll';

interface ScrollNavigationOptions {
  scrollOffset?: number;
  scrollDuration?: number;
  scrollDelay?: number;
}

export function useScrollNavigation(options: ScrollNavigationOptions = {}) {
  const {
    scrollOffset = -70,
    scrollDuration = 500,
    scrollDelay = 50
  } = options;
  
  const navigate = useNavigate();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Navigate to a section with react-scroll
  const navigateToSection = (sectionId: string) => {
    if (location.pathname === '/pages') {
      // If already on /pages, update URL hash and scroll manually
      window.history.pushState(null, '', `#${sectionId}`);
      
      // Short timeout to ensure DOM has updated
      setTimeout(() => {
        scroller.scrollTo(sectionId, {
          duration: scrollDuration,
          delay: 0,
          smooth: 'easeInOutQuart',
          offset: scrollOffset,
        });
      }, scrollDelay);
    } else {
      // If not on /pages, navigate there first with hash
      navigate(`/pages#${sectionId}`);
    }
  };
  
  // Handle initial hash in URL
  useEffect(() => {
    if (location.pathname === '/pages' && location.hash) {
      const sectionId = location.hash.substring(1); // Remove #
      
      // Use react-scroll with timeout
      setTimeout(() => {
        scroller.scrollTo(sectionId, {
          duration: scrollDuration,
          delay: 0,
          smooth: 'easeInOutQuart',
          offset: scrollOffset,
        });
      }, 300);
    }
  }, [location.pathname, location.hash, scrollDuration, scrollOffset]);
  
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