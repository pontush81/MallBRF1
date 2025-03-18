import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  CircularProgress, 
  Alert,
  Divider
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Page } from '../../types/Page';
import pageService from '../../services/pageService';

const PublicPagesList: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const publishedPages = await pageService.getPublishedPages();
      setPages(publishedPages);
      setError(null);
    } catch (err) {
      setError('Ett fel uppstod vid hämtning av sidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPage = (slug: string) => {
    navigate(`/page/${slug}`);
  };

  // Funktion för att skapa en kort sammanfattning av innehållet
  const getSummary = (content: string, maxLength: number = 150) => {
    // Ta bort markdown-formatering och begränsa längden
    const plainText = content
      .replace(/#+\s+/g, '') // Remove headings
      .replace(/\*\*|\*/g, '') // Remove bold and italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
      .replace(/\n/g, ' '); // Replace newlines with spaces
    
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    return plainText.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
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
          <Paper sx={{ p: 3 }}>
            <Typography>
              Inga publicerade sidor hittades.
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sidor
        </Typography>
        
        <Grid container spacing={3}>
          {pages.map(page => (
            <Grid item xs={12} md={6} lg={4} key={page.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {page.title}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {getSummary(page.content)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewPage(page.slug)}
                  >
                    Läs mer
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default PublicPagesList; 