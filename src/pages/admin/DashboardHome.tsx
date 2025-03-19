import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Divider
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Article as PageIcon, 
  Event as BookingIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import pageService from '../../services/pageService';
import bookingService from '../../services/bookingService';

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
  
  const navigate = useNavigate();

  // Hämta statistik för dashboard
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Hämta sidstatistik
        const allPages = await pageService.getAllPages();
        const publishedPages = allPages.filter(page => page.isPublished);
        const draftPages = allPages.filter(page => !page.isPublished);
        
        // Hämta bokningsstatistik
        const allBookings = await bookingService.getAllBookings();
        const pendingBookings = allBookings.filter(booking => booking.status === 'pending');
        const confirmedBookings = allBookings.filter(booking => booking.status === 'confirmed');
        
        // Sortera sidorna efter senast uppdaterad
        const recentPages = [...allPages]
          .sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 3)
          .map(page => ({
            id: page.id,
            title: page.title,
            updatedAt: page.updatedAt || ''
          }));
        
        setStats({
          totalPages: allPages.length,
          publishedPages: publishedPages.length,
          draftPages: draftPages.length,
          totalBookings: allBookings.length,
          pendingBookings: pendingBookings.length,
          confirmedBookings: confirmedBookings.length,
          totalUsers: 12, // Mock-data
          recentPages
        });
      } catch (error) {
        console.error('Kunde inte hämta statistik:', error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <Box>
      
      
      {/* Statistik-kort */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Sidor
            </Typography>
            <Typography variant="body2">Totalt: {stats.totalPages}</Typography>
            <Typography variant="body2">Publicerade: {stats.publishedPages}</Typography>
            <Typography variant="body2">Utkast: {stats.draftPages}</Typography>
            <Button 
              sx={{ mt: 2 }} 
              size="small" 
              variant="outlined"
              onClick={() => navigate('/admin/pages')}
            >
              Visa alla
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Bokningar
            </Typography>
            <Typography variant="body2">Totalt: {stats.totalBookings}</Typography>
            <Typography variant="body2">Väntande: {stats.pendingBookings}</Typography>
            <Typography variant="body2">Bekräftade: {stats.confirmedBookings}</Typography>
            <Button 
              sx={{ mt: 2 }} 
              size="small" 
              variant="outlined"
              onClick={() => navigate('/admin/bookings')}
            >
              Visa alla
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Användare
            </Typography>
            <Typography variant="body2">Totalt: {stats.totalUsers}</Typography>
            <Button 
              sx={{ mt: 2 }} 
              size="small" 
              variant="outlined"
              onClick={() => navigate('/admin/users')}
            >
              Visa alla
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Statistik
            </Typography>
            <Typography variant="body2">Besökare denna månad: 105</Typography>
            <Typography variant="body2">Bokningar denna månad: {stats.totalBookings}</Typography>
            <Button 
              sx={{ mt: 2 }} 
              size="small" 
              variant="outlined"
              onClick={() => navigate('/admin/stats')}
            >
              Mer statistik
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Senaste sidor och snabblänkar */}
      <Grid container spacing={3}>
        {/* Senaste sidor */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Senast uppdaterade sidor
            </Typography>
            <List>
              {stats.recentPages.map(page => (
                <ListItem key={page.id} disablePadding>
                  <ListItemButton onClick={() => navigate(`/admin/pages/edit/${page.id}`)}>
                    <ListItemText 
                      primary={page.title} 
                      secondary={`Uppdaterad: ${new Date(page.updatedAt).toLocaleDateString('sv-SE')}`} 
                    />
                    <EditIcon fontSize="small" color="action" />
                  </ListItemButton>
                </ListItem>
              ))}
              {stats.recentPages.length === 0 && (
                <ListItem>
                  <ListItemText primary="Inga sidor hittades" />
                </ListItem>
              )}
            </List>
            <Divider sx={{ my: 1 }} />
            <Button 
              startIcon={<PageIcon />}
              onClick={() => navigate('/admin/pages')}
              fullWidth
            >
              Visa alla sidor
            </Button>
          </Paper>
        </Grid>
        
        {/* Snabblänkar */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Snabblänkar
            </Typography>
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/admin/pages/new')}>
                  <ListItemIcon>
                    <AddIcon />
                  </ListItemIcon>
                  <ListItemText primary="Skapa ny sida" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/admin/bookings')}>
                  <ListItemIcon>
                    <BookingIcon />
                  </ListItemIcon>
                  <ListItemText primary="Hantera bokningar" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/admin/users')}>
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Hantera användare" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/admin/settings')}>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Inställningar" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome; 