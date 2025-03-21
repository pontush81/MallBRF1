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
    CircularProgress
} from '@mui/material';
import { format } from 'date-fns';

interface BackupFile {
    fileName: string;
    createdAt: string;
    size: number;
}

const BackupManager: React.FC = () => {
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Hämta lista över backuper
    const fetchBackups = async () => {
        try {
            const response = await fetch('/api/backups');
            const data = await response.json();
            if (data.success) {
                setBackups(data.files);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Kunde inte hämta backup-listan');
        }
    };

    // Skapa ny backup
    const createBackup = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch('/api/backup', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setSuccess('Backup skapad framgångsrikt');
                fetchBackups();
            } else {
                setError(data.error);
            }
        } catch (err) {
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
            const response = await fetch(`/api/restore/${fileName}`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setSuccess('Återställning slutförd');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Kunde inte återställa från backup');
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
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Button
                variant="contained"
                color="primary"
                onClick={createBackup}
                disabled={loading}
                sx={{ mb: 3 }}
            >
                {loading ? <CircularProgress size={24} /> : 'Skapa ny backup'}
            </Button>

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