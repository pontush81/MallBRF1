import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContextNew';
import { bastadTheme } from '../theme/bastadTheme';

// Icons
import ArticleIcon from '@mui/icons-material/Article';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// ═══════════════════════════════════════════════════════════════════════════
// HERO SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const HeroSection: React.FC<{ isLoggedIn: boolean; isAdmin: boolean }> = ({ 
  isLoggedIn, 
  isAdmin 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        minHeight: { xs: '100vh', md: '90vh' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        // Dramatic ocean gradient background
        background: `linear-gradient(135deg, 
          ${bastadTheme.colors.ocean[950]} 0%, 
          ${bastadTheme.colors.ocean[900]} 25%, 
          ${bastadTheme.colors.twilight[500]} 60%, 
          ${bastadTheme.colors.ocean[700]} 100%)`,
        overflow: 'hidden',
        // Padding for fixed header
        pt: { xs: 10, md: 8 },
        pb: { xs: 8, md: 12 },
      }}
    >
      {/* Decorative wave pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 30px',
        }}
      />

      {/* Subtle animated gradient orb */}
      <Box
        sx={{
          position: 'absolute',
          width: { xs: '300px', md: '600px' },
          height: { xs: '300px', md: '600px' },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${bastadTheme.colors.terracotta[500]}30 0%, transparent 70%)`,
          top: '10%',
          right: '-10%',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0) scale(1)' },
            '50%': { transform: 'translateY(-30px) scale(1.05)' },
          },
        }}
      />

      {/* Main content */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            textAlign: 'center',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Pre-headline */}
          <Typography
            component="span"
            sx={{
              display: 'inline-block',
              color: bastadTheme.colors.terracotta[500],
              fontFamily: bastadTheme.typography.fontFamily.body,
              fontSize: { xs: '0.875rem', md: '1rem' },
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              mb: 2,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
            }}
          >
            Bostadsrättsförening i Båstad
          </Typography>

          {/* Main headline */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.heading,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
              fontWeight: 700,
              color: bastadTheme.colors.sand[200],
              lineHeight: 1.1,
              mb: 3,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
            }}
          >
            Välkommen till
            <Box
              component="span"
              sx={{
                display: 'block',
                background: `linear-gradient(135deg, ${bastadTheme.colors.sand[200]} 0%, ${bastadTheme.colors.terracotta[500]} 50%, ${bastadTheme.colors.sand[300]} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Gulmåran
            </Box>
          </Typography>

          {/* Subheadline */}
          <Typography
            variant="h5"
            component="p"
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.body,
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 400,
              color: bastadTheme.colors.ocean[300],
              maxWidth: '600px',
              mx: 'auto',
              mb: 5,
              lineHeight: 1.6,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
            }}
          >
            En digital plattform för vår bostadsrättsförening vid 
            Bjärehalvöns vackra kust. Här hittar du information, 
            bokningar och viktiga dokument.
          </Typography>

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
            }}
          >
            <Box
              component={RouterLink}
              to="/pages"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 4,
                py: 1.75,
                fontFamily: bastadTheme.typography.fontFamily.body,
                fontSize: '1rem',
                fontWeight: 600,
                color: bastadTheme.colors.ocean[950],
                background: bastadTheme.gradients.ctaButton,
                borderRadius: bastadTheme.borderRadius.lg,
                textDecoration: 'none',
                boxShadow: bastadTheme.shadows.warmGlow,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 14px 50px -10px rgba(194, 112, 58, 0.5)`,
                },
              }}
            >
              <ArticleIcon sx={{ fontSize: 20 }} />
              Utforska sidor
            </Box>

            {!isLoggedIn ? (
              <Box
                component={RouterLink}
                to="/login"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 4,
                  py: 1.75,
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: bastadTheme.colors.sand[200],
                  background: 'transparent',
                  border: `2px solid ${bastadTheme.colors.sand[200]}30`,
                  borderRadius: bastadTheme.borderRadius.lg,
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: bastadTheme.colors.sand[200],
                    background: `${bastadTheme.colors.sand[200]}10`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <LoginIcon sx={{ fontSize: 20 }} />
                Logga in
              </Box>
            ) : isAdmin ? (
              <Box
                component={RouterLink}
                to="/admin"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 4,
                  py: 1.75,
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: bastadTheme.colors.sand[200],
                  background: bastadTheme.colors.seagreen[500],
                  borderRadius: bastadTheme.borderRadius.lg,
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: bastadTheme.colors.seagreen[600],
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />
                Adminpanel
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Container>

      {/* Scroll indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 24, md: 40 },
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: isVisible ? 0.6 : 0,
          transition: 'opacity 0.6s ease 1s',
          animation: 'bounce 2s ease-in-out infinite',
          '@keyframes bounce': {
            '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
            '50%': { transform: 'translateX(-50%) translateY(8px)' },
          },
        }}
      >
        <KeyboardArrowDownIcon 
          sx={{ 
            fontSize: 32, 
            color: bastadTheme.colors.sand[200] 
          }} 
        />
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  delay 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.2 }
    );

    const element = document.getElementById(`feature-${title}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [delay, title]);

  return (
    <Box
      id={`feature-${title}`}
      sx={{
        p: 4,
        height: '100%',
        background: bastadTheme.colors.white,
        borderRadius: bastadTheme.borderRadius.xl,
        boxShadow: bastadTheme.shadows.card,
        border: `1px solid ${bastadTheme.colors.sand[300]}`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: bastadTheme.shadows.cardHover,
          transform: 'translateY(-4px)',
          borderColor: bastadTheme.colors.terracotta[500],
        },
      }}
    >
      {/* Icon container */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: bastadTheme.borderRadius.lg,
          background: `linear-gradient(135deg, ${bastadTheme.colors.ocean[900]} 0%, ${bastadTheme.colors.twilight[500]} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          color: bastadTheme.colors.sand[200],
        }}
      >
        {icon}
      </Box>

      <Typography
        variant="h6"
        component="h3"
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.heading,
          fontSize: '1.25rem',
          fontWeight: 600,
          color: bastadTheme.colors.ocean[900],
          mb: 1.5,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontFamily: bastadTheme.typography.fontFamily.body,
          fontSize: '1rem',
          color: bastadTheme.colors.ocean[600],
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const Home: React.FC = () => {
  const { isLoggedIn, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [showGDPRGoodbye, setShowGDPRGoodbye] = useState(false);

  useEffect(() => {
    if (searchParams.get('gdpr_deleted') === 'true') {
      setShowGDPRGoodbye(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      setTimeout(() => setShowGDPRGoodbye(false), 10000);
    }
  }, [searchParams]);

  const features: Omit<FeatureCardProps, 'delay'>[] = [
    {
      icon: <HomeWorkIcon sx={{ fontSize: 28 }} />,
      title: 'Boendeinfo',
      description: 'Hitta viktig information om föreningen, regler, och praktisk info för dig som bor här.',
    },
    {
      icon: <CalendarMonthIcon sx={{ fontSize: 28 }} />,
      title: 'Bokningar',
      description: 'Boka gemensamma resurser som tvättstuga, bastu eller gästlägenhet enkelt online.',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 28 }} />,
      title: 'Grannskap',
      description: 'Håll dig uppdaterad om föreningens aktiviteter, möten och gemensamma projekt.',
    },
  ];

  return (
    <Box sx={{ 
      background: bastadTheme.gradients.pageBackground, 
      minHeight: '100vh',
      // Compensate for the full-bleed hero
      mt: '-64px',
    }}>
      {/* GDPR Goodbye Message */}
      {showGDPRGoodbye && (
        <Box sx={{ 
          position: 'fixed', 
          top: 80, 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 1000,
          maxWidth: '90%',
        }}>
          <Alert
            severity="info"
            sx={{
              textAlign: 'center',
              borderRadius: bastadTheme.borderRadius.lg,
              boxShadow: bastadTheme.shadows.lg,
            }}
            onClose={() => setShowGDPRGoodbye(false)}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              👋 Adjö och tack!
            </Typography>
            <Typography variant="body2">
              Dina personuppgifter har raderats permanent enligt GDPR.
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Hero Section */}
      <HeroSection isLoggedIn={isLoggedIn} isAdmin={isAdmin} />

      {/* Features Section */}
      <Box
        component="section"
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          background: bastadTheme.colors.sand[100],
        }}
      >
        <Container maxWidth="lg">
          {/* Section header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              component="span"
              sx={{
                display: 'inline-block',
                color: bastadTheme.colors.terracotta[500],
                fontFamily: bastadTheme.typography.fontFamily.body,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                mb: 2,
              }}
            >
              Funktioner
            </Typography>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.heading,
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                color: bastadTheme.colors.ocean[900],
                mb: 2,
              }}
            >
              Allt du behöver
            </Typography>
            <Typography
              sx={{
                fontFamily: bastadTheme.typography.fontFamily.body,
                fontSize: { xs: '1rem', md: '1.125rem' },
                color: bastadTheme.colors.ocean[600],
                maxWidth: '500px',
                mx: 'auto',
              }}
            >
              En modern plattform för att förenkla vardagen i föreningen
            </Typography>
          </Box>

          {/* Feature cards */}
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={feature.title}>
                <FeatureCard {...feature} delay={index * 100} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Location Section */}
      <Box
        component="section"
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          background: bastadTheme.colors.white,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                component="span"
                sx={{
                  display: 'inline-block',
                  color: bastadTheme.colors.seagreen[500],
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  mb: 2,
                }}
              >
                Vår plats
              </Typography>
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.heading,
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  fontWeight: 700,
                  color: bastadTheme.colors.ocean[900],
                  mb: 3,
                }}
              >
                Beläget vid vackra Bjärehalvön
              </Typography>
              <Typography
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontSize: '1rem',
                  color: bastadTheme.colors.ocean[600],
                  lineHeight: 1.7,
                  mb: 3,
                }}
              >
                Gulmåran ligger i hjärtat av Båstad, känt för sin fantastiska natur, 
                tennistraditioner och charmiga småstadsatmosfär. Här möts havet och 
                Hallandsåsen i ett av Sveriges mest eftertraktade områden.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.heading,
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: bastadTheme.colors.terracotta[500],
                    }}
                  >
                    1957
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.body,
                      fontSize: '0.875rem',
                      color: bastadTheme.colors.ocean[500],
                    }}
                  >
                    Grundat
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.heading,
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: bastadTheme.colors.terracotta[500],
                    }}
                  >
                    24
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: bastadTheme.typography.fontFamily.body,
                      fontSize: '0.875rem',
                      color: bastadTheme.colors.ocean[500],
                    }}
                  >
                    Lägenheter
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Placeholder for map or image */}
              <Box
                sx={{
                  width: '100%',
                  height: { xs: 250, md: 350 },
                  borderRadius: bastadTheme.borderRadius.xl,
                  background: `linear-gradient(135deg, ${bastadTheme.colors.ocean[800]} 0%, ${bastadTheme.colors.twilight[500]} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: bastadTheme.shadows.lg,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative pattern */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.1,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.heading,
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    fontWeight: 600,
                    color: bastadTheme.colors.sand[200],
                    textAlign: 'center',
                    px: 4,
                  }}
                >
                  📍 Köpmansgatan 80<br />
                  269 31 Båstad
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
