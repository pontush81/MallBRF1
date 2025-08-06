import React, { useState, useEffect } from 'react';
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
  Grid,
  Stack
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  Article as ArticleIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

import { Page } from '../../types/Page';
import pageServiceSupabase from '../../services/pageServiceSupabase';
import { ModernCard } from '../../components/common/ModernCard';
import { modernTheme } from '../../theme/modernTheme';

const PagesList: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const navigate = useNavigate();

  // Hämta alla sidor vid komponentmontering
  useEffect(() => {
    fetchPages();
  }, []);

  // Funktion för att hämta sidor
  const fetchPages = async () => {
    try {
      setLoading(true);
      const allPages = await pageServiceSupabase.getAllPages();
      setPages(allPages);
      setError(null);
    } catch (err) {
      setError('Ett fel uppstod vid hämtning av sidor');
      console.error(err);
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

    try {
      await pageServiceSupabase.deletePage(pageToDelete.id);
      setSnackbarMessage('Sidan har raderats');
      setSnackbarOpen(true);
      fetchPages(); // Uppdatera listan
    } catch (err) {
      setSnackbarMessage('Ett fel uppstod vid radering av sidan');
      setSnackbarOpen(true);
    } finally {
      setDeleteDialogOpen(false);
      setPageToDelete(null);
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
        <CircularProgress size={60} sx={{ color: modernTheme.colors.primary[500] }} />
      </Box>
    );
  }

  if (error) {
    return (
      <ModernCard>
        <Alert severity="error" sx={{ borderRadius: modernTheme.borderRadius.lg }}>
          {error}
        </Alert>
      </ModernCard>
    );
  }

  return (
    <Box>
      {/* Header med titel och knapp */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: modernTheme.spacing[6]
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: modernTheme.typography.fontWeight.bold,
              color: modernTheme.colors.gray[900],
              mb: modernTheme.spacing[1]
            }}
          >
            Hantera Sidor
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ color: modernTheme.colors.gray[600] }}
          >
            Skapa, redigera och hantera dina webbsidor
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/pages/new')}
          sx={{
            background: modernTheme.gradients.accent,
            borderRadius: modernTheme.borderRadius.xl,
            px: modernTheme.spacing[4],
            py: modernTheme.spacing[2],
            boxShadow: modernTheme.shadows.lg,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: modernTheme.shadows.xl,
            }
          }}
        >
          Skapa Ny Sida
        </Button>
      </Box>

      {/* Grid med sidor */}
      <Grid container spacing={3}>
        {pages.map((page) => (
          <Grid item xs={12} sm={6} lg={4} key={page.id}>
            <ModernCard hover onClick={() => navigate(`/admin/pages/edit/${page.id}`)}>
              <Box>
                {/* Header med ikon och status */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: modernTheme.spacing[3]
                }}>
                  <Box sx={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: modernTheme.borderRadius.xl,
                    background: modernTheme.gradients.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: modernTheme.spacing[2]
                  }}>
                    <ArticleIcon sx={{ color: 'white', fontSize: '24px' }} />
                  </Box>
                  <Chip
                    label={page.isPublished ? 'Publicerad' : 'Ej publicerad'}
                    color={page.isPublished ? 'success' : 'default'}
                    size="small"
                    sx={{ 
                      borderRadius: modernTheme.borderRadius.lg,
                      fontWeight: modernTheme.typography.fontWeight.medium
                    }}
                  />
                </Box>

                {/* Titel */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: modernTheme.typography.fontWeight.semibold,
                    color: modernTheme.colors.gray[900],
                    mb: modernTheme.spacing[2],
                    lineHeight: modernTheme.typography.lineHeight.tight
                  }}
                >
                  {page.title}
                </Typography>

                {/* Content preview */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: modernTheme.colors.gray[600],
                    mb: modernTheme.spacing[3],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4
                  }}
                >
                  {page.content ? page.content.substring(0, 120) + '...' : 'Ingen innehåll'}
                </Typography>

                {/* Footer med datum och actions */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  pt: modernTheme.spacing[3],
                  borderTop: `1px solid ${modernTheme.colors.gray[200]}`
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ 
                      fontSize: '16px', 
                      color: modernTheme.colors.gray[500] 
                    }} />
                    <Typography 
                      variant="caption" 
                      sx={{ color: modernTheme.colors.gray[500] }}
                    >
                      {page.updatedAt ? format(new Date(page.updatedAt), 'dd MMM yyyy', { locale: sv }) : 'Okänt datum'}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/pages/edit/${page.id}`);
                      }}
                      sx={{ 
                        color: modernTheme.colors.primary[600],
                        '&:hover': { 
                          backgroundColor: modernTheme.colors.primary[50] 
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(page);
                      }}
                      sx={{ 
                        color: modernTheme.colors.error[600],
                        '&:hover': { 
                          backgroundColor: modernTheme.colors.error[50] 
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>
            </ModernCard>
          </Grid>
        ))}
      </Grid>

      {/* Tom-tillstånd */}
      {pages.length === 0 && (
        <ModernCard>
          <Box sx={{ 
            textAlign: 'center', 
            py: modernTheme.spacing[8] 
          }}>
            <ArticleIcon sx={{ 
              fontSize: '72px', 
              color: modernTheme.colors.gray[400],
              mb: modernTheme.spacing[3]
            }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: modernTheme.colors.gray[600],
                mb: modernTheme.spacing[2]
              }}
            >
              Inga sidor hittades
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: modernTheme.colors.gray[500],
                mb: modernTheme.spacing[4]
              }}
            >
              Kom igång genom att skapa din första sida
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/pages/new')}
              sx={{
                background: modernTheme.gradients.accent,
                borderRadius: modernTheme.borderRadius.xl,
                px: modernTheme.spacing[4],
                py: modernTheme.spacing[2],
              }}
            >
              Skapa Första Sidan
            </Button>
          </Box>
        </ModernCard>
      )}

      {/* Dialogs och notifications */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: modernTheme.borderRadius['2xl'],
            boxShadow: modernTheme.shadows.xl,
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: modernTheme.typography.fontWeight.semibold,
          color: modernTheme.colors.gray[900]
        }}>
          Bekräfta radering
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: modernTheme.colors.gray[600] }}>
            Är du säker på att du vill radera sidan "{pageToDelete?.title}"? 
            Den här åtgärden kan inte ångras.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ 
              borderRadius: modernTheme.borderRadius.lg,
              color: modernTheme.colors.gray[600] 
            }}
          >
            Avbryt
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: modernTheme.borderRadius.lg,
              boxShadow: modernTheme.shadows.md 
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
            borderRadius: modernTheme.borderRadius.lg,
            boxShadow: modernTheme.shadows.lg
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PagesList; 