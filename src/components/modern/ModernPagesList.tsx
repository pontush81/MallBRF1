import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
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
} from '@mui/icons-material';
import { Page } from '../../types/Page';
import { modernTheme } from '../../theme/modernTheme';
import { ModernCard } from '../common/ModernCard';

interface ModernPagesListProps {
  pages: Page[];
  onPageClick: (page: Page) => void;
  isLoading?: boolean;
}

// Simplified, clean hero section
const HeroSection = styled(Box)(({ theme }) => ({
  background: modernTheme.colors.white,
  padding: `${modernTheme.spacing[8]} 0 ${modernTheme.spacing[6]} 0`,
  textAlign: 'center',
  marginBottom: modernTheme.spacing[6],
  borderBottom: `1px solid ${modernTheme.colors.gray[200]}`,
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: modernTheme.colors.white,
    borderRadius: modernTheme.borderRadius.xl,
    fontSize: modernTheme.typography.fontSize.base,
    minHeight: '48px',
    '&:hover': {
      boxShadow: modernTheme.shadows.sm,
    },
    '&.Mui-focused': {
      boxShadow: modernTheme.shadows.md,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: modernTheme.colors.secondary[500],
        borderWidth: '2px',
      },
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: modernTheme.spacing[3],
  },
}));



const PageCard = styled(ModernCard)(({ theme }) => ({
  height: '100%',
  transition: modernTheme.transitions.normal,
  cursor: 'pointer',
  border: `1px solid ${modernTheme.colors.gray[200]}`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: modernTheme.shadows.lg,
    borderColor: modernTheme.colors.secondary[300],
    '& .expand-indicator': {
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

  // Simple search functionality - no complex filtering needed for 10 documents
  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    
    return pages.filter(page =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

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

  const isRecentlyUpdated = (date?: string) => {
    if (!date) return false;
    const updatedDate = new Date(date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return updatedDate > thirtyDaysAgo;
  };

  return (
    <Box>
      {/* Clean, simplified hero section */}
      <HeroSection>
        <Container maxWidth="md">
          <Typography
            variant="h3"
            sx={{
              fontSize: modernTheme.typography.fontSize['2xl'],
              fontWeight: modernTheme.typography.fontWeight.bold,
              marginBottom: modernTheme.spacing[2],
              color: modernTheme.colors.primary[800],
            }}
          >
            Gulmaran Information
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: modernTheme.typography.fontSize.base,
              color: modernTheme.colors.gray[600],
              marginBottom: modernTheme.spacing[6],
            }}
          >
            Dokument och information för vår bostadsrättsförening
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
                    <Box sx={{ marginRight: modernTheme.spacing[2], color: modernTheme.colors.gray[500] }}>
                      🔍
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
      <Container maxWidth="lg">
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
              <Grid container spacing={modernTheme.spacing[4]}>
                              {filteredPages.map((page) => {
                return (
                    <Grid item xs={12} md={6} key={page.id}>
                      <Box
                        tabIndex={0}
                        role="button"
                                                  aria-label={`${expandedCards.includes(page.id) ? 'Kollaps' : 'Expandera'} ${page.title}`}
                        onClick={() => toggleCardExpansion(page.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleCardExpansion(page.id);
                          }
                        }}
                      >
                        <PageCard>
                          <CardContent sx={{ padding: modernTheme.spacing[5] }}>
                            {/* NYTT badge */}
                            {isRecentlyUpdated(page.updatedAt) && (
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'flex-end',
                                marginBottom: modernTheme.spacing[3],
                              }}>
                                <Chip
                                  label="NYTT"
                                  size="small"
                                  sx={{
                                    backgroundColor: modernTheme.colors.secondary[100],
                                    color: modernTheme.colors.secondary[800],
                                    fontWeight: modernTheme.typography.fontWeight.bold,
                                    fontSize: modernTheme.typography.fontSize.xs,
                                  }}
                                />
                              </Box>
                            )}

                            {/* Title */}
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: modernTheme.typography.fontWeight.semibold,
                                fontSize: modernTheme.typography.fontSize.lg,
                                marginBottom: modernTheme.spacing[3],
                                color: modernTheme.colors.primary[800],
                                lineHeight: modernTheme.typography.lineHeight.snug,
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
                        {/* NYTT badge */}
                        {isRecentlyUpdated(page.updatedAt) && (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            marginBottom: modernTheme.spacing[4],
                          }}>
                            <Chip
                              label="NYTT"
                              size="small"
                              sx={{
                                backgroundColor: modernTheme.colors.secondary[100],
                                color: modernTheme.colors.secondary[800],
                                fontWeight: modernTheme.typography.fontWeight.bold,
                                fontSize: modernTheme.typography.fontSize.xs,
                              }}
                            />
                          </Box>
                        )}

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