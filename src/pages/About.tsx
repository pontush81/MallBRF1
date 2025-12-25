import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Description as DocumentIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const About: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Om BRF Gulmåran
        </Typography>
        
        <Typography variant="body1" paragraph>
          Bostadsrättsförening Gulmåran är en välorganiserad och ekonomiskt stabil bostadsrättsförening 
          som erbjuder trivsamma bostäder i en attraktiv miljö.
        </Typography>

        <Divider sx={{ my: 4 }} />

        {/* Legal Organization Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Organisationsinformation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enligt svensk lag måste vi tillhandahålla följande information:
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Juridisk beteckning"
                        secondary="Bostadsrättsförening Gulmåran"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <DocumentIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Organisationsnummer"
                        secondary="769639-5420"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Registrerad adress"
                        secondary="Köpmansgatan 80, 269 31 Båstad"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* About the Association */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Om föreningen
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vi erbjuder våra medlemmar moderna bostäder med gemensamma faciliteter som 
            gästlägenhet, tvättstuga och parkeringsplatser. Föreningen sköts professionellt 
            med fokus på ekonomisk stabilitet och trivsel.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Digital Services */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Digitala tjänster
          </Typography>
          <Typography variant="body1" paragraph>
            Denna webbplats tillhandahåller digitala tjänster för våra medlemmar:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <BusinessIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Bokningshantering"
                secondary="Boka gästlägenhet och andra gemensamma utrymmen"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DocumentIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Information och dokument"
                secondary="Tillgång till föreningsinformation och viktiga dokument"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PeopleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Medlemshantering"
                secondary="Säker hantering av medlemsuppgifter enligt GDPR"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Denna information uppdaterades senast: {new Date().toLocaleDateString('sv-SE')}
            <br />
            All information på denna sida följer svensk associationslagstiftning och GDPR-krav.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default About; 