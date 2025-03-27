import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  Article as ArticleIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useNavigate, Route, Routes } from 'react-router-dom';

import PagesList from './PagesList';
import PageEditor from './PageEditor';
import BookingsList from './BookingsList';
import DashboardHome from './DashboardHome';
import UsersList from './UsersList';

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
    } else if (path.includes('/admin/bookings')) {
      setSelectedItem('bookings');
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
      case 'bookings':
        navigate('/admin/bookings');
        break;
      case 'users':
        navigate('/admin/users');
        break;
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Paper elevation={1} sx={{ mb: 3, px: 3, py: 2 }}>
        <Grid container spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems="center">
          <Grid item>
            <Typography variant="h6" sx={{ mb: { xs: 2, sm: 0 } }}>
              Administration
            </Typography>
          </Grid>
          
          <Grid item>
            <Button
              variant={selectedItem === 'dashboard' ? 'contained' : 'outlined'}
              startIcon={<DashboardIcon />}
              onClick={() => handleNavItemClick('dashboard')}
            >
              Översikt
            </Button>
          </Grid>
          
          <Grid item>
            <Button
              variant={selectedItem === 'pages' ? 'contained' : 'outlined'}
              startIcon={<ArticleIcon />}
              onClick={() => handleNavItemClick('pages')}
            >
              Sidor
            </Button>
          </Grid>
          
          <Grid item>
            <Button
              variant={selectedItem === 'bookings' ? 'contained' : 'outlined'}
              startIcon={<EventIcon />}
              onClick={() => handleNavItemClick('bookings')}
            >
              Bokningar
            </Button>
          </Grid>
          
          <Grid item>
            <Button
              variant={selectedItem === 'users' ? 'contained' : 'outlined'}
              startIcon={<PeopleIcon />}
              onClick={() => handleNavItemClick('users')}
            >
              Användare
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/pages" element={<PagesList />} />
          <Route path="/pages/new" element={<PageEditor />} />
          <Route path="/pages/edit/:id" element={<PageEditor />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/users" element={<UsersList />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default Dashboard; 