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
  Button,
  Collapse,
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

// EMERGENCY DEBUG VERSION - SIMPLIFIED TO TEST RENDERING

interface ModernPagesListProps {
  pages: Page[];
  onPageClick: (page: Page) => void;
  isLoading: boolean;
}

export const ModernPagesList: React.FC<ModernPagesListProps> = ({
  pages,
  onPageClick,
  isLoading,
}) => {
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  const toggleCardExpansion = (pageId: string) => {
    setExpandedCards(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };



  return (
    <Box sx={{ 
      minHeight: '400px', 
      padding: 2
    }}>
      <Container maxWidth="lg">
        {/* PROFESSIONAL MOBILE-FIRST CARDS - Following 2025 Best Practices */}
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 1, sm: 2 }}>
          {pages.map((page) => (
            <Grid item xs={12} sm={6} key={page.id}>
              <Card 
                sx={{ 
                  minHeight: { xs: 264, md: 280 },
                  boxShadow: { xs: 2, md: 3 },
                  borderRadius: 3, // 12px for modern soft edges
                  cursor: 'pointer',
                  transition: 'box-shadow 0.25s ease-out, transform 0.2s ease-out',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)'
                  },
                  '&:focus': {
                    boxShadow: 6,
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '2px'
                  },
                  display: 'flex',
                  flexDirection: 'column'
                }}
                tabIndex={0}
                role="button"
                aria-label={`${expandedCards.includes(page.id) ? 'Kollaps' : 'Expandera'} dokument: ${page.title}`}
                onClick={() => {
                  console.log('🖱️ Card expansion toggle:', page.title);
                  toggleCardExpansion(page.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCardExpansion(page.id);
                  }
                }}
              >
                <CardContent sx={{ 
                  padding: { xs: 2, md: 3 }, // 16px mobile, 24px desktop
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}>
                  {/* Header with title and expand/collapse button */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'space-between',
                    marginBottom: 2
                  }}>
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ 
                        fontWeight: 600,
                        lineHeight: 1.25,
                        color: 'text.primary',
                        flex: 1,
                        marginRight: 2
                      }}
                    >
                      {page.title}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flexShrink: 0
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'primary.main',
                          fontSize: '0.875rem',
                          marginRight: 1,
                          fontWeight: 500
                        }}
                      >
                        {expandedCards.includes(page.id) ? 'Kollaps' : 'Läs mer'}
                      </Typography>
                      {expandedCards.includes(page.id) ? (
                        <ExpandLess sx={{ color: 'primary.main' }} />
                      ) : (
                        <ExpandMore sx={{ color: 'primary.main' }} />
                      )}
                    </Box>
                  </Box>

                  {/* Content - Preview or Full */}
                  {expandedCards.includes(page.id) ? (
                    /* EXPANDED - Full content with markdown */
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ 
                        flex: 1,
                        marginBottom: 3,
                        overflow: 'auto',
                        maxHeight: '60vh' // Prevent cards from becoming too tall
                      }}>
                        <ReactMarkdown 
                          components={{
                            h1: ({ children }) => (
                              <Typography variant="h4" sx={{ 
                                marginBottom: 2,
                                color: 'primary.main',
                                fontWeight: 600
                              }}>
                                {children}
                              </Typography>
                            ),
                            h2: ({ children }) => (
                              <Typography variant="h5" sx={{ 
                                marginBottom: 2,
                                marginTop: 3,
                                color: 'primary.main',
                                fontWeight: 600
                              }}>
                                {children}
                              </Typography>
                            ),
                            h3: ({ children }) => (
                              <Typography variant="h6" sx={{ 
                                marginBottom: 1,
                                marginTop: 2,
                                color: 'primary.main',
                                fontWeight: 600
                              }}>
                                {children}
                              </Typography>
                            ),
                            p: ({ children }) => (
                              <Typography variant="body1" sx={{ 
                                marginBottom: 2,
                                lineHeight: 1.6,
                                color: 'text.primary'
                              }}>
                                {children}
                              </Typography>
                            ),
                            ul: ({ children }) => (
                              <Box component="ul" sx={{ 
                                marginBottom: 2,
                                paddingLeft: 3,
                                '& li': {
                                  marginBottom: 0.5,
                                  color: 'text.primary'
                                }
                              }}>
                                {children}
                              </Box>
                            ),
                            ol: ({ children }) => (
                              <Box component="ol" sx={{ 
                                marginBottom: 2,
                                paddingLeft: 3,
                                '& li': {
                                  marginBottom: 0.5,
                                  color: 'text.primary'
                                }
                              }}>
                                {children}
                              </Box>
                            ),
                            strong: ({ children }) => (
                              <Typography component="span" sx={{ 
                                fontWeight: 600,
                                color: 'primary.main'
                              }}>
                                {children}
                              </Typography>
                            )
                          }}
                        >
                          {page.content}
                        </ReactMarkdown>
                      </Box>

                      {/* Expanded footer with full page button */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        paddingTop: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        marginTop: 'auto'
                      }}>
                        <Typography variant="caption" color="text.disabled">
                          {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('sv-SE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Ingen datum'}
                        </Typography>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPageClick(page);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        >
                          Öppna fullsida
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    /* COLLAPSED - Preview only */
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          flex: 1,
                          lineHeight: 1.5,
                          marginBottom: 2,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {page.content?.replace(/[#*\-\[\]]/g, '').trim().substring(0, 200)}...
                      </Typography>
                      
                      {/* Collapsed footer */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: 'auto'
                      }}>
                        <Typography variant="caption" color="text.disabled">
                          {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('sv-SE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Ingen datum'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {isLoading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <CircularProgress />
          </Box>
        )}
      </Container>
    </Box>
  );
};