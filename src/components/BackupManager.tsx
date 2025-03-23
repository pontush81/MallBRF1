import React, { useState, useEffect } from 'react';
import {
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box,
    Alert,
    CircularProgress,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Card,
    CardContent
} from '@mui/material';
import { format } from 'date-fns';
import { API_BASE_URL } from '../config';

interface BackupFile {
    fileName: string;
    createdAt: string;
    size: number;
}

const AVAILABLE_TABLES = [
    { name: 'pages', label: 'Sidor' },
    { name: 'bookings', label: 'Bokningar' },
    { name: 'users', label: 'Användare' }
];

const BackupManager: React.FC = () => {
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);

    // Hämta lista över backuper
    const fetchBackups = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/backups`);
            const data = await response.json();
            if (data.success) {
                setBackups(data.files);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Kunde inte hämta backup-listan');
            console.error('Error fetching backups:', err);
        }
    };

    // Hantera val av tabeller
    const handleTableSelection = (tableName: string) => {
        setSelectedTables(prev => {
            if (prev.includes(tableName)) {
                return prev.filter(t => t !== tableName);
            } else {
                return [...prev, tableName];
            }
        });
    };

    // Välj alla tabeller
    const handleSelectAll = () => {
        if (selectedTables.length === AVAILABLE_TABLES.length) {
            setSelectedTables([]);
        } else {
            setSelectedTables(AVAILABLE_TABLES.map(t => t.name));
        }
    };

    // Skapa ny backup
    const createBackup = async () => {
        if (selectedTables.length === 0) {
            setError('Välj minst en tabell att backa upp');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${API_BASE_URL}/backup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tables: selectedTables })
            });
            const data = await response.json();
            
            if (data.success) {
                if (data.partialSuccess) {
                    // Handle partial success (some tables failed)
                    const errorMessages = Object.entries(data.errors)
                        .map(([table, error]) => `${table}: ${error}`)
                        .join('\n');
                        
                    setSuccess(`Backup skapad med begränsningar: ${data.fileName}`);
                    setError(`Några tabeller kunde inte backas upp på grund av behörighetsproblem:\n${errorMessages}`);
                } else {
                    setSuccess('Backup skapad framgångsrikt');
                }
                fetchBackups();
            } else {
                setError(data.error || data.message || 'Kunde inte skapa backup');
            }
        } catch (err) {
            console.error('Error creating backup:', err);
            setError('Kunde inte skapa backup');
        } finally {
            setLoading(false);
        }
    };

    // Återställ från backup
    const restoreBackup = async (fileName: string) => {
        if (!window.confirm('Är du säker på att du vill återställa från denna backup? Detta kommer att ersätta all nuvarande data.')) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${API_BASE_URL}/backups/${fileName}/restore`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Fel: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
                setSuccess('Återställning slutförd');
                fetchBackups();
            } else {
                setError(data.message || data.error || 'Kunde inte återställa från backup');
            }
        } catch (err) {
            console.error('Error restoring backup:', err);
            const errorMessage = err instanceof Error ? err.message : 'Kunde inte återställa från backup';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Ladda backups när komponenten monteras
    useEffect(() => {
        fetchBackups();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Backup-hantering
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Välj tabeller att backa upp
                    </Typography>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedTables.length === AVAILABLE_TABLES.length}
                                    indeterminate={selectedTables.length > 0 && selectedTables.length < AVAILABLE_TABLES.length}
                                    onChange={handleSelectAll}
                                />
                            }
                            label="Välj alla"
                        />
                        {AVAILABLE_TABLES.map(table => (
                            <FormControlLabel
                                key={table.name}
                                control={
                                    <Checkbox
                                        checked={selectedTables.includes(table.name)}
                                        onChange={() => handleTableSelection(table.name)}
                                    />
                                }
                                label={table.label}
                            />
                        ))}
                    </FormGroup>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={createBackup}
                        disabled={loading || selectedTables.length === 0}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Skapa ny backup'}
                    </Button>
                </CardContent>
            </Card>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Filnamn</TableCell>
                            <TableCell>Skapad</TableCell>
                            <TableCell>Storlek</TableCell>
                            <TableCell>Åtgärder</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {backups.map((backup) => (
                            <TableRow key={backup.fileName}>
                                <TableCell>{backup.fileName}</TableCell>
                                <TableCell>
                                    {format(new Date(backup.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                                </TableCell>
                                <TableCell>
                                    {Math.round(backup.size / 1024)} KB
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => restoreBackup(backup.fileName)}
                                        disabled={loading}
                                    >
                                        Återställ
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default BackupManager; 