import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  BarChart as ChartIcon, 
  Description as PageIcon, 
  People as UserIcon
} from '@mui/icons-material';
import { useNavigate, Route, Routes } from 'react-router-dom';

import PagesList from './PagesList';
import PageEditor from './PageEditor';
import pageService from '../../services/pageService';

// Komponenten för översiktsdashboard
const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalPages: 0,
    publishedPages: 0,
    draftPages: 0,
    totalUsers: 12, // Mock-data för användare
    recentPages: [] as { id: string; title: string; updatedAt: string }[]
  });
  
  const navigate = useNavigate();

  // Hämta statistik för dashboard
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const allPages = await pageService.getAllPages();
        const publishedPages = allPages.filter(page => page.isPublished);
        const draftPages = allPages.filter(page => !page.isPublished);
        
        // Sortera sidorna efter senast uppdaterad
        const recentPages = [...allPages]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 3)
          .map(page => ({
            id: page.id,
            title: page.title,
            updatedAt: page.updatedAt
          }));
        
        setStats({
          totalPages: allPages.length,
          publishedPages: publishedPages.length,
          draftPages: draftPages.length,
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
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Totalt antal sidor
              </Typography>
              <Typography variant="h4">
                {stats.totalPages}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Publicerade sidor
              </Typography>
              <Typography variant="h4">
                {stats.publishedPages}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Utkast
              </Typography>
              <Typography variant="h4">
                {stats.draftPages}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Totalt antal användare
              </Typography>
              <Typography variant="h4">
                {stats.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Pages */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Senast uppdaterade sidor
            </Typography>
            <List>
              {stats.recentPages.map((page, index) => (
                <React.Fragment key={page.id}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => navigate(`/admin/pages/edit/${page.id}`)}>
                      <ListItemIcon>
                        <PageIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={page.title} 
                        secondary={`Uppdaterad: ${new Date(page.updatedAt).toLocaleDateString()}`} 
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < stats.recentPages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {stats.recentPages.length === 0 && (
                <ListItem>
                  <ListItemText primary="Inga sidor har skapats än" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Snabbåtgärder
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item>
                <ListItemButton 
                  onClick={() => navigate('/admin/pages/new')}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <ListItemIcon>
                    <PageIcon />
                  </ListItemIcon>
                  <ListItemText primary="Skapa ny sida" />
                </ListItemButton>
              </Grid>
              <Grid item>
                <ListItemButton 
                  onClick={() => navigate('/admin/pages')}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <ListItemIcon>
                    <PageIcon />
                  </ListItemIcon>
                  <ListItemText primary="Hantera sidor" />
                </ListItemButton>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Huvudkomponent för admin-dashboarden med sidebar och routing
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState('dashboard');
  
  // Uppdatera vald menypunkt baserat på nuvarande sökväg
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin/pages')) {
      setSelectedItem('pages');
    } else if (path.includes('/admin/users')) {
      setSelectedItem('users');
    } else if (path.includes('/admin/stats')) {
      setSelectedItem('stats');
    } else {
      setSelectedItem('dashboard');
    }
  }, []);

  const handleNavItemClick = (item: string) => {
    setSelectedItem(item);
    
    switch (item) {
      case 'dashboard':
        navigate('/admin');
        break;
      case 'pages':
        navigate('/admin/pages');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'stats':
        navigate('/admin/stats');
        break;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>        
        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Admin Menu
              </Typography>
              <List component="nav">
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={selectedItem === 'dashboard'}
                    onClick={() => handleNavItemClick('dashboard')}
                  >
                    <ListItemIcon>
                      <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={selectedItem === 'pages'}
                    onClick={() => handleNavItemClick('pages')}
                  >
                    <ListItemIcon>
                      <PageIcon />
                    </ListItemIcon>
                    <ListItemText primary="Hantera sidor" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={selectedItem === 'users'}
                    onClick={() => handleNavItemClick('users')}
                  >
                    <ListItemIcon>
                      <UserIcon />
                    </ListItemIcon>
                    <ListItemText primary="Användare" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={selectedItem === 'stats'}
                    onClick={() => handleNavItemClick('stats')}
                  >
                    <ListItemIcon>
                      <ChartIcon />
                    </ListItemIcon>
                    <ListItemText primary="Statistik" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 3 }}>
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/pages" element={<PagesList />} />
                <Route path="/pages/new" element={<PageEditor />} />
                <Route path="/pages/edit/:id" element={<PageEditor />} />
                {/* Fler rutter kan läggas till här senare */}
              </Routes>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 