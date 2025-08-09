import React from 'react';
import { 
  Typography, 
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button
} from '@mui/material';
import {
  Article as ArticleIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Build as MaintenanceIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Add as AddIcon,
  List as ListIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { modernTheme } from '../../theme/modernTheme';

interface QuickActionCard {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
  color: string;
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  const quickActions: QuickActionCard[] = [
    {
      title: 'Hantera Sidor',
      description: 'Skapa och redigera webbsidors innehåll',
      icon: <ArticleIcon />,
      path: '/admin/pages',
      color: modernTheme.colors.primary[500]
    },
    {
      title: 'Bokningar',
      description: 'Visa och hantera alla bokningar',
      icon: <EventIcon />,
      path: '/booking',
      color: modernTheme.colors.secondary[500]
    },
    {
      title: 'Användare',
      description: 'Hantera användarkonton och behörigheter',
      icon: <PeopleIcon />,
      path: '/admin/users',
      color: modernTheme.colors.success[500]
    },
    {
      title: 'Underhållsplan',
      description: 'Planera och följa upp underhållsarbeten',
      icon: <MaintenanceIcon />,
      path: '/admin/maintenance',
      color: modernTheme.colors.warning[500]
    },

    {
      title: 'Notifikationer',
      description: 'Konfigurera systemmeddelanden',
      icon: <NotificationIcon />,
      path: '/admin/notifications',
      color: modernTheme.colors.error[500]
    },
    {
      title: 'Data Retention',
      description: 'Hantera automatisk dataradering enligt GDPR',
      icon: <SettingsIcon />,
      path: '/admin/data-retention',
      color: modernTheme.colors.primary[600]
    },
    {
      title: 'HSB-rapport',
      description: 'Skapa och redigera HSB-rapporter med anpassade data',
      icon: <ReportIcon />,
      path: '/admin/hsb-report',
      color: modernTheme.colors.secondary[600]
    }
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: modernTheme.spacing[6], textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: modernTheme.typography.fontWeight.bold,
            color: modernTheme.colors.gray[800],
            mb: modernTheme.spacing[2]
          }}
        >
          Välkommen till Admin-panelen
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: modernTheme.colors.gray[600],
            fontWeight: modernTheme.typography.fontWeight.normal,
            maxWidth: '600px',
            mx: 'auto'
          }}
        >
          Hantera ditt innehåll och bokningar från en central plats
        </Typography>
      </Box>

      {/* Quick Actions Grid */}
      <Box sx={{ mb: modernTheme.spacing[6] }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: modernTheme.typography.fontWeight.semibold,
            color: modernTheme.colors.gray[800],
            mb: modernTheme.spacing[4]
          }}
        >
          Snabbåtkomst
        </Typography>
        
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: modernTheme.borderRadius.lg,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `1px solid ${modernTheme.colors.gray[200]}`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    borderColor: action.color
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleCardClick(action.path)}
                  sx={{ height: '100%', p: 0 }}
                >
                  <CardContent sx={{ p: modernTheme.spacing[4], textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: `${action.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: modernTheme.spacing[3]
                      }}
                    >
                      {React.cloneElement(action.icon, {
                        sx: { fontSize: 30, color: action.color }
                      })}
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: modernTheme.typography.fontWeight.semibold,
                        color: modernTheme.colors.gray[800],
                        mb: modernTheme.spacing[2]
                      }}
                    >
                      {action.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: modernTheme.colors.gray[600],
                        lineHeight: 1.5
                      }}
                    >
                      {action.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Quick Create Actions */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: modernTheme.typography.fontWeight.semibold,
            color: modernTheme.colors.gray[800],
            mb: modernTheme.spacing[4]
          }}
        >
          Snabbåtgärder
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/pages/new')}
            sx={{
              backgroundColor: modernTheme.colors.primary[500],
              '&:hover': { backgroundColor: modernTheme.colors.primary[600] },
              borderRadius: modernTheme.borderRadius.lg,
              px: modernTheme.spacing[4],
              py: modernTheme.spacing[2]
            }}
          >
            Skapa Ny Sida
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ListIcon />}
            onClick={() => navigate('/booking')}
            sx={{
              borderColor: modernTheme.colors.secondary[500],
              color: modernTheme.colors.secondary[500],
              '&:hover': { 
                borderColor: modernTheme.colors.secondary[600],
                backgroundColor: `${modernTheme.colors.secondary[500]}10`
              },
              borderRadius: modernTheme.borderRadius.lg,
              px: modernTheme.spacing[4],
              py: modernTheme.spacing[2]
            }}
          >
            Visa Alla Bokningar
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardHome; 