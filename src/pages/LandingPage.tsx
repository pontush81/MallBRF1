import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 4
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Välkommen till Gulmåran
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Din föreningens digitala mötesplats
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/pages')}
          sx={{ mt: 4 }}
        >
          Gå till sidorna
        </Button>
      </Box>
    </Container>
  );
};

export default LandingPage; 