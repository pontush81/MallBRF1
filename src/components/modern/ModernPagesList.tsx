import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  ArticleOutlined,
  AccessTimeOutlined,
  ViewModule,
  ViewList,
  ExpandMore,
  ExpandLess,
  SearchOutlined,
} from '@mui/icons-material';
import { Page } from '../../types/Page';
import { modernTheme } from '../../theme/modernTheme';
import { ModernCard } from '../common/ModernCard';

interface ModernPagesListProps {
  pages: Page[];
  onPageClick: (page: Page) => void;
  isLoading?: boolean;
}

// Modern hero section with gradient and visual interest
const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${modernTheme.colors.secondary[50]} 0%, ${modernTheme.colors.white} 50%, ${modernTheme.colors.primary[50]} 100%)`,
  padding: `${modernTheme.spacing[10]} 0 ${modernTheme.spacing[8]} 0`,
  textAlign: 'center',
  marginBottom: modernTheme.spacing[6],
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 30% 20%, ${modernTheme.colors.secondary[100]}40 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, ${modernTheme.colors.primary[100]}30 0%, transparent 50%)`,
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, transparent 0%, ${modernTheme.colors.secondary[400]} 50%, transparent 100%)`,
  },
}));

const SearchField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: modernTheme.colors.white,
    borderRadius: modernTheme.borderRadius.xl,
    fontSize: modernTheme.typography.fontSize.base,
    minHeight: '56px',
    border: `2px solid ${modernTheme.colors.gray[200]}`,
    boxShadow: modernTheme.shadows.sm,
    transition: modernTheme.transitions.normal,
    '&:hover': {
      boxShadow: modernTheme.shadows.md,
      borderColor: modernTheme.colors.secondary[300],
      transform: 'translateY(-1px)',
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 4px ${modernTheme.colors.secondary[100]}, ${modernTheme.shadows.lg}`,
      borderColor: modernTheme.colors.secondary[500],
      transform: 'translateY(-2px)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent',
      },
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: `${modernTheme.spacing[4]} ${modernTheme.spacing[4]}`,
    fontWeight: modernTheme.typography.fontWeight.medium,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
}));



const PageCard = styled(Card)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: modernTheme.transitions.normal,
  cursor: 'pointer',
  border: `1px solid ${modernTheme.colors.gray[200]}`,
  background: `linear-gradient(145deg, ${modernTheme.colors.white} 0%, ${modernTheme.colors.gray[50]} 100%)`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${modernTheme.colors.secondary[500]} 0%, ${modernTheme.colors.primary[500]} 100%)`,
    opacity: 0,
    transition: modernTheme.transitions.normal,
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 25px rgba(0,0,0,0.1), 0 0 0 1px ${modernTheme.colors.secondary[200]}`,
    borderColor: modernTheme.colors.secondary[300],
    '&::before': {
      opacity: 1,
    },
    '& .expand-indicator': {
      color: modernTheme.colors.secondary[700],
    },
    '& .page-title': {
      color: modernTheme.colors.secondary[700],
    },
  },
  '&:focus': {
    outline: `3px solid ${modernTheme.colors.secondary[200]}`,
    outlineOffset: '2px',
  },
}));

export const ModernPagesList: React.FC<ModernPagesListProps> = ({
  pages,
  onPageClick,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  // DEBUG: Log ModernPagesList state
  console.log('📋 ModernPagesList state:', { 
    pagesCount: pages.length,
    isLoading,
    searchTerm,
    viewMode,
    pages: pages.map(p => ({ id: p.id, title: p.title }))
  });

  // Simple search functionality - no complex filtering needed for 10 documents
  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    
    return pages.filter(page =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

  // DEBUG: Log filtered pages and rendering state
  console.log('🔍 ModernPagesList render details:', {
    filteredPagesCount: filteredPages.length,
    filteredPages: filteredPages.map(p => ({ id: p.id, title: p.title })),
    shouldRenderCards: viewMode === 'cards' && !isLoading,
    modernThemeExists: !!modernTheme,
    modernThemeSpacing: modernTheme?.spacing?.[4],
    viewMode,
    isLoading,
    pagesLength: pages.length
  });
  
  // Extra debugging for empty state
  if (filteredPages.length === 0) {
    console.log('🚨 No filtered pages to display!', { pages, searchTerm, isLoading });
  }

  const toggleCardExpansion = (pageId: string) => {
    setExpandedCards(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)  // Remove if already expanded
        : [...prev, pageId]                 // Add if not expanded
    );
  };

  // Custom link component for ReactMarkdown to handle internal routing
  const MarkdownLink = ({ href, children, ...props }: any) => {
    // Check if it's an internal link (starts with /)
    if (href && href.startsWith('/')) {
      return (
        <RouterLink 
          to={href} 
          style={{ 
            color: modernTheme.colors.secondary[600],
            textDecoration: 'underline',
            fontWeight: modernTheme.typography.fontWeight.medium,
          }}
          {...props}
        >
          {children}
        </RouterLink>
      );
    }
    
    // External links
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          color: modernTheme.colors.secondary[600],
          textDecoration: 'underline',
          fontWeight: modernTheme.typography.fontWeight.medium,
        }}
        {...props}
      >
        {children}
      </a>
    );
  };



  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getContentPreview = (content: string, maxLength: number = 100) => {
    // Remove markdown formatting for preview - remove headers, bold, links etc
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic 
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/`([^`]+)`/g, '$1') // Remove code formatting
      .replace(/\n+/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + '...'  
      : cleanContent;
  };

  // isRecentlyUpdated function removed - NYTT badge was removed

  return (
    <Box>
      {/* Clean, simplified hero section */}
      <HeroSection>
        <Container maxWidth="md">
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontSize: { xs: modernTheme.typography.fontSize['2xl'], md: modernTheme.typography.fontSize['3xl'] },
              fontWeight: modernTheme.typography.fontWeight.bold,
              background: `linear-gradient(135deg, ${modernTheme.colors.secondary[700]} 0%, ${modernTheme.colors.primary[600]} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: modernTheme.spacing[6],
              position: 'relative',
              zIndex: 1,
            }}
          >
            Information för vår bostadsrättsförening
          </Typography>

          {/* Simple search - only if we have documents */}
          {pages.length > 0 && (
            <Box sx={{ maxWidth: '400px', margin: '0 auto' }}>
              <SearchField
                fullWidth
                variant="outlined"
                placeholder="Sök information..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ 
                      marginRight: modernTheme.spacing[2], 
                      display: 'flex',
                      alignItems: 'center',
                      color: modernTheme.colors.secondary[500],
                    }}>
                      <SearchOutlined fontSize="small" />
                    </Box>
                  ),
                }}
              />
            </Box>
          )}
          
          {/* View toggle buttons */}
          {pages.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: modernTheme.spacing[4] 
            }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(event, newView) => {
                  if (newView !== null) {
                    setViewMode(newView);
                  }
                }}
                aria-label="Visningsläge"
                sx={{
                  backgroundColor: modernTheme.colors.white,
                  borderRadius: modernTheme.borderRadius.lg,
                  boxShadow: modernTheme.shadows.sm,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: modernTheme.borderRadius.lg,
                    padding: `${modernTheme.spacing[2]} ${modernTheme.spacing[4]}`,
                    textTransform: 'none',
                    fontWeight: modernTheme.typography.fontWeight.medium,
                    '&.Mui-selected': {
                      backgroundColor: modernTheme.colors.secondary[100],
                      color: modernTheme.colors.secondary[800],
                    },
                  },
                }}
              >
                <ToggleButton value="cards" aria-label="Kortvy">
                  <ViewModule sx={{ marginRight: 1 }} />
                  Kortvy
                </ToggleButton>
                <ToggleButton value="list" aria-label="Listvy">
                  <ViewList sx={{ marginRight: 1 }} />
                  Visa allt
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
        </Container>
      </HeroSection>

      {/* Simple document grid */}
      <Container maxWidth="lg" sx={{ border: '2px solid red', minHeight: '200px', backgroundColor: 'yellow' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: modernTheme.spacing[8] }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Results summary */}
            {searchTerm && (
              <Typography
                variant="body2"
                sx={{
                  marginBottom: modernTheme.spacing[4],
                  color: modernTheme.colors.gray[600],
                  textAlign: 'center',
                }}
              >
                {filteredPages.length} av {pages.length} dokument
              </Typography>
            )}

            {/* Conditional rendering based on view mode */}
            {viewMode === 'cards' ? (
              // Card view - current layout
              <Grid container spacing={4} sx={{ alignItems: 'stretch', border: '3px solid blue', backgroundColor: 'lightblue', minHeight: '300px' }}>
                              {filteredPages.map((page) => {
                return (
                    <Grid item xs={12} md={6} key={page.id} sx={{ display: 'flex' }}>
                      <Box
                        tabIndex={0}
                        role="button"
                        aria-label={`Öppna ${page.title}`}
                        onClick={() => onPageClick(page)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onPageClick(page);
                          }
                        }}
                        sx={{ 
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <PageCard>
                          <CardContent sx={{ 
                            padding: modernTheme.spacing[5],
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                          }}>
                            {/* NYTT badge removed - was confusing for users */}

                            {/* Title */}
                            <Typography
                              variant="h6"
                              className="page-title"
                              sx={{
                                fontWeight: modernTheme.typography.fontWeight.semibold,
                                fontSize: modernTheme.typography.fontSize.lg,
                                marginBottom: modernTheme.spacing[3],
                                color: modernTheme.colors.primary[800],
                                lineHeight: modernTheme.typography.lineHeight.snug,
                                transition: modernTheme.transitions.normal,
                              }}
                            >
                              {page.title}
                            </Typography>

                                                          {/* Content preview or full content */}
                              {expandedCards.includes(page.id) ? (
                              <Box
                                sx={{
                                  color: modernTheme.colors.gray[700],
                                  marginBottom: modernTheme.spacing[4],
                                  lineHeight: modernTheme.typography.lineHeight.relaxed,
                                  fontSize: modernTheme.typography.fontSize.base,
                                  '& p': { marginBottom: modernTheme.spacing[3] },
                                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                                    fontWeight: modernTheme.typography.fontWeight.semibold,
                                    color: modernTheme.colors.primary[800],
                                    marginBottom: modernTheme.spacing[2],
                                  },
                                  '& ul, & ol': { 
                                    marginBottom: modernTheme.spacing[3],
                                    paddingLeft: modernTheme.spacing[4],
                                  },
                                  '& li': { marginBottom: modernTheme.spacing[1] },
                                  '& strong': { 
                                    fontWeight: modernTheme.typography.fontWeight.semibold,
                                    color: modernTheme.colors.primary[800],
                                  },
                                }}
                              >
                                <ReactMarkdown 
                                  components={{
                                    a: MarkdownLink,
                                  }}
                                >
                                  {page.content}
                                </ReactMarkdown>
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: modernTheme.colors.gray[600],
                                  marginBottom: modernTheme.spacing[4],
                                  lineHeight: modernTheme.typography.lineHeight.relaxed,
                                }}
                              >
                                {getContentPreview(page.content)}
                              </Typography>
                            )}

                                                        {/* Meta information */}
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: modernTheme.spacing[3],
                              borderTop: `1px solid ${modernTheme.colors.gray[100]}`,
                              marginTop: 'auto',
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: modernTheme.spacing[1] }}>
                                <AccessTimeOutlined sx={{ 
                                  fontSize: modernTheme.typography.fontSize.sm,
                                  color: modernTheme.colors.gray[500],
                                }} />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: modernTheme.colors.gray[500],
                                    fontSize: modernTheme.typography.fontSize.xs,
                                  }}
                                >
                                  {formatDate(page.updatedAt)}
                                </Typography>
                              </Box>
                              
                              {/* Expand/Collapse indicator */}
                              <Box className="expand-indicator" sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: modernTheme.spacing[1],
                                color: modernTheme.colors.secondary[600],
                                fontSize: modernTheme.typography.fontSize.xs,
                                transition: modernTheme.transitions.normal,
                              }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: modernTheme.colors.secondary[600],
                                    fontSize: modernTheme.typography.fontSize.xs,
                                    fontWeight: modernTheme.typography.fontWeight.medium,
                                  }}
                                >
                                  {expandedCards.includes(page.id) ? 'Kollaps' : 'Läs mer'}
                                </Typography>
                                {expandedCards.includes(page.id) ? (
                                  <ExpandLess sx={{ fontSize: modernTheme.typography.fontSize.sm }} />
                                ) : (
                                  <ExpandMore sx={{ fontSize: modernTheme.typography.fontSize.sm }} />
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </PageCard>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              // List view - continuous reading
              <Box sx={{ maxWidth: '800px', margin: '0 auto' }}>
                {filteredPages.map((page, index) => {
                  return (
                    <Box key={page.id}>
                      <Box sx={{ 
                        padding: modernTheme.spacing[6],
                        marginBottom: modernTheme.spacing[4],
                      }}>
                        {/* NYTT badge removed */}

                        {/* Title */}
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: modernTheme.typography.fontWeight.bold,
                            fontSize: modernTheme.typography.fontSize['2xl'],
                            marginBottom: modernTheme.spacing[4],
                            color: modernTheme.colors.primary[800],
                            lineHeight: modernTheme.typography.lineHeight.tight,
                          }}
                        >
                          {page.title}
                        </Typography>

                        {/* Full content */}
                        <Box
                          sx={{
                            color: modernTheme.colors.gray[700],
                            lineHeight: modernTheme.typography.lineHeight.relaxed,
                            fontSize: modernTheme.typography.fontSize.base,
                            marginBottom: modernTheme.spacing[4],
                            '& p': { marginBottom: modernTheme.spacing[3] },
                            '& h1, & h2, & h3, & h4, & h5, & h6': {
                              fontWeight: modernTheme.typography.fontWeight.semibold,
                              color: modernTheme.colors.primary[800],
                              marginBottom: modernTheme.spacing[2],
                            },
                            '& ul, & ol': { 
                              marginBottom: modernTheme.spacing[3],
                              paddingLeft: modernTheme.spacing[4],
                            },
                            '& li': { marginBottom: modernTheme.spacing[1] },
                            '& strong': {
                              fontWeight: modernTheme.typography.fontWeight.semibold,
                              color: modernTheme.colors.primary[800],
                            },
                          }}
                        >
                          <ReactMarkdown 
                            components={{
                              a: MarkdownLink,
                            }}
                          >
                            {page.content}
                          </ReactMarkdown>
                        </Box>

                        {/* Meta information */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          paddingTop: modernTheme.spacing[3],
                          borderTop: `1px solid ${modernTheme.colors.gray[200]}`,
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: modernTheme.spacing[1] }}>
                            <AccessTimeOutlined sx={{ 
                              fontSize: modernTheme.typography.fontSize.sm,
                              color: modernTheme.colors.gray[500],
                            }} />
                            <Typography
                              variant="caption"
                              sx={{
                                color: modernTheme.colors.gray[500],
                                fontSize: modernTheme.typography.fontSize.xs,
                              }}
                            >
                              {formatDate(page.updatedAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Divider between sections */}
                      {index < filteredPages.length - 1 && (
                        <Divider sx={{ 
                          margin: `${modernTheme.spacing[6]} 0`,
                          borderColor: modernTheme.colors.gray[200],
                        }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Simple empty state */}
            {filteredPages.length === 0 && !isLoading && (
              <Box sx={{ 
                textAlign: 'center', 
                padding: modernTheme.spacing[8],
              }}>
                <ArticleOutlined sx={{ 
                  fontSize: '3rem', 
                  color: modernTheme.colors.gray[400],
                  marginBottom: modernTheme.spacing[3],
                }} />
                <Typography
                  variant="h6"
                  sx={{
                    marginBottom: modernTheme.spacing[2],
                    color: modernTheme.colors.gray[700],
                  }}
                >
                  {searchTerm ? 'Inga dokument hittades' : 'Inga dokument tillgängliga'}
                </Typography>
                {searchTerm && (
                  <Typography
                    variant="body2"
                    sx={{ color: modernTheme.colors.gray[500] }}
                  >
                    Prova att söka på något annat
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}; 