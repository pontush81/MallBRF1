import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  disabled: boolean;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  customClaims?: {
    role?: string;
  };
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunde inte hämta användare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.customClaims?.role || '');
    setOpenRoleDialog(true);
  };

  const handleRoleSubmit = async () => {
    if (!selectedUser) return;

    try {
      await axios.put(`/api/users/${selectedUser.uid}/role`, { role: selectedRole });
      await fetchUsers();
      setOpenRoleDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunde inte uppdatera användarroll');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await axios.put(`/api/users/${user.uid}/status`, { disabled: !user.disabled });
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunde inte uppdatera användarstatus');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Är du säker på att du vill ta bort användaren ${user.email}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/users/${user.uid}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kunde inte ta bort användaren');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Användaradministration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>E-post</TableCell>
              <TableCell>Namn</TableCell>
              <TableCell>Roll</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Senast inloggad</TableCell>
              <TableCell>Åtgärder</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.displayName || '-'}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleRoleChange(user)}
                    size="small"
                    variant="outlined"
                  >
                    {user.customClaims?.role || 'Ingen roll'}
                  </Button>
                </TableCell>
                <TableCell>
                  {user.disabled ? (
                    <Typography color="error">Inaktiverad</Typography>
                  ) : (
                    <Typography color="success">Aktiv</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.metadata.lastSignInTime).toLocaleString('sv-SE')}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleToggleStatus(user)}
                    color={user.disabled ? "success" : "warning"}
                    title={user.disabled ? "Aktivera användare" : "Inaktivera användare"}
                  >
                    {user.disabled ? <CheckCircleIcon /> : <BlockIcon />}
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteUser(user)}
                    color="error"
                    title="Ta bort användare"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)}>
        <DialogTitle>Ändra användarroll</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Roll</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Roll"
            >
              <MenuItem value="">Ingen roll</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">Användare</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoleDialog(false)}>Avbryt</Button>
          <Button onClick={handleRoleSubmit} variant="contained">
            Spara
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManager; 