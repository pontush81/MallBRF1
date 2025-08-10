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
  Collapse,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  Button,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon, 
  ViewModule as CardsIcon, 
  List as ListIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  OpenInNew as OpenIcon
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number): string => {
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    return cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + '...'  
      : cleanContent;
  };

  const handleCardToggle = (pageId: string) => {
    setExpandedCard(expandedCard === pageId ? null : pageId);
  };

  // Professionell Page Card komponent
  const PageCard: React.FC<{ page: Page }> = ({ page }) => {
    const isExpanded = expandedCard === page.id;

    return (
      <Fade in timeout={300}>
        <Card
          sx={{
            height: 'fit-content',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            '&:hover': {
              transform: isMobile ? 'none' : 'translateY(-2px)',
              boxShadow: theme.shadows[8],
            },
            boxShadow: isExpanded ? theme.shadows[12] : theme.shadows[2],
            borderRadius: 2,
            border: isExpanded ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography 
                variant="h6" 
                component="h3"
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  flex: 1,
                  mr: 2,
                  lineHeight: 1.3
                }}
              >
                {page.title}
              </Typography>
              <Chip
                icon={<ScheduleIcon />}
                label={formatDate(page.updatedAt)}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ 
                  fontSize: '0.75rem',
                  flexShrink: 0
                }}
              />
            </Box>

            {/* Content Preview */}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: isExpanded ? 'none' : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {truncateContent(page.content, isExpanded ? 10000 : 200)}
            </Typography>

            {/* Expanded Content */}
            <Collapse in={isExpanded} timeout={300}>
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Box
                  dangerouslySetInnerHTML={{ __html: page.content }}
                  sx={{
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      color: 'text.primary',
                      fontWeight: 600,
                      mb: 1,
                      mt: 2,
                      '&:first-of-type': { mt: 0 }
                    },
                    '& p': {
                      mb: 1.5,
                      lineHeight: 1.7,
                      color: 'text.secondary'
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
                
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<OpenIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPageClick(page);
                    }}
                    sx={{ mr: 2 }}
                  >
                    Öppna hela sidan
                  </Button>
                </Box>
              </Box>
            </Collapse>

            {/* Footer */}
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ mt: 2, pt: 1 }}
            >
              <Button
                variant="text"
                size="small"
                startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardToggle(page.id);
                }}
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                {isExpanded ? 'Stäng' : 'Läs mer'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="body1" color="text.secondary">
            Laddar sidor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
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

      {/* Cards Grid */}
      {filteredPages.length > 0 ? (
        <Grid container spacing={3}>
          {filteredPages.map((page) => (
            <Grid 
              item 
              xs={12} 
              sm={viewMode === 'cards' ? 6 : 12} 
              md={viewMode === 'cards' ? 4 : 12}
              key={page.id}
            >
              <PageCard page={page} />
            </Grid>
          ))}
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
