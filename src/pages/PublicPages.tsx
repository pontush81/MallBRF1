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
  Button,
  AppBar,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { 
  Image as ImageIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import pageService, { FALLBACK_PAGES } from '../services/pageService';
import { Page } from '../types/Page';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Element, scroller } from 'react-scroll';

const STICKY_NAV_HEIGHT = 64; // Höjd på sticky navbar i pixlar

const PublicPages: React.FC = (): JSX.Element => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const BATCH_SIZE = 3; // Number of pages to load initially
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [stickyNav, setStickyNav] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, logout } = useAuth();
  
  // Refs för varje sida för att kunna scrolla till dem
  const pageRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const headerRef = useRef<HTMLDivElement | null>(null);

  // Debounce function for smoother scroll handling
  const debounce = (fn: Function, ms = 100) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  useEffect(() => {
    loadInitialPages();
  }, []);

  const loadInitialPages = async () => {
    try {
      const allPages = await pageService.getVisiblePages();
      // Initially show only the first batch
      setPages(allPages.slice(0, BATCH_SIZE));
      setHasMore(allPages.length > BATCH_SIZE);
      setInitialLoadComplete(true);
    } catch (err) {
      setError('Ett fel uppstod vid laddning av sidorna');
      setPages(FALLBACK_PAGES.slice(0, BATCH_SIZE));
    } finally {
      setLoading(false);
    }
  };

  const loadMorePages = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const allPages = await pageService.getVisiblePages();
      const currentCount = pages.length;
      const nextBatch = allPages.slice(currentCount, currentCount + BATCH_SIZE);
      
      if (nextBatch.length > 0) {
        setPages(prev => [...prev, ...nextBatch]);
        setHasMore(currentCount + nextBatch.length < allPages.length);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more pages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Add intersection observer for infinite scroll
  useEffect(() => {
    if (!initialLoadComplete || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePages();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('load-more-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [initialLoadComplete, loadingMore, hasMore]);

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
          const element = document.getElementById(page.id) || document.querySelector(`[name="${page.id}"]`);
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
      
      // Alltid visa sticky navigation efter liten scroll för att menyn ska vara tillgänglig
      setStickyNav(scrollPosition > 50);
      
      // Update the active section (debounced)
      debouncedUpdateActiveSection(scrollPosition);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pages, selectedPageIndex]);

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
      
      // Använd react-scroll med fördröjning
      setTimeout(() => {
        scroller.scrollTo(id, {
          duration: 500,
          delay: 0,
          smooth: 'easeInOutQuart',
          offset: -70,
        });
      }, 300);
    }
    
    // Clean up
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, [pages]);

  // Funktionen för att scrolla till en sida med react-scroll
  const scrollToPage = (pageId: string, index: number) => {
    setSelectedPageIndex(index);
    
    // Uppdatera URL för konsekvent länkhantering
    window.history.pushState(null, '', `#${pageId}`);
    
    // Använd react-scroll för en smidigare upplevelse
    setTimeout(() => {
      scroller.scrollTo(pageId, {
        duration: 500,
        delay: 0,
        smooth: 'easeInOutQuart',
        offset: -70,
      });
    }, 50);
    
    // Stäng drawer om det är öppet
    if (drawerOpen) {
      setDrawerOpen(false);
    }
  };

  // Scrolla till toppen av sidan
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Funktion för att öppna hamburgermenyn
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Logga ut funktion
  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/login');
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
              justifyContent: 'space-between',
              height: '100%',
              p: 1,
              width: '100%'
            }}>
              {/* Hamburger-meny ikon till vänster för konsekvent upplevelse */}
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                aria-label="öppna meny"
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Container>
        </AppBar>
      )}
      
      {/* Drawer för hamburgermenyn */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
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
        {/* Drawer-innehåll */}
        <Box 
          sx={{ 
            width: '100vw',
            height: '100vh',
            backgroundColor: theme.palette.background.paper,
            pt: 8, // Utrymme för logotypen
            pb: 4,
            display: 'flex',
            flexDirection: 'column'
          }}
          role="navigation"
        >
          {/* Stängknapp i övre högra hörnet */}
          <IconButton
            onClick={handleDrawerToggle}
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
          
          {/* Lista över sidor */}
          <List sx={{ 
            width: '100%',
            maxWidth: '100%',
            py: 2,
            px: 4
          }}>
            {pages.map((page, idx) => (
              <ListItem
                key={page.id}
                component="div"
                onClick={() => {
                  scrollToPage(page.id, idx);
                  setDrawerOpen(false);
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
            
            {/* Admin-länk endast för administratörer */}
            {isAdmin && (
              <ListItem 
                component="div"
                onClick={() => {
                  setDrawerOpen(false);
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
            
            {/* Logga ut-knapp om inloggad */}
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
            
            {/* Logga in-knapp om inte inloggad */}
            {!isLoggedIn && (
              <ListItem 
                component="div"
                onClick={() => {
                  setDrawerOpen(false);
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
      </Drawer>
      
      {/* Huvudinnehåll */}
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box ref={headerRef}>
            <Box sx={{ mb: 4 }}>
              {/* Tar bort Innehåll-rubriken helt */}
            </Box>
          </Box>
          
          {/* Sidornas innehåll */}
          {pages.map((page, index) => (
            <Element 
              name={page.id}
              key={page.id}
              id={page.id}
              className="section-element"
            >
              <Paper 
                elevation={2} 
                sx={{ 
                  mb: 6, 
                  p: { xs: 2, md: 4 }, 
                  borderRadius: 2,
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

                    {/* Dokument (PDF) */}
                    {page.files.filter(file => file.mimetype && file.mimetype.includes('pdf')).length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" gutterBottom>
                          Dokument
                        </Typography>
                        <Grid container spacing={1}>
                          {page.files
                            .filter(file => file.mimetype && file.mimetype.includes('pdf'))
                            .map((file) => (
                              <Grid item xs={12} md={6} key={file.id || file.filename}>
                                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                                  <PictureAsPdfIcon color="error" sx={{ mr: 2 }} />
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" noWrap title={file.originalName}>
                                      {file.originalName}
                                    </Typography>
                                  </Box>
                                  <Button 
                                    size="small" 
                                    component="a"
                                    href={getFileUrl(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<FileDownloadIcon />}
                                  >
                                    Ladda ner
                                  </Button>
                                </Paper>
                              </Grid>
                            ))}
                        </Grid>
                      </Box>
                    )}

                    {/* Övriga filer */}
                    {page.files.filter(file => 
                      file.mimetype && 
                      !file.mimetype.startsWith('image/') && 
                      !file.mimetype.includes('pdf')
                    ).length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" gutterBottom>
                          Övriga filer
                        </Typography>
                        <Grid container spacing={1}>
                          {page.files
                            .filter(file => 
                              file.mimetype && 
                              !file.mimetype.startsWith('image/') && 
                              !file.mimetype.includes('pdf')
                            )
                            .map((file) => (
                              <Grid item xs={12} md={6} key={file.id || file.filename}>
                                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                                  <AttachFileIcon sx={{ mr: 2 }} />
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" noWrap title={file.originalName}>
                                      {file.originalName}
                                    </Typography>
                                  </Box>
                                  <Button 
                                    size="small" 
                                    component="a"
                                    href={getFileUrl(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<FileDownloadIcon />}
                                  >
                                    Ladda ner
                                  </Button>
                                </Paper>
                              </Grid>
                            ))}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </Element>
          ))}

          {/* Loading indicator for more content */}
          {hasMore && (
            <Box id="load-more-sentinel" sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              {loadingMore ? (
                <CircularProgress size={24} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Scrolla för att ladda mer innehåll
                </Typography>
              )}
            </Box>
          )}
        </Box>
        
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