import React, { useState, memo, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  BookOnline as BookIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Assignment as MaintenanceIcon,
  Gavel as StadgarIcon,
  ReportProblem as FaultIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextNew';
import { bastadTheme } from '../../theme/bastadTheme';

const ModernHeader: React.FC = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoggedIn, isAdmin, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for subtle shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { label: 'Hem', path: '/', icon: <HomeIcon /> },
    { label: 'Boka', path: '/booking', icon: <BookIcon /> },
    { label: 'Stadgar', path: '/stadgar', icon: <StadgarIcon /> },
    { label: 'Felanmälan', path: '/felanmalan', icon: <FaultIcon /> },
  ];

  const loggedInItems = isLoggedIn ? [
    { label: 'Underhållsplan', path: '/maintenance-plan', icon: <MaintenanceIcon /> },
  ] : [];

  const adminItems = isAdmin ? [
    { label: 'Admin', path: '/admin', icon: <AdminIcon /> },
  ] : [];

  const allNavigationItems = [...navigationItems, ...loggedInItems, ...adminItems];

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const forceCloseOverlays = () => {
    setMobileDrawerOpen(false);
    setUserMenuAnchor(null);
    const backdrops = document.querySelectorAll('.MuiBackdrop-root');
    backdrops.forEach(backdrop => {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    });
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigation = (path: string) => {
    forceCloseOverlays();
    setTimeout(() => navigate(path), 150);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      handleUserMenuClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = (user: { email?: string; name?: string } | null): string => {
    if (!user) return 'G';
    if (user.email) return user.email.charAt(0).toUpperCase();
    if (user.name) return user.name.charAt(0).toUpperCase();
    return 'U';
  };

  const isActivePath = (path: string): boolean => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Clean header styling - alltid vit bakgrund
  const headerBackground = bastadTheme.colors.white;
  const headerBorder = `1px solid ${bastadTheme.colors.sand[300]}`;
  const textColor = bastadTheme.colors.ocean[900];

  const renderNavigationItem = (
    item: { label: string; path: string; icon: React.ReactNode },
    isMobileView: boolean = false
  ) => {
    const isActive = isActivePath(item.path);
    
    if (isMobileView) {
      return (
        <ListItem key={item.path} disablePadding>
          <ListItemButton
            onClick={() => handleNavigation(item.path)}
            selected={isActive}
            sx={{
              borderRadius: bastadTheme.borderRadius.lg,
              margin: `0 ${bastadTheme.spacing[2]}`,
              padding: bastadTheme.spacing[3],
              '&.Mui-selected': {
                backgroundColor: bastadTheme.colors.ocean[50],
                color: bastadTheme.colors.ocean[900],
                '&:hover': {
                  backgroundColor: bastadTheme.colors.ocean[100],
                },
              },
              '&:focus': {
                outline: `2px solid ${bastadTheme.colors.terracotta[500]}`,
                outlineOffset: '2px',
              },
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: bastadTheme.spacing[3],
              width: '100%',
            }}>
              {React.cloneElement(item.icon as React.ReactElement, {
                sx: { 
                  color: isActive 
                    ? bastadTheme.colors.terracotta[500] 
                    : bastadTheme.colors.ocean[600],
                  fontSize: '1.25rem',
                }
              })}
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '1rem',
                  color: isActive 
                    ? bastadTheme.colors.ocean[900] 
                    : bastadTheme.colors.ocean[700],
                }}
              />
              {isActive && (
                <Chip
                  label="Aktiv"
                  size="small"
                  sx={{
                    backgroundColor: bastadTheme.colors.terracotta[500],
                    color: bastadTheme.colors.white,
                    fontSize: '0.75rem',
                    height: '22px',
                    fontFamily: bastadTheme.typography.fontFamily.body,
                  }}
                />
              )}
            </Box>
          </ListItemButton>
        </ListItem>
      );
    }

    return (
      <Button
        key={item.path}
        onClick={() => handleNavigation(item.path)}
        sx={{
          color: isActive ? textColor : `${textColor}99`,
          backgroundColor: 'transparent',
          fontFamily: bastadTheme.typography.fontFamily.body,
          fontWeight: isActive ? 600 : 500,
          fontSize: '0.9375rem',
          textTransform: 'none',
          borderRadius: bastadTheme.borderRadius.md,
          padding: '8px 16px',
          minHeight: '36px',
          transition: bastadTheme.transitions.normal,
          position: 'relative',
          '&::after': isActive ? {
            content: '""',
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '2px',
            backgroundColor: bastadTheme.colors.terracotta[500],
            borderRadius: '1px',
          } : {},
          '&:hover': {
            backgroundColor: bastadTheme.colors.sand[200],
            color: textColor,
          },
          '&:focus': {
            outline: `2px solid ${bastadTheme.colors.terracotta[500]}`,
            outlineOffset: '2px',
          },
        }}
      >
        {item.label}
      </Button>
    );
  };

  const mobileDrawer = (
    <>
      {/* Header */}
      <Box
        component="header"
        sx={{
          flex: '0 0 auto',
          padding: bastadTheme.spacing[4],
          background: `linear-gradient(135deg, ${bastadTheme.colors.ocean[900]} 0%, ${bastadTheme.colors.twilight[500]} 100%)`,
          color: bastadTheme.colors.sand[200],
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: bastadTheme.spacing[1],
        }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.heading,
              fontWeight: 700,
              fontSize: '1.25rem',
              color: bastadTheme.colors.sand[200],
            }}
          >
            Gulmåran
          </Typography>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ 
              color: bastadTheme.colors.sand[200],
              '&:focus': {
                outline: `2px solid ${bastadTheme.colors.sand[200]}40`,
                outlineOffset: '2px',
              },
            }}
            aria-label="Stäng meny"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography
          variant="body2"
          sx={{
            opacity: 0.8,
            fontSize: '0.875rem',
            fontFamily: bastadTheme.typography.fontFamily.body,
          }}
        >
          Bostadsrättsförening
        </Typography>
      </Box>

      {/* Navigation */}
      <Box
        component="nav"
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingTop: bastadTheme.spacing[2],
          background: bastadTheme.colors.sand[50],
        }}
      >
        <List>
          {allNavigationItems.map((item) => renderNavigationItem(item, true))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          flex: '0 0 auto',
          padding: bastadTheme.spacing[4],
          borderTop: `1px solid ${bastadTheme.colors.sand[300]}`,
          backgroundColor: bastadTheme.colors.white,
          paddingBottom: `calc(${bastadTheme.spacing[4]} + env(safe-area-inset-bottom))`,
        }}
      >
        {isLoggedIn && currentUser ? (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: bastadTheme.spacing[3],
              marginBottom: bastadTheme.spacing[3],
            }}>
              <Avatar
                sx={{
                  backgroundColor: bastadTheme.colors.ocean[800],
                  color: bastadTheme.colors.sand[200],
                  width: 44,
                  height: 44,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  fontFamily: bastadTheme.typography.fontFamily.heading,
                }}
              >
                {getUserInitials(currentUser)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    fontWeight: 600,
                    color: bastadTheme.colors.ocean[900],
                    fontSize: '0.9375rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentUser.email || 'Användare'}
                </Typography>
                {isAdmin && (
                  <Chip
                    label="Admin"
                    size="small"
                    sx={{
                      backgroundColor: bastadTheme.colors.terracotta[500],
                      color: bastadTheme.colors.white,
                      fontSize: '0.75rem',
                      height: '20px',
                      mt: 0.5,
                      fontFamily: bastadTheme.typography.fontFamily.body,
                    }}
                  />
                )}
              </Box>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                borderRadius: bastadTheme.borderRadius.lg,
                textTransform: 'none',
                borderColor: bastadTheme.colors.ocean[300],
                color: bastadTheme.colors.ocean[700],
                fontFamily: bastadTheme.typography.fontFamily.body,
                fontSize: '0.9375rem',
                py: 1.5,
                minHeight: '48px',
                transition: bastadTheme.transitions.normal,
                '&:hover': {
                  borderColor: bastadTheme.colors.ocean[500],
                  backgroundColor: bastadTheme.colors.ocean[50],
                },
              }}
            >
              Logga ut
            </Button>
          </Box>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={() => handleNavigation('/login')}
            sx={{
              background: bastadTheme.gradients.ctaButton,
              borderRadius: bastadTheme.borderRadius.lg,
              textTransform: 'none',
              boxShadow: bastadTheme.shadows.warmGlow,
              color: bastadTheme.colors.ocean[950],
              fontFamily: bastadTheme.typography.fontFamily.body,
              fontWeight: 600,
              fontSize: '0.9375rem',
              py: 1.5,
              minHeight: '48px',
              transition: bastadTheme.transitions.normal,
              '&:hover': {
                boxShadow: `0 14px 50px -10px rgba(194, 112, 58, 0.5)`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            Logga in
          </Button>
        )}
      </Box>
    </>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: headerBackground,
          borderBottom: headerBorder,
          boxShadow: isScrolled ? bastadTheme.shadows.sm : 'none',
          height: '64px',
          minHeight: '64px !important',
          maxHeight: '64px !important',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Toolbar sx={{ 
          padding: { xs: bastadTheme.spacing[2], md: bastadTheme.spacing[4] },
          minHeight: '64px !important',
          maxHeight: '64px !important',
          height: '64px !important',
        }}>
          {/* Logo */}
          <Box 
            onClick={() => handleNavigation('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: bastadTheme.spacing[2],
              flexGrow: isMobile ? 1 : 0,
              cursor: 'pointer',
              marginRight: isMobile ? 0 : bastadTheme.spacing[8],
              '&:focus': {
                outline: `2px solid ${bastadTheme.colors.terracotta[500]}`,
                outlineOffset: '2px',
                borderRadius: bastadTheme.borderRadius.md,
              },
            }}
            tabIndex={0}
            role="button"
            aria-label="Gå till startsidan"
          >
            {/* Logo mark - enkelt och rent */}
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: bastadTheme.borderRadius.md,
              background: bastadTheme.colors.sand[100],
              border: `1px solid ${bastadTheme.colors.sand[300]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              🏠
            </Box>
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.heading,
                  fontWeight: 700,
                  fontSize: { xs: '1.125rem', md: '1.25rem' },
                  color: textColor,
                  lineHeight: 1.2,
                  margin: 0,
                  transition: bastadTheme.transitions.normal,
                }}
              >
                Gulmåran
              </Typography>
            </Box>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ 
              display: 'flex', 
              gap: bastadTheme.spacing[1],
              flexGrow: 1,
              alignItems: 'center',
            }}>
              {allNavigationItems.map((item) => renderNavigationItem(item, false))}
            </Box>
          )}

          {/* Desktop User Section */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: bastadTheme.spacing[2] }}>
              {isLoggedIn && currentUser ? (
                <>
                  <Button
                    onClick={handleUserMenuClick}
                    startIcon={
                      <Avatar
                        sx={{
                          backgroundColor: bastadTheme.colors.ocean[800],
                          color: bastadTheme.colors.sand[200],
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          fontFamily: bastadTheme.typography.fontFamily.heading,
                        }}
                      >
                        {getUserInitials(currentUser)}
                      </Avatar>
                    }
                    sx={{
                      color: textColor,
                      textTransform: 'none',
                      fontFamily: bastadTheme.typography.fontFamily.body,
                      borderRadius: bastadTheme.borderRadius.lg,
                      padding: `${bastadTheme.spacing[2]} ${bastadTheme.spacing[3]}`,
                      transition: bastadTheme.transitions.normal,
                      '&:hover': {
                        backgroundColor: bastadTheme.colors.sand[200],
                      },
                    }}
                    aria-haspopup="true"
                    aria-expanded={Boolean(userMenuAnchor)}
                  >
                    {currentUser.email || 'Användare'}
                  </Button>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    sx={{
                      '& .MuiPaper-root': {
                        borderRadius: bastadTheme.borderRadius.lg,
                        boxShadow: bastadTheme.shadows.xl,
                        minWidth: '220px',
                        marginTop: bastadTheme.spacing[1],
                        border: `1px solid ${bastadTheme.colors.sand[300]}`,
                      },
                    }}
                  >
                    <Box sx={{ padding: bastadTheme.spacing[3] }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: bastadTheme.colors.ocean[500],
                          fontSize: '0.8125rem',
                          marginBottom: bastadTheme.spacing[1],
                          fontFamily: bastadTheme.typography.fontFamily.body,
                        }}
                      >
                        Inloggad som
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: bastadTheme.colors.ocean[900],
                          fontSize: '0.9375rem',
                          fontFamily: bastadTheme.typography.fontFamily.body,
                        }}
                      >
                        {currentUser.email}
                      </Typography>
                      {isAdmin && (
                        <Chip
                          label="Administratör"
                          size="small"
                          sx={{
                            backgroundColor: bastadTheme.colors.terracotta[500],
                            color: bastadTheme.colors.white,
                            fontSize: '0.75rem',
                            marginTop: bastadTheme.spacing[1],
                            fontFamily: bastadTheme.typography.fontFamily.body,
                          }}
                        />
                      )}
                    </Box>
                    <Divider />
                    <MenuItem
                      onClick={handleLogout}
                      sx={{
                        gap: bastadTheme.spacing[2],
                        padding: bastadTheme.spacing[3],
                        fontFamily: bastadTheme.typography.fontFamily.body,
                        '&:hover': {
                          backgroundColor: bastadTheme.colors.sand[100],
                        },
                      }}
                    >
                      <LogoutIcon sx={{ fontSize: '1.125rem', color: bastadTheme.colors.ocean[600] }} />
                      <Typography variant="body2" sx={{ fontFamily: bastadTheme.typography.fontFamily.body }}>
                        Logga ut
                      </Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<LoginIcon />}
                  onClick={() => handleNavigation('/login')}
                  sx={{
                    background: bastadTheme.gradients.ctaButton,
                    color: bastadTheme.colors.ocean[950],
                    borderRadius: bastadTheme.borderRadius.md,
                    textTransform: 'none',
                    fontFamily: bastadTheme.typography.fontFamily.body,
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    fontSize: '0.9375rem',
                    boxShadow: 'none',
                    transition: bastadTheme.transitions.normal,
                    '&:hover': {
                      boxShadow: bastadTheme.shadows.warmGlow,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Logga in
                </Button>
              )}
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="Öppna navigationsmeny"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{
                color: textColor,
                backgroundColor: bastadTheme.colors.sand[100],
                border: `1px solid ${bastadTheme.colors.sand[300]}`,
                borderRadius: bastadTheme.borderRadius.md,
                padding: bastadTheme.spacing[2],
                marginRight: bastadTheme.spacing[2],
                transition: bastadTheme.transitions.normal,
                '&:hover': {
                  backgroundColor: bastadTheme.colors.sand[200],
                },
              }}
            >
              {mobileDrawerOpen ? (
                <CloseIcon sx={{ fontSize: '1.25rem' }} />
              ) : (
                <MenuIcon sx={{ fontSize: '1.25rem' }} />
              )}
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            width: 300,
            background: bastadTheme.colors.sand[50],
            border: 'none',
            boxShadow: bastadTheme.shadows['2xl'],
          },
        }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {mobileDrawer}
      </Drawer>
    </>
  );
});

export default ModernHeader;
