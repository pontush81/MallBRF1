import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop - Scrollar sidan till toppen när användaren navigerar till en ny sida
 * Placera denna komponent inuti Router men utanför Route-elementen
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scrolla till toppen när pathname ändras (navigation till ny sida)
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop; 