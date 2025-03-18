import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Divider, 
  Chip, 
  Skeleton, 
  Alert,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import pageService from '../../services/pageService';
import { Page } from '../../types/Page';

// Komponentstilar för Markdown-innehåll
const markdownStyles = {
  h1: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    marginTop: '1.5rem'
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.8rem',
    marginTop: '1.2rem'
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '0.6rem',
    marginTop: '1rem'
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '0.4rem',
    marginTop: '0.8rem'
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
    color: 'primary.main',
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
    borderColor: 'divider',
    paddingLeft: '1rem',
    fontStyle: 'italic',
    marginBottom: '1rem'
  },
  pre: {
    backgroundColor: 'grey.100',
    padding: '0.5rem',
    borderRadius: '4px',
    overflow: 'auto',
    marginBottom: '1rem'
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: 'grey.100',
    padding: '0.1rem 0.2rem',
    borderRadius: '3px',
    fontSize: '0.9em'
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: '1rem'
  },
  th: {
    border: '1px solid',
    borderColor: 'divider',
    padding: '0.5rem',
    backgroundColor: 'grey.100',
    fontWeight: 'bold'
  },
  td: {
    border: '1px solid',
    borderColor: 'divider',
    padding: '0.5rem'
  }
};

const PageView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!id) {
        setError('Sidan kunde inte hittas');
        return;
      }

      try {
        setLoading(true);
        const fetchedPage = await pageService.getPageById(id);
        
        if (!fetchedPage) {
          setError('Sidan kunde inte hittas');
          return;
        }
        
        if (!fetchedPage.isPublished) {
          setError('Denna sida är inte publicerad');
          return;
        }
        
        setPage(fetchedPage);
        setError(null);
      } catch (err) {
        console.error('Kunde inte hämta sidan:', err);
        setError('Kunde inte ladda sidan. Försök igen senare.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [id]);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Skeleton variant="text" width="60%" height={40} />
          </Box>
          <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
          <Divider sx={{ mb: 4 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleGoBack}
            sx={{ mb: 3 }}
          >
            Tillbaka
          </Button>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/pages')}
          >
            Se alla sidor
          </Button>
        </Box>
      </Container>
    );
  }

  if (!page) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleGoBack}
            sx={{ mb: 3 }}
          >
            Tillbaka
          </Button>
          <Alert severity="info" sx={{ mb: 3 }}>
            Sidan kunde inte hittas
          </Alert>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/pages')}
          >
            Se alla sidor
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {page.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(page.updatedAt || page.createdAt)}
          </Typography>
          
          {page.slug && (
            <Chip 
              label={page.slug}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Paper sx={{ 
          p: { xs: 2, md: 4 }, 
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ 
            ...markdownStyles,
            typography: 'body1'
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => <Typography variant="h1" gutterBottom {...props} />,
                h2: ({ node, ...props }) => <Typography variant="h2" gutterBottom {...props} />,
                h3: ({ node, ...props }) => <Typography variant="h3" gutterBottom {...props} />,
                h4: ({ node, ...props }) => <Typography variant="h4" gutterBottom {...props} />
              }}
            >
              {page.content}
            </ReactMarkdown>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PageView; 