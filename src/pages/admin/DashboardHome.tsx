import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Article as PageIcon, 
  Event as BookingIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import pageServiceSupabase from '../../services/pageServiceSupabase';
import bookingServiceSupabase from '../../services/bookingServiceSupabase';
import { userService } from '../../services/userService';

import AdminMenu from '../../components/AdminMenu';

// Komponenten för översiktsdashboard
const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalPages: 0,
    publishedPages: 0,
    draftPages: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalUsers: 0,
    bookingsByYear: {} as Record<string, number>,
    recentPages: [] as { id: string; title: string; updatedAt: string }[]
  });

  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Add state to track user count refresh
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Hämta sidstatistik
      const pages = await pageServiceSupabase.getAllPages();
      const published = pages.filter(p => p.isPublished).length;
      const drafts = pages.length - published;
      
      // Hämta bokningsstatistik (använd cache för snabbare laddning)
      const bookings = await bookingServiceSupabase.getAllBookings();
      const pending = bookings.filter(b => b.status === 'pending').length;
      const confirmed = bookings.filter(b => b.status === 'confirmed').length;
      
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
      
      // First make sure we sync auth users with Firestore
      await userService.syncAuthUsersWithFirestore();
      
      // Then get all users which should now include the synced auth users
      const users = await userService.getAllUsers();
      console.log(`Dashboard found ${users.length} unique users`);
      
      // Hämta senaste sidorna
      const recentPages = pages
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map(page => ({
          id: page.id,
          title: page.title,
          updatedAt: page.updatedAt
        }));
      
      setStats({
        totalPages: pages.length,
        publishedPages: published,
        draftPages: drafts,
        totalBookings: bookings.length,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        totalUsers: users.length,
        bookingsByYear,
        recentPages
      });
    } catch (error) {
      console.error('Fel vid hämtning av statistik:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to refresh user count
  const handleRefreshUserCount = () => {
    setRefreshing(true);
    fetchStats();
  };



  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
      {/* Använd AdminMenu-komponenten istället för att återskapa statistikkorten */}
      <AdminMenu />
      
      {/* Behåll den befintliga statisk-korten som backup (dold) ifall AdminMenu inte fungerar */}
      <Box sx={{ display: 'none' }}>
        <Typography variant="h4" component="h1" sx={{ mt: 0, mb: 2 }}>
          Välkommen till adminpanelen
        </Typography>
        
        {/* Statistik-kort */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2} sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
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
              <CardActions sx={{ pt: 0 }}>
                <Button size="small" onClick={() => navigate('/admin/pages')}>
                  Hantera sidor
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2} sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
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
                {Object.keys(stats.bookingsByYear).length > 0 && (
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
                )}
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                <Button size="small" onClick={() => navigate('/admin/bookings')}>
                  Hantera bokningar
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card elevation={2} sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
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
                      disabled={refreshing}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ pt: 1, pb: 1 }}>
                <Typography variant="h4">
                  {refreshing ? 
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
              <CardActions>
                <Button size="small" onClick={() => navigate('/admin/users')}>
                  Hantera användare
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardHome; 