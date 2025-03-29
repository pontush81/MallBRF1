import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Skeleton, 
  Alert,
  useTheme,
  Tabs,
  Tab,
  useMediaQuery,
  Fab,
  Menu,
  MenuItem,
  Button,
  AppBar,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
} from '@mui/material';
import { 
  Image as ImageIcon,
} from '@mui/icons-material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import pageService from '../services/pageService';
import { Page } from '../types/Page';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { API_BASE_URL } from '../config';

const STICKY_NAV_HEIGHT = 64; // Höjd på sticky navbar i pixlar

const PublicPages: React.FC = (): JSX.Element => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [stickyNav, setStickyNav] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Refs för varje sida för att kunna scrolla till dem
  const pageRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const headerRef = useRef<HTMLDivElement | null>(null);

  // Ref for tracking clicks outside the menu
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Debounce function for smoother scroll handling
  const debounce = (fn: Function, ms = 100) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        // Använd getVisiblePages för att endast hämta publicerade sidor markerade för visning
        const visiblePages = await pageService.getVisiblePages();
        setPages(visiblePages);
      } catch (err) {
        console.error('Kunde inte hämta sidor:', err);
        setError('Kunde inte ladda sidorna. Försök igen senare.');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  // Funktion för att formatera datum
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Markdown-stilar
  const markdownStyles = {
    h1: {
      fontSize: '2.2rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      marginTop: '1rem',
      color: theme.palette.primary.main
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      marginBottom: '0.8rem',
      marginTop: '1.2rem'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.6rem',
      marginTop: '1rem'
    },
    p: {
      marginBottom: '1rem',
      lineHeight: 1.6
    },
    ul: {
      marginBottom: '1rem',
      paddingLeft: '1.5rem'
    },
    ol: {
      marginBottom: '1rem',
      paddingLeft: '1.5rem'
    },
    li: {
      marginBottom: '0.5rem'
    },
    a: {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline'
      }
    },
    img: {
      maxWidth: '100%',
      height: 'auto',
      marginBottom: '1rem'
    },
    blockquote: {
      borderLeft: '4px solid',
      borderColor: theme.palette.divider,
      paddingLeft: '1rem',
      fontStyle: 'italic',
      marginBottom: '1rem'
    }
  };

  // Scrollposition-hantering with debounce for active section updates
  useEffect(() => {
    const updateActiveSection = (scrollPosition: number) => {
      if (pages.length > 0) {
        // Get all page sections and their positions
        const pageSections = pages.map(page => {
          const element = pageRefs.current[page.id];
          if (!element) return { id: page.id, top: 0, bottom: 0 };
          
          const rect = element.getBoundingClientRect();
          const scrollOffset = window.pageYOffset || document.documentElement.scrollTop;
          
          return {
            id: page.id,
            top: rect.top + scrollOffset,
            bottom: rect.bottom + scrollOffset
          };
        });
        
        // Calculate threshold based on viewport height (show as active when section is 1/4 into view)
        const viewportHeight = window.innerHeight;
        const threshold = viewportHeight * 0.25;
        const checkPosition = scrollPosition + threshold;
        
        // Find the current active section
        let activeIndex = 0;
        for (let i = 0; i < pageSections.length; i++) {
          const section = pageSections[i];
          const nextSection = i < pageSections.length - 1 ? pageSections[i + 1] : null;
          
          if (
            (checkPosition >= section.top && !nextSection) || 
            (checkPosition >= section.top && checkPosition < nextSection?.top)
          ) {
            activeIndex = i;
            break;
          }
        }
        
        // Only update if the index changed to avoid unnecessary re-renders
        if (selectedPageIndex !== activeIndex) {
          setSelectedPageIndex(activeIndex);
        }
      }
    };

    // Debounced version for better performance
    const debouncedUpdateActiveSection = debounce(updateActiveSection, 100);

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowScrollTop(scrollPosition > 300);
      
      // Kontrollera om vi bör visa sticky navigation
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom;
        setStickyNav(headerBottom < 0);
      }
      
      // Update the active section (debounced)
      debouncedUpdateActiveSection(scrollPosition);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pages, selectedPageIndex]);

  // Handling clicks outside the menu to close it
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && menuAnchorEl) {
        setMenuAnchorEl(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuAnchorEl]);

  // Effect to set up scroll margins and behaviors for better navigation
  useEffect(() => {
    // Add scroll-margin-top to all sections
    document.querySelectorAll('[id]').forEach(element => {
      if (element.id) {
        (element as HTMLElement).style.scrollMarginTop = '120px';
      }
    });
    
    // Apply smooth scroll behavior to entire document
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Handle initial hash navigation if present
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      
      // Short delay to ensure rendering is complete
      setTimeout(() => {
        try {
          // First scroll to the element
          const element = document.getElementById(id);
          if (element) {
            // Scroll to element with offset
            const rect = element.getBoundingClientRect();
            const scrollOffset = window.pageYOffset || document.documentElement.scrollTop;
            window.scrollTo({
              top: rect.top + scrollOffset - 120,
              behavior: 'smooth'
            });
          }
        } catch (err) {
          console.error('Error scrolling to hash element:', err);
        }
      }, 300);
    }
    
    // Clean up
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, [pages]);

  // Navigera till en specifik sida
  const scrollToPage = (pageId: string, index: number) => {
    // We can reuse the handler we created for menu items
    handleMenuItemClick(pageId, index);
  };

  // Scrolla till toppen av sidan
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler för att navigera till en sida via menyn
  const handleMenuItemClick = (pageId: string, index: number) => {
    // Close the menu first
    handleMenuClose();
    
    // Update selected index
    setSelectedPageIndex(index);
    
    // Get the element
    const element = document.getElementById(pageId);
    if (element) {
      // Manually handle the scrolling with offset
      setTimeout(() => {
        element.scrollIntoView();
        window.scrollBy(0, -120);
      }, 10);
      
      // Update URL without causing a jump
      window.history.pushState(null, '', `#${pageId}`);
    }
  };

  // Update refs with IDs for hash navigation
  const setPageRef = (pageId: string) => (el: HTMLDivElement | null) => {
    if (el !== pageRefs.current[pageId]) {
      pageRefs.current[pageId] = el;
      
      // Set id for hash navigation
      if (el) {
        el.id = pageId;
      }
    }
  };

  // Helper to ensure proper menu opening
  const handleMenuButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setMenuAnchorEl(event.currentTarget);
  };

  // Simple handler to close the menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Komponent för navigationsflikar
  const NavigationTabs = ({ compact = false }: { compact?: boolean }) => {
    // Direct handler for tab clicks
    const onTabClick = (pageId: string, index: number) => {
      // Update selected index
      setSelectedPageIndex(index);
      
      // Use a short timeout to scroll after state update
      setTimeout(() => {
        const element = pageRefs.current[pageId];
        if (element) {
          // Get element position
          const rect = element.getBoundingClientRect();
          const scrollOffset = window.pageYOffset || document.documentElement.scrollTop;
          
          // Scroll with a fixed offset
          window.scrollTo({
            top: rect.top + scrollOffset - 120,
            behavior: 'smooth'
          });
        }
      }, 10);
    };
    
    return (
      <Tabs 
        value={selectedPageIndex}
        onChange={(_, newValue) => setSelectedPageIndex(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ 
          minHeight: compact ? '48px' : '56px',
          '& .MuiTabs-indicator': {
            display: compact ? 'none' : 'block'
          }
        }}
      >
        {pages.map((page, index) => (
          <Tab 
            key={page.id}
            label={page.title}
            onClick={() => onTabClick(page.id, index)}
            sx={{ 
              textTransform: 'none', 
              fontWeight: selectedPageIndex === index ? 'bold' : 'normal',
              fontSize: compact ? '0.875rem' : '1rem',
              minHeight: compact ? '48px' : '56px',
              py: compact ? 1 : 2
            }}
          />
        ))}
      </Tabs>
    );
  };

  // Mobilmeny-komponent
  const MobileMenu = ({ compact = false }: { compact?: boolean }) => {
    const menuOpen = Boolean(menuAnchorEl);
    
    // Simple direct click handler for menu items
    const onItemClick = (page: Page, index: number) => {
      // Close the menu
      setMenuAnchorEl(null);
      
      // Update selected index
      setSelectedPageIndex(index);
      
      // Use standard browser hash navigation
      window.location.href = `#${page.id}`;
    };
    
    return (
      <div 
        style={{
          position: 'relative',
          marginBottom: compact ? 0 : '24px',
          width: '100%'
        }}
      >
        {/* Menu button */}
        <button
          style={{
            width: '100%',
            padding: compact ? '8px 16px' : '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: menuOpen ? '4px 4px 0 0' : '4px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: compact ? '14px' : '16px',
            minHeight: compact ? '36px' : '48px',
            textAlign: 'left'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchorEl(menuAnchorEl ? null : e.currentTarget);
          }}
        >
          <span style={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap', 
            flexGrow: 1,
            paddingRight: '8px'
          }}>
            {pages[selectedPageIndex]?.title || 'Välj sida'}
          </span>
          <span>
            {menuOpen ? '▲' : '▼'}
          </span>
        </button>
        
        {/* Menu items */}
        {menuOpen && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              maxHeight: '70vh',
              overflowY: 'auto',
              zIndex: 1100
            }}
          >
            {pages.map((page, index) => (
              <a 
                key={page.id}
                href={`#${page.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onItemClick(page, index);
                }}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: selectedPageIndex === index ? '#1976d2' : 'inherit',
                  fontWeight: selectedPageIndex === index ? 'bold' : 'normal',
                  textDecoration: 'none',
                  borderBottom: index < pages.length - 1 ? '1px solid #eee' : 'none',
                  backgroundColor: selectedPageIndex === index ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  position: 'relative',
                  paddingLeft: selectedPageIndex === index ? '20px' : '16px'
                }}
              >
                {selectedPageIndex === index && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: '#1976d2'
                  }} />
                )}
                {page.title}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to get file URL (either Supabase Storage URL or local path)
  const getFileUrl = (file: any): string => {
    // If the file has a url property, it's from Supabase Storage
    if (file.url && (file.url.startsWith('http://') || file.url.startsWith('https://'))) {
      return file.url;
    }
    
    // Otherwise use the path with BASE_URL for local files
    return `${API_BASE_URL}${file.path}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Divider sx={{ mb: 4 }} />
          
          {[1, 2].map((item) => (
            <Box key={item} sx={{ mb: 6 }}>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
              <Divider />
            </Box>
          ))}
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (pages.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="info">
            Det finns inga sidor att visa för tillfället.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <>
      {/* Sticky navigering som visas vid scrollning */}
      {stickyNav && (
        <AppBar 
          position="fixed" 
          color="default"
          elevation={4}
          sx={{ 
            top: 0, 
            zIndex: 1100, 
            height: STICKY_NAV_HEIGHT,
            backgroundColor: 'background.paper'
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              height: '100%',
              p: 1,
              width: '100%'
            }}>
              {isMobile ? <MobileMenu compact /> : <NavigationTabs compact />}
            </Box>
          </Container>
        </AppBar>
      )}
      
      {/* Huvudinnehåll */}
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box ref={headerRef}>
            <Box sx={{ mb: 4 }}>
              {isMobile ? <MobileMenu /> : <NavigationTabs />}
            </Box>
          </Box>
          
          {/* Sidornas innehåll */}
          {pages.map((page, index) => (
            <Paper 
              key={page.id}
              ref={setPageRef(page.id)}
              id={page.id}
              elevation={2} 
              sx={{ 
                mb: 6, 
                p: { xs: 2, md: 4 }, 
                borderRadius: 2,
                scrollMarginTop: '120px' // Add scroll margin for hash navigation
              }}
            >
              {/* Sidhuvud med titel och metadata */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h2" gutterBottom>
                  {page.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Uppdaterad: {formatDate((page.updatedAt || page.createdAt || '') as string)}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Sidans innehåll med markdown */}
              <Box sx={{ 
                ...markdownStyles,
                typography: 'body1' 
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {page.content}
                </ReactMarkdown>
              </Box>

              {/* Visa filer om de finns */}
              {page.files && page.files.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Divider sx={{ mb: 3 }} />
                  
                  {/* Visa bilder */}
                  {page.files.filter(file => file.mimetype && file.mimetype.startsWith('image/')).length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h5" gutterBottom>
                        Bilder
                      </Typography>
                      <Grid container spacing={2}>
                        {page.files
                          .filter(file => file.mimetype && file.mimetype.startsWith('image/'))
                          .map((file) => (
                            <Grid item xs={12} sm={6} md={4} key={file.id || file.filename}>
                              <Card>
                                <CardMedia
                                  component="img"
                                  height="180"
                                  image={getFileUrl(file)}
                                  alt={file.originalName}
                                  sx={{ objectFit: 'cover' }}
                                />
                                <CardContent sx={{ py: 1 }}>
                                  <Typography variant="body2" noWrap title={file.originalName}>
                                    {file.originalName}
                                  </Typography>
                                </CardContent>
                                <CardActions>
                                  <Button 
                                    size="small" 
                                    component="a"
                                    href={getFileUrl(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<ImageIcon />}
                                  >
                                    Öppna
                                  </Button>
                                </CardActions>
                              </Card>
                            </Grid>
                          ))}
                      </Grid>
                    </Box>
                  )}
                  
                  {/* Visa dokument */}
                  {page.files.filter(file => file.mimetype && !file.mimetype.startsWith('image/')).length > 0 && (
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        Dokument
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 0 }}>
                        {page.files
                          .filter(file => file.mimetype && !file.mimetype.startsWith('image/'))
                          .map((file, index, arr) => (
                            <React.Fragment key={file.id || file.filename}>
                              {index > 0 && <Divider />}
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                p: 2,
                                '&:hover': { bgcolor: 'action.hover' }
                              }}>
                                <Box sx={{ pr: 2 }}>
                                  {file.mimetype === 'application/pdf' ? (
                                    <PictureAsPdfIcon />
                                  ) : (
                                    <AttachFileIcon />
                                  )}
                                </Box>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="subtitle1" gutterBottom>
                                    {file.originalName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {file.originalName}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {file.originalName}
                                  </Typography>
                                </Box>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  component="a" 
                                  href={getFileUrl(file)}
                                  download={file.originalName}
                                  startIcon={<FileDownloadIcon />}
                                >
                                  Ladda ner
                                </Button>
                              </Box>
                            </React.Fragment>
                          ))}
                      </Paper>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          ))}
        </Box>
        
        {/* Scroll-till-toppen knapp */}
        {showScrollTop && (
          <Fab
            color="primary"
            size="small"
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        )}
      </Container>
    </>
  );
};

export default PublicPages; 