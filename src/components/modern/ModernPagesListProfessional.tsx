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
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
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
import { bastadTheme } from '../../theme/bastadTheme';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    const searchLower = searchTerm.toLowerCase().trim();
    return pages.filter(page => 
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower)
    );
  }, [pages, searchTerm]);

  useEffect(() => {
    console.log('🔍 All sections being rendered:', filteredPages.map(p => ({ id: p.id, title: p.title })));
  }, [filteredPages]);

  // Färgschema med Båstad-tema - terrakotta som accent
  const iconMapping = {
    'info': { icon: InfoIcon, color: bastadTheme.colors.twilight[500], bgColor: `${bastadTheme.colors.twilight[500]}15` },
    'sports': { icon: SportsEsportsIcon, color: bastadTheme.colors.twilight[500], bgColor: `${bastadTheme.colors.twilight[500]}15` },
    'electric': { icon: ElectricBoltIcon, color: bastadTheme.colors.terracotta[500], bgColor: `${bastadTheme.colors.terracotta[500]}15` },
    'yard': { icon: YardIcon, color: bastadTheme.colors.seagreen[500], bgColor: `${bastadTheme.colors.seagreen[500]}15` },
    'gavel': { icon: GavelIcon, color: bastadTheme.colors.ocean[700], bgColor: `${bastadTheme.colors.ocean[700]}15` },
    'home': { icon: HomeIcon, color: bastadTheme.colors.terracotta[500], bgColor: `${bastadTheme.colors.terracotta[500]}15` },
    'work': { icon: WorkIcon, color: bastadTheme.colors.twilight[500], bgColor: `${bastadTheme.colors.twilight[500]}15` },
    'school': { icon: SchoolIcon, color: bastadTheme.colors.twilight[500], bgColor: `${bastadTheme.colors.twilight[500]}15` },
    'hospital': { icon: LocalHospitalIcon, color: bastadTheme.colors.error, bgColor: `${bastadTheme.colors.error}15` },
    'restaurant': { icon: RestaurantIcon, color: bastadTheme.colors.terracotta[500], bgColor: `${bastadTheme.colors.terracotta[500]}15` },
    'car': { icon: DirectionsCarIcon, color: bastadTheme.colors.twilight[500], bgColor: `${bastadTheme.colors.twilight[500]}15` },
    'build': { icon: BuildIcon, color: bastadTheme.colors.ocean[600], bgColor: `${bastadTheme.colors.ocean[600]}15` },
    'event': { icon: EventIcon, color: bastadTheme.colors.terracotta[500], bgColor: `${bastadTheme.colors.terracotta[500]}15` },
    'people': { icon: PeopleIcon, color: bastadTheme.colors.seagreen[500], bgColor: `${bastadTheme.colors.seagreen[500]}15` },
    'settings': { icon: SettingsIcon, color: bastadTheme.colors.ocean[600], bgColor: `${bastadTheme.colors.ocean[600]}15` },
    'palette': { icon: InfoIcon, color: bastadTheme.colors.terracotta[500], bgColor: `${bastadTheme.colors.terracotta[500]}15` },
    'recycle': { icon: InfoIcon, color: bastadTheme.colors.seagreen[500], bgColor: `${bastadTheme.colors.seagreen[500]}15` },
    'document': { icon: InfoIcon, color: bastadTheme.colors.ocean[700], bgColor: `${bastadTheme.colors.ocean[700]}15` },
    'wash': { icon: InfoIcon, color: bastadTheme.colors.twilight[500], bgColor: `${bastadTheme.colors.twilight[500]}15` }
  };

  const getPageIconAndColor = (page: Page) => {
    if (page.icon && iconMapping[page.icon as keyof typeof iconMapping]) {
      return iconMapping[page.icon as keyof typeof iconMapping];
    }
    
    const titleLower = page.title.toLowerCase();
    
    if (titleLower.includes('aktivitetsrum') || titleLower.includes('aktivitet')) return iconMapping.sports;
    if (titleLower.includes('elbil') || titleLower.includes('el') || titleLower.includes('bil')) return iconMapping.electric;
    if (titleLower.includes('ellagård') || titleLower.includes('trädgård') || titleLower.includes('gård')) return iconMapping.yard;
    if (titleLower.includes('föreningsstämma') || titleLower.includes('stämma') || titleLower.includes('förening')) return iconMapping.people;
    if (titleLower.includes('grillregler') || titleLower.includes('grill')) return iconMapping.restaurant;
    if (titleLower.includes('gästlägenhet') || titleLower.includes('gäst')) return iconMapping.home;
    if (titleLower.includes('färgkoder') || titleLower.includes('färg')) return iconMapping.palette;
    if (titleLower.includes('sophantering') || titleLower.includes('sop') || titleLower.includes('återvinning')) return iconMapping.recycle;
    if (titleLower.includes('styrelsen') || titleLower.includes('dokument')) return iconMapping.document;
    if (titleLower.includes('tvättsuga') || titleLower.includes('tvätt')) return iconMapping.wash;
    
    return iconMapping.info;
  };

  const getContentSummary = (content: string): string => {
    if (!content || content.trim().length === 0) return 'Klicka för att visa innehåll';

    const cleanContent = content
      .replace(/###\s+(.+)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^- (.+)$/gm, '$1')
      .trim();

    if (cleanContent.length < 10) return 'Klicka för att visa innehåll';

    const firstParagraph = cleanContent.split('\n\n')[0].trim();
    if (firstParagraph.length === 0) {
      const firstLine = cleanContent.split('\n')[0].trim();
      if (firstLine.length === 0) return 'Klicka för att visa innehåll';
      return firstLine.length <= 120 ? firstLine : firstLine.substring(0, 117).trim() + '...';
    }
    
    if (firstParagraph.length <= 120) return firstParagraph;
    
    const firstSentence = firstParagraph.split('.')[0];
    if (firstSentence.length <= 120 && firstSentence.length > 10) return firstSentence.trim() + '.';
    
    return firstParagraph.substring(0, 117).trim() + '...';
  };

  const formatPlainTextToHTML = (text: string) => {
    return text
      // Markdown-länkar: [text](url) -> <a href="url">text</a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #c2703a; text-decoration: underline;">$1</a>')
      .replace(/###\s+(.+)/g, '<h3>$1</h3>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => {
        if (paragraph.startsWith('<') && paragraph.endsWith('>')) return paragraph;
        return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
      })
      .join('');
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ pb: 4, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="150px">
            <Typography 
              variant="body1" 
              sx={{ 
                color: bastadTheme.colors.ocean[500],
                fontFamily: bastadTheme.typography.fontFamily.body,
              }}
            >
              Laddar sidor...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        pb: { xs: 16, md: 20 }, // Mer utrymme före footer
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ mt: { xs: 3, sm: 4 } }}>
        
        {/* SÖKFÄLT - MOBIL-OPTIMERAT */}
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <TextField
            placeholder="Sök i handboken..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="medium"
            fullWidth
            sx={{ 
              maxWidth: { xs: '100%', md: '700px' },
              mx: 'auto',
              display: 'block',
              '& .MuiOutlinedInput-root': {
                borderRadius: bastadTheme.borderRadius.xl,
                backgroundColor: bastadTheme.colors.white,
                border: `1px solid ${bastadTheme.colors.sand[300]}`,
                boxShadow: bastadTheme.shadows.card,
                transition: bastadTheme.transitions.normal,
                // MOBIL: Mindre höjd
                minHeight: { xs: '48px', md: '54px' },
                '& > fieldset': { border: 'none !important' },
                '&:hover': {
                  boxShadow: bastadTheme.shadows.cardHover,
                  borderColor: bastadTheme.colors.sand[400],
                },
                '&.Mui-focused': {
                  boxShadow: `0 0 0 3px ${bastadTheme.colors.terracotta[500]}25`,
                  borderColor: bastadTheme.colors.terracotta[500],
                }
              },
              '& .MuiInputBase-input': {
                fontFamily: bastadTheme.typography.fontFamily.body,
                fontSize: { xs: '0.9375rem', md: '1rem' },
                padding: { xs: '12px 16px', md: '14px 18px' },
                '&::placeholder': {
                  color: bastadTheme.colors.ocean[400],
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ 
                    color: bastadTheme.colors.ocean[400],
                    fontSize: { xs: '20px', md: '22px' },
                    ml: { xs: 0.5, md: 1 },
                  }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Sökresultat */}
        {searchTerm && (
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: bastadTheme.colors.ocean[500],
                fontFamily: bastadTheme.typography.fontFamily.body,
                fontSize: { xs: '0.8125rem', md: '0.875rem' },
              }}
            >
              {filteredPages.length} resultat för "{searchTerm}"
            </Typography>
          </Box>
        )}


        {/* KORT-LISTA - MOBIL-FÖRST */}
        {filteredPages.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 4, md: 6 }, 
              textAlign: 'center', 
              borderRadius: bastadTheme.borderRadius.xl,
              border: `1px solid ${bastadTheme.colors.sand[300]}`,
              background: bastadTheme.colors.white,
              boxShadow: bastadTheme.shadows.card,
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2,
                fontFamily: bastadTheme.typography.fontFamily.heading,
                color: bastadTheme.colors.ocean[800],
                fontSize: { xs: '1.125rem', md: '1.25rem' },
              }}
            >
              {searchTerm ? 'Inga resultat hittades' : 'Inga sidor tillgängliga'}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: bastadTheme.typography.fontFamily.body,
                color: bastadTheme.colors.ocean[500],
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            >
              {searchTerm ? 'Prova att söka med andra ord.' : 'Det finns inga publicerade sidor.'}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={{ xs: 0, md: 3 }}>
            {filteredPages.map((page, index) => {
              const summary = getContentSummary(page.content);
              const { icon: PageIcon, color: iconColor, bgColor } = getPageIconAndColor(page);

              return (
                <Fade in={true} timeout={200 + index * 50} key={page.id}>
                  <Box>
                  {index > 0 && (
                    <Divider sx={{ display: { xs: 'block', md: 'none' }, mt: 3, mb: 2, borderColor: bastadTheme.colors.sand[300] }} />
                  )}
                  <Card
                    elevation={0}
                    onClick={() => toggleCardExpansion(page.id.toString())}
                    sx={{
                      borderRadius: { xs: 0, md: bastadTheme.borderRadius.xl },
                      border: { xs: 'none', md: `1px solid ${bastadTheme.colors.sand[300]}` },
                      transition: bastadTheme.transitions.normal,
                      cursor: 'pointer',
                      backgroundColor: { xs: 'transparent', md: bastadTheme.colors.white },
                      boxShadow: { xs: 'none', md: bastadTheme.shadows.card },
                      WebkitTapHighlightColor: 'transparent',
                      '&:hover': {
                        boxShadow: { xs: 'none', md: bastadTheme.shadows.cardHover },
                        borderColor: { xs: 'transparent', md: bastadTheme.colors.terracotta[500] },
                      },
                      '&:active': {
                        transform: { xs: 'scale(0.99)', md: 'none' },
                      },
                    }}
                  >
                    <CardContent sx={{
                      p: { xs: 0, sm: 3, md: 4 },
                      '&:last-child': { pb: { xs: 0, sm: 3, md: 4 } },
                    }}>
                      {/* Header med ikon och titel */}
                      <Stack 
                        direction="row" 
                        alignItems="center" 
                        spacing={{ xs: 1.5, md: 2 }}
                        sx={{ mb: { xs: 1.5, md: 2 } }}
                      >
                        {/* IKON - MINDRE PÅ MOBIL */}
                        <Box
                          sx={{
                            width: { xs: 44, md: 52 },
                            height: { xs: 44, md: 52 },
                            borderRadius: bastadTheme.borderRadius.lg,
                            backgroundColor: bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: `1px solid ${iconColor}20`,
                          }}
                        >
                          <PageIcon sx={{ 
                            color: iconColor, 
                            fontSize: { xs: 22, md: 26 },
                          }} />
                        </Box>
                        
                        {/* TITEL */}
                        <Typography 
                          variant="h6" 
                          component="h2"
                          id={`section-${page.id}`}
                          sx={{ 
                            fontFamily: bastadTheme.typography.fontFamily.heading,
                            fontWeight: 600,
                            color: bastadTheme.colors.ocean[900],
                            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                            lineHeight: 1.3,
                            flex: 1,
                            // MOBIL: Förhindra overflow
                            wordBreak: 'break-word',
                          }}
                        >
                          {page.title}
                        </Typography>
                      </Stack>

                      {/* INNEHÅLL */}
                      <Box sx={{ mt: { xs: 1, md: 2 } }}>
                        {expandedCards.has(page.id.toString()) ? (
                          <Typography
                            variant="body1"
                            component="div"
                            sx={{ 
                              fontFamily: bastadTheme.typography.fontFamily.body,
                              color: bastadTheme.colors.ocean[700],
                              lineHeight: 1.7,
                              fontSize: { xs: '0.875rem', md: '0.9375rem' },
                              '& p': { mb: 2, '&:last-child': { mb: 0 } },
                              '& h3': {
                                mt: 3, mb: 1.5,
                                fontFamily: bastadTheme.typography.fontFamily.heading,
                                fontWeight: 600,
                                color: bastadTheme.colors.ocean[800],
                                fontSize: { xs: '1rem', md: '1.0625rem' },
                              },
                              '& ul': { pl: 2, mb: 2 },
                              '& li': { mb: 0.5 },
                            }}
                            dangerouslySetInnerHTML={{ __html: formatPlainTextToHTML(page.content) }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ 
                              fontFamily: bastadTheme.typography.fontFamily.body,
                              color: bastadTheme.colors.ocean[500],
                              lineHeight: 1.6,
                              fontSize: { xs: '0.8125rem', md: '0.875rem' },
                            }}
                          >
                            {summary}
                          </Typography>
                        )}
                      </Box>

                      {/* LÄS MER-KNAPP - MOBIL-OPTIMERAD */}
                      <Box sx={{ 
                        mt: { xs: 2, md: 3 }, 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                      }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: { xs: 2.5, md: 3 },
                            py: { xs: 1, md: 1.25 },
                            borderRadius: bastadTheme.borderRadius.lg,
                            backgroundColor: `${iconColor}10`,
                            border: `1px solid ${iconColor}25`,
                            transition: bastadTheme.transitions.fast,
                            // MOBIL: Touch-vänlig storlek
                            minHeight: { xs: '40px', md: '36px' },
                            '&:hover': {
                              backgroundColor: `${iconColor}18`,
                              borderColor: `${iconColor}40`,
                            },
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: bastadTheme.typography.fontFamily.body,
                              color: iconColor,
                              fontSize: { xs: '0.8125rem', md: '0.875rem' },
                              fontWeight: 600,
                            }}
                          >
                            {expandedCards.has(page.id.toString()) ? 'Visa mindre' : 'Läs mer'}
                          </Typography>
                          {expandedCards.has(page.id.toString()) ? (
                            <ExpandLessIcon sx={{ fontSize: { xs: 18, md: 20 }, color: iconColor }} />
                          ) : (
                            <ExpandMoreIcon sx={{ fontSize: { xs: 18, md: 20 }, color: iconColor }} />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  </Box>
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
