import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { bastadTheme } from '../theme/bastadTheme';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentYear = new Date().getFullYear();

  const handleCookieSettings = () => {
    localStorage.removeItem('gdpr-consent');
    localStorage.removeItem('gdpr-consent-date');
    window.location.reload();
  };

  const footerLinks = [
    { label: 'Om föreningen', path: '/about' },
    { label: 'Stadgar', path: '/stadgar' },
    { label: 'Integritet', path: '/privacy-policy' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: `linear-gradient(135deg, ${bastadTheme.colors.ocean[950]} 0%, ${bastadTheme.colors.ocean[900]} 100%)`,
        color: bastadTheme.colors.sand[200],
        mt: { xs: 6, md: 8 }, // Utrymme mellan innehåll och footer
        py: { xs: 6, md: 8 },
        px: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative wave pattern */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 30px',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Main Footer Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'flex-start',
            gap: { xs: 4, md: 6 },
            mb: 4,
          }}
        >
          {/* Brand Section */}
          <Box sx={{ maxWidth: 300 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.heading,
                fontWeight: 700,
                fontSize: '1.5rem',
                color: bastadTheme.colors.sand[200],
                mb: 1,
              }}
            >
              Gulmåran
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                color: bastadTheme.colors.ocean[400],
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                mb: 2,
              }}
            >
              Bostadsrättsförening vid Bjärehalvöns vackra kust.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                color: bastadTheme.colors.ocean[500],
                fontSize: '0.8125rem',
              }}
            >
              Org.nr: 769639-5420
            </Typography>
          </Box>

          {/* Links Section */}
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: bastadTheme.colors.terracotta[500],
                display: 'block',
                mb: 2,
              }}
            >
              Genvägar
            </Typography>
            <Stack spacing={1.5}>
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    fontSize: '0.9375rem',
                    color: bastadTheme.colors.ocean[300],
                    textDecoration: 'none',
                    transition: bastadTheme.transitions.fast,
                    '&:hover': {
                      color: bastadTheme.colors.sand[200],
                      textDecoration: 'none',
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                component="button"
                onClick={handleCookieSettings}
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontSize: '0.9375rem',
                  color: bastadTheme.colors.ocean[300],
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: bastadTheme.transitions.fast,
                  '&:hover': {
                    color: bastadTheme.colors.sand[200],
                  },
                }}
              >
                Cookie-inställningar
              </Link>
            </Stack>
          </Box>

          {/* Contact Section */}
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: bastadTheme.colors.terracotta[500],
                display: 'block',
                mb: 2,
              }}
            >
              Adress
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                color: bastadTheme.colors.ocean[300],
                fontSize: '0.9375rem',
                lineHeight: 1.7,
              }}
            >
              Köpmansgatan 80<br />
              269 31 Båstad
            </Typography>
          </Box>
        </Box>

        {/* Divider */}
        <Box
          sx={{
            height: '1px',
            background: `linear-gradient(90deg, transparent 0%, ${bastadTheme.colors.ocean[700]} 50%, transparent 100%)`,
            mb: 3,
          }}
        />

        {/* Bottom Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.body,
              color: bastadTheme.colors.ocean[500],
              fontSize: '0.8125rem',
            }}
          >
            © {currentYear} BRF Gulmåran. Alla rättigheter förbehållna.
          </Typography>
          
          <Typography
            variant="body2"
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.body,
              color: bastadTheme.colors.ocean[600],
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: bastadTheme.colors.seagreen[500],
              }}
            />
            GDPR-compliant
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
