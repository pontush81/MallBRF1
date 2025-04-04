import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Grid,
  Alert,
  Chip,
  CircularProgress,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Tabs,
  Tab,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { userService } from '../../services/userService';
import { Allowlist } from '../../services/auth/allowlist';
import { User } from '../../types/User';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AllowlistManager: React.FC = () => {
  const [allowlist, setAllowlist] = useState<Allowlist>({
    emails: [],
    domains: [],
    lastUpdated: ''
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(1);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const theme = useTheme();
  
  useEffect(() => {
    loadAllowlist();
    loadUsers();
  }, []);
  
  const loadAllowlist = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllowlist();
      setAllowlist(data);
      setError(null);
    } catch (err) {
      setError('Kunde inte ladda tillåtna användare');
      console.error('Error loading allowlist:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      await userService.syncAuthUsersWithFirestore();
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const handleSaveAllowlist = async () => {
    try {
      setSaving(true);
      
      try {
        await userService.updateAllowlist(allowlist);
      } catch (err: any) {
        // Kontrollera om det är ett behörighetsfel
        if (err.message && (
          err.message.includes('permission') || 
          err.message.includes('insufficient') ||
          err.message.includes('Missing or insufficient permissions')
        )) {
          setError('Kunde inte spara: Du har inte administratörsbehörighet. Logga in med ett administratörskonto.');
          console.error('Error saving allowlist (permission error):', err);
          return;
        } else {
          // Om det inte är ett behörighetsfel, kasta vidare felet
          throw err;
        }
      }
      
      // Om det inte var ett behörighetsfel, fortsätt med att uppdatera användare
      try {
        // Hämta alla användare
        const allUsers = await userService.getAllUsers();
        
        // För varje användare, kontrollera om de ska vara aktiva baserat på allowlist
        for (const user of allUsers) {
          // Ensure user has valid id and email
          if (!user || !user.id || !user.email) {
            console.warn('Found invalid user in users list:', user);
            continue;
          }
          
          const shouldBeActive = isInAllowlist(user.email);
          const currentlyActive = !!user.isActive;
          
          // Uppdatera bara om statusen behöver ändras
          if (shouldBeActive !== currentlyActive) {
            await userService.updateUserStatus(user.id, shouldBeActive);
          }
        }
        
        // Ladda om användarlistan
        await loadUsers();
      } catch (updateErr) {
        console.error('Error updating users after allowlist change:', updateErr);
        // Vi fortsätter ändå, eftersom vi redan har sparat allowlist
      }
      
      setSuccess('Tillåtna användare har sparats');
      setError(null);
    } catch (err) {
      setError('Kunde inte spara tillåtna användare: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error saving allowlist:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('Ange en giltig e-postadress');
      return;
    }
    
    // Check if email already exists
    if (allowlist.emails.some(email => email.toLowerCase() === newEmail.toLowerCase())) {
      setError('E-postadressen finns redan i listan');
      return;
    }
    
    setAllowlist(prev => ({
      ...prev,
      emails: [...prev.emails, newEmail]
    }));
    setNewEmail('');
    setError(null);
  };
  
  const handleAddDomain = () => {
    if (!newDomain || !newDomain.includes('.')) {
      setError('Ange en giltig domän (t.ex. exempel.se)');
      return;
    }
    
    // Remove @ if added
    let domain = newDomain;
    if (domain.startsWith('@')) {
      domain = domain.substring(1);
    }
    
    // Check if domain already exists
    if (allowlist.domains.some(d => d.toLowerCase() === domain.toLowerCase())) {
      setError('Domänen finns redan i listan');
      return;
    }
    
    setAllowlist(prev => ({
      ...prev,
      domains: [...prev.domains, domain]
    }));
    setNewDomain('');
    setError(null);
  };
  
  const handleRemoveEmail = (email: string) => {
    setAllowlist(prev => ({
      ...prev,
      emails: prev.emails.filter(e => e !== email)
    }));
  };
  
  const handleRemoveDomain = (domain: string) => {
    setAllowlist(prev => ({
      ...prev,
      domains: prev.domains.filter(d => d !== domain)
    }));
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(null);
  };
  
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const toggleUserInAllowlist = (email: string) => {
    if (isInAllowlist(email)) {
      // Ta bort från allowlist
      setAllowlist(prev => ({
        ...prev,
        emails: prev.emails.filter(e => e.toLowerCase() !== email.toLowerCase())
      }));
    } else {
      // Lägg till i allowlist
      setAllowlist(prev => ({
        ...prev,
        emails: [...prev.emails, email]
      }));
    }
  };
  
  const isInAllowlist = (email: string) => {
    if (!email) return false;
    
    // Kolla om e-postadressen direkt finns i listan
    if (allowlist.emails && allowlist.emails.some(e => e && e.toLowerCase() === email.toLowerCase())) {
      return true;
    }
    
    // Kolla om domänen finns i listan
    const parts = email.split('@');
    if (parts.length < 2) return false;
    
    const domain = parts[1];
    if (domain && allowlist.domains && allowlist.domains.some(d => d && d.toLowerCase() === domain.toLowerCase())) {
      return true;
    }
    
    return false;
  };
  
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const success = await userService.deleteUser(userToDelete.id);
      
      if (success) {
        setSuccess(`Användaren ${userToDelete.name || userToDelete.email} har tagits bort`);
        // Refresh the users list
        await loadUsers();
      } else {
        setError(`Kunde inte ta bort användaren ${userToDelete.name || userToDelete.email}`);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Ett fel inträffade när användaren skulle tas bort');
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };
  
  const cancelDeleteUser = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };
  
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Hantera tillåtna användare
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Allowlist-inställningar" />
          <Tab label="Alla användare" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Nuvarande inställningar
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Om inga e-postadresser eller domäner är tillagda kan vem som helst logga in.
                Lägg till specifika e-postadresser eller hela domäner (t.ex. "exempel.se") för att begränsa åtkomsten.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Tillåtna e-postadresser
              </Typography>
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <TextField
                      label="Lägg till e-postadress"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="namn@exempel.se"
                    />
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddEmail}
                      sx={{ ml: 1 }}
                      variant="outlined"
                    >
                      Lägg till
                    </Button>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1, minHeight: '200px' }}>
                    {allowlist.emails.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                        Inga specifika e-postadresser har lagts till
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {allowlist.emails.map((email) => (
                          <Chip
                            key={email}
                            label={email}
                            onDelete={() => handleRemoveEmail(email)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Tillåtna domäner
              </Typography>
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <TextField
                      label="Lägg till domän"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="exempel.se"
                    />
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddDomain}
                      sx={{ ml: 1 }}
                      variant="outlined"
                    >
                      Lägg till
                    </Button>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1, minHeight: '200px' }}>
                    {allowlist.domains.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                        Inga domäner har lagts till
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {allowlist.domains.map((domain) => (
                          <Chip
                            key={domain}
                            label={domain}
                            onDelete={() => handleRemoveDomain(domain)}
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="subtitle1" gutterBottom>
            Användarhantering
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Markera användare som ska tillåtas logga in i systemet. Användare som inte är markerade kommer nekas tillgång om whitelist-funktionen är aktiv.
          </Typography>
          
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={1} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Typography variant="subtitle2">Tillåt</Typography>
                    </TableCell>
                    <TableCell>Namn</TableCell>
                    <TableCell>E-post</TableCell>
                    <TableCell>Roll</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Åtgärder</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Inga användare hittades
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isInAllowlist(user.email)}
                            onChange={() => toggleUserInAllowlist(user.email)}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role === 'admin' ? 'Administratör' : 'Användare'} 
                            color={user.role === 'admin' ? 'secondary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                            label={user.isActive ? 'Aktiv' : 'Inaktiv'} 
                            color={user.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.role === 'admin'} // Prevent deleting admin users
                            title="Ta bort användare"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveAllowlist}
          disabled={loading || saving}
        >
          {saving ? 'Sparar...' : 'Spara ändringar'}
        </Button>
      </Box>
      
      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={success || ''}
      />
      
      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteUser}
      >
        <DialogTitle>Ta bort användare</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Är du säker på att du vill ta bort användaren {userToDelete?.name || userToDelete?.email}? 
            Denna åtgärd kan inte ångras.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteUser} color="primary">
            Avbryt
          </Button>
          <Button onClick={confirmDeleteUser} color="error" autoFocus>
            Ta bort
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllowlistManager; 