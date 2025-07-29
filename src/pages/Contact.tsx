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
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const Contact: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Kontakta oss
        </Typography>
        
        <Typography variant="body1" paragraph>
          Har du frågor eller behöver hjälp? Här hittar du all kontaktinformation för 
          BRF Gulmåran och hur du enkelt kan komma i kontakt med styrelsen.
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Svarstid</AlertTitle>
          Vi strävar efter att svara på alla förfrågningar inom 2-3 arbetsdagar. 
          Brådskande ärenden hanteras prioriterat.
        </Alert>

        {/* Primary Contact */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Primär kontakt
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Styrelseordförande"
                        secondary="BRF Gulmåran"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="E-post"
                        secondary="gulmaranbrf@gmail.com"
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List>
                                         <ListItem>
                       <ListItemIcon>
                         <EmailIcon color="primary" />
                       </ListItemIcon>
                       <ListItemText
                         primary="E-post (allmän)"
                         secondary="gulmaranbrf@gmail.com"
                       />
                     </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tillgänglighet"
                        secondary="Vardagar 08:00-18:00"
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Contact by Topic */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Kontakt efter ärende
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            För att få snabbare hjälp, använd rätt ämnesrad i ditt e-postmeddelande:
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    📋 Föreningsfrågor
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Ämnesrad: "Föreningsfråga - [Kort beskrivning]"
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Medlemskap och rättigheter" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Styrelsebeslut" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ekonomiska frågor" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Föreningsordning" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    🏠 Fastighet & Underhåll
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Ämnesrad: "Fastighet - [Kort beskrivning]"
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Underhåll och reparationer" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Gemensamma utrymmen" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Säkerhet och tillgänglighet" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Renovering och uppgraderingar" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    💻 Digitala tjänster
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Ämnesrad: "IT-support - [Kort beskrivning]"
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Webbplats och inloggning" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Bokningssystem" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="GDPR och dataskydd" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tekniska problem" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ⚖️ Klagomål
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Ämnesrad: "Klagomål - [Kort beskrivning]"
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Formella klagomål" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Dataskyddsproblem" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tillgänglighetsproblem" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Diskrimineringsärenden" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Organization Info */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Organisationsinformation
          </Typography>
          
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                        <InfoIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Organisationsnummer"
                        secondary="769639-5420"
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon color="primary" />
                      </ListItemIcon>
                                             <ListItemText
                         primary="Registrerad adress"
                         secondary="Köpmansgatan 80, 269 31 Båstad"
                       />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Officiell e-post"
                        secondary="gulmaranbrf@gmail.com"
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Tips for Better Communication */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Tips för bättre kommunikation
          </Typography>
          
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>För snabbare svar:</strong> Inkludera ditt lägenhetsnummer, 
              en tydlig beskrivning av ärendet, och eventuella relevanta datum eller dokument.
            </Typography>
          </Alert>

          <List>
            <ListItem>
              <ListItemText 
                primary="Var konkret och tydlig" 
                secondary="Beskriv ditt ärende så detaljerat som möjligt"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Inkludera lägenhetsnummer" 
                secondary="Hjälper oss att snabbt identifiera relevant information"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Bifoga relevanta dokument" 
                secondary="Foton, avtal, eller andra dokument som stöder ditt ärende"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Ange önskad kontaktmetod" 
                secondary="E-post, telefon eller fysiskt möte"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Ge oss tid att svara" 
                secondary="Vi svarar inom 2-3 arbetsdagar, brådskande ärenden prioriteras"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Kontaktinformation uppdaterad: {new Date().toLocaleDateString('sv-SE')}
            <br />
            För brådskande ärenden utanför kontorstid, kontakta styrelseordföranden direkt.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Contact; 