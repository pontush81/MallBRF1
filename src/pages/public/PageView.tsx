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

  Dialog,
  DialogContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ReactMarkdown from 'react-markdown';
// Removed remarkGfm to reduce bundle size
import pageServiceSupabase from '../../services/pageServiceSupabase';
import { Page, FileInfo } from '../../types/Page';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';

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
  // Test-loggning
  console.log('=====================================');
  console.log('PageView COMPONENT IS RENDERING');
  console.log('=====================================');

  const { id } = useParams<{ id: string }>();
  console.log('Page ID:', id);
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<FileInfo | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!id) {
        setError('Sidan kunde inte hittas');
        return;
      }

      try {
        setLoading(true);
        const fetchedPage = await pageServiceSupabase.getPageById(id);
        
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

  useEffect(() => {
    console.log('Page data:', page);
    if (page?.files) {
      console.log('Files:', page.files);
    }
  }, [page]);

  useEffect(() => {
    console.log('PageView rendered');
    console.log('Current page data:', page);
  }, [page]);

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

  // Uppdatera getFileUrl funktionen
  const getFileUrl = (file: FileInfo) => {
    console.log('Getting URL for file:', file);
    // Använd den medföljande URL:en om den finns
    if (file.url) {
      console.log('Using provided URL:', file.url);
      return file.url;
    }
    // Fallback till konstruerad URL
    const constructedUrl = `https://qhdgqevdmvkrwnzpwikz.supabase.co/storage/v1/object/public/files/pages/${file.filename}`;
    console.log('Using constructed URL:', constructedUrl);
    return constructedUrl;
  };

  // Uppdatera filhanteringen
  const handleFileOpen = (file: FileInfo) => {
    console.log('=====================================');
    console.log('handleFileOpen called with file:', file);
    console.log('File type:', file.mimetype);
    console.log('File URL:', file.url);
    console.log('=====================================');
    
    const url = getFileUrl(file);
    console.log('Final URL to be used:', url);
    
    if (file.mimetype.startsWith('image/')) {
      console.log('Attempting to open image in dialog');
      setSelectedImage(file);
    } else {
      console.log('Attempting to download file');
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Hantera stängning av bildvisaren
  const handleCloseImage = () => {
    setSelectedImage(null);
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

  const { images, documents } = categorizeFiles(page.files);
  const hasAttachments = (images.length > 0 || documents.length > 0);

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
              // Removed remarkGfm for smaller bundle
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
          
          {hasAttachments && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              
              {images.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    Bilder
                  </Typography>
                  <Grid container spacing={2}>
                    {images.map((file) => (
                      <Grid item xs={12} sm={6} md={4} key={file.id}>
                        <Card>
                          <Box 
                            sx={{ 
                              position: 'relative',
                              cursor: 'pointer',
                              '&:hover .zoom-overlay': {
                                opacity: 1,
                              },
                            }}
                            onClick={() => handleFileOpen(file)}
                          >
                            <CardMedia
                              component="img"
                              height="180"
                              src={getFileUrl(file)}
                              alt={file.originalName || 'Bild'}
                              sx={{ objectFit: 'cover' }}
                              onError={(e) => {
                                console.error('Failed to load image:', getFileUrl(file));
                                const imgElement = e.target as HTMLImageElement;
                                imgElement.style.display = 'none';
                                // Visa felmeddelande
                                const parent = imgElement.parentElement;
                                if (parent) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.style.height = '180px';
                                  errorDiv.style.display = 'flex';
                                  errorDiv.style.alignItems = 'center';
                                  errorDiv.style.justifyContent = 'center';
                                  errorDiv.style.backgroundColor = '#f5f5f5';
                                  errorDiv.textContent = 'Kunde inte ladda bilden';
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                            <Box
                              className="zoom-overlay"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(0,0,0,0.5)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                              }}
                            >
                              <ZoomInIcon sx={{ color: 'white', fontSize: 40 }} />
                            </Box>
                          </Box>
                          <CardContent>
                            <Typography variant="body2" noWrap>
                              {file.originalName || file.filename}
                            </Typography>
                            <Button 
                              fullWidth 
                              variant="contained"
                              onClick={() => handleFileOpen(file)}
                              startIcon={<ZoomInIcon />}
                              sx={{ mt: 1 }}
                            >
                              Visa bild
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {documents.length > 0 && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Dokument
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 0 }}>
                    {documents.map((file, index) => (
                      <React.Fragment key={file.id}>
                        {index > 0 && <Divider />}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 2,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}>
                          <Box sx={{ pr: 2 }}>
                            {getFileIcon(file.mimetype)}
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
                            variant="contained"
                            color="primary"
                            onClick={() => handleFileOpen(file)}
                            startIcon={getFileIcon(file.mimetype)}
                          >
                            {file.mimetype === 'application/pdf' ? 'Ladda ner PDF' : 'Ladda ner'}
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
      </Box>

      {/* Lägg till bildvisaren */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseImage}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={handleCloseImage}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.originalName || 'Bild'}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PageView; 