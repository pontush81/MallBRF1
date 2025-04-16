import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography, 
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  CardHeader,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { 
  Article as PageIcon,
  Event as BookingIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  BuildCircle as MaintenanceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import { userService } from '../services/userService';
import { Booking } from '../types/Booking';
import { maintenanceTasksData } from '../data/maintenanceTasksData';

const AdminMenu: React.FC = () => {
  const [stats, setStats] = useState({
    totalPages: 10,
    totalBookings: 6,
    totalUsers: 0,
    bookingsByYear: {} as Record<string, number>,
    allowlistItems: 0,
    pendingMaintenance: 0,
    completedMaintenance: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshingUsers, setRefreshingUsers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      await Promise.all([
        fetchBookingStats(),
        fetchUserStats(),
        fetchAllowlistStats(),
        fetchMaintenanceStats()
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshingUsers(false);
    }
  };

  const fetchMaintenanceStats = async () => {
    try {
      // Count maintenance tasks by status
      const pending = maintenanceTasksData.filter(task => task.status === 'pending').length;
      const completed = maintenanceTasksData.filter(task => task.status === 'completed').length;
      
      setStats(prevStats => ({
        ...prevStats,
        pendingMaintenance: pending,
        completedMaintenance: completed
      }));
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
    }
  };

  const fetchBookingStats = async () => {
    try {
      // Hämta bokningsstatistik
      const bookings = await bookingService.getAllBookings();
      
      // Räkna bokningar per år
      const bookingsByYear: Record<string, number> = {};
      
      bookings.forEach(booking => {
        // Använd startDate eller startdate (för att hantera båda formaten)
        const startDateStr = booking.startDate || booking.startdate;
        if (startDateStr) {
          const year = new Date(startDateStr).getFullYear().toString();
          if (!bookingsByYear[year]) {
            bookingsByYear[year] = 0;
          }
          bookingsByYear[year]++;
        }
      });
      
      setStats(prevStats => ({
        ...prevStats,
        totalBookings: bookings.length,
        bookingsByYear
      }));
    } catch (error) {
      console.error('Fel vid hämtning av bokningsstatistik:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Force fresh user data without caching
      const users = await userService.getAllUsers();
      
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: users.length
      }));
    } catch (error) {
      console.error('Fel vid hämtning av användarstatistik:', error);
    }
  };

  const fetchAllowlistStats = async () => {
    try {
      const allowlist = await userService.getAllowlist();
      const totalItems = allowlist.emails.length + allowlist.domains.length;
      
      setStats(prevStats => ({
        ...prevStats,
        allowlistItems: totalItems
      }));
    } catch (error) {
      console.error('Fel vid hämtning av allowlist-statistik:', error);
    }
  };

  const handleRefreshUserCount = () => {
    setRefreshingUsers(true);
    fetchUserStats().finally(() => setRefreshingUsers(false));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mt: 0, mb: 2 }}>
        Välkommen till adminpanelen
      </Typography>
      
      {/* Statistik-kort */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Sidor card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                  <PageIcon fontSize="small" />
                </Avatar>
              }
              title="Sidor"
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1, pb: 1 }}>
              <Typography variant="h4">{stats.totalPages}</Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button size="small" onClick={() => navigate('/admin/pages')}>
                Hantera sidor
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Bokningar card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                  <BookingIcon fontSize="small" />
                </Avatar>
              }
              title="Bokningar"
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1, pb: 1 }}>
              <Typography variant="h4">{stats.totalBookings}</Typography>
              
              {/* Visa bokningar per år */}
              {loading ? (
                <CircularProgress size={20} sx={{ mt: 1 }} />
              ) : (
                Object.keys(stats.bookingsByYear).length > 0 && (
                  <List dense sx={{ mt: 1, p: 0 }}>
                    {Object.keys(stats.bookingsByYear)
                      .sort((a, b) => parseInt(b) - parseInt(a)) // Sortera åren i fallande ordning
                      .map(year => (
                        <ListItem key={year} sx={{ py: 0, px: 1 }}>
                          <ListItemText 
                            primary={`${year}: ${stats.bookingsByYear[year]} bokningar`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                )
              )}
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button size="small" onClick={() => navigate('/booking')}>
                Hantera bokningar
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Användare card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                  <PeopleIcon fontSize="small" />
                </Avatar>
              }
              title="Användare"
              action={
                <Tooltip title="Uppdatera användarantal">
                  <IconButton 
                    aria-label="uppdatera" 
                    size="small" 
                    onClick={handleRefreshUserCount}
                    disabled={refreshingUsers}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1, pb: 1 }}>
              <Typography variant="h4">
                {refreshingUsers ? 
                  <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Box sx={{ width: '20px', mr: 1 }}>
                      <LinearProgress />
                    </Box>
                    {stats.totalUsers}
                  </Box> : 
                  stats.totalUsers
                }
              </Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button size="small" onClick={() => navigate('/admin/users')}>
                Hantera användare
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Underhållsplan card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                  <MaintenanceIcon fontSize="small" />
                </Avatar>
              }
              title="Underhållsplan"
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1, pb: 1 }}>
              <Typography variant="h4">{maintenanceTasksData.length}</Typography>
              
              {/* Visa uppgifter per status */}
              {loading ? (
                <CircularProgress size={20} sx={{ mt: 1 }} />
              ) : (
                <List dense sx={{ mt: 1, p: 0 }}>
                  <ListItem sx={{ py: 0, px: 1 }}>
                    <ListItemText 
                      primary={`Ej påbörjade: ${stats.pendingMaintenance}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0, px: 1 }}>
                    <ListItemText 
                      primary={`Klara: ${stats.completedMaintenance}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button size="small" onClick={() => navigate('/admin/maintenance')}>
                Visa underhållsplan
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Tillåtna användare kort */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                  <SecurityIcon fontSize="small" />
                </Avatar>
              }
              title="Tillåtna användare"
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1, pb: 1 }}>
              <Typography variant="h4">
                {loading ? 
                  <CircularProgress size={20} /> : 
                  stats.allowlistItems
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.allowlistItems === 0 && !loading ? 
                  "Alla användare tillåts logga in" : 
                  "Begränsad åtkomst aktiverad"
                }
              </Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button size="small" onClick={() => navigate('/admin/allowlist')}>
                Hantera tillåtna användare
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminMenu; 