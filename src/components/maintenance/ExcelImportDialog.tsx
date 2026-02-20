import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { PlanRow } from '../../services/maintenancePlanService';
import { parseExcelFile, ImportResult } from '../../services/excelImportService';

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: PlanRow[]) => void;
}

export default function ExcelImportDialog({ open, onClose, onImport }: ExcelImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelFile(buffer);
      setResult(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett okänt fel uppstod vid inläsning av filen.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!result) return;
    onImport(result.rows);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Importera underhållsplan från Excel</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={handleFileSelect}
          />
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            fullWidth
            sx={{ py: 1.5, mb: 2 }}
          >
            {fileName ? fileName : 'Välj Excel-fil (.xlsx / .xls)'}
          </Button>

          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Läser filen...
              </Typography>
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Preview */}
          {result && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Förhandsvisning
              </Typography>
              <Box sx={{ pl: 1, mb: 1 }}>
                <Typography variant="body2">
                  Sektioner: <strong>{result.sectionCount}</strong>
                </Typography>
                <Typography variant="body2">
                  Poster: <strong>{result.itemCount}</strong>
                </Typography>
                {result.yearRange && (
                  <Typography variant="body2">
                    År: <strong>{result.yearRange.start} – {result.yearRange.end}</strong>
                  </Typography>
                )}
              </Box>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Varningar ({result.warnings.length})
                  </Typography>
                  {result.warnings.map((w, i) => (
                    <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                      - {w}
                    </Typography>
                  ))}
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Avbryt</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!result || result.rows.length === 0}
        >
          Importera {result ? `${result.rows.length} poster` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
