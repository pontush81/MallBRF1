import React from 'react';
import { Container, Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { bastadTheme } from '../../theme/bastadTheme';

const Dashboard: React.FC = () => {
  return (
    <Box
      sx={{
        background: bastadTheme.colors.sand[50],
        minHeight: 0,
      }}
    >
      <Container maxWidth="xl" sx={{ pt: bastadTheme.spacing[12], pb: bastadTheme.spacing[4] }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default Dashboard;
