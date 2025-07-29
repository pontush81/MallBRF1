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
  CardContent
} from '@mui/material';
import {
  Accessible as AccessibleIcon,
  Hearing as HearingIcon,
  Visibility as VisionIcon,
  TouchApp as TouchIcon
} from '@mui/icons-material';

const Accessibility: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Tillgänglighetsredogörelse
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Vårt åtagande</AlertTitle>
          BRF Gulmåran strävar efter att göra vår webbplats tillgänglig för alla användare, 
          oavsett funktionsnedsättning eller teknik som används.
        </Alert>

        {/* Section 1 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            1. Tillgänglighetsstatus
          </Typography>
          <Typography variant="body1" paragraph>
            Denna webbplats är delvis förenlig med <strong>Web Content Accessibility Guidelines (WCAG) 2.1</strong> 
            på nivå AA. Vi arbetar kontinuerligt för att förbättra tillgängligheten.
          </Typography>
          <Typography variant="body1" paragraph>
            Webbplatsen testades senast för tillgänglighet: {new Date().toLocaleDateString('sv-SE')}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 2 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            2. Tillgänglighetsfunktioner
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            Vi har implementerat följande funktioner för att förbättra tillgängligheten:
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <VisionIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Syn och läsning</Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Hög kontrast mellan text och bakgrund" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Responsiv design som fungerar på alla skärmstorlekar" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Alternativ text för bilder och ikoner" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tydlig visuell hierarki med rubriker" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TouchIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Navigation och interaktion</Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Fullt tangentbordsnavigation" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Stora klickbara områden för knappar" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tydliga fokusindikatorer" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Logisk navigationsordning" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 3 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            3. Kända tillgänglighetsproblem
          </Typography>
          <Typography variant="body1" paragraph>
            Vi är medvetna om följande tillgänglighetsproblem och arbetar på att lösa dem:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Vissa komplexa formulär" 
                secondary="Vissa avancerade formulär kan vara svåra att navigera med skärmläsare"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="PDF-dokument" 
                secondary="Vissa äldre PDF-dokument kanske inte är fullt tillgängliga"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Färgkodning" 
                secondary="Vissa funktioner kan bero på färg som enda indikator"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 4 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            4. Hjälpmedel och verktyg
          </Typography>
          <Typography variant="body1" paragraph>
            Webbplatsen är testad och fungerar med följande hjälpmedel:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Skärmläsare (NVDA, JAWS, VoiceOver)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Tangentbordsnavigation" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Förstoringsprogram" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Talsyntes" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Höga kontrast-lägen" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 5 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            5. Webbläsarstöd
          </Typography>
          <Typography variant="body1" paragraph>
            Webbplatsen stöder och har testats med:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Chrome (senaste 2 versioner)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Firefox (senaste 2 versioner)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Safari (senaste 2 versioner)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Microsoft Edge (senaste 2 versioner)" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 6 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            6. Alternativa sätt att få information
          </Typography>
          <Typography variant="body1" paragraph>
            Om du inte kan komma åt information på webbplatsen, kan du kontakta oss för:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Information i alternativa format (text, ljud, utskrift)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Hjälp med att använda webbplatsen" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Bokningar via telefon eller e-post" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Dokument i tillgängliga format" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 7 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            7. Rapportera tillgänglighetsproblem
          </Typography>
          <Typography variant="body1" paragraph>
            Om du stöter på tillgänglighetsproblem på vår webbplats, vänligen kontakta oss:
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Kontakt för tillgänglighetsfrågor:</strong><br />
                             E-post: gulmaranbrf@gmail.com<br />
               Ämnesrad: "Tillgänglighet"<br />
               Allmän e-post: gulmaranbrf@gmail.com
            </Typography>
          </Alert>

          <Typography variant="body1" paragraph>
            När du rapporterar ett problem, inkludera gärna:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Vilken sida eller funktion som är problematisk" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vilken typ av hjälpmedel du använder" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vilken webbläsare och version du använder" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Beskrivning av problemet" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 8 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            8. Tillsynsmyndighet
          </Typography>
          <Typography variant="body1" paragraph>
            Om du inte är nöjd med hur vi hanterar ditt tillgänglighetsproblem, 
            kan du kontakta Myndigheten för digital förvaltning (DIGG):
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Myndigheten för digital förvaltning (DIGG)</strong><br />
            Webbplats: www.digg.se<br />
            E-post: webbtillganglighet@digg.se<br />
            Telefon: 010-472 90 00
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 9 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            9. Teknisk information
          </Typography>
          <Typography variant="body1" paragraph>
            Webbplatsens tillgänglighet bygger på följande tekniker:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="HTML5 semantik för korrekt struktur" />
            </ListItem>
            <ListItem>
              <ListItemText primary="ARIA-etiketter för komplex interaktion" />
            </ListItem>
            <ListItem>
              <ListItemText primary="CSS för visuell presentation" />
            </ListItem>
            <ListItem>
              <ListItemText primary="JavaScript för förbättrad funktionalitet" />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Denna tillgänglighetsredogörelse uppdaterades senast: {new Date().toLocaleDateString('sv-SE')}
            <br />
            Vi utvärderar kontinuerligt tillgängligheten och förbättrar webbplatsen baserat på användarfeedback.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Accessibility; 