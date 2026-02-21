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
  Assessment as ReportIcon,
  ReportProblem as FaultIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContextNew';
import { bastadTheme } from '../../theme/bastadTheme';

interface QuickActionCard {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
  color: string;
  allowedRoles?: string[];
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  const quickActions: QuickActionCard[] = [
    {
      title: 'Hantera Sidor',
      description: 'Skapa och redigera webbsidors innehåll',
      icon: <ArticleIcon />,
      path: '/admin/pages',
      color: bastadTheme.colors.ocean[500],
      allowedRoles: ['admin']
    },
    {
      title: 'Bokningar',
      description: 'Visa och hantera alla bokningar',
      icon: <EventIcon />,
      path: '/booking',
      color: bastadTheme.colors.twilight[500],
      allowedRoles: ['admin']
    },
    {
      title: 'Användare',
      description: 'Hantera användarkonton och behörigheter',
      icon: <PeopleIcon />,
      path: '/admin/users',
      color: bastadTheme.colors.success,
      allowedRoles: ['admin']
    },
    {
      title: 'Underhållsplan',
      description: 'Planera och följa upp underhållsarbeten',
      icon: <MaintenanceIcon />,
      path: '/admin/maintenance',
      color: bastadTheme.colors.warning
    },

    {
      title: 'Notifikationer',
      description: 'Konfigurera systemmeddelanden',
      icon: <NotificationIcon />,
      path: '/admin/notifications',
      color: bastadTheme.colors.error,
      allowedRoles: ['admin']
    },
    {
      title: 'Data Retention',
      description: 'Hantera automatisk dataradering enligt GDPR',
      icon: <SettingsIcon />,
      path: '/admin/data-retention',
      color: bastadTheme.colors.ocean[600],
      allowedRoles: ['admin']
    },
    {
      title: 'HSB-rapport',
      description: 'Skapa och redigera HSB-rapporter med anpassade data',
      icon: <ReportIcon />,
      path: '/admin/hsb-report',
      color: bastadTheme.colors.twilight[600],
      allowedRoles: ['admin']
    },
    {
      title: 'Felanmälningar',
      description: 'Hantera felanmälningar från boende',
      icon: <FaultIcon />,
      path: '/admin/felanmalningar',
      color: bastadTheme.colors.error
    }
  ];

  const { currentUser } = useAuth();
  const userRole = currentUser?.role || 'user';

  const visibleActions = quickActions.filter(action => {
    if (!action.allowedRoles) return true;
    return action.allowedRoles.includes(userRole);
  });

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: bastadTheme.spacing[6], textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: bastadTheme.typography.fontWeight.bold,
            color: bastadTheme.colors.ocean[800],
            mb: bastadTheme.spacing[2]
          }}
        >
          Välkommen till Admin-panelen
        </Typography>
        {userRole === 'board' && (
          <Typography
            variant="h6"
            sx={{
              color: bastadTheme.colors.ocean[600],
              fontWeight: bastadTheme.typography.fontWeight.normal,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Styrelsevy — underhållsplan och felanmälningar
          </Typography>
        )}
      </Box>

      {/* Quick Actions Grid */}
      <Box sx={{ mb: bastadTheme.spacing[6] }}>
        <Grid container spacing={3}>
          {visibleActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: bastadTheme.borderRadius.lg,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `1px solid ${bastadTheme.colors.sand[200]}`,
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
                  <CardContent sx={{ p: bastadTheme.spacing[4], textAlign: 'center' }}>
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
                        mb: bastadTheme.spacing[3]
                      }}
                    >
                      {React.cloneElement(action.icon, {
                        sx: { fontSize: 30, color: action.color }
                      })}
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: bastadTheme.typography.fontWeight.semibold,
                        color: bastadTheme.colors.ocean[800],
                        mb: bastadTheme.spacing[2]
                      }}
                    >
                      {action.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: bastadTheme.colors.ocean[600],
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
    </Box>
  );
};

export default DashboardHome; 