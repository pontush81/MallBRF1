import React, { useState, useEffect, useRef } from 'react';
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
import { BASE_URL } from '../services/pageService';

const STICKY_NAV_HEIGHT = 64; // Höjd på sticky navbar i pixlar

const PublicPages: React.FC = () => {
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

  // Scrollposition-hantering
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowScrollTop(scrollPosition > 300);
      
      // Kontrollera om vi bör visa sticky navigation
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom;
        setStickyNav(headerBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigera till en specifik sida
  const scrollToPage = (pageId: string, index: number) => {
    const element = pageRefs.current[pageId];
    if (element) {
      const yOffset = stickyNav ? -STICKY_NAV_HEIGHT - 16 : -16;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setSelectedPageIndex(index);
    setMenuAnchorEl(null);
  };

  // Scrolla till toppen av sidan
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hantera klick på menyknappen (mobil)
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Callback-funktion för att sätta ref på varje sida
  const setPageRef = (pageId: string) => (el: HTMLDivElement | null) => {
    pageRefs.current[pageId] = el;
  };

  // Komponent för navigationsflikar
  const NavigationTabs = ({ compact = false }: { compact?: boolean }) => (
    <Tabs 
      value={selectedPageIndex}
      onChange={(_, newValue) => setSelectedPageIndex(newValue)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{ 
        borderBottom: compact ? 0 : 1, 
        borderColor: 'divider',
        '& .MuiTabs-flexContainer': {
          borderBottom: 'none'
        },
        minHeight: compact ? '48px' : '56px',
      }}
    >
      {pages.map((page, index) => (
        <Tab 
          key={page.id}
          label={page.title}
          onClick={() => scrollToPage(page.id, index)}
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

  // Mobilmeny-komponent
  const MobileMenu = ({ compact = false }: { compact?: boolean }) => (
    <Box sx={{ mb: compact ? 0 : 3 }}>
      <Button
        variant={compact ? "contained" : "outlined"}
        onClick={handleMenuClick}
        endIcon={menuAnchorEl ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        fullWidth
        size={compact ? "small" : "medium"}
        sx={{ 
          justifyContent: 'space-between', 
          py: compact ? 0.8 : 1,
          boxShadow: compact ? 2 : 0
        }}
      >
        {pages[selectedPageIndex]?.title || 'Välj sida'}
      </Button>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          style: {
            width: menuAnchorEl?.offsetWidth,
            maxHeight: '70vh'
          }
        }}
      >
        {pages.map((page, index) => (
          <MenuItem 
            key={page.id}
            onClick={() => scrollToPage(page.id, index)}
            selected={selectedPageIndex === index}
            sx={{ minHeight: '48px' }}
          >
            {page.title}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Sidor
          </Typography>
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
          <Typography variant="h4" component="h1" gutterBottom>
            Sidor
          </Typography>
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
              p: 1
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
            <Typography variant="h3" component="h1" gutterBottom color="primary">
              Sidor
            </Typography>
            
            {/* Standard navigationsmeny */}
            <Box sx={{ mb: 4 }}>
              {isMobile ? <MobileMenu /> : <NavigationTabs />}
            </Box>
            
            <Divider sx={{ mb: 4 }} />
          </Box>
          
          {/* Sidornas innehåll */}
          {pages.map((page, index) => (
            <Paper 
              key={page.id}
              ref={setPageRef(page.id)}
              elevation={2} 
              sx={{ 
                mb: 6, 
                p: { xs: 2, md: 4 }, 
                borderRadius: 2,
                scrollMarginTop: `${STICKY_NAV_HEIGHT + 16}px`
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => <Typography variant="h4" gutterBottom {...props} />,
                    h2: ({ node, ...props }) => <Typography variant="h5" gutterBottom {...props} />,
                    h3: ({ node, ...props }) => <Typography variant="h6" gutterBottom {...props} />
                  }}
                >
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
                            <Grid item xs={12} sm={6} md={4} key={file.id}>
                              <Card>
                                <CardMedia
                                  component="img"
                                  height="180"
                                  image={`${BASE_URL}${file.path}`}
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
                                    href={`${BASE_URL}${file.path}`}
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
                            <React.Fragment key={file.id}>
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
                                  <Typography variant="body1">
                                    {file.originalName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(file.size / 1024).toFixed(1)} KB • {file.mimetype}
                                  </Typography>
                                </Box>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  component="a" 
                                  href={`${BASE_URL}${file.path}`}
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