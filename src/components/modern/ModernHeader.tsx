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

  const adminItems = isAdmin ? [
    {
      label: 'Admin',
      path: '/admin',
      icon: <AdminIcon />,
    },
  ] : [];

  const allNavigationItems = [...navigationItems, ...adminItems];

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
        startIcon={item.icon}
        sx={{
          color: isActive ? modernTheme.colors.secondary[600] : modernTheme.colors.primary[700],
          backgroundColor: isActive ? modernTheme.colors.secondary[50] : 'transparent',
          fontWeight: isActive ? modernTheme.typography.fontWeight.semibold : modernTheme.typography.fontWeight.medium,
          fontSize: modernTheme.typography.fontSize.sm,
          textTransform: 'none',
          borderRadius: modernTheme.borderRadius.lg,
          padding: `${modernTheme.spacing[2]} ${modernTheme.spacing[4]}`,
          minHeight: '40px',
          transition: modernTheme.transitions.normal,
          border: isActive ? `1px solid ${modernTheme.colors.secondary[200]}` : '1px solid transparent',
          '&:hover': {
            backgroundColor: modernTheme.colors.gray[100],
            transform: 'translateY(-1px)',
          },
          '&:focus': {
            outline: `2px solid ${modernTheme.colors.secondary[400]}`,
            outlineOffset: '2px',
          },
        }}
      >
        {item.label}
      </Button>
    );
  };

  const mobileDrawer = (
    <Box sx={{ 
      width: 280,
      height: '100%',
      background: modernTheme.colors.white,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Ultra Compact Mobile Header */}
      <Box sx={{ 
        padding: modernTheme.spacing[2], // Further reduced from 3 to 2
        background: modernTheme.gradients.header,
        color: modernTheme.colors.primary[800],
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: modernTheme.spacing[0.5], // Further reduced
        }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: modernTheme.typography.fontWeight.extrabold,
              fontSize: modernTheme.typography.fontSize.sm, // Even smaller
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
            size="small"
            sx={{ 
              color: modernTheme.colors.white,
              p: 0.5, // Smaller padding
              '&:focus': {
                outline: `2px solid ${modernTheme.colors.white}40`,
                outlineOffset: '2px',
              },
            }}
            aria-label="Stäng meny"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.8,
            fontSize: '10px', // Very small text
            lineHeight: 1,
          }}
        >
          Bostadsrättsförening
        </Typography>
      </Box>

      {/* Navigation Items - Ultra Compact */}
      <Box sx={{ flexGrow: 1, paddingTop: modernTheme.spacing[1] }}> {/* Further reduced */}
        <List sx={{ py: 0, '& .MuiListItem-root': { py: 0.5 } }}> {/* Even smaller list items */}
          {allNavigationItems.map((item) => renderNavigationItem(item, true))}
        </List>
      </Box>

      {/* Ultra Compact Mobile User Section */}
      <Box sx={{ 
        padding: modernTheme.spacing[2], // Further reduced from 3 to 2
        borderTop: `1px solid ${modernTheme.colors.gray[200]}`,
      }}>
        {isLoggedIn && currentUser ? (
          <Box>
            {/* Ultra Compact User Info */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: modernTheme.spacing[1.5], // Further reduced gap
              marginBottom: modernTheme.spacing[1.5], // Further reduced margin
            }}>
              <Avatar
                sx={{
                  backgroundColor: modernTheme.colors.primary[500],
                  color: modernTheme.colors.white,
                  width: 28, // Further reduced from 32
                  height: 28, // Further reduced from 32
                  fontSize: '11px', // Very small font
                  fontWeight: modernTheme.typography.fontWeight.semibold,
                }}
              >
                {getUserInitials(currentUser)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}> {/* Prevent overflow */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: modernTheme.typography.fontWeight.semibold,
                    color: modernTheme.colors.gray[900],
                    fontSize: '11px', // Very small
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
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
                      fontSize: '9px', // Very small
                      height: '14px', // Very small chip
                      mt: 0.25,
                      '& .MuiChip-label': {
                        px: 0.5,
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
            {/* Ultra Compact Logout Button */}
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon sx={{ fontSize: '14px' }} />}
              onClick={handleLogout}
              sx={{
                borderRadius: modernTheme.borderRadius.lg,
                textTransform: 'none',
                borderColor: modernTheme.colors.gray[300],
                color: modernTheme.colors.gray[700],
                fontSize: '11px', // Very small text
                py: 0.75, // Further reduced padding
                minHeight: '32px', // Set minimum height
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
            size="small"
            startIcon={<LoginIcon sx={{ fontSize: '14px' }} />}
            onClick={() => handleNavigation('/login')}
            sx={{
              background: modernTheme.gradients.accent,
              borderRadius: modernTheme.borderRadius.lg,
              textTransform: 'none',
              boxShadow: modernTheme.shadows.md,
              color: modernTheme.colors.white,
              fontSize: '11px', // Very small text
              py: 0.75, // Further reduced padding
              minHeight: '32px', // Set minimum height
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
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: modernTheme.gradients.header,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${modernTheme.colors.gray[200]}`,
          boxShadow: modernTheme.shadows.lg,
          height: '64px', // Fixed height to prevent CLS
          minHeight: '64px !important',
          maxHeight: '64px !important',
        }}
      >
        <Toolbar sx={{ 
          padding: { xs: modernTheme.spacing[2], md: modernTheme.spacing[4] },
          minHeight: '64px !important', // Fixed height to prevent CLS
          maxHeight: '64px !important', // Fixed height to prevent CLS
          height: '64px !important', // Fixed height to prevent CLS
        }}>
          {/* Logo/Brand */}
          <Typography
            variant="h6"
            component="div"
            onClick={() => handleNavigation('/')}
            sx={{
              flexGrow: isMobile ? 1 : 0,
              fontWeight: modernTheme.typography.fontWeight.extrabold,
              fontSize: { xs: modernTheme.typography.fontSize.lg, md: modernTheme.typography.fontSize.xl },
              background: `linear-gradient(135deg, ${modernTheme.colors.secondary[600]} 0%, ${modernTheme.colors.secondary[700]} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              cursor: 'pointer',
              textShadow: 'none',
              transition: modernTheme.transitions.normal,
              marginRight: isMobile ? 0 : modernTheme.spacing[8],
              '&:hover': {
                background: `linear-gradient(135deg, ${modernTheme.colors.secondary[500]} 0%, ${modernTheme.colors.secondary[600]} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                transform: 'scale(1.02)',
              },
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
            Gulmåran
          </Typography>

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
                  variant="contained"
                  startIcon={<LoginIcon />}
                  onClick={() => handleNavigation('/login')}
                  sx={{
                    backgroundColor: modernTheme.colors.white,
                    color: modernTheme.colors.primary[600],
                    borderRadius: modernTheme.borderRadius.lg,
                    textTransform: 'none',
                    fontWeight: modernTheme.typography.fontWeight.semibold,
                    boxShadow: modernTheme.shadows.md,
                    '&:hover': {
                      backgroundColor: modernTheme.colors.gray[100],
                      boxShadow: modernTheme.shadows.lg,
                    },
                    '&:focus': {
                      outline: `2px solid ${modernTheme.colors.white}40`,
                      outlineOffset: '2px',
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
                border: `2px solid ${modernTheme.colors.primary[200]}`,
                borderRadius: modernTheme.borderRadius.lg,
                padding: modernTheme.spacing[2],
                marginRight: modernTheme.spacing[2],
                boxShadow: modernTheme.shadows.sm,
                transition: modernTheme.transitions.normal,
                '&:hover': {
                  backgroundColor: modernTheme.colors.primary[50],
                  borderColor: modernTheme.colors.primary[300],
                  boxShadow: modernTheme.shadows.md,
                  transform: 'scale(1.05)',
                },
                '&:focus': {
                  outline: `2px solid ${modernTheme.colors.primary[400]}`,
                  outlineOffset: '2px',
                  backgroundColor: modernTheme.colors.primary[50],
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: '1.2rem' }} />
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
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            border: 'none',
            boxShadow: modernTheme.shadows['2xl'],
          },
        }}
      >
        {mobileDrawer}
      </Drawer>
    </>
  );
});

export default ModernHeader; 