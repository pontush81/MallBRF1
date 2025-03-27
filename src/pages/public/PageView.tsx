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
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import pageService from '../../services/pageService';
import { Page, FileInfo } from '../../types/Page';

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

  // Få rätt ikon baserat på filtyp
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <ImageIcon />;
    } else if (mimetype === 'application/pdf') {
      return <PictureAsPdfIcon />;
    } else {
      return <AttachFileIcon />;
    }
  };

  // Kategorisera filer
  const categorizeFiles = (files?: FileInfo[]) => {
    if (!files || files.length === 0) return { images: [], documents: [] };
    
    return {
      images: files.filter(file => file.mimetype && file.mimetype.startsWith('image/')),
      documents: files.filter(file => file.mimetype && !file.mimetype.startsWith('image/'))
    };
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
          <Alert severity="warning" sx={{ mb: 3 }}>
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

  // Visa bokningsknapp för sidor med slug 'gastlagenhet'
  const showBookingButton = page.slug === 'gastlagenhet';

  // Hantera kategoriserade filer
  const { images, documents } = categorizeFiles(page.files);
  const hasAttachments = (images.length > 0 || documents.length > 0);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              {page.title}
            </Typography>
          </Box>
          
          {showBookingButton && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<CalendarTodayIcon />}
              onClick={() => navigate('/booking')}
            >
              Boka gästlägenhet
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate((page.updatedAt || page.createdAt || '') as string)}
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
                h1: ({ node, children, ref, ...props }) => <Typography variant="h1" component="h1" gutterBottom {...props}>{children}</Typography>,
                h2: ({ node, children, ref, ...props }) => <Typography variant="h2" component="h2" gutterBottom {...props}>{children}</Typography>,
                h3: ({ node, children, ref, ...props }) => <Typography variant="h3" component="h3" gutterBottom {...props}>{children}</Typography>,
                h4: ({ node, children, ref, ...props }) => <Typography variant="h4" component="h4" gutterBottom {...props}>{children}</Typography>
              }}
            >
              {page.content}
            </ReactMarkdown>
          </Box>

          {showBookingButton && (
            <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                startIcon={<CalendarTodayIcon />}
                onClick={() => navigate('/booking')}
              >
                Boka gästlägenhet nu
              </Button>
            </Box>
          )}

          {hasAttachments && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              
              {/* Rest of attachment code remains the same */}
              {images.length > 0 && (
                <>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                    Bilder
                  </Typography>
                  <Grid container spacing={2}>
                    {images.map((file: FileInfo, index: number) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="200"
                            image={file.url}
                            alt={file.name}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                            <Typography variant="body2" noWrap>
                              {file.name}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button size="small" href={file.url} target="_blank">
                              Visa i full storlek
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              {documents.length > 0 && (
                <>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                    Dokument
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    {documents.map((file: FileInfo, index: number) => (
                      <Button
                        key={index}
                        variant="outlined"
                        startIcon={getFileIcon(file.mimetype || '')}
                        href={file.url}
                        target="_blank"
                        sx={{ m: 0.5 }}
                      >
                        {file.name}
                      </Button>
                    ))}
                  </Paper>
                </>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default PageView; 