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
    recentPages: [] as { id: string; title: string; updatedAt: string }[]
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
        
        setStats({
          totalPages: pages.length,
          publishedPages: published,
          draftPages: drafts,
          totalBookings: bookings.length,
          pendingBookings: pending,
          confirmedBookings: confirmed,
          totalUsers: 12, // Mock-data tills vi har användarstatistik
          recentPages
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
      </Grid>
    </Box>
  );
};

export default DashboardHome; 