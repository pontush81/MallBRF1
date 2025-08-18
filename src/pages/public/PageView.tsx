import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Divider, 
 
  Skeleton, 
  Alert,
  IconButton,
  Grid,
  Card,

  CardContent,

  Dialog,
  DialogContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // Not currently used
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ReactMarkdown from 'react-markdown';
// Removed remarkGfm to reduce bundle size
import pageServiceSupabase from '../../services/pageServiceSupabase';
import { Page, FileInfo } from '../../types/Page';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
// import { OptimizedImage } from '../../components/common/OptimizedImage';

// Förbättrade komponentstilar för Markdown-innehåll med bättre läsbarhet
const markdownStyles = {
  h1: {
    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
    fontWeight: 700,
    marginBottom: '1.5rem',
    marginTop: '2rem',
    color: 'text.primary',
    lineHeight: 1.2,
    '&:first-child': { marginTop: 0 }
  },
  h2: {
    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
    fontWeight: 600,
    marginBottom: '1.25rem',
    marginTop: '2rem',
    color: 'text.primary',
    lineHeight: 1.3,
    '&:first-child': { marginTop: 0 }
  },
  h3: {
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
    fontWeight: 600,
    marginBottom: '1rem',
    marginTop: '1.5rem',
    color: 'text.primary',
    lineHeight: 1.3
  },
  h4: {
    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
    fontWeight: 600,
    marginBottom: '0.75rem',
    marginTop: '1.25rem',
    color: 'text.primary',
    lineHeight: 1.4
  },
  p: {
    marginBottom: '2rem', // Ökat från 1.25rem för bättre luftighet
    marginTop: '0.5rem',  // Lägg till marginTop för ännu bättre separation
    lineHeight: 1.8,      // Ökat från 1.7 för bättre läsbarhet
    fontSize: { xs: '1rem', md: '1.1rem' },
    color: 'text.primary',
    '&:last-child': { marginBottom: 0 },
    '&:first-child': { marginTop: 0 }
  },
  ul: {
    marginBottom: '1.5rem',
    paddingLeft: { xs: '1.25rem', md: '2rem' },
    '& li': {
      marginBottom: '0.75rem',
      lineHeight: 1.6,
      fontSize: { xs: '1rem', md: '1.1rem' },
      color: 'text.primary'
    }
  },
  ol: {
    marginBottom: '1.5rem',
    paddingLeft: { xs: '1.25rem', md: '2rem' },
    '& li': {
      marginBottom: '0.75rem',
      lineHeight: 1.6,
      fontSize: { xs: '1rem', md: '1.1rem' },
      color: 'text.primary'
    }
  },
  li: {
    marginBottom: '0.75rem',
    lineHeight: 1.6,
    fontSize: { xs: '1rem', md: '1.1rem' },
    color: 'text.primary'
  },
  a: {
    color: 'primary.main',
    textDecoration: 'none',
    fontWeight: 500,
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark'
    }
  },
  strong: {
    fontWeight: 700,
    color: 'text.primary'
  },
  em: {
    fontStyle: 'italic',
    color: 'text.primary'
  },
  img: {
    maxWidth: '100%',
    height: 'auto',
    marginBottom: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  blockquote: {
    borderLeft: '4px solid',
    borderColor: 'primary.main',
    paddingLeft: '1.5rem',
    paddingY: '0.5rem',
    fontStyle: 'italic',
    marginBottom: '1.5rem',
    backgroundColor: 'grey.50',
    marginLeft: 0,
    marginRight: 0,
    fontSize: { xs: '1rem', md: '1.1rem' },
    color: 'text.secondary'
  },
  pre: {
    backgroundColor: 'grey.100',
    padding: '1rem',
    borderRadius: '8px',
    overflow: 'auto',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    border: '1px solid',
    borderColor: 'grey.300'
  },
  code: {
    fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
    backgroundColor: 'grey.100',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.875em',
    color: 'text.primary',
    border: '1px solid',
    borderColor: 'grey.300'
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    marginBottom: '1.5rem',
    border: '1px solid',
    borderColor: 'grey.300',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  th: {
    border: '1px solid',
    borderColor: 'grey.300',
    padding: '0.75rem',
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    fontWeight: 600,
    textAlign: 'left'
  },
  td: {
    border: '1px solid',
    borderColor: 'grey.300',
    padding: '0.75rem',
    color: 'text.primary'
  },
  hr: {
    border: 'none',
    borderTop: '2px solid',
    borderColor: 'grey.300',
    margin: '2rem 0'
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  if (loading && !page) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4, pb: 6 }}> {/* Extra bottom padding för bättre avstånd till footer */}
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
        <Box sx={{ my: 4, pb: 6 }}> {/* Extra bottom padding för bättre avstånd till footer */}
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
        <Box sx={{ my: 4, pb: 6 }}> {/* Extra bottom padding för bättre avstånd till footer */}
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
      <Box sx={{ my: 4, pb: 6 }}> {/* Lägg till extra bottom padding för bättre avstånd till footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {page.title}
          </Typography>
        </Box>



        <Divider sx={{ mb: 4 }} />

        <Paper sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Box sx={{ 
            '& h1': markdownStyles.h1,
            '& h2': markdownStyles.h2,
            '& h3': markdownStyles.h3,
            '& h4': markdownStyles.h4,
            '& p': markdownStyles.p,
            '& ul': markdownStyles.ul,
            '& ol': markdownStyles.ol,
            '& li': markdownStyles.li,
            '& a': markdownStyles.a,
            '& strong': markdownStyles.strong,
            '& em': markdownStyles.em,
            '& img': markdownStyles.img,
            '& blockquote': markdownStyles.blockquote,
            '& pre': markdownStyles.pre,
            '& code': markdownStyles.code,
            '& table': markdownStyles.table,
            '& th': markdownStyles.th,
            '& td': markdownStyles.td,
            '& hr': markdownStyles.hr,
            maxWidth: '100%',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}>
            <ReactMarkdown
              // Removed remarkGfm for smaller bundle
              components={{
                h1: ({ node, children, ref, ...props }) => (
                  <Typography 
                    variant="h1" 
                    component="h1" 
                    sx={markdownStyles.h1}
                    {...props}
                  >
                    {children}
                  </Typography>
                ),
                h2: ({ node, children, ref, ...props }) => (
                  <Typography 
                    variant="h2" 
                    component="h2" 
                    sx={markdownStyles.h2}
                    {...props}
                  >
                    {children}
                  </Typography>
                ),
                h3: ({ node, children, ref, ...props }) => (
                  <Typography 
                    variant="h3" 
                    component="h3" 
                    sx={markdownStyles.h3}
                    {...props}
                  >
                    {children}
                  </Typography>
                ),
                h4: ({ node, children, ref, ...props }) => (
                  <Typography 
                    variant="h4" 
                    component="h4" 
                    sx={markdownStyles.h4}
                    {...props}
                  >
                    {children}
                  </Typography>
                ),
                p: ({ node, children, ref, ...props }) => (
                  <Typography 
                    component="p" 
                    sx={markdownStyles.p}
                    {...props}
                  >
                    {children}
                  </Typography>
                ),
                strong: ({ node, children, ref, ...props }) => (
                  <Box 
                    component="strong" 
                    sx={markdownStyles.strong}
                    {...props}
                  >
                    {children}
                  </Box>
                ),
                em: ({ node, children, ref, ...props }) => (
                  <Box 
                    component="em" 
                    sx={markdownStyles.em}
                    {...props}
                  >
                    {children}
                  </Box>
                )
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
                            <img
                              src={getFileUrl(file)}
                              alt={file.originalName || 'Bild'}
                              height={180}
                              style={{
                                objectFit: 'cover',
                                width: '100%',
                                borderRadius: '8px',
                                maxWidth: '100%',
                                height: 'auto'
                              }}
                              loading="lazy"
                              decoding="async"
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
                objectFit: 'contain',
                maxHeight: '80vh'
              }}
              loading="eager"
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PageView; 