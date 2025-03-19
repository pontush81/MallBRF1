import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { User, UserFormData } from '../../types/User';
import userService from '../../services/userService';

const UsersList: React.FC = () => {
  // State för användarlista
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State för dialoger och snackbar
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // State för användarredigeringsformulär
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'user',
    isActive: true
  });
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Hämta alla användare vid komponentmontering
  useEffect(() => {
    fetchUsers();
  }, []);

  // Funktion för att hämta användare
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
      setError(null);
    } catch (err) {
      setError('Ett fel uppstod vid hämtning av användare');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hantera ändringar i formulärfält
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  // Hantera switch toggle
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isActive: e.target.checked
    });
  };

  // Öppna redigeringsdialog
  const handleEditClick = (user: User) => {
    setEditUserId(user.id);
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      isActive: user.isActive,
      password: '' // Lämna tomt för att inte ändra lösenordet
    });
    setEditDialogOpen(true);
  };

  // Öppna skapa-dialog
  const handleCreateClick = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user',
      isActive: true
    });
    setCreateDialogOpen(true);
  };

  // Öppna dialog för att radera användare
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Stäng raderingsdialogrutan
  const handleDeleteCancel = () => {
    setUserToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Bekräfta radering av användare
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      const success = await userService.deleteUser(userToDelete.id);
      
      if (success) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setSnackbarMessage(`Användaren "${userToDelete.email}" har raderats`);
        setSnackbarOpen(true);
      } else {
        setError('Ett fel uppstod vid radering av användaren');
      }
    } catch (err) {
      setError('Ett fel uppstod vid radering av användaren');
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Skapa ny användare
  const handleCreateSubmit = async () => {
    try {
      setLoading(true);
      const newUser = await userService.createUser(formData);
      
      if (newUser) {
        setUsers([...users, newUser]);
        setSnackbarMessage(`Användaren "${newUser.email}" har skapats`);
        setSnackbarOpen(true);
        setCreateDialogOpen(false);
      } else {
        setError('Ett fel uppstod vid skapande av användaren');
      }
    } catch (err) {
      setError('Ett fel uppstod vid skapande av användaren');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Uppdatera en användare
  const handleEditSubmit = async () => {
    if (!editUserId) return;
    
    try {
      setLoading(true);
      // Om lösenordet är tomt, ta bort det från formData för att inte ändra det
      const dataToSubmit = {...formData};
      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      
      const updatedUser = await userService.updateUser(editUserId, dataToSubmit);
      
      if (updatedUser) {
        setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
        setSnackbarMessage(`Användaren "${updatedUser.email}" har uppdaterats`);
        setSnackbarOpen(true);
        setEditDialogOpen(false);
      } else {
        setError('Ett fel uppstod vid uppdatering av användaren');
      }
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering av användaren');
      console.error(err);
    } finally {
      setLoading(false);
      setEditUserId(null);
    }
  };

  // Stäng snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Formatera datum
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'PPP', { locale: sv });
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Hantera användare
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Skapa ny användare
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Användarnamn</TableCell>
              <TableCell>E-post</TableCell>
              <TableCell>Roll</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Skapad</TableCell>
              <TableCell>Senaste inloggning</TableCell>
              <TableCell>Åtgärder</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Inga användare hittades
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
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
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.lastLogin)}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditClick(user)}
                      title="Redigera användare"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteClick(user)}
                      title="Radera användare"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Radera användare dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Radera användare</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Är du säker på att du vill radera användaren "{userToDelete?.email}"?
            Detta kan inte ångras.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Avbryt</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            autoFocus
          >
            Radera
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redigera användare dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Redigera användare</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="E-post"
                type="email"
                fullWidth
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Namn"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="password"
                label="Lösenord (lämna tomt för att behålla nuvarande)"
                type="password"
                fullWidth
                value={formData.password}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Roll</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Roll"
                  onChange={handleInputChange}
                >
                  <MenuItem value="user">Användare</MenuItem>
                  <MenuItem value="admin">Administratör</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.isActive} 
                    onChange={handleSwitchChange} 
                    name="isActive" 
                  />
                }
                label="Aktiv användare"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Avbryt</Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained"
            color="primary"
          >
            Spara
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skapa användare dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Skapa ny användare</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="E-post"
                type="email"
                fullWidth
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Namn"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="password"
                label="Lösenord"
                type="password"
                fullWidth
                required
                value={formData.password}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Roll</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Roll"
                  onChange={handleInputChange}
                >
                  <MenuItem value="user">Användare</MenuItem>
                  <MenuItem value="admin">Administratör</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.isActive} 
                    onChange={handleSwitchChange} 
                    name="isActive" 
                  />
                }
                label="Aktiv användare"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Avbryt</Button>
          <Button 
            onClick={handleCreateSubmit} 
            variant="contained"
            color="primary"
          >
            Skapa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar för meddelanden */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default UsersList; 