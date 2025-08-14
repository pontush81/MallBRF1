import React, { useState, useMemo } from 'react';
import { 
  Box,
  Container,
  TextField,
  InputAdornment,
  Typography,
  useTheme,
  Card,
  CardContent,
  Paper,
  Fade,
  Stack,
  Collapse,
  Button
} from '@mui/material';
import { 
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  SportsEsports as SportsEsportsIcon,  // För Aktivitetsrum (gaming/aktiviteter)
  ElectricBolt as ElectricBoltIcon,     // För Elbil (mer modern el-ikon)
  Yard as YardIcon,                     // För Ellagården (trädgård/utemiljö)
  Gavel as GavelIcon,                   // För Föreningsstämma (beslut/möten)
  Info as InfoIcon
} from '@mui/icons-material';
import { Page } from '../../types/Page';

interface ModernPagesListProfessionalProps {
  pages: Page[];
  onPageClick: (page: Page) => void;
  isLoading?: boolean;
}

const ModernPagesListProfessional: React.FC<ModernPagesListProfessionalProps> = ({ 
  pages, 
  onPageClick, 
  isLoading = false 
}) => {
  const theme = useTheme();

  
  // State for search, TOC, and card expansion
  const [searchTerm, setSearchTerm] = useState('');
  const [tocExpanded, setTocExpanded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Enhanced search function
  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return pages.filter(page => 
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower)
    );
  }, [pages, searchTerm]);

  // Function to toggle card expansion
  const toggleCardExpansion = (pageId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  // Available icons mapping (same as in PageEditor)
  const iconMapping = {
    'info': { icon: InfoIcon, color: '#616161', bgColor: '#f5f5f5' },
    'sports': { icon: SportsEsportsIcon, color: '#e91e63', bgColor: '#fce4ec' },
    'electric': { icon: ElectricBoltIcon, color: '#ff9800', bgColor: '#fff3e0' },
    'yard': { icon: YardIcon, color: '#4caf50', bgColor: '#e8f5e8' },
    'gavel': { icon: GavelIcon, color: '#3f51b5', bgColor: '#e8eaf6' }
  };

  // Function to get icon and color based on saved icon or fallback to title-based detection
  const getPageIconAndColor = (page: Page) => {
    // First, try to use the saved icon from admin selection
    if (page.icon && iconMapping[page.icon as keyof typeof iconMapping]) {
      return iconMapping[page.icon as keyof typeof iconMapping];
    }
    
    // Fallback to title-based detection for existing pages without saved icons
    const titleLower = page.title.toLowerCase();
    
    if (titleLower.includes('aktivitetsrum') || titleLower.includes('aktivitet')) {
      return iconMapping.sports;
    }
    if (titleLower.includes('elbil') || titleLower.includes('el') || titleLower.includes('bil')) {
      return iconMapping.electric;
    }
    if (titleLower.includes('ellagård') || titleLower.includes('trädgård') || titleLower.includes('gård')) {
      return iconMapping.yard;
    }
    if (titleLower.includes('föreningsstämma') || titleLower.includes('stämma') || titleLower.includes('förening')) {
      return iconMapping.gavel;
    }
    
    // Default icon and color
    return iconMapping.info;
  };

  // Function to get content summary (first paragraph or sentence)
  const getContentSummary = (content: string): string => {
    // Remove markdown formatting for clean summary
    const cleanContent = content
      .replace(/###\s+(.+)/g, '$1') // Remove ### headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/^- (.+)$/gm, '$1'); // Remove bullet points

    // Get first paragraph or first 150 characters
    const firstParagraph = cleanContent.split('\n\n')[0];
    if (firstParagraph.length <= 150) {
      return firstParagraph.trim();
    }
    
    // If first paragraph is too long, get first sentence or 150 chars
    const firstSentence = firstParagraph.split('.')[0];
    if (firstSentence.length <= 150) {
      return firstSentence.trim() + '.';
    }
    
    return firstParagraph.substring(0, 147).trim() + '...';
  };

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
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
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
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
        
        {/* Clean Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            placeholder="Sök..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="medium"
            fullWidth
            sx={{ 
              maxWidth: '600px',
              mx: 'auto',
              display: 'block',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'background.paper',
                border: 'none !important',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                '& > fieldset': {
                  border: 'none !important',
                  borderColor: 'transparent !important',
                },
                '&:hover': {
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  '& > fieldset': {
                    border: 'none !important',
                    borderColor: 'transparent !important',
                  }
                },
                '&.Mui-focused': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  '& > fieldset': {
                    border: 'none !important',
                    borderColor: 'transparent !important',
                    borderWidth: '0px !important',
                  }
                }
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredPages.length} {filteredPages.length === 1 ? 'resultat' : 'resultat'} för "{searchTerm}"
            </Typography>
          </Box>
        )}

        {/* Collapsible Table of Contents */}
        {filteredPages.length > 3 && !searchTerm && (
          <Box sx={{ mb: 3 }}>
            <Button
              onClick={() => setTocExpanded(!tocExpanded)}
              startIcon={tocExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.875rem',
                fontWeight: 500,
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: 'primary.main'
                }
              }}
            >
              På denna sida ({filteredPages.length} avsnitt)
            </Button>
            
            <Collapse in={tocExpanded}>
              <Box sx={{ mt: 2, pl: 2 }}>
                <Stack spacing={1}>
                  {filteredPages.map((page, index) => (
                    <Typography
                      key={page.id}
                      variant="body2"
                      color="primary.main"
                      sx={{
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        '&:hover': {
                          color: 'primary.dark',
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => {
                        const element = document.getElementById(`section-${page.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setTocExpanded(false); // Collapse after navigation
                      }}
                    >
                      {index + 1}. {page.title}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Content Sections */}
        {filteredPages.length === 0 ? (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
              {searchTerm ? 'Inga resultat hittades' : 'Inga sidor tillgängliga'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'Prova att söka med andra ord.' : 'Det finns inga publicerade sidor att visa för tillfället.'}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={4}>
            {filteredPages.map((page, index) => {
              const isExpanded = expandedCards.has(page.id);
              const summary = getContentSummary(page.content);
              const { icon: PageIcon, color: iconColor, bgColor } = getPageIconAndColor(page);
              
              return (
                <Fade in={true} timeout={300 + index * 100} key={page.id}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      borderRadius: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      '&:hover': {
                        elevation: 8,
                        transform: 'translateY(-4px)',
                        borderColor: iconColor,
                        boxShadow: `0 8px 25px rgba(0,0,0,0.12), 0 0 0 1px ${iconColor}20`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      {/* Section Header with Icon */}
                      <Stack 
                        direction="row" 
                        alignItems="center" 
                        justifyContent="space-between"
                        spacing={{ xs: 1, sm: 2 }}
                        sx={{ mb: 3 }}
                      >
                        <Stack 
                          direction="row" 
                          alignItems="center" 
                          spacing={2} 
                          sx={{ 
                            flex: 1,
                            minWidth: 0 // Tillåt text att truncate om nödvändigt
                          }}
                        >
                          {/* Colored Icon */}
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              backgroundColor: bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'transform 0.2s ease',
                              '&:hover': { transform: 'scale(1.1)' }
                            }}
                          >
                            <PageIcon sx={{ color: iconColor, fontSize: 24 }} />
                          </Box>
                          
                          <Typography 
                            variant="h5" 
                            component="h2"
                            id={`section-${page.id}`}
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              fontSize: { xs: '1.25rem', sm: '1.5rem' },
                              transition: 'color 0.2s ease',
                              '&:hover': { color: iconColor }
                            }}
                          >
                            {page.title}
                          </Typography>
                        </Stack>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardExpansion(page.id);
                          }}
                          endIcon={isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          sx={{
                            textTransform: 'none',
                            color: iconColor,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            fontWeight: 500,
                            minWidth: { xs: 100, sm: 'auto' }, // Sätt minimum bredd på mobil
                            px: { xs: 1.5, sm: 2 },
                            py: { xs: 0.5, sm: 1 },
                            borderRadius: 2,
                            flexShrink: 0, // Förhindra att knappen krymps
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: bgColor,
                              color: iconColor,
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          {isExpanded ? 'Visa mindre' : 'Läs mer'}
                        </Button>
                      </Stack>

                      {/* Single Collapse with conditional content to prevent text duplication */}
                      <Collapse in={true} timeout={400} collapsedSize={0}>
                        {isExpanded ? (
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
                        ) : (
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ 
                              lineHeight: 1.7,
                              fontSize: '1rem'
                            }}
                          >
                            {summary}
                          </Typography>
                        )}
                      </Collapse>
                    </CardContent>
                  </Card>
                </Fade>
              );
            })}
          </Stack>
        )}


      </Box>
    </Container>
  );
};

export default ModernPagesListProfessional;

