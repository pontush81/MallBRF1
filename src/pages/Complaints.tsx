import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  AlertTitle,
  Grid,
  Card,
  CardContent,
  ListItemIcon
} from '@mui/material';
import {
  Report as ComplaintIcon,
  Security as PrivacyIcon,
  Business as BrfIcon,
  Gavel as LegalIcon,
  ContactSupport as SupportIcon
} from '@mui/icons-material';

const Complaints: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Klagomålshantering
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Ditt klagomål är viktigt för oss</AlertTitle>
          Vi tar alla klagomål på allvar och strävar efter att lösa problem på ett rättvist och snabbt sätt. 
          Denna sida förklarar hur du kan lämna klagomål och vad som händer därefter.
        </Alert>

        {/* Section 1 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            1. Typer av klagomål
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            Du kan lämna klagomål inom följande områden:
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BrfIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Föreningsfrågor</Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Beslut av styrelsen" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Underhåll och fastighetsförvaltning" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Medlemsrättigheter" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ekonomiska frågor" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SupportIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Digitala tjänster</Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Webbplatsens funktionalitet" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Bokningssystem" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tekniska problem" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tillgänglighet" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PrivacyIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Dataskydd (GDPR)</Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Hantering av personuppgifter" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Cookies och samtycke" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Dataläckage" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Bristande transparens" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LegalIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Rättsliga frågor</Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Diskriminering" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Brott mot föreningsordning" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Otillbörlig behandling" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Lagstridiga beslut" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 2 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            2. Hur du lämnar klagomål
          </Typography>
          <Typography variant="body1" paragraph>
            Följ dessa steg för att lämna ett klagomål:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <Typography variant="h6" color="primary">1</Typography>
              </ListItemIcon>
              <ListItemText 
                primary="Kontakta oss först" 
                secondary="Försök lösa problemet genom att kontakta styrelsen direkt"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="h6" color="primary">2</Typography>
              </ListItemIcon>
              <ListItemText 
                primary="Skriftligt klagomål" 
                secondary="Om problemet kvarstår, lämna ett skriftligt klagomål via e-post"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="h6" color="primary">3</Typography>
              </ListItemIcon>
              <ListItemText 
                primary="Inkludera detaljer" 
                secondary="Beskriv problemet tydligt med datum, platser och eventuella vittnen"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="h6" color="primary">4</Typography>
              </ListItemIcon>
              <ListItemText 
                primary="Vänta på svar" 
                secondary="Vi svarar inom 14 dagar och strävar efter att lösa problemet inom 30 dagar"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 3 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            3. Kontaktinformation för klagomål
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Skriftliga klagomål</AlertTitle>
            <Typography variant="body2">
              <strong>E-post:</strong> gulmaranbrf@gmail.com<br />
              <strong>Ämnesrad:</strong> "Klagomål - [Beskriv kort vad det gäller]"<br />
                             <strong>Postadress:</strong> Köpmansgatan 80, 269 31 Båstad
            </Typography>
          </Alert>

          <Typography variant="body1" paragraph>
            <strong>Vad du ska inkludera i ditt klagomål:</strong>
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Ditt namn och kontaktuppgifter" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Lägenhetsnummer (om tillämpligt)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Tydlig beskrivning av problemet" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Datum och tid när problemet uppstod" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vilken lösning du önskar" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Eventuella bevis (foton, dokument, e-post)" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 4 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            4. Vår klagomålsprocess
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            När vi mottar ditt klagomål följer vi denna process:
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Dag 1-2
                </Typography>
                <Typography variant="body2">
                  <strong>Bekräftelse</strong><br />
                  Vi bekräftar mottagandet av ditt klagomål
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Dag 3-10
                </Typography>
                <Typography variant="body2">
                  <strong>Utredning</strong><br />
                  Vi utreder fakta och samlar information
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Dag 11-14
                </Typography>
                <Typography variant="body2">
                  <strong>Beslut</strong><br />
                  Styrelsen fattar beslut om åtgärder
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Dag 15-30
                </Typography>
                <Typography variant="body2">
                  <strong>Genomförande</strong><br />
                  Vi genomför beslutade åtgärder
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 5 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            5. Om du inte är nöjd med vårt svar
          </Typography>
          <Typography variant="body1" paragraph>
            Om du inte är nöjd med hur vi hanterat ditt klagomål kan du vända dig till externa myndigheter:
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Dataskyddsklagomål
                  </Typography>
                  <Typography variant="body2" paragraph>
                    För klagomål om hantering av personuppgifter:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Integritetsskyddsmyndigheten (IMY)</strong><br />
                    Webbplats: www.imy.se<br />
                    E-post: imy@imy.se<br />
                    Telefon: 08-657 61 00
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Bostadsrättsfrågor
                  </Typography>
                  <Typography variant="body2" paragraph>
                    För klagomål om föreningsfrågor:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Boverket</strong><br />
                    Webbplats: www.boverket.se<br />
                    <strong>Hyresgästföreningen</strong><br />
                    Eller konsultera juridisk rådgivning
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Tillgänglighetsfrågor
                  </Typography>
                  <Typography variant="body2" paragraph>
                    För klagomål om webbplatsets tillgänglighet:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Myndigheten för digital förvaltning (DIGG)</strong><br />
                    Webbplats: www.digg.se<br />
                    E-post: webbtillganglighet@digg.se<br />
                    Telefon: 010-472 90 00
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Diskrimineringsfrågor
                  </Typography>
                  <Typography variant="body2" paragraph>
                    För klagomål om diskriminering:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Diskrimineringsombudsmannen (DO)</strong><br />
                    Webbplats: www.do.se<br />
                    Telefon: 08-120 86 000
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 6 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            6. Anonyma klagomål
          </Typography>
          <Typography variant="body1" paragraph>
            Vi accepterar anonyma klagomål, men det kan begränsa vår möjlighet att:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Utreda problemet fullständigt" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Ge dig återkoppling om våra åtgärder" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Begära förtydliganden" />
            </ListItem>
          </List>
          <Typography variant="body1" paragraph>
            Vi rekommenderar att du lämnar kontaktuppgifter för att vi ska kunna hantera ditt klagomål effektivt.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 7 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            7. Förbättringsarbete
          </Typography>
          <Typography variant="body1" paragraph>
            Vi använder klagomål för att förbättra vår verksamhet:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Alla klagomål dokumenteras och analyseras" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vi identifierar återkommande problem" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Styrelsen granskar klagomålsstatistik kvartalsvis" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vi implementerar systematiska förbättringar" />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Denna klagomålsprocess uppdaterades senast: {new Date().toLocaleDateString('sv-SE')}
            <br />
            Vi följer god förvaltningssed och strävar efter öppenhet, rättssäkerhet och effektivitet i vår klagomålshantering.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Complaints; 