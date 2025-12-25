import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Description as FileIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Sync as ProcessingIcon,
} from '@mui/icons-material';
import { gulmaranGPTAuthContext as gulmaranGPT, type Document } from '../../services/gulmaran-gpt-auth-context';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface DocumentListProps {
  refreshTrigger?: number;
}

const DocumentList: React.FC<DocumentListProps> = ({ refreshTrigger }) => {
  console.log('🔄 DocumentList component mounted');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; document: Document | null }>({
    open: false,
    document: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading documents...');
      const docs = await gulmaranGPT.getDocuments();
      console.log('✅ Documents loaded:', docs.length);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      
      // Show specific error message
      if (error.message?.includes('timeout')) {
        toast.error('Timeout vid laddning av dokument - försök igen');
      } else if (error.message?.includes('Session expired')) {
        toast.error('Session har gått ut - logga ut och in igen för att använda Gulmåran-GPT');
      } else if (error.message?.includes('authenticated')) {
        toast.error('Autentisering krävs - logga in igen');
      } else {
        toast.error('Kunde inte ladda dokument: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 DocumentList useEffect triggered, refreshTrigger:', refreshTrigger);
    loadDocuments();
  }, [refreshTrigger]);

  // Subscribe to real-time updates (disabled to prevent re-mounting issues)
  // useEffect(() => {
  //   const subscription = gulmaranGPT.subscribeToDocumentUpdates((updatedDocuments) => {
  //     setDocuments(updatedDocuments);
  //   });

  //   return () => {
  //     subscription();
  //   };
  // }, []);

  // Auto-refresh for processing documents (with stable reference)
  useEffect(() => {
    const hasProcessingDocs = documents.some(doc => 
      doc.processing_status === 'processing' || doc.processing_status === 'pending'
    );

    if (hasProcessingDocs) {
      console.log('📊 Found processing documents, setting up auto-refresh...');
      const interval = setInterval(async () => {
        console.log('🔄 Auto-refreshing documents due to processing status...');
        try {
          const updatedDocs = await gulmaranGPT.getDocuments();
          setDocuments(updatedDocs);
        } catch (error) {
          console.error('❌ Auto-refresh failed:', error);
        }
      }, 15000); // Refresh every 15 seconds (less frequent to reduce load)

      return () => {
        console.log('🛑 Clearing auto-refresh interval');
        clearInterval(interval);
      };
    }
  }, [documents.filter(d => d.processing_status === 'processing' || d.processing_status === 'pending').length]); // Only re-run if count of processing documents changes

  const handleDelete = async () => {
    if (!deleteDialog.document) return;

    setDeleting(true);
    try {
      await gulmaranGPT.deleteDocument(deleteDialog.document.id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDialog.document!.id));
      toast.success('Dokument raderat');
      setDeleteDialog({ open: false, document: null });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Kunde inte radera dokument');
    } finally {
      setDeleting(false);
    }
  };

  const handleProcessDocuments = async () => {
    setProcessing(true);
    try {
      await gulmaranGPT.triggerDocumentProcessing();
      toast.success('Dokumentbearbetning startad');
      // Refresh documents after a short delay
      setTimeout(() => {
        loadDocuments();
      }, 2000);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Kunde inte starta dokumentbearbetning');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenDocument = async (document: Document) => {
    try {
      const signedUrl = await gulmaranGPT.getSignedUrl(document.storage_path);
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      toast.error('Kunde inte öppna dokument');
    }
  };

  const getStatusIcon = (status: Document['processing_status']) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" {...iconProps} />;
      case 'processing':
        return <CircularProgress size={20} color="primary" />;
      case 'pending':
        return <PendingIcon color="warning" {...iconProps} />;
      case 'failed':
        return <ErrorIcon color="error" {...iconProps} />;
      default:
        return <PendingIcon {...iconProps} />;
    }
  };

  const getStatusColor = (status: Document['processing_status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: Document['processing_status']) => {
    switch (status) {
      case 'completed':
        return 'Klar';
      case 'processing':
        return 'Bearbetar';
      case 'pending':
        return 'Väntar';
      case 'failed':
        return 'Misslyckad';
      default:
        return 'Okänd';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: sv });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Uppladdade dokument</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleProcessDocuments}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={16} /> : undefined}
            >
              {processing ? 'Bearbetar...' : 'Bearbeta väntande'}
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadDocuments}
              disabled={loading}
            >
              Uppdatera
            </Button>
          </Box>
        </Box>

        {documents.length === 0 ? (
          <Alert severity="info">
            Inga dokument uppladdade än. Ladda upp ditt första dokument för att komma igång.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dokument</TableCell>
                  <TableCell>Typ</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Storlek</TableCell>
                  <TableCell>Datum</TableCell>
                  <TableCell>Uppladdad</TableCell>
                  <TableCell align="right">Åtgärder</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileIcon color="primary" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {document.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {document.filename}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={document.filetype.toUpperCase()} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        minHeight: '32px' // Ensure consistent height
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px'
                        }}>
                          {getStatusIcon(document.processing_status)}
                        </Box>
                        <Chip
                          label={getStatusText(document.processing_status)}
                          size="small"
                          color={getStatusColor(document.processing_status) as any}
                          variant="outlined"
                        />
                      </Box>
                      {document.processing_status === 'failed' && document.processing_error && (
                        <Tooltip title={document.processing_error}>
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            Fel: {document.processing_error.substring(0, 50)}...
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(document.file_size)}
                      </Typography>
                      {document.pages && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {document.pages} sidor
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {document.doc_date 
                          ? format(new Date(document.doc_date), 'dd MMM yyyy', { locale: sv })
                          : '—'
                        }
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(document.created_at)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Öppna dokument">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDocument(document)}
                              disabled={document.processing_status !== 'completed'}
                            >
                              <OpenIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Radera dokument">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteDialog({ open: true, document })}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog.open} onClose={() => !deleting && setDeleteDialog({ open: false, document: null })}>
        <DialogTitle>Radera dokument</DialogTitle>
        <DialogContent>
          <Typography>
            Är du säker på att du vill radera dokumentet "{deleteDialog.document?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Detta kommer att ta bort dokumentet och alla associerade textchunkar permanent.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, document: null })} disabled={deleting}>
            Avbryt
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? 'Raderar...' : 'Radera'}
          </Button>
        </DialogActions>
      </Dialog>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default DocumentList;
