import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Alert,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import { StandardLoading } from '../../components/common/StandardLoading';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Page } from '../../types/Page';
import pageServiceSupabase from '../../services/pageServiceSupabase';

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
      const publishedPages = await pageServiceSupabase.getPublishedPages();
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

  // Check if page is a maintenance plan (needs special treatment)
  const isMaintenancePlan = (page: Page) => {
    return page.title.toLowerCase().includes('skötselplan') || 
           page.title.toLowerCase().includes('underhåll');
  };

  // Funktion för att skapa en intelligent sammanfattning baserat på innehåll
  const getSummary = (page: Page, maxLength: number = 150) => {
    const { title, content } = page;
    
    // Special handling för Skötselplan - skapa smart sammanfattning med metrics
    if (title.toLowerCase().includes('skötselplan') || title.toLowerCase().includes('underhåll')) {
      // Count sections and tasks from content
      const sections = (content.match(/###\s+[^#\n]+/g) || []).length;
      const tasks = (content.match(/^-\s+/gm) || []).length;
      
      return `${sections} områden • ${tasks} uppgifter • Säsongsbaserade scheman för boende (B) och BRF. Nästa: Kontrollera hängrännor och fasadbelysning.`;
    }
    
    // Special handling för andra långa strukturerade dokument
    if (content.length > 1000 && content.includes('###')) {
      const sections = content.match(/###\s+([^\n]+)/g);
      if (sections && sections.length > 3) {
        const sectionNames = sections.slice(0, 3).map(s => s.replace(/###\s+/, ''));
        return `Omfattande guide som täcker: ${sectionNames.join(', ')} och mer.`;
      }
    }
    
    // Standard sammanfattning för kortare innehåll
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
        <Box sx={{ my: 4 }}>
          <StandardLoading message="Loading pages..." />
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
            <Grid item xs={12} md={6} key={page.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => theme.shadows[8],
                  }
                }}
                onClick={() => handleViewPage(page.slug)}
              >
                <CardContent sx={{ 
                  flexGrow: 1, 
                  pb: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '200px',
                  maxHeight: '280px'
                }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {page.title}
                  </Typography>
                  
                  {/* Special chips for maintenance plan */}
                  {isMaintenancePlan(page) && (
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip label="Utomhus" size="small" color="success" variant="outlined" />
                      <Chip label="Inomhus" size="small" color="info" variant="outlined" />
                      <Chip label="Säsong" size="small" color="warning" variant="outlined" />
                    </Stack>
                  )}
                  
                  <Divider sx={{ mb: 2 }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      flexGrow: 1,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: isMaintenancePlan(page) ? 3 : 4,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.5
                    }}
                  >
                    {getSummary(page)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default PublicPagesList; 