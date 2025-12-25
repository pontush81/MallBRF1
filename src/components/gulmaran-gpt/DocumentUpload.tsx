import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { gulmaranGPTAuthContext as gulmaranGPT, type Document } from '../../services/gulmaran-gpt-auth-context';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  onUploadComplete?: (document: Document) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docDate, setDocDate] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log('onDrop called:', { acceptedFiles, rejectedFiles });
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      console.log('File rejected:', rejection);
      console.log('Rejection errors:', rejection.errors);
      rejection.errors.forEach((error: any, index: number) => {
        console.log(`Error ${index + 1}:`, error.code, error.message);
      });
      
      // Try to accept the file anyway if it's just MIME type issues
      const file = rejection.file;
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const validExtensions = ['.pdf', '.txt', '.docx'];
      
      if (validExtensions.includes(fileExtension) && file.size <= 10 * 1024 * 1024) {
        console.log('Overriding rejection - file has valid extension and size');
        setSelectedFile(file);
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        setShowDialog(true);
        return;
      }
      
      const errorMessage = rejection.errors[0]?.message || 'Filen kunde inte accepteras';
      toast.error(errorMessage);
      return;
    }

    // Handle accepted files
    const file = acceptedFiles[0];
    if (file) {
      console.log('File accepted:', file.name, file.type, file.size);
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      setShowDialog(true);
    } else {
      console.log('No files in acceptedFiles array');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Remove strict MIME type checking - accept all files and validate manually
    accept: undefined,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    // Custom validator that only checks file extension and size
    validator: (file) => {
      console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Check if file.name exists
      if (!file.name) {
        return {
          code: 'file-invalid-name',
          message: 'Filnamn saknas'
        };
      }
      
      const validExtensions = ['.pdf', '.txt', '.docx', '.xlsx', '.csv', '.pptx', '.html', '.rtf', '.epub'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        return {
          code: 'file-invalid-type',
          message: `Filtyp ${fileExtension} stöds inte. Stödda format: PDF, TXT, DOCX, XLSX, CSV, PPTX, HTML, RTF, EPUB.`
        };
      }
      
      if (file.size > 50 * 1024 * 1024) {
        return {
          code: 'file-too-large',
          message: 'Filen är för stor. Max 50MB tillåtet.'
        };
      }
      
      return null;
    }
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    console.log('🚀 Starting upload for:', selectedFile.name);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      console.log('📤 Calling gulmaranGPT.uploadDocument...');
      const result = await gulmaranGPT.uploadDocument(
        selectedFile,
        title || undefined,
        docDate || undefined
      );
      console.log('✅ Upload result:', result);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Dokument uppladdad! Bearbetning påbörjas...');
      
      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDocDate('');
      setShowDialog(false);

      if (onUploadComplete) {
        // We don't have the full document object, so we'll need to fetch it
        // or pass what we have
        onUploadComplete({
          id: result.documentId,
          title: title || selectedFile.name,
          filename: selectedFile.name,
          filetype: getFileType(selectedFile.type),
          created_at: new Date().toISOString(),
          doc_date: docDate || null,
          visibility: 'admin',
          storage_path: '',
          pages: null,
          file_size: selectedFile.size,
          processing_status: 'pending',
          processing_error: null,
          uploaded_by: '',
          updated_at: new Date().toISOString(),
        } as Document);
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      // Show specific error message for session expiry
      if (error instanceof Error && error.message?.includes('Session expired')) {
        toast.error('Session har gått ut - logga ut och in igen för att använda Gulmåran-GPT');
      } else {
        toast.error(error instanceof Error ? error.message : 'Uppladdning misslyckades');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'text/plain') return 'txt';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx';
    if (mimeType === 'text/csv') return 'csv';
    if (mimeType === 'text/html') return 'html';
    if (mimeType === 'application/rtf') return 'rtf';
    if (mimeType === 'application/epub+zip') return 'epub';
    return 'unknown';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCloseDialog = () => {
    if (!uploading) {
      setShowDialog(false);
      setSelectedFile(null);
      setTitle('');
      setDocDate('');
    }
  };

  return (
    <>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'primary.50' : 'grey.50',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Släpp filen här...' : 'Dra och släpp en fil här'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          eller klicka för att välja fil
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Stödda format: PDF, TXT, DOCX, XLSX, CSV, PPTX, HTML, RTF, EPUB (max 50MB)
        </Typography>
      </Paper>

      {/* Backup file input if dropzone fails */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Problem med drag-and-drop? Använd denna knapp:
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadIcon />}
        >
          Välj fil
          <input
            type="file"
            hidden
            accept=".pdf,.txt,.docx,.xlsx,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                console.log('Backup file input used:', file.name, file.type, file.size);
                setSelectedFile(file);
                setTitle(file.name.replace(/\.[^/.]+$/, ''));
                setShowDialog(true);
              }
            }}
          />
        </Button>
      </Box>

      <Dialog 
        open={showDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={uploading}
      >
        <DialogTitle>
          Ladda upp dokument
          {!uploading && (
            <IconButton
              onClick={handleCloseDialog}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        
        <DialogContent>
          {selectedFile && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FileIcon color="primary" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(selectedFile.size)} • {getFileType(selectedFile.type).toUpperCase()}
                  </Typography>
                </Box>
                <Chip 
                  label={getFileType(selectedFile.type).toUpperCase()} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            label="Dokumenttitel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            disabled={uploading}
            helperText="Lämna tom för att använda filnamnet"
          />

          <TextField
            fullWidth
            label="Dokumentdatum"
            type="date"
            value={docDate}
            onChange={(e) => setDocDate(e.target.value)}
            margin="normal"
            disabled={uploading}
            InputLabelProps={{ shrink: true }}
            helperText="Valfritt - t.ex. protokolldatum"
          />

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Laddar upp dokument...
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {uploadProgress}%
              </Typography>
            </Box>
          )}

          {uploading && uploadProgress >= 90 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Dokumentet bearbetas och indexeras för sökning. Detta kan ta några minuter.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            disabled={uploading}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={<UploadIcon />}
          >
            {uploading ? 'Laddar upp...' : 'Ladda upp'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentUpload;
