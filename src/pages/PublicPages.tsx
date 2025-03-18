import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Skeleton, 
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import pageService from '../services/pageService';
import { Page } from '../types/Page';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PublicPages: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

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
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Sidor
        </Typography>
        
        <Divider sx={{ mb: 6 }} />
        
        {pages.map((page) => (
          <Paper 
            key={page.id} 
            elevation={2} 
            sx={{ 
              mb: 6, 
              p: { xs: 2, md: 4 }, 
              borderRadius: 2
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
                  Uppdaterad: {formatDate(page.updatedAt || page.createdAt)}
                </Typography>
                
                {page.slug && (
                  <Chip
                    label={page.slug}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 2 }}
                  />
                )}
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
          </Paper>
        ))}
      </Box>
    </Container>
  );
};

export default PublicPages; 