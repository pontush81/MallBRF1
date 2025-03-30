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
  useTheme,
  useMediaQuery,
  Grid,
  Divider
} from '@mui/material';
import { 
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { User } from '../../types/User';
import { userService } from '../../services/userService';

const UsersList: React.FC = () => {
  // State för användarlista
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add theme and responsive media query
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Hämta alla användare vid komponentmontering
  useEffect(() => {
    fetchUsers();
  }, []);

  // Funktion för att hämta användare
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First sync auth users with Firestore
      await userService.syncAuthUsersWithFirestore();
      
      // Then get all users from Firestore
      const allUsers = await userService.getAllUsers();
      console.log(`UsersList found ${allUsers.length} users after syncing`);
      
      setUsers(allUsers);
      setError(null);
    } catch (err) {
      setError('Ett fel uppstod vid hämtning av användare');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Formatera datum
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return format(date, 'PPP', { locale: sv });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };
  
  // Render user item based on screen size
  const renderUserItem = (user: User) => {
    if (isMobile) {
      // Card-based mobile view
      return (
        <Paper 
          key={user.id} 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2, 
            borderLeft: '4px solid', 
            borderColor: user.role === 'admin' ? 'secondary.main' : 'primary.main' 
          }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6">{user.name || user.email}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, mt: 2 }}>
            <Chip 
              label={user.role === 'admin' ? 'Administratör' : 'Användare'} 
              color={user.role === 'admin' ? 'secondary' : 'default'}
              size="small"
            />
            <Chip 
              icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
              label={user.isActive ? 'Aktiv' : 'Inaktiv'} 
              color={user.isActive ? 'success' : 'error'}
              size="small"
            />
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Skapad:</Typography>
              <Typography variant="body2">{formatDate(user.createdAt)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Senaste inloggning:</Typography>
              <Typography variant="body2">{formatDate(user.lastLogin)}</Typography>
            </Grid>
          </Grid>
        </Paper>
      );
    }
    
    // Standard table row for desktop
    return (
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
      </TableRow>
    );
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: { xs: 'wrap', sm: 'nowrap' }
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '1.8rem', sm: '2.125rem' }, 
            width: { xs: '100%', sm: 'auto' },
            mb: { xs: 1, sm: 0 }
          }}
        >
          Användare ({users.length})
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Desktop view with table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
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
                users.map((user) => renderUserItem(user))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile view with cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {users.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Inga användare hittades</Typography>
          </Paper>
        ) : (
          users.map((user) => renderUserItem(user))
        )}
      </Box>
    </Box>
  );
};

export default UsersList; 