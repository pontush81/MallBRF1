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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
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
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(false);
    const [backupName, setBackupName] = useState('');
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/backups`);
            if (!response.ok) {
                throw new Error('Kunde inte hämta backup-listan');
            }
            const data = await response.json();
            setBackups(data.files || []);
        } catch (err) {
            console.error('Error fetching backups:', err);
            setError('Kunde inte hämta backup-listan');
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
            setError('Vänligen ange ett namn för backupen');
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
                    tables: ['bookings'],
                    name: backupName.trim()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Kunde inte skapa backup');
            }

            setSuccessMessage('Backup skapad framgångsrikt!');
            setBackupName('');
            fetchBackups();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ett fel uppstod vid skapande av backup');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreClick = (fileName: string) => {
        setSelectedBackup(backups.find(b => b.name === fileName) || null);
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

            setError(null);
            setSuccessMessage('Backup återställd framgångsrikt');
            fetchBackups();
        } catch (err) {
            console.error('Error restoring backup:', err);
            setError('Ett fel uppstod vid återställning av backup');
        } finally {
            setLoading(false);
            setRestoreDialogOpen(false);
            setSelectedBackup(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Skapa backup</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Namn på backup
                        </label>
                        <input
                            type="text"
                            value={backupName}
                            onChange={(e) => setBackupName(e.target.value)}
                            placeholder="T.ex. 'Backup före uppdatering' eller 'Månadsbackup'"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Välj tabeller att backa upp
                        </label>
                        <div className="space-y-2">
                            {TABLES_TO_BACKUP.map((table) => (
                                <label key={table.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedTables.includes(table.id)}
                                        onChange={() => handleTableSelect(table.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{table.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleCreateBackup}
                        disabled={loading || selectedTables.length === 0 || !backupName.trim()}
                        className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                            loading || selectedTables.length === 0 || !backupName.trim()
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'Skapar backup...' : 'Skapa backup'}
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Tillgängliga backups</h2>
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
                        {successMessage}
                    </div>
                )}
                {backups.length === 0 ? (
                    <p className="text-gray-500">Inga backups tillgängliga</p>
                ) : (
                    <div className="space-y-4">
                        {backups.map((backup) => (
                            <div
                                key={backup.name}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{backup.name}</p>
                                    <p className="text-sm text-gray-500">
                                        Skapad: {new Date(backup.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRestoreClick(backup.name)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                                >
                                    Återställ
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Backup-fil</TableCell>
                            <TableCell align="right">Åtgärder</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {backups.map((backup) => (
                            <TableRow key={backup.name}>
                                <TableCell>{backup.name}</TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => handleRestoreClick(backup.name)}
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
                    <Button onClick={handleRestoreConfirm} color="primary">
                        Återställ
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default BackupManager; 