import React, { useState, useEffect } from 'react';
import {
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    CardActions,
    CardHeader,
    TextField,
    Grid,
    Divider,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Chip,
    FormGroup,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import {
    Backup as BackupIcon,
    Restore as RestoreIcon,
    DeleteForever as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { API_BASE_URL } from '../config';

interface Backup {
    id: string;
    name: string;
    createdAt: string;
    tables: string[];
}

const TABLES_TO_BACKUP = [
    { id: 'bookings', label: 'Bokningar' }
];

const BackupManager: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedTables, setSelectedTables] = useState<string[]>(['bookings']);
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(false);
    const [backupName, setBackupName] = useState('');
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
    
    // Snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/backups`);
            if (!response.ok) {
                throw new Error('Kunde inte hämta backup-listan');
            }
            const data = await response.json();
            setBackups(data.files || []);
        } catch (err) {
            console.error('Error fetching backups:', err);
            setError('Kunde inte hämta backup-listan');
        } finally {
            setLoading(false);
        }
    };

    const handleTableSelect = (tableId: string) => {
        setSelectedTables(prev => 
            prev.includes(tableId) 
                ? prev.filter(t => t !== tableId)
                : [...prev, tableId]
        );
    };

    const handleCreateBackup = async () => {
        if (!backupName.trim()) {
            setSnackbarMessage('Vänligen ange ett namn för backupen');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/backup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tables: selectedTables,
                    name: backupName.trim()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Kunde inte skapa backup');
            }

            setSnackbarMessage('Backup skapad framgångsrikt!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setBackupName('');
            fetchBackups();
        } catch (err) {
            setSnackbarMessage(err instanceof Error ? err.message : 'Ett fel uppstod vid skapande av backup');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreClick = (backup: Backup) => {
        setSelectedBackup(backup);
        setRestoreDialogOpen(true);
    };

    const handleRestoreCancel = () => {
        setSelectedBackup(null);
        setRestoreDialogOpen(false);
    };

    const handleRestoreConfirm = async () => {
        if (!selectedBackup) return;
        
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/backups/${selectedBackup.name}/restore`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Kunde inte återställa backup');
            }

            setSnackbarMessage('Backup återställd framgångsrikt');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            fetchBackups();
        } catch (err) {
            console.error('Error restoring backup:', err);
            setSnackbarMessage('Ett fel uppstod vid återställning av backup');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
            setRestoreDialogOpen(false);
            setSelectedBackup(null);
        }
    };

    // Hantera snackbar close
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'PPP, HH:mm', { locale: sv });
        } catch (error) {
            return 'Ogiltigt datum';
        }
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Backup-hantering
            </Typography>
            
            <Grid container spacing={3}>
                {/* Skapa backup */}
                <Grid item xs={12} md={5} lg={4}>
                    <Card elevation={2}>
                        <CardHeader 
                            title="Skapa ny backup"
                            avatar={<BackupIcon color="primary" />} 
                        />
                        <Divider />
                        <CardContent>
                            <TextField
                                label="Namn på backup"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={backupName}
                                onChange={(e) => setBackupName(e.target.value)}
                                placeholder="T.ex. 'Månadsbakup' eller 'Före uppdatering'"
                                size="small"
                            />
                            
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Välj tabeller att backa upp:
                                </Typography>
                                <FormGroup>
                                    {TABLES_TO_BACKUP.map((table) => (
                                        <FormControlLabel
                                            key={table.id}
                                            control={
                                                <Checkbox
                                                    checked={selectedTables.includes(table.id)}
                                                    onChange={() => handleTableSelect(table.id)}
                                                    size="small"
                                                />
                                            }
                                            label={table.label}
                                        />
                                    ))}
                                </FormGroup>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<BackupIcon />}
                                onClick={handleCreateBackup}
                                disabled={loading || selectedTables.length === 0 || !backupName.trim()}
                                fullWidth
                            >
                                {loading ? 'Skapar backup...' : 'Skapa backup'}
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                
                {/* Backup lista */}
                <Grid item xs={12} md={7} lg={8}>
                    <Card elevation={2}>
                        <CardHeader 
                            title="Tillgängliga backups" 
                            subheader={backups.length === 0 ? 'Inga backups tillgängliga' : `${backups.length} backups sparade`}
                        />
                        <Divider />
                        <CardContent sx={{ p: 0 }}>
                            {loading && (
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                    <CircularProgress size={30} />
                                </Box>
                            )}
                            
                            {!loading && backups.length === 0 ? (
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography color="text.secondary">
                                        Inga backups har skapats än. Använd formuläret till vänster för att skapa din första backup.
                                    </Typography>
                                </Box>
                            ) : (
                                <List>
                                    {backups.map((backup) => (
                                        <React.Fragment key={backup.name}>
                                            <ListItem>
                                                <ListItemText 
                                                    primary={backup.name}
                                                    secondary={`Skapad: ${formatDate(backup.createdAt)}`}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton 
                                                        edge="end" 
                                                        aria-label="restore" 
                                                        onClick={() => handleRestoreClick(backup)}
                                                        disabled={loading}
                                                        title="Återställ från backup"
                                                    >
                                                        <RestoreIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            <Divider component="li" />
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            
            {/* Dialog för bekräftelse av återställning */}
            <Dialog
                open={restoreDialogOpen}
                onClose={handleRestoreCancel}
            >
                <DialogTitle>Bekräfta återställning</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Är du säker på att du vill återställa från backup-filen{' '}
                        <strong>{selectedBackup?.name}</strong>?
                        <br /><br />
                        Detta kommer att skriva över nuvarande data.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRestoreCancel}>Avbryt</Button>
                    <Button 
                        onClick={handleRestoreConfirm} 
                        color="primary"
                        variant="contained"
                        startIcon={<RestoreIcon />}
                    >
                        Återställ
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Snackbar för meddelanden */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleSnackbarClose} 
                    severity={snackbarSeverity}
                    variant="filled"
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BackupManager; 