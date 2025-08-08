import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Grid,
  Alert,
  Chip,
  CircularProgress,
  Snackbar,

  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,

  Refresh as RefreshIcon
} from '@mui/icons-material';
import supabaseClient from '../../services/supabaseClient';

interface AllowlistEntry {
  id: string;
  email: string;
  domain: string;
  created_at: string;
  created_by: string;
}

const AllowlistManager: React.FC = () => {
  const [allowedEmails, setAllowedEmails] = useState<AllowlistEntry[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<AllowlistEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AllowlistEntry | null>(null);

  useEffect(() => {
    loadAllowlist();
  }, []);

  const loadAllowlist = async () => {
    try {
      setLoading(true);
      
      // Load allowed emails
      const { data: emails, error: emailError } = await supabaseClient
        .from('allowed_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (emailError && emailError.code === '42P01') {
        setError('Allowlist-tabellerna behöver skapas i databasen. Kontakta administratör för att köra migrationen.');
        return;
      }
      if (emailError) throw emailError;

      // Load allowed domains
      const { data: domains, error: domainError } = await supabaseClient
        .from('allowed_domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (domainError && domainError.code === '42P01') {
        setError('Allowlist-tabellerna behöver skapas i databasen. Kontakta administratör för att köra migrationen.');
        return;
      }
      if (domainError) throw domainError;

      setAllowedEmails(emails || []);
      setAllowedDomains(domains || []);
      setError(null);
    } catch (err: any) {
      setError('Kunde inte ladda tillåtna användare: ' + err.message);
      console.error('Error loading allowlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const addEmail = async () => {
    if (!newEmail.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabaseClient
        .from('allowed_emails')
        .insert([{ 
          email: newEmail.trim().toLowerCase(),
          created_by: 'admin' // TODO: Get from current user context
        }]);

      if (error) throw error;

      setNewEmail('');
      setSuccess('E-post tillagd i tillåtna användare');
      loadAllowlist();
    } catch (err: any) {
      setError('Kunde inte lägga till e-post: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabaseClient
        .from('allowed_domains')
        .insert([{ 
          domain: newDomain.trim().toLowerCase(),
          created_by: 'admin' // TODO: Get from current user context
        }]);

      if (error) throw error;

      setNewDomain('');
      setSuccess('Domän tillagd i tillåtna användare');
      loadAllowlist();
    } catch (err: any) {
      setError('Kunde inte lägga till domän: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: AllowlistEntry) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setSaving(true);
      const table = itemToDelete.email ? 'allowed_emails' : 'allowed_domains';
      const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      setSuccess('Posten borttagen');
      loadAllowlist();
    } catch (err: any) {
      setError('Kunde inte ta bort posten: ' + err.message);
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tillåtna användare
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAllowlist}
          disabled={loading}
        >
          Uppdatera
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Add new email */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lägg till e-postadress
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="E-postadress"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                fullWidth
                placeholder="exempel@domain.se"
                type="email"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addEmail}
                disabled={!newEmail.trim() || saving}
              >
                Lägg till
              </Button>
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Tillåtna e-postadresser ({allowedEmails.length})
            </Typography>
            {allowedEmails.length === 0 ? (
              <Typography color="text.secondary">Inga tillåtna e-postadresser</Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {allowedEmails.map((entry) => (
                  <Box key={entry.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Chip label={entry.email} size="small" />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(entry)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Add new domain */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lägg till domän
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Domän"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                fullWidth
                placeholder="företag.se"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addDomain}
                disabled={!newDomain.trim() || saving}
              >
                Lägg till
              </Button>
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Tillåtna domäner ({allowedDomains.length})
            </Typography>
            {allowedDomains.length === 0 ? (
              <Typography color="text.secondary">Inga tillåtna domäner</Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {allowedDomains.map((entry) => (
                  <Box key={entry.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Chip label={`@${entry.domain}`} size="small" />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(entry)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
      >
        <DialogTitle>Ta bort från tillåtna användare</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Är du säker på att du vill ta bort {itemToDelete?.email || `@${itemToDelete?.domain}`} från listan över tillåtna användare?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Avbryt</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Ta bort
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={success}
      />
    </Box>
  );
};

export default AllowlistManager;