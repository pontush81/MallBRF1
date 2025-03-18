import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
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
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

import { Page } from '../../types/Page';
import pageService from '../../services/pageService';

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
      const allPages = await pageService.getAllPages();
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
      setLoading(true);
      const success = await pageService.deletePage(pageToDelete.id);
      
      if (success) {
        setPages(pages.filter(p => p.id !== pageToDelete.id));
        setSnackbarMessage(`Sidan "${pageToDelete.title}" har raderats`);
        setSnackbarOpen(true);
      } else {
        setError('Ett fel uppstod vid radering av sidan');
      }
    } catch (err) {
      setError('Ett fel uppstod vid radering av sidan');
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setPageToDelete(null);
    }
  };

  // Navigera till sideditorn för att redigera sida
  const handleEditClick = (pageId: string) => {
    navigate(`/admin/pages/edit/${pageId}`);
  };

  // Navigera till sideditorn för att skapa en ny sida
  const handleCreateClick = () => {
    navigate('/admin/pages/new');
  };

  // Navigera för att visa sidan på frontend
  const handleViewClick = (slug: string) => {
    window.open(`/page/${slug}`, '_blank');
  };

  // Formatera datum
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: sv });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Hantera sidor
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Skapa ny sida
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && pages.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Titel</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Senast uppdaterad</TableCell>
                <TableCell align="right">Åtgärder</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>{page.title}</TableCell>
                  <TableCell>{page.slug}</TableCell>
                  <TableCell>
                    <Chip 
                      label={page.isPublished ? 'Publicerad' : 'Utkast'} 
                      color={page.isPublished ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatDate(page.updatedAt || '')}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditClick(page.id)}
                      title="Redigera"
                    >
                      <EditIcon />
                    </IconButton>
                    {page.isPublished && (
                      <IconButton 
                        color="info" 
                        onClick={() => handleViewClick(page.slug)}
                        title="Visa"
                      >
                        <ViewIcon />
                      </IconButton>
                    )}
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteClick(page)}
                      title="Radera"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {pages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      Inga sidor hittades. Skapa din första sida genom att klicka på "Skapa ny sida".
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog för radering av sida */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Bekräfta radering</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Är du säker på att du vill radera sidan "{pageToDelete?.title}"? Denna åtgärd kan inte ångras.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Avbryt
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Radera
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar för feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PagesList; 