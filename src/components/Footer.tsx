import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { title: 'Integritetspolicy', path: '/privacy-policy' },
    { title: 'Användarvillkor', path: '/terms-of-service' },
    { title: 'Cookiepolicy', path: '/cookie-policy' },
    { title: 'GDPR-förfrågningar', path: '/data-deletion' },
  ];

  const infoLinks = [
    { title: 'Om föreningen', path: '/about' },
    { title: 'Kontakt', path: '/contact' },
    { title: 'Tillgänglighet', path: '/accessibility' },
    { title: 'Klagomål', path: '/complaints' },
  ];

  const handleCookieSettings = () => {
    // Trigger cookie banner to show
    localStorage.removeItem('gdpr-consent');
    localStorage.removeItem('gdpr-consent-date');
    window.location.reload();
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        bgcolor: 'grey.100',
        borderTop: 1,
        borderColor: 'divider',
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Organization Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="primary">
              BRF Gulmåran
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Bostadsrättsförening Gulmåran
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Org.nr: 769639-5420
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Köpmansgatan 80
            </Typography>
            <Typography variant="body2" color="text.secondary">
              269 31 Båstad
            </Typography>
          </Grid>

          {/* Legal Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Rättsligt
            </Typography>
            {legalLinks.map((link) => (
              <Box key={link.title} sx={{ mb: 1 }}>
                <Link
                  component={RouterLink}
                  to={link.path}
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {link.title}
                </Link>
              </Box>
            ))}
            <Box sx={{ mb: 1 }}>
              <Link
                component="button"
                variant="body2"
                color="text.secondary"
                onClick={handleCookieSettings}
                sx={{ 
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Cookie-inställningar
              </Link>
            </Box>
          </Grid>

          {/* Info Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Information
            </Typography>
            {infoLinks.map((link) => (
              <Box key={link.title} sx={{ mb: 1 }}>
                <Link
                  component={RouterLink}
                  to={link.path}
                  variant="body2"
                  color="text.secondary"
                  sx={{ 
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {link.title}
                </Link>
              </Box>
            ))}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? 2 : 0
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} BRF Gulmåran. Alla rättigheter förbehållna.
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            GDPR-compliant • Säker datahantering
          </Typography>
        </Box>

        {/* Compliance Note */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Denna webbplats följer GDPR och svensk dataskyddslagstiftning. 
            {' '}
            <Link
              href="https://www.imy.se"
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              color="primary"
            >
              Klaga till IMY
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 