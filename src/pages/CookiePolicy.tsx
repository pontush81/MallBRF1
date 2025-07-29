import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  Button,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

const CookiePolicy: React.FC = () => {
  const handleCookieSettings = () => {
    // Trigger cookie banner to show
    localStorage.removeItem('gdpr-consent');
    localStorage.removeItem('gdpr-consent-date');
    window.location.reload();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Cookiepolicy
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Version: 2.0 | BRF Gulmåran (Org.nr: 769639-5420)
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Hantera dina cookie-inställningar</AlertTitle>
          Du kan när som helst ändra dina cookie-inställningar genom att klicka på knappen nedan.
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleCookieSettings}
              size="small"
            >
              Ändra cookie-inställningar
            </Button>
          </Box>
        </Alert>

        {/* Section 1 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            1. Vad är cookies?
          </Typography>
          <Typography variant="body1" paragraph>
            Cookies är små textfiler som lagras på din dator, telefon eller surfplatta när du besöker 
            en webbplats. De hjälper webbplatsen att komma ihåg information om ditt besök, 
            som dina inställningar och preferenser.
          </Typography>
          <Typography variant="body1" paragraph>
            Cookies kan inte skada din dator och innehåller ingen personlig information som 
            kan användas för att identifiera dig direkt.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 2 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            2. Varför använder vi cookies?
          </Typography>
          <Typography variant="body1" paragraph>
            Vi använder cookies för att:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Säkerställa att webbplatsen fungerar korrekt" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Hålla dig inloggad när du navigerar mellan sidor" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Komma ihåg dina inställningar och preferenser" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Förbättra säkerheten på webbplatsen" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Förstå hur webbplatsen används (endast med ditt samtycke)" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 3 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            3. Vilka cookies använder vi?
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            Vi använder olika typer av cookies beroende på deras funktion:
          </Typography>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Rättslig grund enligt ePrivacy-direktivet</AlertTitle>
            <Typography variant="body2">
              <strong>Nödvändiga cookies:</strong> Berättigat intresse (LEK 6:18c) - krävs för tjänsten<br/>
              <strong>Funktionella cookies:</strong> Samtycke (LEK 6:18a) - används endast med ditt godkännande<br/>
              <strong>Analysckies:</strong> Samtycke (LEK 6:18a) - används för närvarande inte
            </Typography>
          </Alert>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Cookie-namn</strong></TableCell>
                  <TableCell><strong>Leverantör</strong></TableCell>
                  <TableCell><strong>Syfte</strong></TableCell>
                  <TableCell><strong>Typ</strong></TableCell>
                  <TableCell><strong>Lagringstid</strong></TableCell>
                  <TableCell><strong>Samtycke</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>gdpr-consent</TableCell>
                  <TableCell>BRF Gulmåran (1:a part)</TableCell>
                  <TableCell>Sparar dina cookie-preferenser</TableCell>
                  <TableCell>Nödvändig</TableCell>
                  <TableCell>1 år</TableCell>
                  <TableCell>Nej</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>sb-*-auth-token</TableCell>
                  <TableCell>Supabase (1:a part)</TableCell>
                  <TableCell>Autentisering och session</TableCell>
                  <TableCell>Nödvändig</TableCell>
                  <TableCell>1 år</TableCell>
                  <TableCell>Nej</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>__session</TableCell>
                  <TableCell>Firebase (Google)</TableCell>
                  <TableCell>Säker autentisering via Google</TableCell>
                  <TableCell>Autentisering</TableCell>
                  <TableCell>Session</TableCell>
                  <TableCell>Ja</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>_gid, _ga</TableCell>
                  <TableCell>Google Analytics</TableCell>
                  <TableCell>Webbplatsanalys (används ej för närvarande)</TableCell>
                  <TableCell>Analys</TableCell>
                  <TableCell>2 år</TableCell>
                  <TableCell>Ja</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>theme-preference</TableCell>
                  <TableCell>BRF Gulmåran (1:a part)</TableCell>
                  <TableCell>Sparar dina tema-inställningar</TableCell>
                  <TableCell>Funktionell</TableCell>
                  <TableCell>6 månader</TableCell>
                  <TableCell>Ja</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Samtycke-loggning</AlertTitle>
            <Typography variant="body2">
              Vi loggar dina cookie-val (datum, tid, version, inställningar) för juridisk efterlevnad. 
              Dessa loggar sparas i 5 år enligt svenska myndighetskrav och raderas sedan automatiskt.
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 4 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            4. Tredjepartscookies
          </Typography>
          <Typography variant="body1" paragraph>
            Vi använder vissa tjänster från tredjeparter som kan sätta egna cookies. 
            Dessa tredjeparter behandlar dina personuppgifter enligt sina egna integritetspolicyer:
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Viktigt om tredjepartscookies</AlertTitle>
            <Typography variant="body2">
              När du accepterar tredjepartscookies delas vissa uppgifter med externa leverantörer. 
              Du kan alltid neka dessa genom att välja "Endast nödvändiga cookies" i vår banner.
            </Typography>
          </Alert>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tjänst</strong></TableCell>
                  <TableCell><strong>Leverantör</strong></TableCell>
                  <TableCell><strong>Data som delas</strong></TableCell>
                  <TableCell><strong>Syfte</strong></TableCell>
                  <TableCell><strong>Integritetspolicy</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Firebase Authentication</TableCell>
                  <TableCell>Google LLC (USA)</TableCell>
                  <TableCell>E-post, namn, autentiseringstoken</TableCell>
                  <TableCell>Säker inloggning och session</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" component="a" href="https://policies.google.com/privacy" target="_blank">
                      policies.google.com/privacy ↗
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Google OAuth</TableCell>
                  <TableCell>Google LLC (USA)</TableCell>
                  <TableCell>Google-profil (namn, e-post, profilbild)</TableCell>
                  <TableCell>Social inloggning med Google-konto</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" component="a" href="https://policies.google.com/privacy" target="_blank">
                      policies.google.com/privacy ↗
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Supabase</TableCell>
                  <TableCell>Supabase Inc. (EU)</TableCell>
                  <TableCell>Sessionsdata, användar-ID</TableCell>
                  <TableCell>Databas och backend-tjänster</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" component="a" href="https://supabase.com/privacy" target="_blank">
                      supabase.com/privacy ↗
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vercel Analytics</TableCell>
                  <TableCell>Vercel Inc. (USA)</TableCell>
                  <TableCell>IP-adress (anonymiserad), sidvisningar</TableCell>
                  <TableCell>Webbplatsprestatamätning</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" component="a" href="https://vercel.com/legal/privacy-policy" target="_blank">
                      vercel.com/legal/privacy-policy ↗
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>Dataöverföringar till tredje land</AlertTitle>
            <Typography variant="body2">
              Google och Vercel kan överföra data till USA. Dessa överföringar skyddas av:
              <br/>• <strong>Google:</strong> EU:s Data Privacy Framework (DPF) + standardavtalsklausuler
              <br/>• <strong>Vercel:</strong> Standardavtalsklausuler (SCCs)
              <br/>• <strong>Supabase:</strong> All data förblir inom EU/EEA
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 5 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            5. Dina rättigheter och kontroll över cookies
          </Typography>
          <Typography variant="body1" paragraph>
            Enligt ePrivacy-direktivet och GDPR har du fullständig kontroll över cookies. 
            Du kan när som helst ge, neka eller återkalla ditt samtycke:
          </Typography>

          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Enkelt att ändra dina val</AlertTitle>
            <Typography variant="body2">
              <strong>Viktigt:</strong> Att återkalla samtycke är lika enkelt som att ge det. 
              Vi kommer inte att fråga varför eller hindra dig från att ändra dina inställningar.
            </Typography>
          </Alert>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            🔧 Via vår webbplats (rekommenderat):
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Cookie-banner" 
                secondary="Första gången du besöker sidan - välj exakt vilka kategorier du vill acceptera"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Ändra cookie-inställningar (ovanför)" 
                secondary="Klicka knappen ovanför för att när som helst ändra dina val"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Granulär kontroll" 
                secondary="Acceptera bara vissa kategorier - t.ex. 'Ja' till funktionalitet men 'Nej' till analys"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Återkalla samtycke" 
                secondary="Klicka 'Endast nödvändiga' för att dra tillbaka allt samtycke för icke-nödvändiga cookies"
              />
            </ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            🌐 Via din webbläsare:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Chrome/Edge: Inställningar > Integritet och säkerhet > Cookies"
                secondary="Blockera alla eller bara tredjepartscookies från specifika webbplatser"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Firefox: Inställningar > Integritet och säkerhet"
                secondary="Välj 'Anpassad' för granulär cookie-kontroll"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Safari: Inställningar > Integritet"
                secondary="Blockera alla cookies eller bara från tredjeparter"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Radera befintliga cookies"
                secondary="Alla webbläsare: Rensa surfdata > Cookies och webbplatsdata"
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 3 }}>
            <AlertTitle>Konsekvenser av att blockera cookies</AlertTitle>
            <Typography variant="body2">
              <strong>Nödvändiga cookies blockerade:</strong> Inloggning, bokningar och säkerhetsfunktioner slutar fungera<br/>
              <strong>Funktionella cookies blockerade:</strong> Dina inställningar (tema, språk) sparas inte<br/>
              <strong>Analyskookies blockerade:</strong> Ingen påverkan på funktionalitet - vi får bara mindre statistik
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 6 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            6. Uppdateringar av denna policy
          </Typography>
          <Typography variant="body1" paragraph>
            Vi kan uppdatera denna cookiepolicy när vi lägger till nya funktioner 
            eller ändrar hur vi använder cookies. Väsentliga ändringar kommer att:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Meddelas via e-post till registrerade användare" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Visas som meddelanden på webbplatsen" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Kräva nytt samtycke för nya cookie-kategorier" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 7 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            7. Kontakt och klagomål
          </Typography>
          <Typography variant="body1" paragraph>
            För frågor om vår användning av cookies eller för att utöva dina rättigheter:
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
            <Typography variant="body1">
              <strong>Personuppgiftsansvarig:</strong> Bostadsrättsförening Gulmåran<br />
              <strong>Organisationsnummer:</strong> 769639-5420<br />
              <strong>Kontaktperson:</strong> BRF Gulmåran<br />
              <strong>E-post:</strong> gulmaranbrf@gmail.com<br />
              <strong>Ämnesrad:</strong> "Cookiepolicy" eller "Cookie-rättigheter"<br />
              <strong>Svarstid:</strong> Vi strävar efter att svara inom 72 timmar
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Klagomål till tillsynsmyndighet</AlertTitle>
            <Typography variant="body2">
              Om du anser att vi behandlar cookies eller personuppgifter felaktigt kan du lämna klagomål till:
              <br/><strong>Integritetsskyddsmyndigheten (IMY)</strong>
              <br/>🌐 Webbplats: <Typography component="a" href="https://www.imy.se" target="_blank" color="primary">www.imy.se ↗</Typography>
              <br/>✉️ E-post: imy@imy.se
              <br/>📞 Telefon: 08-657 61 00
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary">
            <strong>EU-medborgare:</strong> Du kan också använda EU:s ODR-plattform för tvistlösning online: 
            <Typography component="a" href="https://ec.europa.eu/consumers/odr" target="_blank" color="primary"> ec.europa.eu/consumers/odr ↗</Typography>
          </Typography>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Juridisk grund och efterlevnad
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Rättslig grund:</strong> EU:s ePrivacy-direktiv (2002/58/EG), implementerad i Sverige som LEK (Lag om elektronisk kommunikation) 6:18<br/>
            <strong>Dataskydd:</strong> EU:s dataskyddsförordning (GDPR) och svensk dataskyddslagstiftning<br/>
            <strong>Tillsynsmyndighet:</strong> Integritetsskyddsmyndigheten (IMY)<br/>
            <strong>Uppdateringsfrekvens:</strong> Granskas minst årligen eller vid tekniska ändringar
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Version:</strong> 2.0<br/>
            <strong>Giltig från:</strong> {new Date().toLocaleDateString('sv-SE')}<br/>
            <strong>Senast granskad:</strong> {new Date().toLocaleDateString('sv-SE')}<br/>
            <strong>Nästa granskning:</strong> {new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('sv-SE')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            <strong>Relaterade dokument:</strong> Integritetspolicy (/privacy-policy), Användarvillkor (/terms-of-service), GDPR-formulär (/data-deletion)
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CookiePolicy; 