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
  Divider,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Tab,
  Tabs
} from '@mui/material';
import { 
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  PersonAdd as AddToAllowlistIcon,
  Check as ApproveIcon,
  Block as RejectIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { User } from '../../types/User';
import { userService } from '../../services/userService';
import { Allowlist } from '../../services/auth/allowlist';

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
      id={`users-tabpanel-${index}`}
      aria-labelledby={`users-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UsersList: React.FC = () => {
  // State för användarlista
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allowlist, setAllowlist] = useState<Allowlist>({
    emails: [], 
    domains: [], 
    lastUpdated: new Date().toISOString()
  });
  const [tabValue, setTabValue] = useState(0);
  
  // Add theme and responsive media query
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Hämta alla användare vid komponentmontering
  useEffect(() => {
    fetchUsers();
    fetchAllowlist();
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
      
      // Separera användare i pending och active
      const pending = allUsers.filter(user => user.pendingApproval);
      const active = allUsers.filter(user => user.isActive);
      
      setUsers(allUsers);
      setPendingUsers(pending);
      setActiveUsers(active);
      setError(null);
    } catch (err) {
      setError('Ett fel uppstod vid hämtning av användare');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hämta nuvarande allowlist
  const fetchAllowlist = async () => {
    try {
      const data = await userService.getAllowlist();
      setAllowlist(data);
    } catch (err) {
      console.error('Error fetching allowlist:', err);
    }
  };

  // Lägg till användare i allowlist
  const addUserToAllowlist = async (email: string) => {
    try {
      if (!email) return;
      
      // Kontrollera om användaren redan finns i listan
      if (allowlist.emails.some(e => e.toLowerCase() === email.toLowerCase())) {
        setError(`${email} finns redan i listan över tillåtna användare`);
        return;
      }
      
      const updatedAllowlist = {
        ...allowlist,
        emails: [...allowlist.emails, email],
        lastUpdated: new Date().toISOString()
      };
      
      await userService.updateAllowlist(updatedAllowlist);
      setAllowlist(updatedAllowlist);
      setSuccess(`${email} har lagts till i listan över tillåtna användare`);
      setError(null);
    } catch (err) {
      setError('Ett fel uppstod när användaren skulle läggas till i allowlist');
      console.error(err);
    }
  };
  
  // Godkänn användare
  const approveUser = async (user: User) => {
    try {
      // Först uppdatera användaren i Firestore
      await userService.updateUserStatus(user.id, true);
      
      // Vänta en kort stund för att säkerställa att ändringen genomförs
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Om användaren inte finns i allowlist, lägg till dem
      if (!isInAllowlist(user.email)) {
        await addUserToAllowlist(user.email);
      }
      
      // Ladda om användarlistan för att få uppdaterad status
      await fetchUsers();
      
      setSuccess(`${user.name || user.email} har godkänts och kan nu logga in`);
    } catch (err) {
      setError('Ett fel uppstod när användaren skulle godkännas');
      console.error(err);
    }
  };
  
  // Avvisa användare
  const rejectUser = async (user: User) => {
    try {
      await userService.updateUserStatus(user.id, false);
      
      // Vänta en kort stund för att säkerställa att ändringen genomförs
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Ladda om användarlistan
      await fetchUsers();
      
      setSuccess(`${user.name || user.email} nekades åtkomst`);
    } catch (err) {
      setError('Ett fel uppstod när användaren skulle nekas');
      console.error(err);
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

  // Kontrollera om en användare finns i allowlist
  const isInAllowlist = (email: string) => {
    if (!email) return false;
    
    // Kolla om e-postadressen direkt finns i listan
    if (allowlist.emails.some(e => e.toLowerCase() === email.toLowerCase())) {
      return true;
    }
    
    // Kolla om domänen finns i listan
    const domain = email.split('@')[1];
    if (domain && allowlist.domains.some(d => d.toLowerCase() === domain.toLowerCase())) {
      return true;
    }
    
    return false;
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
            borderColor: user.pendingApproval ? 'warning.main' : user.role === 'admin' ? 'secondary.main' : 'primary.main' 
          }}
        >
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Typography variant="h6">{user.name || user.email}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </div>
            {user.pendingApproval ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Godkänn användare">
                  <IconButton 
                    size="small" 
                    color="success"
                    onClick={() => approveUser(user)}
                  >
                    <ApproveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Neka användare">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => rejectUser(user)}
                  >
                    <RejectIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Tooltip title={isInAllowlist(user.email) ? "Finns redan i allowlist" : "Lägg till i allowlist"}>
                <span>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => addUserToAllowlist(user.email)}
                    disabled={isInAllowlist(user.email)}
                  >
                    <AddToAllowlistIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
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
            {user.pendingApproval && (
              <Chip 
                label="Väntar på godkännande" 
                color="warning"
                size="small"
              />
            )}
            {isInAllowlist(user.email) && !user.pendingApproval && (
              <Chip 
                label="Tillåten användare" 
                color="info"
                size="small"
              />
            )}
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
              label={user.isActive ? 'Aktiv' : 'Inaktiv'} 
              color={user.isActive ? 'success' : 'error'}
              size="small"
            />
            {user.pendingApproval && (
              <Chip 
                label="Väntar på godkännande" 
                color="warning"
                size="small"
              />
            )}
            {isInAllowlist(user.email) && !user.pendingApproval && (
              <Chip 
                label="Tillåten" 
                color="info"
                size="small"
              />
            )}
          </Box>
        </TableCell>
        <TableCell>{formatDate(user.createdAt)}</TableCell>
        <TableCell>{formatDate(user.lastLogin)}</TableCell>
        <TableCell>
          {user.pendingApproval ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => approveUser(user)}
              >
                Godkänn
              </Button>
              <Button 
                size="small" 
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => rejectUser(user)}
              >
                Neka
              </Button>
            </Box>
          ) : (
            <Tooltip title={isInAllowlist(user.email) ? "Finns redan i allowlist" : "Lägg till i allowlist"}>
              <span>
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<AddToAllowlistIcon />}
                  onClick={() => addUserToAllowlist(user.email)}
                  disabled={isInAllowlist(user.email)}
                >
                  Tillåt
                </Button>
              </span>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
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
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label={`Aktiva användare (${activeUsers.length})`} 
            id="users-tab-0"
            aria-controls="users-tabpanel-0" 
          />
          <Tab 
            label={`Väntar på godkännande (${pendingUsers.length})`} 
            id="users-tab-1" 
            aria-controls="users-tabpanel-1"
            sx={{
              color: pendingUsers.length > 0 ? 'warning.main' : 'inherit',
              fontWeight: pendingUsers.length > 0 ? 'bold' : 'inherit'
            }}
          />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {/* Desktop view with table */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} elevation={0}>
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
                  {activeUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Inga aktiva användare hittades
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeUsers.map((user) => renderUserItem(user))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile view with cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {activeUsers.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Inga aktiva användare hittades</Typography>
              </Paper>
            ) : (
              activeUsers.map((user) => renderUserItem(user))
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {/* Desktop view with table */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} elevation={0}>
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
                  {pendingUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Inga användare väntar på godkännande
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingUsers.map((user) => renderUserItem(user))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile view with cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {pendingUsers.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Inga användare väntar på godkännande</Typography>
              </Paper>
            ) : (
              pendingUsers.map((user) => renderUserItem(user))
            )}
          </Box>
        </TabPanel>
      </Paper>

      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={success || ''}
      />
    </Box>
  );
};

export default UsersList; 