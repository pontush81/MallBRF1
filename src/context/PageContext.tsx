import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Page } from '../types/Page';
import pageService from '../services/pageService';

interface PageContextType {
  pages: Page[];
  loading: boolean;
  error: string | null;
  loadAllPages: () => Promise<void>;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Hjälper till att förhindra dubbla anrop
  
  // Load all pages on init - kör bara en gång
  useEffect(() => {
    // Ladda alla sidor direkt vid första renderingen
    loadAllPages();
    
    // Denna useEffect ska bara köras en gång
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Simplified to just load all pages at once, with protection against repeated calls
  const loadAllPages = async () => {
    // Om laddning redan pågår, avbryt
    if (loadingRef.current) return;
    
    // Om sidor redan är laddade, avbryt
    if (pages.length > 0 && !loading) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      const allPages = await pageService.getVisiblePages();
      setPages(allPages);
    } catch (err) {
      console.error('Error loading pages:', err);
      setError('Ett fel uppstod vid laddning av sidorna');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };
  
  // Memoize context value to prevent unnecessary renders
  const contextValue = React.useMemo(() => ({
    pages,
    loading,
    error,
    loadAllPages
  }), [pages, loading, error]);
  
  return (
    <PageContext.Provider value={contextValue}>
      {children}
    </PageContext.Provider>
  );
};

export const usePages = () => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePages must be used within a PageProvider');
  }
  return context;
};
