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
import pageService from '../services/pageService';
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
import { usePages } from '../context/PageContext';

const STICKY_NAV_HEIGHT = 64; // Höjd på sticky navbar i pixlar

const PublicPages: React.FC = (): JSX.Element => {
  const { 
    pages, 
    loading, 
    error
  } = usePages();
  
  const [showScrollTop, setShowScrollTop] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin } = useAuth();
  const pageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Funktion för att navigera till en specifik sida med korrekt offset
  const navigateToPageId = useCallback((pageId: string) => {
    const element = pageRefs.current[pageId];
    if (element) {
      const yOffset = -80; // Mindre offset för att förhindra överscrollning
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);
  
  // Bara hantera scrollToTop-knappen
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Hantera initial hash i URL
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          // Scrolla till elementet men med bättre offset för att visa hela rubriken
          const yOffset = -80; // Mindre offset för att förhindra överscrollning
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 500); // Ge sidan tid att rendera
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scrolla till toppen av sidan
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Formatera datum
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
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      marginTop: '1rem',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      marginBottom: '0.8rem',
      marginTop: '1.2rem',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.6rem',
      marginTop: '1rem',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
    },
    p: {
      marginBottom: '1rem',
      lineHeight: 1.5,
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
      fontSize: '1rem'
    },
    ul: {
      marginBottom: '1rem',
      paddingLeft: '1.5rem',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
    },
    ol: {
      marginBottom: '1rem',
      paddingLeft: '1.5rem',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
    },
    li: {
      marginBottom: '0.5rem',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
      fontSize: '1rem'
    },
    a: {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
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
      marginBottom: '1rem',
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
    }
  };

  if (loading && pages.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && pages.length === 0) {
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
          <Alert severity="info">Inga sidor tillgängliga</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="md" sx={{ overflow: 'visible', height: 'auto' }}>
        <Box 
          sx={{
            overflow: 'visible',
            height: 'auto',
            marginTop: 4
          }}
        >
          {/* Visa laddningsindikator eller felmeddelande */}
          {loading && pages.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error && pages.length === 0 ? (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          ) : (
            <>
              {/* Mappa varje sida till ett eget kort */}
              {pages.map((page) => (
                <Paper 
                  key={page.id} 
                  id={page.id}
                  ref={(el) => (pageRefs.current[page.id] = el)}
                  elevation={2} 
                  sx={{ 
                    p: { xs: 3, md: 4 }, 
                    mb: 4,
                    borderRadius: 2
                  }}
                >
                  <Typography 
                    variant="h4" 
                    component="h2"
                    gutterBottom 
                    sx={{ 
                      mt: 0, 
                      fontWeight: 500,
                      fontSize: '1.8rem', 
                      pb: 1,
                      color: '#333333'
                    }}
                  >
                    {page.title}
                  </Typography>
                  
                  {/* Visa uppdateringsdatum */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Uppdaterad: {formatDate((page.updatedAt || page.createdAt || '') as string)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Box sx={{ typography: 'body1' }}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 {...props} style={markdownStyles.h1} />,
                        h2: ({node, ...props}) => <h2 {...props} style={markdownStyles.h2} />,
                        h3: ({node, ...props}) => <h3 {...props} style={markdownStyles.h3} />,
                        p: ({node, ...props}) => <p {...props} style={markdownStyles.p} />,
                        ul: ({node, ...props}) => <ul {...props} style={markdownStyles.ul} />,
                        ol: ({node, ...props}) => <ol {...props} style={markdownStyles.ol} />,
                        li: ({node, ...props}) => <li {...props} style={markdownStyles.li} />,
                        a: ({node, href, ...props}) => {
                          const isExternal = href?.startsWith('http') || href?.startsWith('https');
                          return isExternal ? 
                            <a {...props} href={href} style={markdownStyles.a} target="_blank" rel="noopener noreferrer" /> :
                            <a {...props} href={href} style={markdownStyles.a} />;
                        },
                        img: ({node, ...props}) => <img {...props} style={markdownStyles.img} alt="" />,
                        blockquote: ({node, ...props}) => <blockquote {...props} style={markdownStyles.blockquote} />,
                      }}
                    >
                      {page.content}
                    </ReactMarkdown>
                  </Box>
                </Paper>
              ))}
            </>
          )}
        </Box>
      </Container>
      
      {/* Scrolla till toppen-knapp */}
      {showScrollTop && (
        <Fab
          color="primary"
          size="small"
          aria-label="scroll to top"
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
    </>
  );
};

export default PublicPages; 