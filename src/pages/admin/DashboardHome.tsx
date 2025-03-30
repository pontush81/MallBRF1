import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Button,
  Divider,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  LinearProgress
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon, 
  Article as PageIcon, 
  Event as BookingIcon,
  Today as CalendarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import pageService from '../../services/pageService';
import bookingService from '../../services/bookingService';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

// Komponenten för översiktsdashboard
const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalPages: 0,
    publishedPages: 0,
    draftPages: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalUsers: 12, // Mock-data för användare
    recentPages: [] as { id: string; title: string; updatedAt: string }[],
    upcomingBookings: [] as { id: string; name: string; startDate: string; endDate: string }[]
  });

  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Hämta sidstatistik
        const pages = await pageService.getAllPages();
        const published = pages.filter(p => p.isPublished).length;
        const drafts = pages.length - published;
        
        // Hämta bokningsstatistik
        const bookings = await bookingService.getAllBookings();
        const pending = bookings.filter(b => b.status === 'pending').length;
        const confirmed = bookings.filter(b => b.status === 'confirmed').length;
        
        // Hämta senaste sidorna
        const recentPages = pages
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map(page => ({
            id: page.id,
            title: page.title,
            updatedAt: page.updatedAt
          }));
        
        // Hämta kommande bokningar (sorterade efter startdatum)
        const today = new Date();
        const upcomingBookings = bookings
          .filter(b => new Date(b.startDate) >= today)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 5)
          .map(booking => ({
            id: booking.id,
            name: booking.name,
            startDate: booking.startDate,
            endDate: booking.endDate
          }));
        
        setStats({
          totalPages: pages.length,
          publishedPages: published,
          draftPages: drafts,
          totalBookings: bookings.length,
          pendingBookings: pending,
          confirmedBookings: confirmed,
          totalUsers: 12, // Mock-data tills vi har användarstatistik
          recentPages,
          upcomingBookings
        });
      } catch (error) {
        console.error('Fel vid hämtning av statistik:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Formatera datum
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: sv });
    } catch (error) {
      return 'Ogiltigt datum';
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
      <Typography variant="h4" component="h1" sx={{ mt: 0, mb: 2 }}>
        Välkommen till adminpanelen
      </Typography>
      
      {/* Statistik-kort */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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
            </CardContent>
            <CardActions sx={{ pt: 0 }}>
              <Button size="small" onClick={() => navigate('/admin/bookings')}>
                Hantera bokningar
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                  <PeopleIcon fontSize="small" />
                </Avatar>
              }
              title="Användare"
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1, pb: 1 }}>
              <Typography variant="h4">{stats.totalUsers}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/admin/users')}>
                Hantera användare
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                  <TrendingUpIcon fontSize="small" />
                </Avatar>
              }
              title="Besökare"
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1, pb: 1 }}>
              <Typography variant="h4">105</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled>Visa detaljer</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Senaste aktiviteter */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
            <CardHeader title="Senast uppdaterade sidor" sx={{ pb: 1 }} />
            <Divider />
            <CardContent sx={{ maxHeight: 300, overflow: 'auto', py: 1 }}>
              {stats.recentPages.length === 0 ? (
                <Typography color="text.secondary">Inga sidor har uppdaterats nyligen</Typography>
              ) : (
                stats.recentPages.map((page) => (
                  <Box key={page.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle1">{page.title}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Uppdaterad: {formatDate(page.updatedAt)}
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/admin/pages/edit/${page.id}`)}
                      >
                        Redigera
                      </Button>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
            <CardHeader title="Kommande bokningar" sx={{ pb: 1 }} />
            <Divider />
            <CardContent sx={{ maxHeight: 300, overflow: 'auto', py: 1 }}>
              {stats.upcomingBookings.length === 0 ? (
                <Typography color="text.secondary">Inga kommande bokningar</Typography>
              ) : (
                stats.upcomingBookings.map((booking) => (
                  <Box key={booking.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle1">{booking.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/admin/bookings')}>
                Visa alla bokningar
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome; 