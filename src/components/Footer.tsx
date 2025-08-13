import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,

  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentYear = new Date().getFullYear();

  // Links removed - not currently used in UI

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
        bgcolor: 'grey.50',
        borderTop: 1,
        borderColor: 'divider',
        py: 2, // Reduced from 4 to 2
        px: 2
      }}
    >
      <Container maxWidth="lg">
        {/* Compact Single Row Layout */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? 2 : 3
          }}
        >
          {/* Company Info - Compact */}
          <Box>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
              BRF Gulmåran
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Org.nr: 769639-5420 • Köpmansgatan 80, 269 31 Båstad
            </Typography>
          </Box>

          {/* Essential Links - Horizontal */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 0.5 : 2,
              alignItems: isMobile ? 'flex-start' : 'center'
            }}
          >
            <Link
              component={RouterLink}
              to="/about"
              variant="caption"
              color="text.secondary"
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Om föreningen
            </Link>
            <Link
              component={RouterLink}
              to="/contact"
              variant="caption"
              color="text.secondary"
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Kontakt
            </Link>
            <Link
              component={RouterLink}
              to="/privacy-policy"
              variant="caption"
              color="text.secondary"
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Integritet
            </Link>
            <Link
              component="button"
              variant="caption"
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
              Cookies
            </Link>
          </Box>
        </Box>

        {/* Copyright - Minimal */}
        <Box sx={{ mt: 1.5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © {currentYear} BRF Gulmåran • GDPR-compliant
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 