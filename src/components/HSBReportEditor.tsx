import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextNew';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tooltip,
  Snackbar,

  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Email as EmailIcon,
  Restore as RestoreIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

interface HSBReportData {
  apartmentNumber: string;
  resident: string;
  email: string;
  phone: string;
  period?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface ResidentData {
  apartmentNumber: string;
  resident: string;
  phone: string;
  email: string;
  parkingSpace: string;
  storageSpace: string;
}

interface HSBReportEditorProps {
  onClose?: () => void;
  onSent?: (message: string) => void;
}

const HSBReportEditor: React.FC<HSBReportEditorProps> = ({ onClose, onSent }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [originalHsbData, setOriginalHsbData] = useState<HSBReportData[]>([]);
  const [editableHsbData, setEditableHsbData] = useState<HSBReportData[]>([]);
  const [residentData, setResidentData] = useState<ResidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<'pdf' | 'email' | 'reset' | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'warning' | 'error'}>({
    open: false, message: '', severity: 'success'
  });
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  // Month/Year selection state - Default to July 2025 for testing
  const [selectedMonth, setSelectedMonth] = useState<number>(7);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const currentDate = new Date();
  const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
  
  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear]);

    const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../config');

      const reporterName = encodeURIComponent(currentUser?.name || currentUser?.email || 'Okänd användare');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/hsb-form-v2?format=preview&month=${selectedMonth}&year=${selectedYear}&reporterName=${reporterName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hsbData && data.residentData) {
          console.log('Successfully fetched HSB data for editing:', data.hsbData.length, 'items');
          console.log('HSB Data details:', data.hsbData);
          setOriginalHsbData(data.hsbData);
          setEditableHsbData([...data.hsbData]); // Create a copy for editing
          setResidentData(data.residentData);
          return;
        }
      }
      
      // Fallback to mock data if API fails
      console.log('HSB API not available, using mock data for editing');
      const mockData = await generateMockData();
      setOriginalHsbData(mockData.hsbData);
      setEditableHsbData([...mockData.hsbData]);
      setResidentData(mockData.residentData);
      
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid laddning');
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockHsbData = [
      {
        apartmentNumber: '1A',
        resident: 'Test Testsson',
        email: 'test1@example.com',
        phone: '070XXXXXXX',
        period: '2 juli',
        description: 'Hyra gästlägenhet',
        quantity: 1,
        unitPrice: 600.00,
        totalAmount: 600.00
      },
      {
        apartmentNumber: '2B',
        resident: 'Anna Andersson',
        email: 'test2@example.com',
        phone: '070XXXXXXX',
        period: '2 juli',
        description: 'Parkering',
        quantity: 1,
        unitPrice: 75.00,
        totalAmount: 75.00
      }
    ];

    const mockResidentData = [
      {
        apartmentNumber: '1, Lägenhet A',
        resident: 'Test Testsson, Maria Testsson',
        phone: '070XXXXXXX',
        email: 'test1@example.com',
        parkingSpace: '1',
        storageSpace: '1'
      },
      {
        apartmentNumber: '2, Lägenhet B', 
        resident: 'Anna Andersson, Björn Andersson',
        phone: '070XXXXXXX',
        email: 'test2@example.com',
        parkingSpace: '2',
        storageSpace: '2'
      }
    ];

    return { hsbData: mockHsbData, residentData: mockResidentData };
  };

  // Inline validation function
  const validateField = (field: keyof HSBReportData, value: string | number, index: number): string | null => {
    const fieldKey = `${index}-${field}`;
    
    switch (field) {
      case 'apartmentNumber':
        if (!String(value).trim()) {
          return 'Lägenhetsnummer krävs';
        }
        break;
      case 'resident':
        if (!String(value).trim()) {
          return 'Namn krävs';
        }
        break;
      case 'quantity':
        const qty = Number(value);
        if (isNaN(qty) || qty <= 0) {
          return 'Antal måste vara större än 0';
        }
        break;
      case 'unitPrice':
        const price = Number(value);
        if (isNaN(price) || price <= 0) {
          return 'Pris måste vara större än 0';
        }
        if (price > 2000) {
          return 'Ovanligt högt pris - kontrollera värdet';
        }
        break;
      case 'description':
        if (!String(value).trim()) {
          return 'Beskrivning krävs';
        }
        break;
    }
    return null;
  };

  // Clear field error
  const clearFieldError = (index: number, field: keyof HSBReportData) => {
    const fieldKey = `${index}-${field}`;
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldKey];
      return newErrors;
    });
  };

  // Set field error
  const setFieldError = (index: number, field: keyof HSBReportData, error: string) => {
    const fieldKey = `${index}-${field}`;
    setFieldErrors(prev => ({
      ...prev,
      [fieldKey]: error
    }));
  };

  const handleFieldChange = useCallback((index: number, field: keyof HSBReportData, value: string | number) => {
    // Validate field
    const error = validateField(field, value, index);
    if (error) {
      setFieldError(index, field, error);
    } else {
      clearFieldError(index, field);
    }

    setEditableHsbData(prev => {
      const newData = [...prev];
      const item = { ...newData[index] };
      
      if (field === 'quantity' || field === 'unitPrice') {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        (item as any)[field] = numValue;
        
        // Recalculate total amount
        item.totalAmount = item.quantity * item.unitPrice;
      } else {
        (item as any)[field] = value;
      }
      
      newData[index] = item;
      return newData;
    });
    
    setIsModified(true);
  }, []);

  const handleAddRow = () => {
    const newRow: HSBReportData = {
      apartmentNumber: '',
      resident: '',
      email: '',
      phone: '',
      period: '',
      description: 'Hyra gästlägenhet',
      quantity: 1,
      unitPrice: 600,
      totalAmount: 600
    };
    
    setEditableHsbData(prev => [...prev, newRow]);
    setIsModified(true);
    setEditingRow(editableHsbData.length); // Start editing the new row
  };

  const handleDeleteRow = (index: number) => {
    setEditableHsbData(prev => prev.filter((_, i) => i !== index));
    setIsModified(true);
    if (editingRow === index) {
      setEditingRow(null);
    }
  };

  const handleResetData = () => {
    setEditableHsbData([...originalHsbData]);
    setIsModified(false);
    setEditingRow(null);
    setConfirmDialog(null);
    showSnackbar('Data återställd till ursprunglig', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'warning' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle period change with unsaved changes warning
  const handlePeriodChange = (newMonth: number, newYear: number) => {
    if (isModified) {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Du har osparade ändringar för ${monthNames[selectedMonth - 1]} ${selectedYear}.\nVill du byta till ${monthNames[newMonth - 1]} ${newYear}? Osparade ändringar går förlorade.`
      );
      
      if (!confirmed) {
        return; // User cancelled, don't change period
      }
    }
    
    // Change period and reload data
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setIsModified(false); // Reset modification state
    setEditingRow(null); // Exit edit mode
    setFieldErrors({}); // Clear field errors
  };

  const validateData = (): string[] => {
    const errors: string[] = [];
    
    editableHsbData.forEach((item, index) => {
      if (!item.apartmentNumber.trim()) {
        errors.push(`Rad ${index + 1}: Lägenhetsnummer saknas`);
      }
      if (!item.resident.trim()) {
        errors.push(`Rad ${index + 1}: Namn saknas`);
      }
      if (item.quantity <= 0) {
        errors.push(`Rad ${index + 1}: Antal måste vara större än 0`);
      }
      if (item.unitPrice <= 0) {
        errors.push(`Rad ${index + 1}: Pris måste vara större än 0`);
      }
    });
    
    return errors;
  };

  const handleGeneratePDF = async () => {
    const errors = validateData();
    if (errors.length > 0) {
      setError(`Validering misslyckades:\n${errors.join('\n')}`);
      return;
    }

    try {
      setSaving(true);
      
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../config');
      // Use selected month and year from state
      const reporterName = encodeURIComponent(currentUser?.name || currentUser?.email || 'Okänd användare');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/hsb-form-v2?format=pdf&month=${selectedMonth}&year=${selectedYear}&reporterName=${reporterName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HSB-rapport-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSnackbar('PDF skapad och nedladdad', 'success');
        setConfirmDialog(null);
      } else {
        throw new Error('Kunde inte skapa PDF');
      }
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid PDF-skapande');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    const errors = validateData();
    if (errors.length > 0) {
      setError(`Validering misslyckades:\n${errors.join('\n')}`);
      return;
    }

    try {
      setSaving(true);
      
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../config');
      // Use selected month and year from state
      const response = await fetch(`${SUPABASE_URL}/functions/v1/hsb-form-v2?format=pdf&sendEmail=true&month=${selectedMonth}&year=${selectedYear}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        }
      });

      if (response.ok) {
        onSent?.('HSB-rapporten har skickats till HSB och administratören via e-post');
        showSnackbar('Rapport skickad via e-post', 'success');
        setConfirmDialog(null);
      } else {
        throw new Error('Kunde inte skicka e-post');
      }
      
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid e-postsändning');
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = editableHsbData.reduce((sum, item) => sum + item.totalAmount, 0);

  // Group data by apartment for subtotals
  const apartmentGroups = editableHsbData.reduce((groups: Record<string, HSBReportData[]>, item) => {
    const apt = item.apartmentNumber || '0';
    if (!groups[apt]) {
      groups[apt] = [];
    }
    groups[apt].push(item);
    return groups;
  }, {});

  // Create array with items and subtotal markers
  const getTableRowsWithSubtotals = () => {
    const rows: Array<{ type: 'data' | 'subtotal', item?: HSBReportData, apartmentNumber?: string, subtotal?: number, resident?: string }> = [];
    
    // Sort apartments numerically
    const sortedApartments = Object.keys(apartmentGroups).sort((a, b) => {
      const numA = parseInt(a) || 999;
      const numB = parseInt(b) || 999;
      return numA - numB;
    });

    sortedApartments.forEach(apt => {
      const items = apartmentGroups[apt];
      
      // Add all items for this apartment
      items.forEach(item => {
        rows.push({ type: 'data', item });
      });
      
      // Add subtotal if more than one item
      if (items.length > 1) {
        const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
        const resident = items[0]?.resident || 'Okänd';
        console.log(`🧮 Subtotal for apt ${apt} (${resident}): ${items.length} items = ${subtotal}kr`, items.map(i => `${i.totalAmount}kr`));
        rows.push({ 
          type: 'subtotal', 
          apartmentNumber: apt, 
          subtotal, 
          resident 
        });
      }
    });
    
    return rows;
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography>Laddar data för {monthNames[selectedMonth - 1]} {selectedYear}...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchReportData}>
          Försök igen
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Period Selector Header - Mobile Optimized */}
      <Box sx={{ 
        bgcolor: 'primary.lighter',
        p: { xs: 2, sm: 3 }, 
        borderRadius: 2,
        mb: 3,
        border: '2px solid',
        borderColor: 'primary.main'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Typography variant={isSmallMobile ? "h6" : "h5"} sx={{ 
            fontWeight: 'bold',
            color: 'primary.dark',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: { xs: '1.1rem', sm: '1.5rem' }
          }}>
            📊 HSB Debiteringsunderlag - Redigera
          </Typography>
          
          {/* Primary Actions - Mobile Optimized */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'stretch', sm: 'flex-end' }
          }}>
            <Button 
              variant="contained" 
              startIcon={saving ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
              onClick={() => setConfirmDialog('pdf')}
              disabled={saving || editableHsbData.length === 0}
              size={isSmallMobile ? "small" : "medium"}
              sx={{ 
                flex: { xs: 1, sm: 'none' },
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              {saving ? 'Skapar PDF...' : 'Skapa PDF'}
            </Button>
            
            <IconButton 
              onClick={(event) => setMoreMenuAnchorEl(event.currentTarget)}
              sx={{ 
                ml: 1,
                minWidth: { xs: 40, sm: 48 }
              }}
              aria-label="Fler åtgärder"
              size={isSmallMobile ? "small" : "medium"}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 2,
          width: '100%'
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            width: { xs: '100%', sm: 'auto' },
            alignItems: 'center'
          }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: 100, sm: 120 },
                flex: { xs: 1, sm: 'none' }
              }}
              fullWidth={isSmallMobile}
            >
              <InputLabel>Månad</InputLabel>
              <Select 
                value={selectedMonth}
                label="Månad"
                onChange={(e) => handlePeriodChange(Number(e.target.value), selectedYear)}
                sx={{ minHeight: 48 }} // Ensure touch target size
              >
                {monthNames.map((month, index) => (
                  <MenuItem key={index + 1} value={index + 1}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: 80, sm: 100 },
                flex: { xs: 0.6, sm: 'none' }
              }}
              fullWidth={isSmallMobile}
            >
              <InputLabel>År</InputLabel>
              <Select 
                value={selectedYear}
                label="År"
                onChange={(e) => handlePeriodChange(selectedMonth, Number(e.target.value))}
                sx={{ minHeight: 48 }} // Ensure touch target size
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <MenuItem key={2023 + i} value={2023 + i}>
                    {2023 + i}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Chip 
            icon={<CheckIcon />} 
            label={`${editableHsbData.length} poster`}
            color="primary"
            size="small"
          />
          
          {isModified && (
            <Chip 
              icon={<WarningIcon />} 
              label="Ändrat"
              color="warning"
              size="small"
            />
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', mr: 1 }}>
            Total summa:
          </Typography>
          <Typography 
            variant="h6" 
            color={isModified ? "warning.main" : "primary.main"}
            fontWeight="bold"
          >
            {totalAmount.toFixed(2)} kr
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        💡 Klicka på en rad för att redigera. Använd knapparna nedan för att lägga till nya poster eller återställa ändringar.
      </Typography>

      {/* Editable Data Table */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Debiteringsunderlag ({editableHsbData.length} poster)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {isMobile ? (
            // Mobile: Card layout with edit functionality
            <Box sx={{ p: 2 }}>
              {editableHsbData.map((item, index) => (
                <Card 
                  key={index} 
                  sx={{ 
                    mb: 2, 
                    border: editingRow === index ? 2 : 1,
                    borderColor: editingRow === index ? 'primary.main' : 'divider',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.light'
                    },
                    cursor: editingRow === index ? 'default' : 'pointer'
                  }}
                >
                  <CardContent>
                    {editingRow === index ? (
                      // Edit mode
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="Lägenhetsnummer"
                          value={item.apartmentNumber}
                          onChange={(e) => handleFieldChange(index, 'apartmentNumber', e.target.value)}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Namn"
                          value={item.resident}
                          onChange={(e) => handleFieldChange(index, 'resident', e.target.value)}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Period"
                          value={item.period || ''}
                          onChange={(e) => handleFieldChange(index, 'period', e.target.value)}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Beskrivning"
                          value={item.description}
                          onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                          size="small"
                          fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            label="Antal"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleFieldChange(index, 'quantity', e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="Pris"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleFieldChange(index, 'unitPrice', e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                        </Box>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          Summa: {item.totalAmount.toFixed(2)} kr
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            onClick={() => setEditingRow(null)}
                            color="primary"
                            variant="contained"
                            size="small"
                            startIcon={<SaveIcon />}
                            sx={{ minHeight: 48, flex: 1 }}
                          >
                            Spara
                          </Button>
                          <IconButton 
                            onClick={() => handleDeleteRow(index)}
                            color="error"
                            sx={{ 
                              minWidth: 48,
                              minHeight: 48,
                              border: 1,
                              borderColor: 'error.main',
                              '&:hover': { bgcolor: 'error.lighter' }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      // Display mode
                      <Box onClick={() => setEditingRow(index)} sx={{ cursor: 'pointer' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="div">
                            Lgh {item.apartmentNumber}
                          </Typography>
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            {item.totalAmount.toFixed(2)} kr
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                          {item.resident}
                        </Typography>
                        {item.period && (
                          <Typography variant="body2" color="primary.main" sx={{ mb: 1, fontWeight: 'medium' }}>
                            {item.period}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Chip size="small" label={`Antal: ${item.quantity}`} />
                          <Chip size="small" label={`á ${item.unitPrice.toFixed(2)} kr`} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <EditIcon color="action" fontSize="small" />
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddRow}
                sx={{ mt: 2 }}
              >
                Lägg till ny post
              </Button>
            </Box>
          ) : (
            // Desktop: Table layout with inline editing
            <TableContainer 
              component={Paper}
              sx={{ 
                overflowX: 'auto',
                '& .MuiTable-root': {
                  minWidth: { xs: 800, sm: 'auto' } // Ensure table has minimum width on mobile
                }
              }}
            >
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Lgh nr</strong></TableCell>
                    <TableCell><strong>Namn</strong></TableCell>
                    <TableCell><strong>Period</strong></TableCell>
                    <TableCell><strong>Beskrivning</strong></TableCell>
                    <TableCell align="center"><strong>Antal</strong></TableCell>
                    <TableCell align="right"><strong>á pris</strong></TableCell>
                    <TableCell align="right"><strong>Summa</strong></TableCell>
                    <TableCell align="center"><strong>Åtgärder</strong></TableCell>
                  </TableRow>
                </TableHead>
                                 <TableBody>
                   {getTableRowsWithSubtotals().map((row, displayIndex) => {
                     if (row.type === 'subtotal') {
                       return (
                         <TableRow key={`subtotal-${row.apartmentNumber}`} sx={{ backgroundColor: 'rgba(25, 118, 210, 0.08)' }}>
                           <TableCell sx={{ fontWeight: 'bold' }}>
                             {row.apartmentNumber === '0' ? 'Okänd' : row.apartmentNumber}
                           </TableCell>
                           <TableCell sx={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                             Subtotal {row.resident}
                           </TableCell>
                           <TableCell></TableCell>
                           <TableCell></TableCell>
                           <TableCell></TableCell>
                           <TableCell></TableCell>
                           <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.05em' }}>
                             {row.subtotal?.toLocaleString('sv-SE')} kr
                           </TableCell>
                           <TableCell></TableCell>
                         </TableRow>
                       );
                     }
                     
                     const item = row.item!;
                     const index = editableHsbData.findIndex(originalItem => originalItem === item);
                     
                     return (
                    <TableRow 
                      key={index}
                      tabIndex={0}
                      role="button"
                      aria-label={`Redigera rad ${index + 1}: ${item.resident || 'Tom rad'}, ${item.totalAmount.toFixed(2)} kr`}
                      onClick={() => editingRow !== index && setEditingRow(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (editingRow !== index) setEditingRow(index);
                        }
                        if (e.key === 'Escape') {
                          setEditingRow(null);
                        }
                      }}
                      sx={{ 
                        backgroundColor: editingRow === index ? 'action.hover' : 'inherit',
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&:focus': { 
                          backgroundColor: 'action.focus',
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: -2
                        },
                        cursor: editingRow === index ? 'default' : 'pointer'
                      }}
                    >
                      <TableCell>
                        {editingRow === index ? (
                          <Box>
                            <TextField
                              value={item.apartmentNumber}
                              onChange={(e) => handleFieldChange(index, 'apartmentNumber', e.target.value)}
                              size="small"
                              variant="standard"
                              error={!!fieldErrors[`${index}-apartmentNumber`]}
                              aria-label="Lägenhetsnummer"
                              autoFocus={index === editingRow}
                            />
                            {fieldErrors[`${index}-apartmentNumber`] && (
                              <FormHelperText error>
                                {fieldErrors[`${index}-apartmentNumber`]}
                              </FormHelperText>
                            )}
                          </Box>
                        ) : (
                          item.apartmentNumber
                        )}
                      </TableCell>
                      <TableCell>
                        {editingRow === index ? (
                          <Box>
                            <TextField
                              value={item.resident}
                              onChange={(e) => handleFieldChange(index, 'resident', e.target.value)}
                              size="small"
                              variant="standard"
                              error={!!fieldErrors[`${index}-resident`]}
                              aria-label="Namn"
                            />
                            {fieldErrors[`${index}-resident`] && (
                              <FormHelperText error>
                                {fieldErrors[`${index}-resident`]}
                              </FormHelperText>
                            )}
                          </Box>
                        ) : (
                          item.resident
                        )}
                      </TableCell>
                      <TableCell>
                        {editingRow === index ? (
                          <TextField
                            value={item.period || ''}
                            onChange={(e) => handleFieldChange(index, 'period', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        ) : (
                          item.period || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingRow === index ? (
                          <TextField
                            value={item.description}
                            onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                            size="small"
                            variant="standard"
                          />
                        ) : (
                          item.description
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {editingRow === index ? (
                          <Box>
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleFieldChange(index, 'quantity', e.target.value)}
                              size="small"
                              variant="standard"
                              sx={{ width: 80 }}
                              error={!!fieldErrors[`${index}-quantity`]}
                              aria-label="Antal"
                            />
                            {fieldErrors[`${index}-quantity`] && (
                              <FormHelperText error sx={{ fontSize: '0.7rem' }}>
                                {fieldErrors[`${index}-quantity`]}
                              </FormHelperText>
                            )}
                          </Box>
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editingRow === index ? (
                          <Box>
                            <TextField
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleFieldChange(index, 'unitPrice', e.target.value)}
                              size="small"
                              variant="standard"
                              sx={{ width: 80 }}
                              error={!!fieldErrors[`${index}-unitPrice`]}
                              aria-label="Pris per enhet"
                            />
                            {fieldErrors[`${index}-unitPrice`] && (
                              <FormHelperText error sx={{ fontSize: '0.7rem' }}>
                                {fieldErrors[`${index}-unitPrice`]}
                              </FormHelperText>
                            )}
                          </Box>
                        ) : (
                          `${item.unitPrice.toFixed(2)} kr`
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {item.totalAmount.toFixed(2)} kr
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {editingRow === index ? (
                            <>
                              <Tooltip title="Spara">
                                <IconButton 
                                  onClick={() => setEditingRow(null)}
                                  color="primary"
                                  size="small"
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Avbryt">
                                <IconButton 
                                  onClick={() => {
                                    // Reset the row to original data
                                    setEditableHsbData(prev => {
                                      const newData = [...prev];
                                      newData[index] = { ...originalHsbData[index] } || newData[index];
                                      return newData;
                                    });
                                    setEditingRow(null);
                                  }}
                                  color="default"
                                  size="small"
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Tooltip title="Redigera">
                              <IconButton 
                                onClick={() => setEditingRow(index)}
                                color="primary"
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Ta bort">
                            <IconButton 
                              onClick={() => handleDeleteRow(index)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                     );
                   })}
                  <TableRow>
                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>
                      Total summa:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                      {totalAmount.toFixed(2)} kr
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Lägg till ny post">
                        <IconButton 
                          onClick={handleAddRow}
                          color="primary"
                          size="small"
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Resident Directory (Read-only) */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Boendeförteckning ({residentData.length} boende)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Boendeförteckningen är skrivskyddad och uppdateras automatiskt från registret.
          </Typography>
          {isMobile ? (
            <Box>
              {residentData.map((resident, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                      {resident.apartmentNumber}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {resident.resident}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tel: {resident.phone || 'Ej angivet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {resident.email || 'Ej angivet'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Lägenhet</strong></TableCell>
                    <TableCell><strong>Namn</strong></TableCell>
                    <TableCell><strong>Telefon</strong></TableCell>
                    <TableCell><strong>E-post</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {residentData.map((resident, index) => (
                    <TableRow key={index}>
                      <TableCell>{resident.apartmentNumber}</TableCell>
                      <TableCell>{resident.resident}</TableCell>
                      <TableCell>{resident.phone || '-'}</TableCell>
                      <TableCell>{resident.email || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Secondary Actions Menu */}
      <Menu
        anchorEl={moreMenuAnchorEl}
        open={Boolean(moreMenuAnchorEl)}
        onClose={() => setMoreMenuAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={() => {
            setMoreMenuAnchorEl(null);
            setConfirmDialog('email');
          }}
          disabled={saving || editableHsbData.length === 0}
        >
          <EmailIcon sx={{ mr: 1 }} />
          Skicka till HSB
        </MenuItem>
        
        {isModified && (
          <MenuItem 
            onClick={() => {
              setMoreMenuAnchorEl(null);
              setConfirmDialog('reset');
            }}
            disabled={saving}
          >
            <RestoreIcon sx={{ mr: 1 }} />
            Återställ ändringar
          </MenuItem>
        )}
        
        {!onClose && (
          <MenuItem 
            onClick={() => {
              setMoreMenuAnchorEl(null);
              navigate('/admin');
            }}
            disabled={saving}
          >
            <ArrowBackIcon sx={{ mr: 1 }} />
            Tillbaka till Dashboard
          </MenuItem>
        )}
      </Menu>

      {/* Confirmation Dialogs */}
      <Dialog 
        open={confirmDialog === 'pdf'} 
        onClose={() => !saving && setConfirmDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isModified ? 'Osparade ändringar' : 'Skapa PDF-rapport'}
        </DialogTitle>
        <DialogContent>
          {isModified ? (
            <>
              <Typography paragraph>
                Du har osparade ändringar för {monthNames[selectedMonth - 1]} {selectedYear}.
              </Typography>
              <Typography paragraph>
                Vill du fortsätta utan att spara, eller avbryta för att spara ändringarna först?
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Om du fortsätter kommer dina ändringar att inkluderas i PDF:en men inte sparas permanent.
              </Alert>
            </>
          ) : (
            <>
              <Typography paragraph>
                En PDF-rapport kommer att skapas för {monthNames[selectedMonth - 1]} {selectedYear} och laddas ner till din enhet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rapporten innehåller {editableHsbData.length} poster med en total summa på {totalAmount.toFixed(2)} kr.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} disabled={saving}>
            Avbryt
          </Button>
          <Button 
            onClick={handleGeneratePDF}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <PictureAsPdfIcon />}
            color={isModified ? "warning" : "primary"}
          >
            {saving ? 'Skapar PDF...' : (isModified ? 'Fortsätt ändå' : 'Skapa PDF')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={confirmDialog === 'email'} 
        onClose={() => !saving && setConfirmDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isModified ? 'Osparade ändringar' : 'Skicka HSB-rapport via e-post'}
        </DialogTitle>
        <DialogContent>
          {isModified ? (
            <>
              <Typography paragraph>
                Du har osparade ändringar för {monthNames[selectedMonth - 1]} {selectedYear}.
              </Typography>
              <Typography paragraph>
                Vill du fortsätta utan att spara, eller avbryta för att spara ändringarna först?
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Om du fortsätter kommer dina ändringar att inkluderas i den skickade rapporten men inte sparas permanent.
              </Alert>
            </>
          ) : (
            <>
              <Typography paragraph>
                Rapporten för {monthNames[selectedMonth - 1]} {selectedYear} kommer att skickas till:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">• HSB</Typography>
                <Typography variant="body2">• Administratör</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Rapporten innehåller {editableHsbData.length} poster med en total summa på {totalAmount.toFixed(2)} kr.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} disabled={saving}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSendEmail}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <EmailIcon />}
            color={isModified ? "warning" : "primary"}
          >
            {saving ? 'Skickar...' : (isModified ? 'Fortsätt ändå' : 'Skicka rapport')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={confirmDialog === 'reset'} 
        onClose={() => setConfirmDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Återställ alla ändringar?</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Alla dina ändringar kommer att förloras och data återställs till ursprungsläget.
          </Typography>
          <Typography variant="body2" color="error.main">
            Denna åtgärd kan inte ångras.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleResetData}
            color="error"
            variant="contained"
            startIcon={<RestoreIcon />}
          >
            Återställ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile PDF creation */}
      {isSmallMobile && (
        <Fab
          color="primary"
          aria-label="Skapa PDF"
          onClick={() => setConfirmDialog('pdf')}
          disabled={saving || editableHsbData.length === 0}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : <PictureAsPdfIcon />}
        </Fab>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: isSmallMobile ? 10 : 0 }} // Account for FAB
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HSBReportEditor;
