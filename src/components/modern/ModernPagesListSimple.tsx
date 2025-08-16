import React, { useState, useMemo } from 'react';
import { 
  Box,
  Container,
  TextField,
  InputAdornment,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import { 
  Search as SearchIcon
} from '@mui/icons-material';
import { Page } from '../../types/Page';

interface ModernPagesListSimpleProps {
  pages: Page[];
  onPageClick: (page: Page) => void;
  isLoading?: boolean;
}

const ModernPagesListSimple: React.FC<ModernPagesListSimpleProps> = ({ 
  pages, 
  onPageClick, 
  isLoading = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for search only
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced search function
  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return pages.filter(page => 
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower)
    );
  }, [pages, searchTerm]);

  // Function to format plain text to HTML
  const formatPlainTextToHTML = (text: string) => {
    return text
      // Convert ### headers to h3
      .replace(/###\s+(.+)/g, '<h3>$1</h3>')
      // Convert ** bold ** to <strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert * italic * to <em>
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Convert bullet points to ul/li
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Convert line breaks to paragraphs
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => {
        // Don't wrap if already wrapped in HTML tags
        if (paragraph.startsWith('<') && paragraph.endsWith('>')) {
          return paragraph;
        }
        return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
      })
      .join('')
      // Remove href attributes from any anchor tags to prevent navigation
      .replace(/href\s*=\s*["'][^"']*["']/gi, '');
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography variant="body1" color="text.secondary">
              Laddar sidor...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pb: 4 }}>
      <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
        
        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            placeholder="Sök information..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="medium"
            fullWidth
            sx={{ 
              maxWidth: '500px',
              mx: 'auto',
              display: 'block',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Results count */}
        {searchTerm && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredPages.length} {filteredPages.length === 1 ? 'resultat' : 'resultat'} för "{searchTerm}"
            </Typography>
          </Box>
        )}

        {/* Table of Contents */}
        {filteredPages.length > 3 && !searchTerm && (
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 3,
              backgroundColor: 'grey.50'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Innehåll
            </Typography>
            <List dense sx={{ py: 0 }}>
              {filteredPages.map((page) => (
                <ListItem 
                  key={page.id}
                  sx={{ 
                    py: 0.5, 
                    px: 0,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => {
                    const element = document.getElementById(`section-${page.id}`);
                    if (element) {
                      // Use modern CSS scroll-margin approach
                      element.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                      
                      console.log('Scrolled to section:', page.id, page.title);
                    } else {
                      console.error(`Element with id section-${page.id} not found`);
                    }
                  }}
                >
                  <ListItemText 
                    primary={page.title}
                    primaryTypographyProps={{
                      color: 'primary.main',
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Content Sections */}
        {filteredPages.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'Inga sidor hittades.' : 'Inga sidor tillgängliga.'}
            </Typography>
          </Box>
        ) : (
          <Box>
            {filteredPages.map((page, index) => (
              <Box key={page.id} sx={{ mb: 5 }}>
                {/* Section Header */}
                <Box 
                  id={`section-${page.id}`}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    cursor: 'pointer',

                    '&:hover .edit-hint': {
                      opacity: 1
                    }
                  }}
                  onClick={() => onPageClick(page)}
                >
                  <Typography 
                    variant="h4" 
                    component="h2"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      flex: 1,
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    {page.title}
                  </Typography>
                  <Typography 
                    className="edit-hint"
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      ml: 2,
                      fontSize: '0.75rem'
                    }}
                  >
                    Klicka för att redigera
                  </Typography>
                </Box>

                {/* Section Content */}
                <Box
                  dangerouslySetInnerHTML={{ __html: formatPlainTextToHTML(page.content) }}
                  sx={{
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      color: 'text.primary',
                      fontWeight: 600,
                      mb: 2,
                      mt: 3,
                      '&:first-of-type': { mt: 0 }
                    },
                    '& p': {
                      mb: 2,
                      lineHeight: 1.7,
                      color: 'text.secondary',
                      fontSize: '1rem'
                    },
                    '& ul, & ol': {
                      pl: 3,
                      mb: 2,
                      '& li': {
                        mb: 1,
                        color: 'text.secondary',
                        lineHeight: 1.6
                      }
                    },
                    '& strong': {
                      fontWeight: 600,
                      color: 'text.primary'
                    }
                  }}
                />

                {/* Divider between sections */}
                {index < filteredPages.length - 1 && (
                  <Divider sx={{ mt: 4, mb: 0 }} />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Back to top */}
        {filteredPages.length > 3 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography 
              variant="body2" 
              color="primary.main"
              sx={{ 
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              ↑ Tillbaka till toppen
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ModernPagesListSimple;
