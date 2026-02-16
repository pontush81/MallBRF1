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
  Chip,
  Alert,
  CircularProgress,


  Button,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import { 
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,

  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
// import supabaseClient from '../../services/supabaseClient'; // Not currently used

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isactive: boolean;
  createdat: string;
  lastlogin?: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🚀 Fetching users via direct REST API...');
      
      const response = await fetch('https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/users?select=*&order=createdat.desc', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 30s timeout (cold start can be slow)
      });

      if (!response.ok) {
        throw new Error(`Direct API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data || []);
      setError(null);
      console.log(`✅ Found ${data?.length || 0} users via direct API (FAST!)`);
      
    } catch (err: any) {
      setError('Ett fel uppstod vid hämtning av användare: ' + err.message);
      console.error('❌ Error fetching users via direct API:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      console.log('🚀 Updating user status via direct REST API...');
      
      const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isactive: !currentStatus }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Direct API error: ${response.status} ${response.statusText}`);
      }

      setSuccess('Användarstatus uppdaterad');
      fetchUsers(); // Refresh the list
      console.log('✅ User status updated via direct API (FAST!)');
      
    } catch (err: any) {
      setError('Kunde inte uppdatera användarstatus: ' + err.message);
      console.error('❌ Error updating user status via direct API:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      console.log('🚀 Updating user role via direct REST API...');
      
      const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Direct API error: ${response.status} ${response.statusText}`);
      }

      setSuccess('Användarroll uppdaterad');
      fetchUsers(); // Refresh the list
      console.log('✅ User role updated via direct API (FAST!)');
      
    } catch (err: any) {
      setError('Kunde inte uppdatera användarroll: ' + err.message);
      console.error('❌ Error updating user role via direct API:', err);
    }
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
          Användarhantering
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchUsers}
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
      
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Registrerade användare ({users.length})
          </Typography>
          
          {users.length === 0 ? (
            <Typography color="text.secondary">
              Inga användare hittades
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Namn</TableCell>
                    <TableCell>E-post</TableCell>
                    <TableCell>Roll</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Registrerad</TableCell>
                    <TableCell>Senast inloggad</TableCell>
                    <TableCell align="right">Åtgärder</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name || 'Ej angivet'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'admin' ? 'Administratör' : 'Användare'}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                          onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.isactive ? <ActiveIcon /> : <InactiveIcon />}
                          label={user.isactive ? 'Aktiv' : 'Inaktiv'}
                          color={user.isactive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.createdat ? format(new Date(user.createdat), 'PPP', { locale: sv }) : 'Okänt'}
                      </TableCell>
                      <TableCell>
                        {user.lastlogin ? format(new Date(user.lastlogin), 'PPP', { locale: sv }) : 'Aldrig'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={user.isactive ? 'Inaktivera användare' : 'Aktivera användare'}>
                          <IconButton
                            size="small"
                            onClick={() => toggleUserStatus(user.id, user.isactive)}
                            color={user.isactive ? 'error' : 'success'}
                          >
                            {user.isactive ? <InactiveIcon /> : <ActiveIcon />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )}
          </Box>
      </Paper>

      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={success}
      />
    </Box>
  );
};

export default UsersList; 