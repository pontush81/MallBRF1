import React, { useState, memo } from 'react';
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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextNew';
import { modernTheme } from '../../theme/modernTheme';

const ModernHeader: React.FC = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoggedIn, isAdmin, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const navigationItems = [
    {
      label: 'Hem',
      path: '/',
      icon: <HomeIcon />,
    },
    {
      label: 'Boka',
      path: '/booking',
      icon: <BookIcon />,
    },
  ];

  const loggedInItems = isLoggedIn ? [
    {
      label: 'Underhållsplan',
      path: '/maintenance-plan',
      icon: <MaintenanceIcon />,
    },
  ] : [];

  const adminItems = isAdmin ? [
    {
      label: 'Admin',
      path: '/admin',
      icon: <AdminIcon />,
    },
  ] : [];

  const allNavigationItems = [...navigationItems, ...loggedInItems, ...adminItems];

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  // Force close all overlays when navigating
  const forceCloseOverlays = () => {
    setMobileDrawerOpen(false);
    setUserMenuAnchor(null);
    
    // Also close any potential stuck Material-UI backdrops
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
    // Force close all overlays immediately
    forceCloseOverlays();
    
    // Small delay to ensure all overlays are closed before navigation
    setTimeout(() => {
      navigate(path);
    }, 150);
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

  const getUserInitials = (user: any) => {
    if (!user) return 'G';
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    if (user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const renderNavigationItem = (item: any, isMobile: boolean = false) => {
    const isActive = isActivePath(item.path);
    
    if (isMobile) {
      return (
        <ListItem key={item.path} disablePadding>
          <ListItemButton
            onClick={() => handleNavigation(item.path)}
            selected={isActive}
            sx={{
              borderRadius: modernTheme.borderRadius.lg,
              margin: `0 ${modernTheme.spacing[2]}`,
              padding: modernTheme.spacing[3],
              '&.Mui-selected': {
                backgroundColor: modernTheme.colors.primary[50],
                color: modernTheme.colors.primary[700],
                '&:hover': {
                  backgroundColor: modernTheme.colors.primary[100],
                },
              },
              '&:focus': {
                outline: `2px solid ${modernTheme.colors.primary[300]}`,
                outlineOffset: '2px',
              },
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: modernTheme.spacing[3],
              width: '100%',
            }}>
              {React.cloneElement(item.icon, {
                sx: { 
                  color: isActive ? modernTheme.colors.primary[600] : modernTheme.colors.gray[600],
                  fontSize: modernTheme.typography.fontSize.xl,
                }
              })}
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
                  fontSize: modernTheme.typography.fontSize.base,
                }}
              />
              {isActive && (
                <Chip
                  label="Aktiv"
                  size="small"
                  sx={{
                    backgroundColor: modernTheme.colors.primary[100],
                    color: modernTheme.colors.primary[700],
                    fontSize: modernTheme.typography.fontSize.xs,
                    height: '24px',
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
          color: isActive ? '#374151' : '#6b7280',
          backgroundColor: 'transparent',
          fontWeight: isActive ? 600 : 500,
          fontSize: '14px',
          textTransform: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          minHeight: '36px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#f3f4f6',
            color: '#374151',
          },
          '&:focus': {
            outline: `2px solid #8b5cf6`,
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
      {/* Header (fixed at top) - flex: 0 0 auto */}
      <Box
        component="header"
        sx={{
          flex: '0 0 auto',
          padding: modernTheme.spacing[3],
          background: modernTheme.gradients.header,
          color: modernTheme.colors.primary[800],
          borderBottom: `1px solid ${modernTheme.colors.gray[200]}`,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: modernTheme.spacing[1],
        }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: modernTheme.typography.fontWeight.extrabold,
              fontSize: modernTheme.typography.fontSize.lg,
              background: `linear-gradient(135deg, ${modernTheme.colors.secondary[600]} 0%, ${modernTheme.colors.secondary[700]} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Gulmåran
          </Typography>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ 
              color: modernTheme.colors.white,
              '&:focus': {
                outline: `2px solid ${modernTheme.colors.white}40`,
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
            opacity: 0.9,
            fontSize: modernTheme.typography.fontSize.sm,
          }}
        >
          Bostadsrättsförening
        </Typography>
      </Box>

      {/* Middle scrollable content - flex: 1 1 auto */}
      <Box
        component="nav"
        sx={{
          flex: '1 1 auto',
          minHeight: 0, // Critical for overflow to work inside flex container
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch', // Better mobile scrolling
          paddingTop: modernTheme.spacing[2],
        }}
      >
        <List>
          {allNavigationItems.map((item) => renderNavigationItem(item, true))}
        </List>
      </Box>

      {/* Footer (fixed at bottom) - flex: 0 0 auto */}
      <Box
        component="footer"
        sx={{
          flex: '0 0 auto',
          padding: modernTheme.spacing[3],
          borderTop: `1px solid ${modernTheme.colors.gray[200]}`,
          backgroundColor: modernTheme.colors.white,
          paddingBottom: `calc(${modernTheme.spacing[3]} + env(safe-area-inset-bottom))`, // iOS safe area
        }}
      >
        {isLoggedIn && currentUser ? (
          <Box>
            {/* User Info */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: modernTheme.spacing[2],
              marginBottom: modernTheme.spacing[2],
            }}>
              <Avatar
                sx={{
                  backgroundColor: modernTheme.colors.primary[500],
                  color: modernTheme.colors.white,
                  width: 40,
                  height: 40,
                  fontSize: modernTheme.typography.fontSize.lg,
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                }}
              >
                {getUserInitials(currentUser)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: modernTheme.typography.fontWeight.semibold,
                    color: modernTheme.colors.gray[900],
                    fontSize: modernTheme.typography.fontSize.sm,
                    display: 'block',
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
                      backgroundColor: modernTheme.colors.primary[100],
                      color: modernTheme.colors.primary[700],
                      fontSize: modernTheme.typography.fontSize.xs,
                      height: '20px',
                      mt: 0.5,
                    }}
                  />
                )}
              </Box>
            </Box>
            {/* ALWAYS VISIBLE Logout Button */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                borderRadius: modernTheme.borderRadius.lg,
                textTransform: 'none',
                borderColor: modernTheme.colors.gray[300],
                color: modernTheme.colors.gray[700],
                fontSize: modernTheme.typography.fontSize.sm,
                py: 1.5,
                minHeight: '44px', // Accessibility compliant touch target
                '&:hover': {
                  borderColor: modernTheme.colors.gray[400],
                  backgroundColor: modernTheme.colors.gray[50],
                },
                '&:focus': {
                  outline: `2px solid ${modernTheme.colors.primary[300]}`,
                  outlineOffset: '2px',
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
              background: modernTheme.gradients.accent,
              borderRadius: modernTheme.borderRadius.lg,
              textTransform: 'none',
              boxShadow: modernTheme.shadows.md,
              color: modernTheme.colors.white,
              fontSize: modernTheme.typography.fontSize.sm,
              py: 1.5,
              minHeight: '44px', // Accessibility compliant touch target
              '&:hover': {
                boxShadow: modernTheme.shadows.lg,
              },
              '&:focus': {
                outline: `2px solid ${modernTheme.colors.secondary[300]}`,
                outlineOffset: '2px',
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
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          height: '64px', // Fixed height to prevent CLS
          minHeight: '64px !important',
          maxHeight: '64px !important',
          transition: 'all 0.2s ease',
        }}
      >
        <Toolbar sx={{ 
          padding: { xs: modernTheme.spacing[2], md: modernTheme.spacing[4] },
          minHeight: '64px !important', // Fixed height to prevent CLS
          maxHeight: '64px !important', // Fixed height to prevent CLS
          height: '64px !important', // Fixed height to prevent CLS
        }}>
          {/* Logo/Brand with Icon and Subtitle */}
          <Box 
            onClick={() => handleNavigation('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: modernTheme.spacing[2],
              flexGrow: isMobile ? 1 : 0,
              cursor: 'pointer',
              marginRight: isMobile ? 0 : modernTheme.spacing[8],
              '&:focus': {
                outline: `2px solid ${modernTheme.colors.secondary[400]}`,
                outlineOffset: '2px',
                borderRadius: modernTheme.borderRadius.md,
              },
            }}
            tabIndex={0}
            role="button"
            aria-label="Gå till startsidan"
          >
            {/* Purple Icon */}
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              fontSize: '20px',
              fontWeight: 'bold',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
              🏢
            </Box>
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '18px', md: '20px' },
                  color: '#1f2937',
                  lineHeight: 1.2,
                  margin: 0
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
              gap: modernTheme.spacing[2],
              flexGrow: 1,
              alignItems: 'center',
            }}>
              {allNavigationItems.map((item) => renderNavigationItem(item, false))}
            </Box>
          )}

          {/* Desktop User Section */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: modernTheme.spacing[2] }}>
              {isLoggedIn && currentUser ? (
                <>
                  <Button
                    onClick={handleUserMenuClick}
                    startIcon={
                      <Avatar
                        sx={{
                          backgroundColor: modernTheme.colors.white,
                          color: modernTheme.colors.primary[600],
                          width: 32,
                          height: 32,
                          fontSize: modernTheme.typography.fontSize.sm,
                          fontWeight: modernTheme.typography.fontWeight.semibold,
                        }}
                      >
                        {getUserInitials(currentUser)}
                      </Avatar>
                    }
                    sx={{
                      color: modernTheme.colors.primary[800],
                      textTransform: 'none',
                      borderRadius: modernTheme.borderRadius.lg,
                      padding: `${modernTheme.spacing[2]} ${modernTheme.spacing[4]}`,
                      '&:hover': {
                        backgroundColor: modernTheme.colors.gray[100],
                      },
                      '&:focus': {
                        outline: `2px solid ${modernTheme.colors.secondary[400]}`,
                        outlineOffset: '2px',
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
                        borderRadius: modernTheme.borderRadius.lg,
                        boxShadow: modernTheme.shadows.xl,
                        minWidth: '200px',
                        marginTop: modernTheme.spacing[1],
                      },
                    }}
                  >
                    <Box sx={{ padding: modernTheme.spacing[3] }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: modernTheme.colors.gray[600],
                          fontSize: modernTheme.typography.fontSize.sm,
                          marginBottom: modernTheme.spacing[1],
                        }}
                      >
                        Inloggad som
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: modernTheme.typography.fontWeight.semibold,
                          color: modernTheme.colors.gray[900],
                          fontSize: modernTheme.typography.fontSize.sm,
                        }}
                      >
                        {currentUser.email}
                      </Typography>
                      {isAdmin && (
                        <Chip
                          label="Administratör"
                          size="small"
                          sx={{
                            backgroundColor: modernTheme.colors.primary[100],
                            color: modernTheme.colors.primary[700],
                            fontSize: modernTheme.typography.fontSize.xs,
                            marginTop: modernTheme.spacing[1],
                          }}
                        />
                      )}
                    </Box>
                    <Divider />
                    <MenuItem
                      onClick={handleLogout}
                      sx={{
                        gap: modernTheme.spacing[2],
                        padding: modernTheme.spacing[3],
                        '&:focus': {
                          outline: `2px solid ${modernTheme.colors.primary[300]}`,
                          outlineOffset: '-2px',
                        },
                      }}
                    >
                      <LogoutIcon sx={{ fontSize: modernTheme.typography.fontSize.lg }} />
                      <Typography variant="body2">Logga ut</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<LoginIcon />}
                  onClick={() => handleNavigation('/login')}
                  sx={{
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2.5,
                    py: 1,
                    fontSize: '14px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      backgroundColor: '#f9fafb',
                      borderColor: '#9ca3af',
                      color: '#111827',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-1px)',
                    },
                    '&:focus': {
                      outline: `2px solid #3b82f6`,
                      outlineOffset: '2px',
                      borderColor: '#3b82f6',
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
                color: modernTheme.colors.primary[700],
                backgroundColor: modernTheme.colors.white,
                border: `1px solid ${modernTheme.colors.primary[200]}`,
                borderRadius: '12px', // More modern rounded corners
                padding: modernTheme.spacing[3],
                marginRight: modernTheme.spacing[2],
                boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)', // Enhanced shadow
                transition: 'all 0.25s ease-in-out',
                '&:hover': {
                  backgroundColor: modernTheme.colors.primary[50],
                  borderColor: modernTheme.colors.secondary[300],
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.15)', // Enhanced hover shadow
                  transform: 'scale(1.05) translateY(-1px)', // Subtle lift
                },
                '&:focus': {
                  outline: `2px solid ${modernTheme.colors.secondary[400]}`,
                  outlineOffset: '2px',
                  backgroundColor: modernTheme.colors.primary[50],
                },
                '&:active': {
                  transform: 'scale(0.98) translateY(0px)',
                },
              }}
            >
              {mobileDrawerOpen ? (
                <CloseIcon 
                  sx={{ 
                    fontSize: '1.2rem',
                    transition: modernTheme.transitions.normal,
                    transform: 'rotate(90deg)',
                  }} 
                />
              ) : (
                <MenuIcon 
                  sx={{ 
                    fontSize: '1.2rem',
                    transition: modernTheme.transitions.normal,
                    transform: 'rotate(0deg)',
                  }} 
                />
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
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        PaperProps={{
          sx: {
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh', // Dynamic viewport height for mobile
            width: 280,
            background: modernTheme.colors.white,
            border: 'none',
            boxShadow: modernTheme.shadows['2xl'],
          },
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        {mobileDrawer}
      </Drawer>
    </>
  );
});

export default ModernHeader; 