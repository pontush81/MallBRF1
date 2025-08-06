import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Typography,
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
    TextField,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Snackbar,
    Alert,
    CircularProgress,
    Divider,
    Grid
} from '@mui/material';
import { 
    Add as AddIcon,
    Refresh as RefreshIcon,
    Backup as BackupIcon,
    Restore as RestoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { auth } from '../services/firebase';

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
    const [selectedTables, setSelectedTables] = useState<string[]>(['bookings']);
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(false);
    const [backupName, setBackupName] = useState('');
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [selectedBackup] = useState<Backup | null>(null);
    
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
            // Note: With Supabase Edge Functions, backup listing is now handled differently
            // Backups are stored in Supabase Storage and can be listed via storage API
            // For now, we'll disable this feature and use the direct backup functionality
            console.log('Backup listing via Storage API not yet implemented');
            setBackups([]);
        } catch (err) {
            console.error('Error fetching backups:', err);
            setError('Backup-listning inte tillgänglig för närvarande');
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
            
                        // Use new Supabase Edge Function for backup with anon key
            const authInstance = auth();
            const user = authInstance?.currentUser;
            if (!user) {
                throw new Error('Du måste vara inloggad för att skapa backup');
            }

            const response = await fetch(`${SUPABASE_URL}/functions/v1/send-backup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                    tables: selectedTables.length > 0 ? selectedTables : ['bookings'],
                    includeFiles: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Kunde inte skapa backup');
            }

            const data = await response.json();
            console.log('Backup response:', data);
            
            setSnackbarMessage(`Backup skapad och skickad via e-post (${data.bookingCount} bokningar)`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            
            // Reset form
            setBackupName('');
            setSelectedTables([]);
            
        } catch (err) {
            console.error('Error creating backup:', err);
            const errorMessage = err instanceof Error ? err.message : 'Ett fel uppstod vid skapande av backup';
            setError(errorMessage);
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreBackup = async () => {
        // Restore functionality is now handled differently with Supabase
        // For now, we'll disable this feature and focus on backup creation
        setSnackbarMessage('Återställning av backup inte tillgänglig för närvarande. Kontakta admin för manuell återställning.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setRestoreDialogOpen(false);
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
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateBackup}
                    disabled={loading || selectedTables.length === 0 || !backupName.trim()}
                >
                    {loading ? 'Skapar backup...' : 'Skapa ny backup'}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchBackups}
                    disabled={loading}
                >
                    Uppdatera lista
                </Button>
            </Box>

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
                                                        onClick={() => handleRestoreBackup()}
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
                onClose={() => setRestoreDialogOpen(false)}
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
                    <Button onClick={() => setRestoreDialogOpen(false)}>Avbryt</Button>
                    <Button 
                        onClick={handleRestoreBackup} 
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