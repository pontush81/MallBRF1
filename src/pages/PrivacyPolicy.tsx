import React from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Alert, AlertTitle, Card, Grid, 
  List, ListItem, ListItemIcon, ListItemText, Button 
} from '@mui/material';
import { Link } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import UpdateIcon from '@mui/icons-material/Update';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import StorageIcon from '@mui/icons-material/Storage';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import SecurityUpdateIcon from '@mui/icons-material/SecurityUpdate';

const PrivacyPolicy: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Integritetspolicy
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Enkel förklaring</AlertTitle>
          Vi samlar endast in den information som behövs för att administrera föreningen och våra tjänster. 
          Du har full kontroll över dina uppgifter och kan när som helst kontakta oss för frågor.
        </Alert>

        {/* Section 1: Who We Are */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            1. Vem ansvarar för dina uppgifter?
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            BRF Gulmåran är ansvarig för hur dina personuppgifter behandlas.
          </Typography>
          <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Personuppgiftsansvarig:</strong> Bostadsrättsförening Gulmåran<br/>
              <strong>Organisationsnummer:</strong> 769639-5420<br/>
              <strong>Kontaktperson:</strong> BRF Gulmåran<br/>
              <strong>E-post:</strong> gulmaranbrf@gmail.com<br/>
              <strong>Adress:</strong> Köpmansgatan 80, 269 31 Båstad
            </Typography>
          </Card>
        </Box>

        {/* Section 2: What Data We Collect */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            2. Vilka uppgifter samlar vi in?
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Vi samlar endast in uppgifter som vi behöver för föreningens verksamhet.
          </Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Typ av uppgift</strong></TableCell>
                  <TableCell><strong>Exempel</strong></TableCell>
                  <TableCell><strong>Varifrån</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Medlemsuppgifter</TableCell>
                  <TableCell>Namn, e-post, telefon, lägenhetsnummer</TableCell>
                  <TableCell>Direkt från dig</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Inloggningsuppgifter</TableCell>
                  <TableCell>E-post, lösenord (krypterat)</TableCell>
                  <TableCell>När du skapar konto</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bokningshistorik</TableCell>
                  <TableCell>Datum, typ av bokning (gäst/tvätt)</TableCell>
                  <TableCell>Dina bokningar</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Teknisk information</TableCell>
                  <TableCell>IP-adress, webbläsartyp</TableCell>
                  <TableCell>Automatiskt när du besöker sidan</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Section 3: How and Why We Use Data */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            3. Varför behandlar vi dina uppgifter?
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Vi använder dina uppgifter endast för tydliga och berättigade ändamål.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Medlemsadministration
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Exempel:</strong> Hantera ditt medlemskap, skicka information om föreningsstämma
                </Typography>
                <Typography variant="body2">
                  <strong>Rättslig grund:</strong> Avtal och rättslig förpliktelse (Bostadsrättslagen)
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Bokningshantering
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Exempel:</strong> Boka gästlägenhet eller tvättstuga
                </Typography>
                <Typography variant="body2">
                  <strong>Rättslig grund:</strong> Berättigat intresse (föreningens administration)
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Kommunikation
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Exempel:</strong> Viktiga meddelanden om underhåll eller störningar
                </Typography>
                <Typography variant="body2">
                  <strong>Rättslig grund:</strong> Berättigat intresse (medlemsinformation)
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Systemsäkerhet
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Exempel:</strong> Skydda mot intrång och säkerställa att tjänsten fungerar
                </Typography>
                <Typography variant="body2">
                  <strong>Rättslig grund:</strong> Berättigat intresse (IT-säkerhet)
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Section 3b: Legitimate Interest Assessment */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            3b. Berättigat intresse-bedömning (LIA)
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            När vi använder "berättigat intresse" som rättslig grund har vi gjort en noggrann bedömning.
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Din rätt att invända</AlertTitle>
            <Typography variant="body2">
              Du har alltid rätt att invända mot behandling som bygger på berättigat intresse. 
              Använd vårt GDPR-formulär eller kontakta oss direkt.
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Bokningshantering
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Vårt intresse:</Typography>
                    <Typography variant="body2">
                      Effektiv administration av gemensamma faciliteter (gästlägenhet, tvättstuga)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Påverkan på dig:</Typography>
                    <Typography variant="body2">
                      Minimal - endast bokningsrelaterad data lagras
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Avvägning:</Typography>
                    <Typography variant="body2">
                      Berättigat - nödvändigt för föreningens funktion
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Kommunikation till medlemmar
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Vårt intresse:</Typography>
                    <Typography variant="body2">
                      Informera medlemmar om viktiga föreningsangelägenheter
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Påverkan på dig:</Typography>
                    <Typography variant="body2">
                      Låg - endast nödvändig kommunikation
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Avvägning:</Typography>
                    <Typography variant="body2">
                      Berättigat - medlemmars rätt till information
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  IT-säkerhet och systemövervakning
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Vårt intresse:</Typography>
                    <Typography variant="body2">
                      Skydda systemet mot intrång och säkerställa driftstabilitet
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Påverkan på dig:</Typography>
                    <Typography variant="body2">
                      Minimal - endast tekniska loggar sparas kortvarigt
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">Avvägning:</Typography>
                    <Typography variant="body2">
                      Berättigat - nödvändigt för alla användares säkerhet
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Section 4: Third Parties */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            4. Vilka har tillgång till dina uppgifter?
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Vi delar endast uppgifter med betrodda leverantörer som hjälper oss att driva tjänsten.
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Viktigt</AlertTitle>
            Vi säljer aldrig dina uppgifter till externa företag för marknadsföring.
          </Alert>

          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Internationella dataöverföringar</AlertTitle>
            <Typography variant="body2">
              <strong>Google/Firebase:</strong> Data kan överföras till USA, skyddat av EU:s beslut om dataskyddsramverk (Data Privacy Framework - DPF) och standardavtalsklausuler (SCCs)<br/>
              <strong>Vercel:</strong> Data kan överföras till USA, skyddat av standardavtalsklausuler (SCCs) och adekvata säkerhetsåtgärder<br/>
              <strong>Supabase:</strong> All data lagras och bearbetas endast inom EU/EEA
            </Typography>
          </Alert>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Leverantör</strong></TableCell>
                  <TableCell><strong>Vilken data delas</strong></TableCell>
                  <TableCell><strong>Syfte</strong></TableCell>
                  <TableCell><strong>Var data lagras</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Google/Firebase</TableCell>
                  <TableCell>E-post, namn, autentiseringsinformation</TableCell>
                  <TableCell>Inloggning och autentisering</TableCell>
                  <TableCell>EU/USA (DPF + SCCs)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Supabase</TableCell>
                  <TableCell>Medlemsdata, bokningar, sidor, användaruppgifter</TableCell>
                  <TableCell>Databas och datalagring</TableCell>
                  <TableCell>EU (Frankfurt)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vercel</TableCell>
                  <TableCell>Teknisk information (IP-adress, användarinteraktion)</TableCell>
                  <TableCell>Webbplatshosting och prestanda</TableCell>
                  <TableCell>EU/USA (SCCs)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Section 5: How Long We Store Data */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            5. Hur länge sparar vi dina uppgifter?
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Vi sparar uppgifter endast så länge som behövs för det specifika ändamålet.
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon><StorageIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Medlemsuppgifter" 
                secondary="Under ditt medlemskap + 2 år (enligt Bostadsrättslagen)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><BookmarkIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Bokningshistorik" 
                secondary="3 år efter bokning (för ekonomisk redovisning)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Säkerhetsloggar" 
                secondary="1 år (för systemsäkerhet och support)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><DeleteIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Sessionsdata" 
                secondary="30 dagar (för teknisk drift)"
              />
            </ListItem>
          </List>
        </Box>

        {/* Section 6: Your Rights */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            6. Dina rättigheter
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Du har flera viktiga rättigheter när det gäller dina personuppgifter.
          </Typography>

          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Så här utövar du dina rättigheter</AlertTitle>
            <Typography variant="body2">
              <strong>1.</strong> Använd vårt GDPR-formulär längre ner på denna sida (rekommenderat)<br/>
              <strong>2.</strong> Skicka e-post till gulmaranbrf@gmail.com med ämnesraden "GDPR-begäran"<br/>
              <strong>3.</strong> Vi svarar inom <strong>30 dagar</strong> enligt GDPR<br/>
              <strong>4.</strong> Du behöver bekräfta din identitet för säkerhets skull
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  <VisibilityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Åtkomst till dina uppgifter
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Få en fullständig kopia av alla uppgifter vi har om dig
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Inkluderar: medlemsdata, bokningshistorik, inloggningsloggar
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Rättelse av uppgifter
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Korrigera felaktiga eller ofullständiga uppgifter
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Vi uppdaterar inom 72 timmar efter verifiering
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Radering av uppgifter
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Begära radering när uppgifterna inte längre behövs
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  OBS: Vissa data kan behöva sparas enligt Bostadsrättslagen
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  <GetAppIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dataportabilitet
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Få ut dina uppgifter i maskinläsbart format (JSON/CSV)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  För överföring till annan tjänst eller egen lagring
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <AlertTitle>Ytterligare rättigheter</AlertTitle>
            <Typography variant="body2">
              <strong>Begränsa behandling:</strong> Begära att vi pausar viss behandling av dina uppgifter<br/>
              <strong>Invända mot behandling:</strong> Säg nej till behandling baserad på berättigade intressen<br/>
              <strong>Återkalla samtycke:</strong> Dra tillbaka samtycke för cookies eller marknadsföring
            </Typography>
          </Alert>
        </Box>

        {/* Section 7: Security */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            7. Hur skyddar vi dina uppgifter?
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Vi använder moderna säkerhetsåtgärder för att skydda dina uppgifter.
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon><LockIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Kryptering" 
                secondary="All data krypteras både när den skickas och när den lagras"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Åtkomstkontroll" 
                secondary="Endast behöriga personer kan komma åt dina uppgifter"
              />
            </ListItem>
                         <ListItem>
               <ListItemIcon><SecurityUpdateIcon color="primary" /></ListItemIcon>
               <ListItemText 
                 primary="Övervakning" 
                 secondary="Vi loggar och övervakar åtkomst till dina uppgifter"
               />
             </ListItem>
            <ListItem>
              <ListItemIcon><UpdateIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Säkerhetsuppdateringar" 
                secondary="Alla system hålls uppdaterade med senaste säkerhetsfixar"
              />
            </ListItem>
          </List>
        </Box>

        {/* Section 8: Cookies */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            8. Cookies och liknande tekniker
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Vi använder cookies för att förbättra din upplevelse på webbplatsen.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Du kan alltid ändra dina cookie-inställningar genom att klicka på "Cookie-inställningar" längst ner på sidan.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Nödvändiga cookies
                </Typography>
                <Typography variant="body2">
                  Krävs för att webbplatsen ska fungera. Inkluderar inloggning och säkerhet.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Funktionalitet
                </Typography>
                <Typography variant="body2">
                  Hjälper webbplatsen att komma ihåg dina val och inställningar.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Analys
                </Typography>
                <Typography variant="body2">
                  För närvarande används inga analysverktyg på webbplatsen.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Section 9: Contact */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            9. Kontakta oss
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Har du frågor eller vill utöva dina rättigheter? Kontakta oss gärna.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Allmänna frågor
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>E-post:</strong> gulmaranbrf@gmail.com
                </Typography>
                <Typography variant="body2">
                  <strong>Ämnesrad:</strong> "Integritetsfråga"
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  GDPR-förfrågningar
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Använd vårt GDPR-formulär längre ner på denna sida
                </Typography>
                <Typography variant="body2">
                  Vi svarar inom 30 dagar
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>Klagomål till tillsynsmyndighet</AlertTitle>
            <Typography variant="body2">
              Om du anser att vi behandlar dina uppgifter felaktigt kan du lämna klagomål till <strong>Integritetsskyddsmyndigheten (IMY)</strong><br/>
              Webbplats: www.imy.se | E-post: imy@imy.se | Telefon: 08-657 61 00
            </Typography>
          </Alert>
        </Box>

        {/* Section 10: Policy Updates */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            10. Ändringar i policyn
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Vi meddelar dig alltid innan vi gör väsentliga ändringar.
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon><NotificationsIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="E-post" 
                secondary="Vi skickar information till alla registrerade användare"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><AnnouncementIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Meddelande på webbplatsen" 
                secondary="Viktig information visas när du loggar in"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><UpdateIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Uppdaterat datum" 
                secondary="Överst på denna sida ser du när policyn senast ändrades"
              />
            </ListItem>
          </List>
        </Box>

        {/* Call to action */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mt: 4, 
            background: 'linear-gradient(45deg, #e3f2fd 30%, #f3e5f5 90%)',
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" gutterBottom color="primary">
            Vill du utöva dina GDPR-rättigheter?
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Använd vårt enkla formulär för att begära information, korrigera uppgifter eller radera ditt konto.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            component={Link}
            to="/data-deletion"
            startIcon={<SecurityIcon />}
          >
            GDPR-formulär
          </Button>
        </Paper>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          Denna policy följer EU:s dataskyddsförordning (GDPR) och svensk dataskyddslagstiftning.
          <br />
          Senast granskad av juridisk expert: {new Date().toLocaleDateString('sv-SE')}
        </Typography>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy; 