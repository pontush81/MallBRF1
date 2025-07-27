import React, { useState, useEffect } from 'react';
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

  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Fab
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,

  CheckCircle as CheckIcon,
  Send as SendIcon
} from '@mui/icons-material';


interface HSBReportData {
  apartmentNumber: string;
  resident: string;
  email: string;
  phone: string;
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

interface HSBReportPreviewProps {
  onClose: () => void;
  onSent: (message: string) => void;
}

const HSBReportPreview: React.FC<HSBReportPreviewProps> = ({ onClose, onSent }) => {
  const [hsbData, setHsbData] = useState<HSBReportData[]>([]);
  const [residentData, setResidentData] = useState<ResidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const currentDate = new Date();
  const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
  
  useEffect(() => {
    fetchReportData();
  }, []);
  
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Temporary mock data until Edge Function is fixed
      console.log('Using mock data for HSB report preview');
      
      const mockHsbData = [
        {
          apartmentNumber: '80A',
          resident: 'Kristina Utas',
          email: 'tinautas@hotmail.com',
          phone: '0705557008',
          description: 'Hyra gästlägenhet 2 juli',
          quantity: 1,
          unitPrice: 600.00,
          totalAmount: 600.00
        },
        {
          apartmentNumber: '80H',
          resident: 'Pontus Hörberg',
          email: 'pontus.hberg@gmail.com',
          phone: '0702887147',
          description: 'Parkering',
          quantity: 1,
          unitPrice: 75.00,
          totalAmount: 75.00
        },
        {
          apartmentNumber: '80A',
          resident: 'Kristina Utas',
          email: 'tinautas@hotmail.com',
          phone: '0705557008',
          description: 'Hyra gästlägenhet 3-5 juli',
          quantity: 2,
          unitPrice: 600.00,
          totalAmount: 1200.00
        },
        {
          apartmentNumber: '80F',
          resident: 'Jacob Adaktusson',
          email: 'jacob@upsec.se',
          phone: '0707962064',
          description: 'Parkering',
          quantity: 3,
          unitPrice: 75.00,
          totalAmount: 225.00
        }
      ];

      const mockResidentData = [
        {
          apartmentNumber: '1, 80 D',
          resident: 'Anette Malmgren, Leif Nilsson',
          phone: '0702360807',
          email: 'anette-malmgren@hotmail.com',
          parkingSpace: '1',
          storageSpace: '1'
        },
        {
          apartmentNumber: '2, 80 C', 
          resident: 'Jonas Ahlin',
          phone: '0706255107',
          email: 'ahlinsweden@gmail.com',
          parkingSpace: '',
          storageSpace: '11'
        },
        {
          apartmentNumber: '3, 80 B',
          resident: 'Kajsa Mårtensson',
          phone: '0708123456',
          email: 'kajsa.martensson@example.com',
          parkingSpace: '3',
          storageSpace: '3'
        },
        {
          apartmentNumber: '4, 80 A',
          resident: 'Erik Svensson',
          phone: '0709876543',
          email: 'erik.svensson@example.com',
          parkingSpace: '4',
          storageSpace: '4'
        },
        {
          apartmentNumber: '5, 80 E',
          resident: 'Maria Andersson',
          phone: '0701234567',
          email: 'maria.andersson@example.com',
          parkingSpace: '5',
          storageSpace: '5'
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHsbData(mockHsbData);
      setResidentData(mockResidentData);
      
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendEmail = async () => {
    try {
      setSending(true);
      setError(null);
      
      // Temporary mock email sending until Edge Function is fixed
      console.log('Simulating email sending...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate CSV content
      const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                          'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const totalAmount = hsbData.reduce((sum, item) => sum + item.totalAmount, 0);
      
      let content = `HSB DEBITERINGSUNDERLAG - ${monthNames[currentMonth - 1]} ${currentYear}\n`;
      content += `BRF Gulmåran\n`;
      content += `Uppgiftslämmare: Kristina Utas\n`;
      content += `Datum: ${new Date().toLocaleDateString('sv-SE')}\n\n`;
      
      content += `DEBITERINGSUNDERLAG\n`;
      content += `Lgh nr,Namn,Vad avser avgiften,Antal,á pris,Summa\n`;
      
      hsbData.forEach(item => {
        content += `${item.apartmentNumber},"${item.resident}","${item.description}",${item.quantity},${item.unitPrice},${item.totalAmount}\n`;
      });
      
      content += `\nTOTAL SUMMA:,,,,,${totalAmount}\n\n`;
      
      content += `BOENDEFÖRTECKNING\n`;
      content += `Lägenhet,Namn,Telefon,E-post,P-plats,Förråd\n`;
      
      residentData.forEach(resident => {
        content += `"${resident.apartmentNumber}","${resident.resident}","${resident.phone}","${resident.email}","${resident.parkingSpace}","${resident.storageSpace}"\n`;
      });
      
      // Create downloadable file
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HSB-debiteringsunderlag-${currentYear}-${String(currentMonth).padStart(2, '0')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('Mock email sent and file downloaded');
      onSent('HSB-rapporten har skickats till HSB och administratören via e-post (simulerad)');
      setConfirmDialog(false);
      
    } catch (err) {
      console.error('Error sending report:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid skickning');
    } finally {
      setSending(false);
    }
  };
  
  const totalAmount = hsbData.reduce((sum, item) => sum + item.totalAmount, 0);
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Laddar rapportdata...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchReportData}>
          Försök igen
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ pb: 10 }}> {/* Bottom padding for FAB */}
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardHeader
          title="HSB Debiteringsunderlag"
          subheader={`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          action={
            <Chip 
              icon={<CheckIcon />} 
              label={`${hsbData.length} poster`}
              color="primary"
              variant="outlined"
            />
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Bostadsrättsförening
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              BRF Gulmåran
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Uppgiftslämmare
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              Kristina Utas
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total summa
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {totalAmount.toFixed(2)} kr
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      {/* Billing Data */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Debiteringsunderlag ({hsbData.length} poster)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {isMobile ? (
            // Mobile: Card layout
            <Box sx={{ p: 2 }}>
              {hsbData.map((item, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip size="small" label={`Antal: ${item.quantity}`} />
                      <Chip size="small" label={`á ${item.unitPrice.toFixed(2)} kr`} />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            // Desktop: Table layout
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Lgh nr</strong></TableCell>
                    <TableCell><strong>Namn</strong></TableCell>
                    <TableCell><strong>Vad avser avgiften?</strong></TableCell>
                    <TableCell align="center"><strong>Antal</strong></TableCell>
                    <TableCell align="right"><strong>á pris</strong></TableCell>
                    <TableCell align="right"><strong>Summa</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hsbData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.apartmentNumber}</TableCell>
                      <TableCell>{item.resident}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{item.unitPrice.toFixed(2)} kr</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {item.totalAmount.toFixed(2)} kr
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                      Total summa:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                      {totalAmount.toFixed(2)} kr
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>
      
      {/* Resident Directory */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Boendeförteckning ({residentData.length} boende)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {isMobile ? (
            // Mobile: Card layout for residents
            <Box sx={{ p: 2 }}>
              {residentData.slice(0, 5).map((resident, index) => (
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
              {residentData.length > 5 && (
                <Typography variant="body2" color="text.secondary" align="center">
                  ... och {residentData.length - 5} boende till
                </Typography>
              )}
            </Box>
          ) : (
            <TableContainer>
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
      
      {/* Floating Action Button */}
      <Fab
        color="primary"
        variant="extended"
        onClick={() => setConfirmDialog(true)}
        disabled={sending}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          left: isMobile ? 16 : 'auto',
          zIndex: 1000
        }}
      >
        {sending ? (
          <CircularProgress size={24} sx={{ mr: 1 }} />
        ) : (
          <SendIcon sx={{ mr: 1 }} />
        )}
        {sending ? 'Skickar...' : 'Skicka till HSB'}
      </Fab>
      
      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog} 
        onClose={() => !sending && setConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Skicka HSB-rapport via e-post?
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Rapporten kommer att skickas till:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2">• HSB</Typography>
            <Typography variant="body2">• Administratör</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Rapporten innehåller {hsbData.length} debiteringsposter med en total summa på {totalAmount.toFixed(2)} kr.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog(false)}
            disabled={sending}
          >
            Avbryt
          </Button>
          <Button 
            onClick={handleSendEmail}
            variant="contained"
            disabled={sending}
            startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sending ? 'Skickar...' : 'Skicka rapport'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default HSBReportPreview; 