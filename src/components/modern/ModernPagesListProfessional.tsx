import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box,
  Container,
  TextField,
  InputAdornment,
  Typography,
  Card,
  CardContent,
  Paper,
  Fade,
  Stack,
  Button,
  Collapse
} from '@mui/material';
import { 
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  // All available icons (same as in PageEditor)
  Info as InfoIcon,
  SportsEsports as SportsEsportsIcon,
  ElectricBolt as ElectricBoltIcon,
  Yard as YardIcon,
  Gavel as GavelIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  LocalHospital as LocalHospitalIcon,
  Restaurant as RestaurantIcon,
  DirectionsCar as DirectionsCarIcon,
  Build as BuildIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Page } from '../../types/Page';
import { gpuAnimations } from '../../utils/performanceUtils';
import { modernTheme } from '../../theme/modernTheme';

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

  
  // State for search and TOC
  const [searchTerm, setSearchTerm] = useState('');
  const [tocExpanded, setTocExpanded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());



  // Toggle card expansion
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

  // Enhanced search function
  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return pages.filter(page => 
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower)
    );
  }, [pages, searchTerm]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 All sections being rendered:', filteredPages.map(p => ({ id: p.id, title: p.title })));
  }, [filteredPages]);



    // Available icons mapping - Blue tones only for unified design
const iconMapping = {
    'info': { icon: InfoIcon, color: '#3b82f6', bgColor: '#dbeafe' },
    'sports': { icon: SportsEsportsIcon, color: '#6366f1', bgColor: '#e0e7ff' },
    'electric': { icon: ElectricBoltIcon, color: '#0ea5e9', bgColor: '#e0f2fe' },
    'yard': { icon: YardIcon, color: '#0891b2', bgColor: '#cffafe' },
    'gavel': { icon: GavelIcon, color: '#3b82f6', bgColor: '#dbeafe' },
    'home': { icon: HomeIcon, color: '#6366f1', bgColor: '#e0e7ff' },
    'work': { icon: WorkIcon, color: '#475569', bgColor: '#f1f5f9' },
    'school': { icon: SchoolIcon, color: '#8b5cf6', bgColor: '#ede9fe' },
    'hospital': { icon: LocalHospitalIcon, color: '#3b82f6', bgColor: '#dbeafe' },
    'restaurant': { icon: RestaurantIcon, color: '#0ea5e9', bgColor: '#e0f2fe' },
    'car': { icon: DirectionsCarIcon, color: '#64748b', bgColor: '#f8fafc' },
    'build': { icon: BuildIcon, color: '#0891b2', bgColor: '#cffafe' },
    'event': { icon: EventIcon, color: '#3b82f6', bgColor: '#eff6ff' },
    'people': { icon: PeopleIcon, color: '#3b82f6', bgColor: '#dbeafe' },
    'settings': { icon: SettingsIcon, color: '#64748b', bgColor: '#f1f5f9' },
    'palette': { icon: InfoIcon, color: '#6366f1', bgColor: '#e0e7ff' },
    'recycle': { icon: InfoIcon, color: '#0891b2', bgColor: '#cffafe' },
    'document': { icon: InfoIcon, color: '#475569', bgColor: '#f1f5f9' },
    'wash': { icon: InfoIcon, color: '#06b6d4', bgColor: '#cffafe' }
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
      return iconMapping.people;
    }
    if (titleLower.includes('grillregler') || titleLower.includes('grill')) {
      return iconMapping.restaurant;
    }
    if (titleLower.includes('gästlägenhet') || titleLower.includes('gäst')) {
      return iconMapping.home;
    }
    if (titleLower.includes('färgkoder') || titleLower.includes('färg')) {
      return iconMapping.palette;
    }
    if (titleLower.includes('sophantering') || titleLower.includes('sop') || titleLower.includes('återvinning')) {
      return iconMapping.recycle;
    }
    if (titleLower.includes('styrelsen') || titleLower.includes('dokument')) {
      return iconMapping.document;
    }
    if (titleLower.includes('tvättsuga') || titleLower.includes('tvätt')) {
      return iconMapping.wash;
    }
    
    // Default icon and color
    return iconMapping.info;
  };

  // Function to get content summary (first paragraph or sentence)
  const getContentSummary = (content: string): string => {
    // Handle empty or very short content
    if (!content || content.trim().length === 0) {
      return 'Klicka för att visa innehåll';
    }

    // Remove markdown formatting for clean summary
    const cleanContent = content
      .replace(/###\s+(.+)/g, '$1') // Remove ### headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/^- (.+)$/gm, '$1') // Remove bullet points
      .trim();

    // Handle very short content (less than 10 characters)
    if (cleanContent.length < 10) {
      return 'Klicka för att visa innehåll';
    }

    // Get first paragraph or first 150 characters
    const firstParagraph = cleanContent.split('\n\n')[0].trim();
    if (firstParagraph.length === 0) {
      // Try getting the first line instead
      const firstLine = cleanContent.split('\n')[0].trim();
      if (firstLine.length === 0) {
        return 'Klicka för att visa innehåll';
      }
      return firstLine.length <= 150 ? firstLine : firstLine.substring(0, 147).trim() + '...';
    }
    
    if (firstParagraph.length <= 150) {
      return firstParagraph;
    }
    
    // If first paragraph is too long, get first sentence or 150 chars
    const firstSentence = firstParagraph.split('.')[0];
    if (firstSentence.length <= 150 && firstSentence.length > 10) {
      return firstSentence.trim() + '.';
    }
    
    return firstParagraph.substring(0, 147).trim() + '...';
  };

  // Function to format plain text to HTML
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      <Container maxWidth="lg" sx={{ pb: 4 }}> {/* Reducerad padding för att minska död yta */}
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
    <Container maxWidth="lg" sx={{ pb: 12 }}> {/* Extra padding för scroll-to-top-knappen */}
      <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
        
        {/* Large Prominent Search Bar - Enhanced modern design */}
        <Box sx={{ mb: 6, px: { xs: 2, sm: 0 } }}>
          <TextField
            placeholder="Sök i handboken..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="medium"
            fullWidth
            sx={{ 
              maxWidth: '800px',
              mx: 'auto',
              display: 'block',
              '& .MuiOutlinedInput-root': {
                borderRadius: modernTheme.borderRadius['2xl'],
                backgroundColor: modernTheme.colors.white,
                border: `1px solid ${modernTheme.colors.gray[200]}`,
                boxShadow: modernTheme.shadows.search,
                transition: modernTheme.transitions.normal,
                fontSize: modernTheme.typography.fontSize.base,
                minHeight: '56px',
                '& > fieldset': {
                  border: 'none !important',
                },
                '&:hover': {
                  boxShadow: modernTheme.shadows.cardHover,
                  borderColor: modernTheme.colors.gray[300],
                  transform: 'translateY(-1px)',
                },
                '&.Mui-focused': {
                  boxShadow: modernTheme.shadows.searchFocus,
                  borderColor: modernTheme.colors.primary[500],
                  transform: 'translateY(-2px)',
                }
              },
              '& .MuiInputBase-input': {
                fontSize: modernTheme.typography.fontSize.base,
                padding: modernTheme.spacing[4],
                fontWeight: modernTheme.typography.fontWeight.normal,
                '&::placeholder': {
                  color: modernTheme.colors.gray[400],
                  fontWeight: modernTheme.typography.fontWeight.normal,
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon 
                    sx={{ 
                      color: modernTheme.colors.gray[400],
                      fontSize: '22px',
                      marginLeft: 1
                    }} 
                  />
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
                        if (element) {
                          // Try modern CSS scroll-margin approach first
                          element.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                          
                          console.log('Scrolled to section:', page.id, page.title, element);
                          console.log('Element text content:', element.textContent?.substring(0, 50));
                        } else {
                          console.error(`Element with id section-${page.id} not found`);
                        }
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
          <Paper 
            elevation={0} 
            sx={{ 
              p: modernTheme.spacing[8], 
              textAlign: 'center', 
              borderRadius: modernTheme.borderRadius['2xl'],
              border: `1px solid ${modernTheme.colors.gray[200]}`,
              background: modernTheme.gradients.card,
              boxShadow: modernTheme.shadows.card,
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: modernTheme.spacing[3],
                color: modernTheme.colors.gray[700],
                fontWeight: modernTheme.typography.fontWeight.semibold,
              }}
            >
              {searchTerm ? 'Inga resultat hittades' : 'Inga sidor tillgängliga'}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: modernTheme.colors.gray[600],
                fontSize: modernTheme.typography.fontSize.base,
              }}
            >
              {searchTerm ? 'Prova att söka med andra ord.' : 'Det finns inga publicerade sidor att visa för tillfället.'}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={4}>
            {filteredPages.map((page, index) => {
              const summary = getContentSummary(page.content);
              const { icon: PageIcon, color: iconColor, bgColor } = getPageIconAndColor(page);
              
              // Debug log each section as it renders
              console.log(`📍 Rendering section: ID=${page.id}, Title="${page.title}"`);
              
              return (
                <Fade in={true} timeout={300 + index * 100} key={page.id}>
                  <Card 
                    elevation={0}
                    onClick={() => toggleCardExpansion(page.id.toString())}
                    sx={{ 
                      borderRadius: '12px',
                      border: `1px solid ${modernTheme.colors.gray[200]}`,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                      {/* Section Header with Icon */}
                      <Stack 
                        direction="row" 
                        alignItems="flex-start" 
                        justifyContent="space-between"
                        spacing={{ xs: 2, sm: 3 }}
                        sx={{ mb: 4 }}
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
                          {/* Enhanced Icon Design - Modern style */}
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: modernTheme.borderRadius['2xl'],
                              backgroundColor: bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: modernTheme.shadows.icon,
                              transition: modernTheme.transitions.normal,
                              position: 'relative',
                              flexShrink: 0,
                              willChange: 'transform, box-shadow',
                              '&:hover': {
                                transform: 'scale(1.1) translateY(-2px)',
                                boxShadow: modernTheme.shadows.iconHover,
                                backgroundColor: bgColor,
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                borderRadius: modernTheme.borderRadius['2xl'],
                                border: `1.5px solid ${iconColor}20`,
                                transition: modernTheme.transitions.normal,
                              },
                              '&:hover::before': {
                                borderColor: `${iconColor}35`,
                              },
                              ...gpuAnimations.hoverScale
                            }}
                          >
                            <PageIcon sx={{ 
                              color: iconColor, 
                              fontSize: 28,
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                              transition: modernTheme.transitions.fast,
                            }} />
                          </Box>
                          
                          <Typography 
                            variant="h5" 
                            component="h2"
                            id={`section-${page.id}`}
                            sx={{ 
                              fontWeight: modernTheme.typography.fontWeight.bold,
                              color: modernTheme.colors.gray[900],
                              fontSize: { xs: modernTheme.typography.fontSize.xl, sm: modernTheme.typography.fontSize['2xl'] },
                              lineHeight: modernTheme.typography.lineHeight.snug,
                              letterSpacing: '-0.025em',
                              transition: modernTheme.transitions.fast,
                              '&:hover': { color: iconColor }
                            }}
                          >
                            {page.title}
                          </Typography>
                        </Stack>
                        

                      </Stack>

                      {/* Content - shows summary when collapsed, full content when expanded */}
                      <Box sx={{ mt: modernTheme.spacing[4] }}>
                        {expandedCards.has(page.id.toString()) ? (
                          <Typography
                            variant="body1"
                            sx={{ 
                              color: modernTheme.colors.gray[700],
                              lineHeight: modernTheme.typography.lineHeight.relaxed,
                              fontSize: modernTheme.typography.fontSize.base,
                              fontWeight: modernTheme.typography.fontWeight.normal,
                              '& p': {
                                marginBottom: modernTheme.spacing[4],
                                '&:last-child': { marginBottom: 0 }
                              },
                              '& h3': {
                                marginTop: modernTheme.spacing[6],
                                marginBottom: modernTheme.spacing[3],
                                fontWeight: modernTheme.typography.fontWeight.semibold,
                                color: modernTheme.colors.gray[900],
                                '&:first-child': { marginTop: 0 }
                              }
                            }}
                            dangerouslySetInnerHTML={{ 
                              __html: formatPlainTextToHTML(page.content) 
                            }}
                          />
                        ) : (
                          <Typography
                            variant="body1"
                            sx={{ 
                              color: modernTheme.colors.gray[600],
                              lineHeight: modernTheme.typography.lineHeight.relaxed,
                              fontSize: modernTheme.typography.fontSize.base,
                              fontWeight: modernTheme.typography.fontWeight.normal,
                            }}
                          >
                            {summary}
                          </Typography>
                        )}
                      </Box>

                      {/* Enhanced CTA Button - Modern design */}
                      <Box sx={{ 
                        mt: modernTheme.spacing[4], 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center' 
                      }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: modernTheme.spacing[2],
                            px: modernTheme.spacing[4],
                            py: modernTheme.spacing[2],
                            borderRadius: modernTheme.borderRadius.xl,
                            backgroundColor: `${iconColor}08`,
                            border: `1.5px solid ${iconColor}20`,
                            transition: modernTheme.transitions.normal,
                            cursor: 'pointer',
                            willChange: 'transform, background-color, box-shadow',
                            '&:hover': {
                              backgroundColor: `${iconColor}15`,
                              border: `1.5px solid ${iconColor}35`,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${iconColor}20`,
                            },
                            '&:active': {
                              transform: 'translateY(0)',
                            }
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: iconColor,
                              fontSize: modernTheme.typography.fontSize.sm,
                              fontWeight: modernTheme.typography.fontWeight.semibold,
                              letterSpacing: '0.025em'
                            }}
                          >
                            {expandedCards.has(page.id.toString()) ? 'Visa mindre' : 'Läs mer'}
                          </Typography>
                          {expandedCards.has(page.id.toString()) ? (
                            <ExpandLessIcon sx={{ 
                              fontSize: '1.125rem', 
                              color: iconColor,
                              transition: modernTheme.transitions.fast,
                            }} />
                          ) : (
                            <ExpandMoreIcon sx={{ 
                              fontSize: '1.125rem', 
                              color: iconColor,
                              transition: modernTheme.transitions.fast,
                            }} />
                          )}
                        </Box>
                      </Box>
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

