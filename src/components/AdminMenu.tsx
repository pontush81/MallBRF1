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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import { userService } from '../services/userService';
import { Booking } from '../types/Booking';

const AdminMenu: React.FC = () => {
  const [stats, setStats] = useState({
    totalPages: 10,
    totalBookings: 6,
    totalUsers: 0,
    bookingsByYear: {} as Record<string, number>
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
        fetchUserStats()
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshingUsers(false);
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
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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
      </Grid>
    </Box>
  );
};

export default AdminMenu; 