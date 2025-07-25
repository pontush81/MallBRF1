import React from 'react';
import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';
import { modernTheme } from '../../theme/modernTheme';

interface BookingSkeletonProps {
  count?: number;
  variant?: 'list' | 'card' | 'calendar';
}

const BookingSkeleton: React.FC<BookingSkeletonProps> = ({ 
  count = 3, 
  variant = 'list' 
}) => {
  const skeletonItems = Array.from({ length: count }, (_, index) => {
    switch (variant) {
      case 'card':
        return (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                borderRadius: modernTheme.borderRadius.lg,
                boxShadow: modernTheme.shadows.sm,
                border: `1px solid ${modernTheme.colors.gray[200]}`,
              }}
            >
              <CardContent sx={{ p: modernTheme.spacing[4] }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: modernTheme.spacing[3] }}>
                  <Skeleton 
                    variant="circular" 
                    width={40} 
                    height={40} 
                    sx={{ mr: modernTheme.spacing[2] }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                </Box>
                <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="50%" height={16} />
                <Box sx={{ mt: modernTheme.spacing[3], display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="circular" width={32} height={32} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );

      case 'calendar':
        return (
          <Box 
            key={index}
            sx={{
              p: modernTheme.spacing[2],
              border: `1px solid ${modernTheme.colors.gray[200]}`,
              borderRadius: modernTheme.borderRadius.lg,
              mb: modernTheme.spacing[2],
              background: modernTheme.colors.white
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: modernTheme.spacing[2] }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: modernTheme.spacing[2] }} />
              <Skeleton variant="text" width="30%" height={20} />
            </Box>
            <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="70%" height={14} />
          </Box>
        );

      default: // 'list'
        return (
          <Box 
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: modernTheme.spacing[3],
              border: `1px solid ${modernTheme.colors.gray[200]}`,
              borderRadius: modernTheme.borderRadius.lg,
              mb: modernTheme.spacing[2],
              background: modernTheme.colors.white
            }}
          >
            <Skeleton 
              variant="circular" 
              width={48} 
              height={48} 
              sx={{ mr: modernTheme.spacing[3] }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="30%" height={14} />
            </Box>
            <Box sx={{ display: 'flex', gap: modernTheme.spacing[2] }}>
              <Skeleton variant="rectangular" width={64} height={24} sx={{ borderRadius: 1 }} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </Box>
        );
    }
  });

  if (variant === 'card') {
    return (
      <Grid container spacing={modernTheme.spacing[4]}>
        {skeletonItems}
      </Grid>
    );
  }

  return <Box>{skeletonItems}</Box>;
};

export default BookingSkeleton; 