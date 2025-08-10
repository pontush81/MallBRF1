import React, { useEffect, useState } from 'react';
// Optimized imports for Home page
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContextNew';

// Ikoner
import ArticleIcon from '@mui/icons-material/Article';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Home: React.FC = () => {
  const { isLoggedIn, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [showGDPRGoodbye, setShowGDPRGoodbye] = useState(false);

  useEffect(() => {
    // Check if user was redirected after GDPR deletion
    if (searchParams.get('gdpr_deleted') === 'true') {
      setShowGDPRGoodbye(true);
      // Clear the URL parameter after showing the message
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Hide the message after 10 seconds
      setTimeout(() => {
        setShowGDPRGoodbye(false);
      }, 10000);
    }
  }, [searchParams]);

  return (
    <Container maxWidth="lg">
      {/* GDPR Goodbye Message */}
      {showGDPRGoodbye && (
        <Box sx={{ my: 2 }}>
          <Alert 
            severity="info" 
            sx={{ 
              textAlign: 'center',
              '& .MuiAlert-message': { width: '100%' }
            }}
            onClose={() => setShowGDPRGoodbye(false)}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              👋 Adjö och tack!
            </Typography>
            <Typography variant="body2">
              Dina personuppgifter har raderats permanent från vårt system enligt GDPR. 
              Vi respekterar din integritet och önskar dig allt gott framöver.
            </Typography>
          </Alert>
        </Box>
      )}
      
      <Box sx={{ mt: { xs: 3, sm: 4, md: 5 }, mb: 6, textAlign: 'center' }}>
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
              variant="contained" 
              component={RouterLink} 
              to="/admin"
              size="large"
            >
              Adminpanel
            </Button>
          ) : (
            null
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