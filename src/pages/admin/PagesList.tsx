import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Article as ArticleIcon,
  Search as SearchIcon,
  // Icons for page types
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
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

import { Page } from '../../types/Page';
import pageServiceSupabase from '../../services/pageServiceSupabase';
import { bastadTheme } from '../../theme/bastadTheme';

const PagesList: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');

  const navigate = useNavigate();

  // Icon mapping (same as in PageEditor)
  const iconMapping = {
    'info': { icon: InfoIcon, color: '#616161', bgColor: '#f5f5f5' },
    'sports': { icon: SportsEsportsIcon, color: '#e91e63', bgColor: '#fce4ec' },
    'electric': { icon: ElectricBoltIcon, color: '#ff9800', bgColor: '#fff3e0' },
    'yard': { icon: YardIcon, color: '#4caf50', bgColor: '#e8f5e8' },
    'gavel': { icon: GavelIcon, color: '#3f51b5', bgColor: '#e8eaf6' },
    'home': { icon: HomeIcon, color: '#1976d2', bgColor: '#e3f2fd' },
    'work': { icon: WorkIcon, color: '#795548', bgColor: '#efebe9' },
    'school': { icon: SchoolIcon, color: '#9c27b0', bgColor: '#f3e5f5' },
    'hospital': { icon: LocalHospitalIcon, color: '#f44336', bgColor: '#ffebee' },
    'restaurant': { icon: RestaurantIcon, color: '#ff5722', bgColor: '#fff3e0' },
    'car': { icon: DirectionsCarIcon, color: '#607d8b', bgColor: '#eceff1' },
    'build': { icon: BuildIcon, color: '#ffc107', bgColor: '#fffde7' },
    'event': { icon: EventIcon, color: '#2196f3', bgColor: '#e3f2fd' },
    'people': { icon: PeopleIcon, color: '#009688', bgColor: '#e0f2f1' },
    'settings': { icon: SettingsIcon, color: '#424242', bgColor: '#f5f5f5' }
  };

  // Function to get icon and color for a page (same logic as ModernPagesListProfessional)
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

  // Strip markdown syntax for plain-text preview
  const stripMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s+/g, '')       // headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/\*(.+?)\*/g, '$1')     // italic
      .replace(/__(.+?)__/g, '$1')     // bold alt
      .replace(/_(.+?)_/g, '$1')       // italic alt
      .replace(/~~(.+?)~~/g, '$1')     // strikethrough
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // images
      .replace(/`{1,3}[^`]*`{1,3}/g, '')     // inline/block code
      .replace(/^\s*[-*+]\s+/gm, '')          // list markers
      .replace(/^\s*\d+\.\s+/gm, '')          // ordered list markers
      .replace(/>\s+/g, '')                    // blockquotes
      .replace(/\|/g, ' ')                     // table pipes
      .replace(/---+/g, '')                    // horizontal rules
      .replace(/\n{2,}/g, ' ')                 // collapse newlines
      .replace(/\n/g, ' ')                     // remaining newlines
      .trim();
  };

  // Filtered pages based on search and status
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesSearch = searchQuery === '' ||
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.content && page.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && page.isPublished) ||
        (statusFilter === 'unpublished' && !page.isPublished);
      return matchesSearch && matchesStatus;
    });
  }, [pages, searchQuery, statusFilter]);

  // Debug logging
  console.log('🔍 Admin PagesList render:', {
    loading,
    error,
    pagesCount: pages?.length || 0,
    pages: pages
  });

  // Hämta alla sidor vid komponentmontering
  useEffect(() => {
    fetchPages();
  }, []);

  // Funktion för att hämta sidor
  const fetchPages = async () => {
    try {
      setLoading(true);
      console.log('📖 Admin PagesList: Fetching pages...');
      const allPages = await pageServiceSupabase.getAllPages();
      console.log('📖 Admin PagesList: Received pages:', allPages);
      console.log('📖 Admin PagesList: Pages count:', allPages?.length || 0);
      
      // Säkerställ att vi alltid har en array
      const pagesArray = Array.isArray(allPages) ? allPages : [];
      setPages(pagesArray);
      setError(null);
      
      console.log('📖 Admin PagesList: Set pages state with:', pagesArray.length, 'items');
    } catch (err) {
      console.error('❌ Admin PagesList: Error fetching pages:', err);
      setError('Ett fel uppstod vid hämtning av sidor');
      setPages([]); // Sätt tom array vid fel
    } finally {
      setLoading(false);
    }
  };

  // Öppna dialog för att radera sida
  const handleDeleteClick = (page: Page) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  // Stäng raderingsdialogrutan
  const handleDeleteCancel = () => {
    setPageToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Bekräfta radering av sida
  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return;

    const id = pageToDelete.id;
    setDeleteDialogOpen(false);
    setPageToDelete(null);

    try {
      await pageServiceSupabase.deletePage(id);
      setSnackbarMessage('Sidan har raderats');
      setSnackbarOpen(true);
      fetchPages();
    } catch (err: any) {
      console.error('❌ Delete failed in PagesList:', err);
      setSnackbarMessage(err?.message || 'Ett fel uppstod vid radering av sidan');
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <CircularProgress size={60} sx={{ color: bastadTheme.colors.ocean[500] }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: bastadTheme.borderRadius.lg }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header med titel och knapp */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: bastadTheme.spacing[6]
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: bastadTheme.typography.fontWeight.bold,
              color: bastadTheme.colors.ocean[900],
              mb: bastadTheme.spacing[1]
            }}
          >
            Hantera Sidor
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ color: bastadTheme.colors.ocean[600] }}
          >
            Skapa, redigera och hantera dina webbsidor
          </Typography>
        </Box>
                    <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  console.log('🔄 Refreshing pages...');
                  fetchPages();
                }}
                sx={{
                  borderRadius: bastadTheme.borderRadius.xl,
                  px: bastadTheme.spacing[3],
                  py: bastadTheme.spacing[2],
                }}
              >
                Uppdatera
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/admin/pages/new')}
                sx={{
                  background: bastadTheme.gradients.ctaButton,
                  borderRadius: bastadTheme.borderRadius.xl,
                  px: bastadTheme.spacing[4],
                  py: bastadTheme.spacing[2],
                  boxShadow: bastadTheme.shadows.lg,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: bastadTheme.shadows.xl,
                  }
                }}
              >
                Skapa Ny Sida
              </Button>
            </Stack>
      </Box>

      {/* Search and filter toolbar */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: bastadTheme.spacing[4],
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <TextField
          size="small"
          placeholder="Sök sidor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: bastadTheme.colors.ocean[400], fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: bastadTheme.borderRadius.lg,
            },
          }}
        />
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, val) => { if (val) setStatusFilter(val); }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              borderRadius: bastadTheme.borderRadius.lg,
              px: 2,
              textTransform: 'none',
              fontWeight: bastadTheme.typography.fontWeight.medium,
              '&.Mui-selected': {
                backgroundColor: bastadTheme.colors.ocean[50],
                color: bastadTheme.colors.ocean[700],
                borderColor: bastadTheme.colors.ocean[300],
              },
            },
          }}
        >
          <ToggleButton value="all">Alla ({pages.length})</ToggleButton>
          <ToggleButton value="published">Publicerade ({pages.filter(p => p.isPublished).length})</ToggleButton>
          <ToggleButton value="unpublished">Ej publicerade ({pages.filter(p => !p.isPublished).length})</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Table */}
      {filteredPages.length > 0 && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: bastadTheme.borderRadius.xl,
            border: `1px solid ${bastadTheme.colors.sand[200]}`,
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: bastadTheme.colors.sand[50] }}>
                <TableCell sx={{ fontWeight: bastadTheme.typography.fontWeight.semibold, color: bastadTheme.colors.ocean[700], width: 44, px: 1.5 }} />
                <TableCell sx={{ fontWeight: bastadTheme.typography.fontWeight.semibold, color: bastadTheme.colors.ocean[700] }}>Titel</TableCell>
                <TableCell sx={{ fontWeight: bastadTheme.typography.fontWeight.semibold, color: bastadTheme.colors.ocean[700] }}>Status</TableCell>
                <TableCell sx={{ fontWeight: bastadTheme.typography.fontWeight.semibold, color: bastadTheme.colors.ocean[700] }}>Uppdaterad</TableCell>
                <TableCell sx={{ fontWeight: bastadTheme.typography.fontWeight.semibold, color: bastadTheme.colors.ocean[700], width: 100 }} align="right">Åtgärder</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPages.map((page) => {
                const { icon: PageIcon, color: iconColor } = getPageIconAndColor(page);
                return (
                  <TableRow
                    key={page.id}
                    hover
                    onClick={() => navigate(`/admin/pages/edit/${page.id}`)}
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ px: 1.5 }}>
                      <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: bastadTheme.borderRadius.lg,
                        backgroundColor: iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <PageIcon sx={{ color: 'white', fontSize: 18 }} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: bastadTheme.typography.fontWeight.semibold,
                          color: bastadTheme.colors.ocean[900],
                        }}
                      >
                        {page.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: bastadTheme.colors.ocean[500],
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 400,
                        }}
                      >
                        {page.content ? stripMarkdown(page.content).substring(0, 80) : 'Inget innehåll'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={page.isPublished ? 'Publicerad' : 'Ej publicerad'}
                        color={page.isPublished ? 'success' : 'default'}
                        size="small"
                        sx={{
                          borderRadius: bastadTheme.borderRadius.lg,
                          fontWeight: bastadTheme.typography.fontWeight.medium,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: bastadTheme.colors.ocean[600] }}>
                        {page.updatedAt ? format(new Date(page.updatedAt), 'dd MMM yyyy', { locale: sv }) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Redigera">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/pages/edit/${page.id}`);
                          }}
                          sx={{
                            color: bastadTheme.colors.ocean[600],
                            '&:hover': { backgroundColor: bastadTheme.colors.ocean[50] },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Radera">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(page);
                          }}
                          sx={{
                            color: bastadTheme.colors.error,
                            '&:hover': { backgroundColor: '#fef2f2' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Empty state — no pages at all */}
      {!loading && pages.length === 0 && (
        <Box sx={{ textAlign: 'center', py: bastadTheme.spacing[8] }}>
          <ArticleIcon sx={{ fontSize: '72px', color: bastadTheme.colors.ocean[400], mb: bastadTheme.spacing[3] }} />
          <Typography variant="h6" sx={{ color: bastadTheme.colors.ocean[600], mb: bastadTheme.spacing[2] }}>
            Inga sidor hittades
          </Typography>
          <Typography variant="body2" sx={{ color: bastadTheme.colors.ocean[500], mb: bastadTheme.spacing[4] }}>
            Kom igång genom att skapa din första sida
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/pages/new')}
            sx={{
              background: bastadTheme.gradients.ctaButton,
              borderRadius: bastadTheme.borderRadius.xl,
              px: bastadTheme.spacing[4],
              py: bastadTheme.spacing[2],
            }}
          >
            Skapa Första Sidan
          </Button>
        </Box>
      )}

      {/* Empty state — filter/search has no matches */}
      {!loading && pages.length > 0 && filteredPages.length === 0 && (
        <Box sx={{ textAlign: 'center', py: bastadTheme.spacing[8] }}>
          <SearchIcon sx={{ fontSize: '48px', color: bastadTheme.colors.ocean[300], mb: bastadTheme.spacing[2] }} />
          <Typography variant="h6" sx={{ color: bastadTheme.colors.ocean[600], mb: bastadTheme.spacing[1] }}>
            Inga sidor matchar
          </Typography>
          <Typography variant="body2" sx={{ color: bastadTheme.colors.ocean[500] }}>
            Prova att ändra sökning eller filter
          </Typography>
        </Box>
      )}

      {/* Dialogs och notifications */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: bastadTheme.borderRadius['2xl'],
            boxShadow: bastadTheme.shadows.xl,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: bastadTheme.typography.fontWeight.semibold,
          color: bastadTheme.colors.ocean[900]
        }}>
          Bekräfta radering
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: bastadTheme.colors.ocean[600] }}>
            Är du säker på att du vill radera sidan "{pageToDelete?.title}"? 
            Den här åtgärden kan inte ångras.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ 
              borderRadius: bastadTheme.borderRadius.lg,
              color: bastadTheme.colors.ocean[600] 
            }}
          >
            Avbryt
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: bastadTheme.borderRadius.lg,
              boxShadow: bastadTheme.shadows.md 
            }}
          >
            Radera
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
          sx={{ 
            borderRadius: bastadTheme.borderRadius.lg,
            boxShadow: bastadTheme.shadows.lg
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PagesList; 