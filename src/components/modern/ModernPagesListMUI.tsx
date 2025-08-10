import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box,
  Container,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Fade,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import { 
  Search as SearchIcon, 
  ViewModule as CardsIcon, 
  List as ListIcon
} from '@mui/icons-material';
import { Page } from '../../types/Page';

interface ModernPagesListMUIProps {
  pages: Page[];
  onPageClick: (page: Page) => void;
  isLoading?: boolean;
}

export const ModernPagesListMUI: React.FC<ModernPagesListMUIProps> = ({
  pages,
  onPageClick,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Tvinga kortvy på mobil
  useEffect(() => {
    if (isMobile) {
      setViewMode('cards');
    }
  }, [isMobile]);

  // Filter pages
  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    const searchLower = searchTerm.toLowerCase();
    return pages.filter((page) => 
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower)
    );
  }, [pages, searchTerm]);





  // Convert plain text to formatted HTML
  const formatPlainTextToHTML = (content: string): string => {
    if (!content) return '';

    let formatted = content;

    // Handle bold text patterns - be very selective
    formatted = formatted.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>'); // **text** only
    // Remove single * bold formatting to avoid conflicts with bullet points

    // Handle headers
    formatted = formatted.replace(/^####\s*(.+)$/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^###\s*(.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^##\s*(.+)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^#\s*(.+)$/gm, '<h1>$1</h1>');

    // Split into sections and process each
    const sections = formatted.split('\n\n');
    let result = '';

    for (let section of sections) {
      section = section.trim();
      if (!section) continue;

      const lines = section.split('\n');
      
      // Check if this section contains bullet points (starts with *)
      if (lines.some(line => line.trim().match(/^\*\s+/))) {
        // Process as a list
        const listItems = lines
          .filter(line => line.trim().match(/^\*\s+/))
          .map(line => {
            let text = line.replace(/^\*\s+/, '').trim();
            // Apply bold formatting to list items if they have **text**
            text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
            return `<li>${text}</li>`;
          });
        
        if (listItems.length > 0) {
          result += `<ul>${listItems.join('')}</ul>\n`;
        }
        
        // Handle non-list lines in the same section
        const nonListLines = lines.filter(line => !line.trim().match(/^\*\s+/));
        if (nonListLines.length > 0) {
          const paragraph = nonListLines.join(' ').trim();
          if (paragraph && !paragraph.match(/^<[h1-6]/)) {
            result += `<p>${paragraph}</p>\n`;
          } else if (paragraph) {
            result += `${paragraph}\n`;
          }
        }
      } else {
        // Process as regular text or header
        const text = lines.join(' ').trim();
        if (text.match(/^<h[1-6]/)) {
          result += `${text}\n`;
        } else {
          result += `<p>${text}</p>\n`;
        }
      }
    }

    return result.trim();
  };

  const handleCardToggle = (pageId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    // Store current scroll position
    const currentScrollY = window.scrollY;
    
    setExpandedCard(expandedCard === pageId ? null : pageId);
    
    // Restore scroll position after state update
    setTimeout(() => {
      window.scrollTo({
        top: currentScrollY,
        behavior: 'auto' // Instant, no smooth scrolling
      });
    }, 0);
  };

  // Professionell Page Card komponent
  const PageCard: React.FC<{ page: Page }> = ({ page }) => {
    const isExpanded = expandedCard === page.id;

    return (
      <Fade in timeout={300}>
        <Card
          onClick={(e) => handleCardToggle(page.id, e)}
          sx={{
            height: 'fit-content',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            '&:hover': {
              transform: isMobile ? 'none' : 'translateY(-4px)',
              boxShadow: theme.shadows[12],
            },
            boxShadow: isExpanded ? theme.shadows[12] : theme.shadows[3],
            borderRadius: 3,
            border: isExpanded ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
            overflow: 'visible', // Allow shadow to show
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography 
                variant="h5" 
                component="h3"
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  flex: 1,
                  lineHeight: 1.2,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {page.title}
              </Typography>
            </Box>

            {/* Content Preview - Show first 150 characters when collapsed */}
            {!isExpanded && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {page.content.substring(0, 150)}...
              </Typography>
            )}

            {/* Full Content - Show when expanded */}
            {isExpanded && (
              <Box
                dangerouslySetInnerHTML={{ __html: formatPlainTextToHTML(page.content) }}
                sx={{
                  mb: 3,
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 2,
                    mt: 3,
                    '&:first-of-type': { mt: 0 }
                  },
                  '& p': {
                    mb: 2,
                    lineHeight: 1.8,
                    color: 'text.secondary',
                    fontSize: '1rem'
                  },
                  '& ul, & ol': {
                    pl: 2,
                    mb: 1.5,
                    '& li': {
                      mb: 0.5,
                      color: 'text.secondary'
                    }
                  },
                  '& a': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: 'primary.dark'
                    }
                  },
                  '& strong': {
                    fontWeight: 600,
                    color: 'text.primary'
                  }
                }}
              />
            )}



            {/* Expand indicator when collapsed */}
            {!isExpanded && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  Klicka för att läsa mer
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      transform: 'rotate(90deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ▶
                  </Box>
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ pt: { xs: 3, sm: 4, md: 5 }, pb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="body1" color="text.secondary">
            Laddar sidor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 4, md: 5 } }}>
      {/* Search & View Controls */}
      <Box sx={{ mb: 4 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          {/* Search Field */}
          <TextField
            fullWidth={isMobile}
            variant="outlined"
            size="medium"
            placeholder="Sök information..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: { sm: 280 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* View Toggle - Dölj på mobil */}
          {!isMobile && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="medium"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500
                }
              }}
            >
              <ToggleButton value="cards">
                <CardsIcon sx={{ mr: 1, fontSize: 20 }} />
                Kort
              </ToggleButton>
              <ToggleButton value="list">
                <ListIcon sx={{ mr: 1, fontSize: 20 }} />
                Lista
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>
      </Box>

      {/* Results Count */}
      {searchTerm && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Visar {filteredPages.length} av {pages.length} sidor
        </Typography>
      )}

      {/* Cards Grid - Optimized layout */}
      {filteredPages.length > 0 ? (
        <Grid container spacing={4}>
          {filteredPages.map((page) => {
            const isExpanded = expandedCard === page.id;
            return (
              <Grid 
                item 
                xs={12} 
                sm={viewMode === 'list' ? 12 : 12} 
                md={viewMode === 'list' ? 12 : 6}
                lg={viewMode === 'list' ? 12 : 6}
                xl={viewMode === 'list' ? 12 : 4}
                key={page.id}
                sx={{
                  // Expanded cards take full width but maintain grid position
                  ...(isExpanded && {
                    gridColumn: { md: '1 / -1', lg: '1 / -1', xl: '1 / -1' }
                  })
                }}
              >
                <PageCard page={page} />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="300px"
          textAlign="center"
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Inga sidor hittades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Prova att ändra din sökning eller kontrollera stavningen
          </Typography>
        </Box>
      )}
    </Container>
  );
};
