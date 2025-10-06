import React, { useState, useMemo, useEffect } from 'react';
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



    // Available icons mapping (same as in PageEditor)
const iconMapping = {
    'info': { icon: InfoIcon, color: '#64748b', bgColor: '#f1f5f9' },
    'sports': { icon: SportsEsportsIcon, color: '#8b5cf6', bgColor: '#f3f4f6' },
    'electric': { icon: ElectricBoltIcon, color: '#10b981', bgColor: '#ecfdf5' },
    'yard': { icon: YardIcon, color: '#059669', bgColor: '#ecfdf5' },
    'gavel': { icon: GavelIcon, color: '#3b82f6', bgColor: '#eff6ff' },
    'home': { icon: HomeIcon, color: '#0ea5e9', bgColor: '#f0f9ff' },
    'work': { icon: WorkIcon, color: '#78716c', bgColor: '#f9fafb' },
    'school': { icon: SchoolIcon, color: '#a855f7', bgColor: '#faf5ff' },
    'hospital': { icon: LocalHospitalIcon, color: '#ef4444', bgColor: '#fef2f2' },
    'restaurant': { icon: RestaurantIcon, color: '#f97316', bgColor: '#fff7ed' },
    'car': { icon: DirectionsCarIcon, color: '#64748b', bgColor: '#f8fafc' },
    'build': { icon: BuildIcon, color: '#eab308', bgColor: '#fefce8' },
    'event': { icon: EventIcon, color: '#3b82f6', bgColor: '#eff6ff' },
    'people': { icon: PeopleIcon, color: '#06b6d4', bgColor: '#f0fdfa' },
    'settings': { icon: SettingsIcon, color: '#6b7280', bgColor: '#f9fafb' }
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
    <Container maxWidth="lg" sx={{ pb: 4 }}> {/* Reducerad padding för att minska död yta */}
      <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
        
        {/* Enhanced Modern Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            placeholder="Search handbook..."
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
                borderRadius: '12px', // More modern rounded corners
                backgroundColor: 'background.paper',
                border: 'none !important',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)', // Enhanced shadow
                transition: 'all 0.25s ease-in-out', // Smooth transitions
                '& > fieldset': {
                  border: 'none !important',
                  borderColor: 'transparent !important',
                },
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.15)',
                  transform: 'translateY(-1px)', // Subtle lift effect
                  '& > fieldset': {
                    border: 'none !important',
                    borderColor: 'transparent !important',
                  }
                },
                '&.Mui-focused': {
                  boxShadow: '0 6px 16px rgba(14, 165, 233, 0.15), 0 2px 8px rgba(0,0,0,0.1)', // Blue accent shadow
                  transform: 'translateY(-2px)', // More lift on focus
                  '& > fieldset': {
                    border: 'none !important',
                    borderColor: 'transparent !important',
                    borderWidth: '0px !important',
                  }
                }
              },
              '& .MuiInputBase-input': {
                fontSize: '16px', // Better mobile experience
                padding: '14px 16px', // More comfortable padding
                '&::placeholder': {
                  color: 'rgba(0,0,0,0.5)',
                  fontWeight: '400',
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon 
                    sx={{ 
                      color: 'rgba(0,0,0,0.4)',
                      fontSize: '20px',
                      transition: 'color 0.25s ease-in-out',
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
                      borderRadius: '16px', // More modern rounded corners
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.25s ease-in-out',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)', // Enhanced gradient
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)', // Subtle initial shadow
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.01)', // Subtle scale + lift
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08), 0 3px 12px rgba(0,0,0,0.1)', // Enhanced shadow
                        borderColor: 'rgba(14, 165, 233, 0.3)', // Blue accent border
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 30%, #f0f9ff 100%)', // Subtle blue tint on hover
                      },
                      '&:active': {
                        transform: 'translateY(-1px) scale(1.005)', // Pressed state
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
                          {/* Enhanced Icon Design */}
                          <Box
                            sx={{
                              width: 56, // Slightly larger for better visual impact
                              height: 56,
                              borderRadius: '16px', // More rounded for modern feel
                              backgroundColor: bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 3px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)', // Enhanced shadow
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smoother easing
                              position: 'relative',
                              '&:hover': {
                                transform: 'scale(1.08) translateY(-1px)', // More pronounced hover
                                boxShadow: '0 6px 20px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                                backgroundColor: iconColor + '10', // Subtle color shift on hover
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '16px',
                                border: `1px solid ${iconColor}15`,
                                transition: 'border-color 0.3s ease',
                              },
                              '&:hover::before': {
                                borderColor: iconColor + '25',
                              },
                              ...gpuAnimations.hoverScale
                            }}
                          >
                            <PageIcon sx={{ 
                              color: iconColor, 
                              fontSize: 28, // Larger icon
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))', // Subtle icon shadow
                            }} />
                          </Box>
                          
                          <Typography 
                            variant="h5" 
                            component="h2"
                            id={`section-${page.id}`}
                            sx={{ 
                              fontWeight: 700,
                              color: 'text.primary',
                              fontSize: { xs: '1.375rem', sm: '1.625rem' },
                              lineHeight: 1.3,
                              letterSpacing: '-0.025em',
                              transition: 'color 0.3s ease',
                              mb: 0.5,
                              '&:hover': { color: iconColor }
                            }}
                          >
                            {page.title}
                          </Typography>
                        </Stack>
                        

                      </Stack>

                      {/* Content - shows summary when collapsed, full content when expanded */}
                      <Box sx={{ mt: 3 }}>
                        {expandedCards.has(page.id.toString()) ? (
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ 
                              lineHeight: 1.8, // Ökat från 1.7
                              fontSize: '1rem',
                              '& p': {
                                marginBottom: '1.5rem', // Lägg till bättre avstånd mellan stycken
                                '&:last-child': { marginBottom: 0 }
                              },
                              '& h3': {
                                marginTop: '2rem',
                                marginBottom: '1rem',
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
                            color="text.secondary"
                            sx={{ 
                              lineHeight: 1.8, // Ökat från 1.7
                              fontSize: '1rem'
                            }}
                          >
                            {summary}
                          </Typography>
                        )}
                      </Box>

                      {/* Enhanced CTA Button */}
                      <Box sx={{ 
                        mt: 3, 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center' 
                      }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 3,
                            py: 1.5,
                            borderRadius: '12px',
                            backgroundColor: `${iconColor}08`,
                            border: `1px solid ${iconColor}20`,
                            transition: 'all 0.25s ease-in-out',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: `${iconColor}12`,
                              border: `1px solid ${iconColor}30`,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${iconColor}15`,
                            }
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: iconColor,
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              letterSpacing: '0.025em'
                            }}
                          >
                            {expandedCards.has(page.id.toString()) ? 'Visa mindre' : 'Läs mer'}
                          </Typography>
                          {expandedCards.has(page.id.toString()) ? (
                            <ExpandLessIcon sx={{ 
                              fontSize: '1.1rem', 
                              color: iconColor,
                              transition: 'transform 0.2s ease',
                            }} />
                          ) : (
                            <ExpandMoreIcon sx={{ 
                              fontSize: '1.1rem', 
                              color: iconColor,
                              transition: 'transform 0.2s ease',
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

