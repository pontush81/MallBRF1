import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Article as ArticleIcon,
  Event as EventIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

import { Page } from '../../types/Page';
import { Booking } from '../../types/Booking';
import pageServiceSupabase from '../../services/pageServiceSupabase';
import bookingServiceSupabase from '../../services/bookingServiceSupabase';
import { StatsCard, ModernCard } from '../../components/common/ModernCard';
import { modernTheme } from '../../theme/modernTheme';

interface DashboardStats {
  totalPages: number;
  publishedPages: number;
  totalBookings: number;
  activeBookings: number;
  uniqueUsers: number;
}

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPages: 0,
    publishedPages: 0,
    totalBookings: 0,
    activeBookings: 0,
    uniqueUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentPages, setRecentPages] = useState<Page[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  console.log('🔍 DashboardHome rendering - loading:', loading, 'error:', error);

  const fetchStats = async () => {
    try {
      console.log('📊 Starting to fetch stats...');
      setLoading(true);
      
      // Hämta sidor
      console.log('📄 Fetching pages...');
      const pages = await pageServiceSupabase.getAllPages();
      console.log('📄 Pages fetched:', pages.length);
      const publishedPages = pages.filter(page => page.isPublished);
      
      // Hämta bokningar
      console.log('📅 Fetching bookings...');
      const bookings = await bookingServiceSupabase.getAllBookings();
      console.log('📅 Bookings fetched:', bookings.length);
      const activeBookings = bookings.filter(booking => 
        booking.status === 'confirmed' || booking.status === 'pending'
      );
      
      // Räkna unika användare baserat på email
      const uniqueEmails = [...new Set(bookings.map(booking => booking.email))];
      
      // Senaste sidor (max 3)
      const sortedPages = pages
        .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())
        .slice(0, 3);
      
      // Senaste bokningar (max 3)  
      const sortedBookings = bookings
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        .slice(0, 3);

      const newStats = {
        totalPages: pages.length,
        publishedPages: publishedPages.length,
        totalBookings: bookings.length,
        activeBookings: activeBookings.length,
        uniqueUsers: uniqueEmails.length
      };

      console.log('📊 Stats calculated:', newStats);
      setStats(newStats);
      
      setRecentPages(sortedPages);
      setRecentBookings(sortedBookings);
      setError(null);
      console.log('✅ Stats fetch completed successfully');
      
    } catch (err) {
      console.error('❌ Error fetching dashboard stats:', err);
      setError('Kunde inte ladda statistik');
    } finally {
      setLoading(false);
      console.log('🏁 Loading set to false');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <CircularProgress size={60} sx={{ color: modernTheme.colors.primary[500] }} />
      </Box>
    );
  }

  if (error) {
    return (
      <ModernCard>
        <Alert severity="error" sx={{ borderRadius: modernTheme.borderRadius.lg }}>
          {error}
        </Alert>
      </ModernCard>
    );
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: modernTheme.spacing[6] }}>
        <ModernCard gradient>
          <Box sx={{ textAlign: 'center', py: modernTheme.spacing[4] }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: modernTheme.typography.fontWeight.bold,
                color: 'white',
                mb: modernTheme.spacing[2]
              }}
            >
              Välkommen till Admin-panelen
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: modernTheme.typography.fontWeight.normal
              }}
            >
              Hantera ditt innehåll och bokningar från en central plats
            </Typography>
          </Box>
        </ModernCard>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: modernTheme.spacing[6] }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            title="Totalt Sidor"
            value={stats.totalPages}
            subtitle={`${stats.publishedPages} publicerade`}
            trend="neutral"
            icon={<ArticleIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            title="Publicerade"
            value={stats.publishedPages}
            subtitle={`${Math.round((stats.publishedPages / Math.max(stats.totalPages, 1)) * 100)}% av alla`}
            trend="up"
            icon={<ViewIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            title="Bokningar"
            value={stats.totalBookings}
            subtitle={`${stats.activeBookings} aktiva`}
            trend="up"
            icon={<EventIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            title="Aktiva Bokningar"
            value={stats.activeBookings}
            subtitle="Bekräftade/väntande"
            trend="neutral"
            icon={<CheckIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatsCard
            title="Användare"
            value={stats.uniqueUsers}
            subtitle="Unika emailadresser"
            trend="up"
            icon={<PeopleIcon />}
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Pages */}
        <Grid item xs={12} md={6}>
          <ModernCard 
            title="Senaste Sidor" 
            subtitle="Nyligen uppdaterade sidor"
            icon={<ArticleIcon />}
          >
            <Box sx={{ mt: modernTheme.spacing[2] }}>
              {recentPages.length > 0 ? (
                recentPages.map((page, index) => (
                  <Box 
                    key={page.id}
                    sx={{ 
                      py: modernTheme.spacing[3],
                      borderBottom: index < recentPages.length - 1 ? 
                        `1px solid ${modernTheme.colors.gray[200]}` : 'none'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start' 
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: modernTheme.typography.fontWeight.semibold,
                            color: modernTheme.colors.gray[900],
                            mb: modernTheme.spacing[1]
                          }}
                        >
                          {page.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: modernTheme.colors.gray[600],
                            mb: modernTheme.spacing[1]
                          }}
                        >
                          {page.content ? page.content.substring(0, 80) + '...' : 'Inget innehåll'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ color: modernTheme.colors.gray[500] }}
                        >
                          Uppdaterad: {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('sv-SE') : 'Okänt datum'}
                        </Typography>
                      </Box>
                      <Box sx={{ ml: modernTheme.spacing[2] }}>
                        <Box
                          sx={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: page.isPublished ? 
                              modernTheme.colors.success[500] : 
                              modernTheme.colors.gray[400],
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: modernTheme.colors.gray[500],
                    textAlign: 'center',
                    py: modernTheme.spacing[4]
                  }}
                >
                  Inga sidor skapade än
                </Typography>
              )}
            </Box>
          </ModernCard>
        </Grid>

        {/* Recent Bookings */}
        <Grid item xs={12} md={6}>
          <ModernCard 
            title="Senaste Bokningar" 
            subtitle="Nyligen gjorda bokningar"
            icon={<EventIcon />}
          >
            <Box sx={{ mt: modernTheme.spacing[2] }}>
              {recentBookings.length > 0 ? (
                recentBookings.map((booking, index) => (
                  <Box 
                    key={booking.id}
                    sx={{ 
                      py: modernTheme.spacing[3],
                      borderBottom: index < recentBookings.length - 1 ? 
                        `1px solid ${modernTheme.colors.gray[200]}` : 'none'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start' 
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: modernTheme.typography.fontWeight.semibold,
                            color: modernTheme.colors.gray[900],
                            mb: modernTheme.spacing[1]
                          }}
                        >
                          {booking.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: modernTheme.colors.gray[600],
                            mb: modernTheme.spacing[1]
                          }}
                        >
                          {booking.email}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ color: modernTheme.colors.gray[500] }}
                        >
                          Period: {booking.startDate ? new Date(booking.startDate).toLocaleDateString('sv-SE') : 'Okänt datum'} - {booking.endDate ? new Date(booking.endDate).toLocaleDateString('sv-SE') : 'Okänt datum'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: modernTheme.spacing[2],
                          py: modernTheme.spacing[1],
                          borderRadius: modernTheme.borderRadius.lg,
                          backgroundColor: booking.status === 'confirmed' ? 
                            modernTheme.colors.success[100] : 
                            booking.status === 'pending' ?
                            modernTheme.colors.warning[100] :
                            modernTheme.colors.gray[100],
                          color: booking.status === 'confirmed' ? 
                            modernTheme.colors.success[800] : 
                            booking.status === 'pending' ?
                            modernTheme.colors.warning[800] :
                            modernTheme.colors.gray[800],
                          fontSize: modernTheme.typography.fontSize.xs,
                          fontWeight: modernTheme.typography.fontWeight.medium,
                        }}
                      >
                        {booking.status === 'confirmed' ? 'Bekräftad' : 
                         booking.status === 'pending' ? 'Väntande' : 
                         booking.status || 'Okänd'}
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: modernTheme.colors.gray[500],
                    textAlign: 'center',
                    py: modernTheme.spacing[4]
                  }}
                >
                  Inga bokningar gjorda än
                </Typography>
              )}
            </Box>
          </ModernCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome; 