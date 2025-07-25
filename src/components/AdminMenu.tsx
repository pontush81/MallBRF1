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
import { modernTheme } from '../theme/modernTheme';
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
      // Hämta bokningsstatistik (använd cache för snabbare laddning)
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
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          mt: modernTheme.spacing[8], // Increased from 0 to fix spacing issue
          mb: modernTheme.spacing[8], // Increased for better separation
          fontFamily: modernTheme.typography.fontFamily.primary,
          fontWeight: modernTheme.typography.fontWeight.bold,
          color: modernTheme.colors.primary[800],
          fontSize: modernTheme.typography.fontSize['3xl']
        }}
      >
        Välkommen till adminpanelen
      </Typography>
      
      {/* Innehåll & Operationer */}
      <Typography 
        variant="h6" 
        sx={{ 
          mb: modernTheme.spacing[4],
          fontFamily: modernTheme.typography.fontFamily.primary,
          fontWeight: modernTheme.typography.fontWeight.semibold,
          color: modernTheme.colors.primary[600],
          fontSize: modernTheme.typography.fontSize.lg
        }}
      >
        Innehåll & Operationer
      </Typography>
      <Grid container spacing={modernTheme.spacing[4]} sx={{ mb: modernTheme.spacing[8] }}>
        {/* Sidor card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              background: modernTheme.gradients.card,
              borderRadius: modernTheme.borderRadius.xl,
              boxShadow: modernTheme.shadows.lg,
              border: `1px solid ${modernTheme.colors.gray[200]}`,
              transition: modernTheme.transitions.normal,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: modernTheme.shadows.xl,
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ 
                  background: modernTheme.gradients.accent,
                  width: 48, 
                  height: 48,
                  boxShadow: modernTheme.shadows.md
                }}>
                  <PageIcon fontSize="medium" />
                </Avatar>
              }
              title={
                <Typography sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                  fontSize: modernTheme.typography.fontSize.lg,
                  color: modernTheme.colors.primary[700]
                }}>
                  Sidor
                </Typography>
              }
              sx={{ pb: modernTheme.spacing[2] }}
            />
            <CardContent sx={{ pt: 0, pb: modernTheme.spacing[2] }}>
              <Typography 
                variant="h3" 
                sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.bold,
                  fontSize: modernTheme.typography.fontSize['4xl'],
                  color: modernTheme.colors.primary[800],
                  lineHeight: modernTheme.typography.lineHeight.tight
                }}
              >
                {stats.totalPages}
              </Typography>
            </CardContent>
            <Box sx={{ px: modernTheme.spacing[4], pb: modernTheme.spacing[4] }}>
              <Button 
                variant="outlined"
                size="small" 
                onClick={() => navigate('/admin/pages')}
                sx={{
                  borderColor: modernTheme.colors.primary[300],
                  color: modernTheme.colors.primary[600],
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.medium,
                  '&:hover': {
                    borderColor: modernTheme.colors.primary[500],
                    backgroundColor: modernTheme.colors.primary[50],
                  }
                }}
              >
                Hantera sidor
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Bokningar card - Made consistent with other cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              background: modernTheme.gradients.card,
              borderRadius: modernTheme.borderRadius.xl,
              boxShadow: modernTheme.shadows.lg,
              border: `1px solid ${modernTheme.colors.gray[200]}`,
              transition: modernTheme.transitions.normal,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: modernTheme.shadows.xl,
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${modernTheme.colors.secondary[500]} 0%, ${modernTheme.colors.secondary[600]} 100%)`,
                  width: 48, 
                  height: 48,
                  boxShadow: modernTheme.shadows.md
                }}>
                  <BookingIcon fontSize="medium" />
                </Avatar>
              }
              title={
                <Typography sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                  fontSize: modernTheme.typography.fontSize.lg,
                  color: modernTheme.colors.primary[700]
                }}>
                  Bokningar
                </Typography>
              }
              sx={{ pb: modernTheme.spacing[2] }}
            />
            <CardContent sx={{ pt: 0, pb: modernTheme.spacing[2] }}>
              <Typography 
                variant="h3" 
                sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.bold,
                  fontSize: modernTheme.typography.fontSize['4xl'],
                  color: modernTheme.colors.primary[800],
                  lineHeight: modernTheme.typography.lineHeight.tight,
                  mb: modernTheme.spacing[2]
                }}
              >
                {stats.totalBookings}
              </Typography>
              
              {/* Visa bokningar per år */}
              {loading ? (
                <CircularProgress size={24} sx={{ color: modernTheme.colors.secondary[500] }} />
              ) : (
                Object.keys(stats.bookingsByYear).length > 0 && (
                  <List dense sx={{ mt: modernTheme.spacing[2], p: 0 }}>
                    {Object.keys(stats.bookingsByYear)
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .slice(0, 2) // Show only last 2 years for consistency
                      .map(year => (
                        <ListItem key={year} sx={{ py: modernTheme.spacing[1], px: 0 }}>
                          <ListItemText 
                            primary={`${year}: ${stats.bookingsByYear[year]} bokningar`}
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              sx: {
                                fontFamily: modernTheme.typography.fontFamily.primary,
                                fontWeight: modernTheme.typography.fontWeight.medium,
                                color: modernTheme.colors.secondary[600]
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                  </List>
                )
              )}
            </CardContent>
            <Box sx={{ px: modernTheme.spacing[4], pb: modernTheme.spacing[4] }}>
              <Button 
                variant="outlined"
                size="small" 
                onClick={() => navigate('/booking')}
                sx={{
                  borderColor: modernTheme.colors.primary[300],
                  color: modernTheme.colors.primary[600],
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.medium,
                  '&:hover': {
                    borderColor: modernTheme.colors.primary[500],
                    backgroundColor: modernTheme.colors.primary[50],
                  }
                }}
              >
                Hantera bokningar
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Underhållsplan card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              background: modernTheme.gradients.card,
              borderRadius: modernTheme.borderRadius.xl,
              boxShadow: modernTheme.shadows.lg,
              border: `1px solid ${modernTheme.colors.gray[200]}`,
              transition: modernTheme.transitions.normal,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: modernTheme.shadows.xl,
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${modernTheme.colors.warning[500]} 0%, ${modernTheme.colors.warning[600]} 100%)`,
                  width: 48, 
                  height: 48,
                  boxShadow: modernTheme.shadows.md
                }}>
                  <MaintenanceIcon fontSize="medium" />
                </Avatar>
              }
              title={
                <Typography sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                  fontSize: modernTheme.typography.fontSize.lg,
                  color: modernTheme.colors.primary[700]
                }}>
                  Underhållsplan
                </Typography>
              }
              sx={{ pb: modernTheme.spacing[2] }}
            />
            <CardContent sx={{ pt: 0, pb: modernTheme.spacing[2] }}>
              <Typography 
                variant="h3" 
                sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.bold,
                  fontSize: modernTheme.typography.fontSize['4xl'],
                  color: modernTheme.colors.primary[800],
                  lineHeight: modernTheme.typography.lineHeight.tight,
                  mb: modernTheme.spacing[2]
                }}
              >
                {maintenanceTasksData.length}
              </Typography>
              
              {/* Visa uppgifter per status */}
              {loading ? (
                <CircularProgress size={24} sx={{ color: modernTheme.colors.warning[500] }} />
              ) : (
                <List dense sx={{ mt: modernTheme.spacing[2], p: 0 }}>
                  <ListItem sx={{ py: modernTheme.spacing[1], px: 0 }}>
                    <ListItemText 
                      primary={`Ej påbörjade: ${stats.pendingMaintenance}`}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: {
                          fontFamily: modernTheme.typography.fontFamily.primary,
                          fontWeight: modernTheme.typography.fontWeight.medium,
                          color: modernTheme.colors.warning[600]
                        }
                      }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: modernTheme.spacing[1], px: 0 }}>
                    <ListItemText 
                      primary={`Klara: ${stats.completedMaintenance}`}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: {
                          fontFamily: modernTheme.typography.fontFamily.primary,
                          fontWeight: modernTheme.typography.fontWeight.medium,
                          color: modernTheme.colors.success[600]
                        }
                      }}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
            <Box sx={{ px: modernTheme.spacing[4], pb: modernTheme.spacing[4] }}>
              <Button 
                variant="outlined"
                size="small" 
                onClick={() => navigate('/admin/maintenance')}
                sx={{
                  borderColor: modernTheme.colors.primary[300],
                  color: modernTheme.colors.primary[600],
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.medium,
                  '&:hover': {
                    borderColor: modernTheme.colors.primary[500],
                    backgroundColor: modernTheme.colors.primary[50],
                  }
                }}
              >
                Visa underhållsplan
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Användarhantering */}
      <Typography 
        variant="h6" 
        sx={{ 
          mb: modernTheme.spacing[4],
          fontFamily: modernTheme.typography.fontFamily.primary,
          fontWeight: modernTheme.typography.fontWeight.semibold,
          color: modernTheme.colors.primary[600],
          fontSize: modernTheme.typography.fontSize.lg
        }}
      >
        Användarhantering
      </Typography>
      <Grid container spacing={modernTheme.spacing[4]} sx={{ mb: modernTheme.spacing[6] }}>
        {/* Användare card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              background: modernTheme.gradients.card,
              borderRadius: modernTheme.borderRadius.xl,
              boxShadow: modernTheme.shadows.lg,
              border: `1px solid ${modernTheme.colors.gray[200]}`,
              transition: modernTheme.transitions.normal,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: modernTheme.shadows.xl,
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${modernTheme.colors.success[500]} 0%, ${modernTheme.colors.success[600]} 100%)`,
                  width: 48, 
                  height: 48,
                  boxShadow: modernTheme.shadows.md
                }}>
                  <PeopleIcon fontSize="medium" />
                </Avatar>
              }
              title={
                <Typography sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                  fontSize: modernTheme.typography.fontSize.lg,
                  color: modernTheme.colors.primary[700]
                }}>
                  Användare
                </Typography>
              }
              action={
                <Tooltip title="Uppdatera användarantal">
                  <IconButton 
                    aria-label="uppdatera" 
                    size="small" 
                    onClick={handleRefreshUserCount}
                    disabled={refreshingUsers}
                    sx={{
                      color: modernTheme.colors.primary[600],
                      '&:hover': {
                        backgroundColor: modernTheme.colors.primary[50],
                        color: modernTheme.colors.primary[700]
                      }
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
              sx={{ pb: modernTheme.spacing[2] }}
            />
            <CardContent sx={{ pt: 0, pb: modernTheme.spacing[2] }}>
              <Typography 
                variant="h3"
                sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.bold,
                  fontSize: modernTheme.typography.fontSize['4xl'],
                  color: modernTheme.colors.primary[800],
                  lineHeight: modernTheme.typography.lineHeight.tight,
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernTheme.spacing[2]
                }}
              >
                {refreshingUsers ? (
                  <>
                    <CircularProgress 
                      size={20} 
                      sx={{ color: modernTheme.colors.success[500] }} 
                    />
                    {stats.totalUsers}
                  </>
                ) : (
                  stats.totalUsers
                )}
              </Typography>
            </CardContent>
            <Box sx={{ px: modernTheme.spacing[4], pb: modernTheme.spacing[4] }}>
              <Button 
                variant="outlined"
                size="small" 
                onClick={() => navigate('/admin/users')}
                sx={{
                  borderColor: modernTheme.colors.primary[300],
                  color: modernTheme.colors.primary[600],
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.medium,
                  '&:hover': {
                    borderColor: modernTheme.colors.primary[500],
                    backgroundColor: modernTheme.colors.primary[50],
                  }
                }}
              >
                Hantera användare
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Tillåtna användare kort */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0}
            sx={{
              background: modernTheme.gradients.card,
              borderRadius: modernTheme.borderRadius.xl,
              boxShadow: modernTheme.shadows.lg,
              border: `1px solid ${modernTheme.colors.gray[200]}`,
              transition: modernTheme.transitions.normal,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: modernTheme.shadows.xl,
              }
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${modernTheme.colors.primary[500]} 0%, ${modernTheme.colors.primary[600]} 100%)`,
                  width: 48, 
                  height: 48,
                  boxShadow: modernTheme.shadows.md
                }}>
                  <SecurityIcon fontSize="medium" />
                </Avatar>
              }
              title={
                <Typography sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                  fontSize: modernTheme.typography.fontSize.lg,
                  color: modernTheme.colors.primary[700]
                }}>
                  Tillåtna användare
                </Typography>
              }
              sx={{ pb: modernTheme.spacing[2] }}
            />
            <CardContent sx={{ pt: 0, pb: modernTheme.spacing[2] }}>
              <Typography 
                variant="h3"
                sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.bold,
                  fontSize: modernTheme.typography.fontSize['4xl'],
                  color: modernTheme.colors.primary[800],
                  lineHeight: modernTheme.typography.lineHeight.tight,
                  mb: modernTheme.spacing[2]
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: modernTheme.colors.primary[500] }} />
                ) : (
                  stats.allowlistItems
                )}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.medium,
                  color: stats.allowlistItems === 0 && !loading ? 
                    modernTheme.colors.success[600] : 
                    modernTheme.colors.warning[600]
                }}
              >
                {stats.allowlistItems === 0 && !loading ? 
                  "Alla användare tillåts logga in" : 
                  "Begränsad åtkomst aktiverad"
                }
              </Typography>
            </CardContent>
            <Box sx={{ px: modernTheme.spacing[4], pb: modernTheme.spacing[4] }}>
              <Button 
                variant="outlined"
                size="small" 
                onClick={() => navigate('/admin/allowlist')}
                sx={{
                  borderColor: modernTheme.colors.primary[300],
                  color: modernTheme.colors.primary[600],
                  fontFamily: modernTheme.typography.fontFamily.primary,
                  fontWeight: modernTheme.typography.fontWeight.medium,
                  '&:hover': {
                    borderColor: modernTheme.colors.primary[500],
                    backgroundColor: modernTheme.colors.primary[50],
                  }
                }}
              >
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