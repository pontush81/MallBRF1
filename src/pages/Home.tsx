import React, { useEffect, useState } from 'react';
// Optimized imports for Home page
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContextNew';

// Import new design system components
import { GulmaranCard, GulmaranButton, Breadcrumbs } from '../components/ui';
import { designTokens } from '../theme/designSystem';

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
      <Breadcrumbs />
      
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
      
      <Box sx={{ mt: { xs: 3, sm: 4, md: 5 }, mb: 2, textAlign: 'center' }}>
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
            mb: 1, 
            color: 'text.secondary' 
          }}
        >
          En modern webbapplikation med React, TypeScript, Material UI och content management-funktioner.
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
          sx={{ mb: 2 }}
        >
          <GulmaranButton 
            variant="primary" 
            component={RouterLink} 
            to="/pages"
            size="large"
            icon={<ArticleIcon />}
            iconPosition="start"
          >
            Utforska sidor
          </GulmaranButton>
          
          {!isLoggedIn ? (
            <GulmaranButton 
              variant="secondary" 
              component={RouterLink} 
              to="/login"
              size="large"
              icon={<LoginIcon />}
              iconPosition="start"
            >
              Logga in
            </GulmaranButton>
          ) : isAdmin ? (
            <GulmaranButton 
              variant="success" 
              component={RouterLink} 
              to="/admin"
              size="large"
              icon={<AdminPanelSettingsIcon />}
              iconPosition="start"
            >
              Adminpanel
            </GulmaranButton>
          ) : (
            null
          )}
        </Stack>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 2 }}>
        Funktioner
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <GulmaranCard 
            title="Innehållshantering"
            variant="elevated"
            sx={{ height: '100%' }}
          >
            <Typography variant="body1">
              Skapa, redigera och publicera sidor med ett intuitivt gränssnitt. 
              Stöd för markdown-formatering ger dig kraftfulla redigeringsmöjligheter.
            </Typography>
          </GulmaranCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <GulmaranCard 
            title="Användarhantering"
            variant="elevated"
            sx={{ height: '100%' }}
          >
            <Typography variant="body1">
              Inloggning och registrering med rollbaserad behörighet.
              Administratörer kan hantera innehåll medan användare kan bläddra bland publicerade sidor.
            </Typography>
          </GulmaranCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <GulmaranCard 
            title="Modern teknik"
            variant="elevated"
            sx={{ height: '100%' }}
          >
            <Typography variant="body1">
              Byggd med React, TypeScript och Material UI för en responsiv och typesäker användarupplevelse.
              Anpassningsbar design som fungerar på alla enheter.
            </Typography>
          </GulmaranCard>
        </Grid>
      </Grid>
      
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderRadius: 2, 
        p: 4, 
        mt: 4, 
        mb: 0, // Remove bottom margin to eliminate spacing
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