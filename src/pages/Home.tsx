import React from 'react';
import { Typography, Box, Button, Grid, Container, Divider, Card, CardContent, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Ikoner
import ArticleIcon from '@mui/icons-material/Article';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Home: React.FC = () => {
  const { isLoggedIn, isAdmin } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 6, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main' 
          }}
        >
          Välkommen till Gulmåran
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            maxWidth: 800, 
            mx: 'auto', 
            mb: 4, 
            color: 'text.secondary' 
          }}
        >
          En modern webbapplikation med React, TypeScript, Material UI och content management-funktioner.
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
          sx={{ mb: 6 }}
        >
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/pages"
            size="large"
            startIcon={<ArticleIcon />}
          >
            Utforska sidor
          </Button>
          
          {!isLoggedIn ? (
            <Button 
              variant="outlined" 
              component={RouterLink} 
              to="/login"
              size="large"
              startIcon={<LoginIcon />}
            >
              Logga in
            </Button>
          ) : isAdmin ? (
            <Button 
              variant="outlined" 
              component={RouterLink} 
              to="/admin"
              size="large"
              startIcon={<AdminPanelSettingsIcon />}
            >
              Admin panel
            </Button>
          ) : (
            <Button 
              variant="outlined" 
              component={RouterLink} 
              to="/profile"
              size="large"
            >
              Min profil
            </Button>
          )}
        </Stack>
      </Box>
      
      <Divider sx={{ mb: 6 }} />
      
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }}>
        Funktioner
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: 6
            }
          }}>
            <CardContent>
              <Typography variant="h5" component="h3" gutterBottom color="primary.main">
                Innehållshantering
              </Typography>
              <Typography variant="body1">
                Skapa, redigera och publicera sidor med ett intuitivt gränssnitt. 
                Stöd för markdown-formatering ger dig kraftfulla redigeringsmöjligheter.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: 6
            }
          }}>
            <CardContent>
              <Typography variant="h5" component="h3" gutterBottom color="primary.main">
                Användarhantering
              </Typography>
              <Typography variant="body1">
                Inloggning och registrering med rollbaserad behörighet.
                Administratörer kan hantera innehåll medan användare kan bläddra bland publicerade sidor.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: 6
            }
          }}>
            <CardContent>
              <Typography variant="h5" component="h3" gutterBottom color="primary.main">
                Modern teknik
              </Typography>
              <Typography variant="body1">
                Byggd med React, TypeScript och Material UI för en responsiv och typesäker användarupplevelse.
                Anpassningsbar design som fungerar på alla enheter.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderRadius: 2, 
        p: 4, 
        mt: 4, 
        mb: 6,
        boxShadow: 2
      }}>
        <Typography variant="h5" gutterBottom>
          Kom igång
        </Typography>
        <Typography variant="body1" paragraph>
          För att testa systemet, skapa ett konto eller logga in med de förinställda kontona:
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <Typography component="li" sx={{ mb: 1 }}>
            <strong>Admin:</strong> admin@example.com / admin123
          </Typography>
          <Typography component="li">
            <strong>Användare:</strong> user@example.com / password123
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Home; 