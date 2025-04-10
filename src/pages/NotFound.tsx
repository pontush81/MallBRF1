import React from 'react';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { SentimentVeryDissatisfied as SadIcon } from '@mui/icons-material';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ 
        my: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <SadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          
          <Typography variant="h2" component="h1" gutterBottom>
            404
          </Typography>
          
          <Typography variant="h5" component="h2" gutterBottom>
            Sidan kunde inte hittas
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '80%' }}>
            Sidan du försöker nå finns inte eller har flyttats.
            Kontrollera URL-adressen eller gå tillbaka till startsidan.
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              component={RouterLink} 
              to="/pages"
            >
              Gå till startsidan
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound; 