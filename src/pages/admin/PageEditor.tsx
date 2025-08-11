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
  Tab,
  Tabs,
  Checkbox,
  Card,
  CardMedia,
  CardContent,
  CardActions
} from '@mui/material';
import { StandardLoading } from '../../components/common/StandardLoading';
import { useNavigate, useParams } from 'react-router-dom';
import SimpleMDE from 'react-simplemde-editor';
import ReactMarkdown from 'react-markdown';
import { 
  Save as SaveIcon, 
  Preview as PreviewIcon, 
  ArrowBack as ArrowBackIcon, 
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import 'easymde/dist/easymde.min.css';
import '../../styles/PageEditor.css';

import { Page, FileInfo } from '../../types/Page';
import pageServiceSupabase from '../../services/pageServiceSupabase';

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
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  
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
      const page = await pageServiceSupabase.getPageById(pageId);
      
      if (!page) {
        setError('Kunde inte hitta sidan');
        return;
      }
      
      setTitle(page.title);
      setContent(page.content);
      setSlug(page.slug);
      setIsPublished(page.isPublished);
      setShow(page.show !== undefined ? page.show : true);
      setFiles(page.files || []);
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
    console.log('🔧 Creating SimpleMDE editor options...');
    const options = {
      spellChecker: false,
      placeholder: 'Skriv innehåll här...',
      status: ['lines', 'words', 'cursor'] as any,
      autofocus: false,
      autoDownloadFontAwesome: true,
      toolbar: [
        'bold',
        'italic',
        'heading-1',
        'heading-2', 
        'heading-3',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        'image',
        'table',
        '|',
        'preview',
        'side-by-side',
        'fullscreen',
        '|',
        'guide'
      ] as any
    } as any;
    
    console.log('🔧 SimpleMDE options created:', options);
    console.log('🔧 Toolbar config:', options.toolbar);
    return options;
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
        show,
        files
      };
      
      let result: Page | null;
      
      if (isEditMode && id) {
        // Uppdatera befintlig sida
        result = await pageServiceSupabase.updatePage(id, pageData);
        
        if (!result) {
          throw new Error('Kunde inte uppdatera sidan');
        }
        
        setSnackbarMessage('Sidan har uppdaterats');
      } else {
        // Skapa ny sida
        result = await pageServiceSupabase.createPage(pageData);
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

  // Hantera filuppladdning
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setLoading(true);
      setError(null);

      // Validera filen innan uppladdning
      if (file.size === 0) {
        throw new Error('Filen är tom (0 bytes). Välj en annan fil.');
      }

      // Kontrollera filtyp
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Filtypen ${file.type} stöds inte. Endast bilder och PDF-filer är tillåtna.`);
      }

      // Kontrollera filstorlek (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`Filen är för stor (${(file.size / 1024 / 1024).toFixed(2)}MB). Max filstorlek är 10MB.`);
      }

      console.log('Starting file upload for:', file.name);
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const response = await pageServiceSupabase.uploadFile(id, file);
      console.log('Upload response:', response);

              if (!response || !response.originalName || !response.url) {
          throw new Error('Kunde inte ladda upp filen: Ogiltig svarsdata');
        }

        console.log('File uploaded successfully:', response.originalName);
        alert(`Filen "${response.originalName}" har laddats upp framgångsrikt!`);
      
      setSnackbarMessage('Filen har laddats upp');
      setSnackbarOpen(true);

      // Rensa fil-inputen
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      setError(null);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid uppladdning av filen');
    } finally {
      setLoading(false);
      // Rensa filinputen
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Hantera radering av fil
  const handleDeleteFile = async (fileId: string) => {
    if (!id) {
      console.error('No page ID available');
      return;
    }

    try {
      setUploadLoading(true);
      console.log('Attempting to delete file:', { pageId: id, fileId });
      
      await pageServiceSupabase.deleteFile(id, fileId);
      
      // Update local state
      setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
      setSnackbarMessage('Filen har raderats');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(error instanceof Error ? error.message : 'Kunde inte radera filen. Försök igen senare.');
    } finally {
      setUploadLoading(false);
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

  // Få rätt ikon baserat på filtyp
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <ImageIcon />;
    } else if (mimetype === 'application/pdf') {
      return <PdfIcon />;
    } else {
      return <AttachFileIcon />;
    }
  };

  // Rendera filbiblioteket
  const renderFileLibrary = () => {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          Filbibliotek
        </Typography>
        
        {isEditMode ? (
          <Button
            variant="contained"
            component="label"
            startIcon={<AttachFileIcon />}
            disabled={saving || uploadLoading}
            sx={{ mb: 2 }}
          >
            Ladda upp fil
            <input
              type="file"
              hidden
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/gif,application/pdf"
            />
          </Button>
        ) : (
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Spara sidan först för att kunna ladda upp filer.
          </Typography>
        )}
        
        {uploadLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <StandardLoading size={24} variant="minimal" />
            <Typography sx={{ ml: 1 }}>Arbetar med filer...</Typography>
          </Box>
        )}
        
        {files.length === 0 ? (
          <Typography color="textSecondary">
            Inga filer har laddats upp ännu.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {files.map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card>
                  {file.mimetype.startsWith('image/') ? (
                    <CardMedia
                      component="img"
                      height="180"
                      image={file.url}
                      alt={file.originalName}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'action.hover'
                      }}
                    >
                      {getFileIcon(file.mimetype)}
                    </Box>
                  )}
                  <CardContent sx={{ pt: 1, pb: 1 }}>
                    <Typography noWrap title={file.originalName}>
                      {file.originalName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(file.size / 1024).toFixed(1)} KB
                    </Typography>
                  </CardContent>
                  <CardActions disableSpacing>
                    <Button 
                      size="small" 
                      component="a"
                      href={file.url}
                      target="_blank"
                    >
                      Visa
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteFile(file.id || file.filename)}
                      disabled={uploadLoading}
                    >
                      Ta bort
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <StandardLoading message="Loading page editor..." />
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
              
              {renderFileLibrary()}
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