import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  FormControlLabel, 
  Switch,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tab,
  Tabs,
  Checkbox
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import SimpleMDE from 'react-simplemde-editor';
import ReactMarkdown from 'react-markdown';
import { Save as SaveIcon, Preview as PreviewIcon, ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import 'easymde/dist/easymde.min.css';

import { Page } from '../../types/Page';
import pageService from '../../services/pageService';

// Interfacet för våra TabPanel komponenter
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel komponent för att växla mellan redigering och förhandsvisning
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`page-tabpanel-${index}`}
      aria-labelledby={`page-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const PageEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [show, setShow] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const navigate = useNavigate();

  // Hämta sidan om vi är i redigeringsläge
  useEffect(() => {
    if (isEditMode && id) {
      fetchPage(id);
    }
  }, [isEditMode, id]);

  // Hämta sidinnehåll
  const fetchPage = async (pageId: string) => {
    try {
      setLoading(true);
      const page = await pageService.getPageById(pageId);
      
      if (!page) {
        setError('Kunde inte hitta sidan');
        return;
      }
      
      setTitle(page.title);
      setContent(page.content);
      setSlug(page.slug);
      setIsPublished(page.isPublished);
      setShow(page.show !== undefined ? page.show : true);
    } catch (err) {
      setError('Ett fel uppstod vid hämtning av sidan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generera en slug från titeln - med debounce
  useEffect(() => {
    if (!isEditMode && title && !slug) {
      const timerId = setTimeout(() => {
        // Skapa slug från titel om vi är i "skapa ny" läge
        const generatedSlug = title
          .toLowerCase()
          .replace(/[åä]/g, 'a')
          .replace(/[ö]/g, 'o')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        setSlug(generatedSlug);
      }, 500); // Vänta 500ms efter senaste knapptryckningen
      
      return () => clearTimeout(timerId);
    }
  }, [title, slug, isEditMode]);

  // Memoizera SimpleMDE-konfigurationen för att förhindra omrenderings-problem
  const editorOptions = useMemo(() => {
    return {
      spellChecker: false,
      placeholder: 'Skriv innehåll här...',
      status: ['lines', 'words'],
      minHeight: '300px',
      autofocus: false
    };
  }, []);

  // Hantera SimpleMDE redigerarens ändringar
  const handleEditorChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  // Hantera formulärinlämning (spara/skapa sida)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || !slug) {
      setError('Vänligen fyll i alla obligatoriska fält');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const pageData = {
        title,
        content,
        slug,
        isPublished,
        show
      };
      
      let result: Page | null;
      
      if (isEditMode && id) {
        // Uppdatera befintlig sida
        result = await pageService.updatePage(id, pageData);
        
        if (!result) {
          throw new Error('Kunde inte uppdatera sidan');
        }
        
        setSnackbarMessage('Sidan har uppdaterats');
      } else {
        // Skapa ny sida
        result = await pageService.createPage(pageData);
        setSnackbarMessage('Sidan har skapats');
      }
      
      setSnackbarOpen(true);
      
      // Navigera tillbaka till sidlistan efter kort fördröjning
      setTimeout(() => {
        navigate('/admin/pages');
      }, 1500);
    } catch (err) {
      setError('Ett fel uppstod när sidan skulle sparas');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Hantera byte av flikar
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Hantera textfältändringar utan att förlora fokus
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
  }, []);

  const handlePublishedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPublished(e.target.checked);
  }, []);

  // Hantera ändringar av "visa"-kryssrutan
  const handleShowChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShow(e.target.checked);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/admin/pages')}
          sx={{ mr: 2 }}
        >
          Tillbaka
        </Button>
        <Typography variant="h5" component="h2">
          {isEditMode ? 'Redigera sida' : 'Skapa ny sida'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Titel"
                value={title}
                onChange={handleTitleChange}
                margin="normal"
                required
                disabled={saving}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Slug"
                value={slug}
                onChange={handleSlugChange}
                margin="normal"
                required
                disabled={saving}
                helperText="URL-vänlig identifierare för sidan"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublished}
                      onChange={handlePublishedChange}
                      disabled={saving}
                    />
                  }
                  label="Publicerad"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={show}
                      onChange={handleShowChange}
                      disabled={saving}
                      icon={<VisibilityIcon color="disabled" />}
                      checkedIcon={<VisibilityIcon color="primary" />}
                    />
                  }
                  label="Visa i sidlistan"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Redigera" icon={<SaveIcon fontSize="small" />} iconPosition="start" />
                <Tab label="Förhandsgranska" icon={<PreviewIcon fontSize="small" />} iconPosition="start" />
              </Tabs>
              
              <TabPanel value={activeTab} index={0}>
                <SimpleMDE
                  value={content}
                  onChange={handleEditorChange}
                  options={editorOptions}
                />
              </TabPanel>
              
              <TabPanel value={activeTab} index={1}>
                <Paper sx={{ p: 3, minHeight: '300px' }}>
                  {content ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <Typography color="textSecondary">
                      Förhandsgranskning kommer att visas här när du har skrivit något innehåll.
                    </Typography>
                  )}
                </Paper>
              </TabPanel>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/admin/pages')}
                  sx={{ mr: 2 }}
                  disabled={saving}
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Sparar...' : 'Spara'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

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

export default PageEditor; 