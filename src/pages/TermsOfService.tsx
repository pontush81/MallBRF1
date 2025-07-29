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
  AlertTitle
} from '@mui/material';

const TermsOfService: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Användarvillkor
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Viktigt att veta</AlertTitle>
          Genom att använda denna webbplats accepterar du dessa användarvillkor. 
          Läs igenom dem noggrant innan du använder våra tjänster.
        </Alert>

        {/* Section 1 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            1. Allmänna villkor och tjänsteleverantör
          </Typography>
          <Typography variant="body1" paragraph>
            Dessa användarvillkor ("Villkoren") reglerar din användning av BRF Gulmårans webbplats 
            och digitala tjänster. Genom att använda webbplatsen accepterar du att följa dessa villkor.
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Tjänsteleverantör:
            </Typography>
            <Typography variant="body2">
              <strong>Bostadsrättsförening Gulmåran</strong><br/>
              Organisationsnummer: 769639-5420<br/>
              Adress: Köpmansgatan 80, 269 31 Båstad<br/>
              E-post: gulmaranbrf@gmail.com<br/>
              Kontaktperson: BRF Gulmåran (gulmaranbrf@gmail.com)
            </Typography>
          </Box>

          <Typography variant="body1" paragraph>
            <strong>Ändringar av villkor:</strong> Vi förbehåller oss rätten att ändra dessa villkor. 
            Väsentliga ändringar meddelas minst 30 dagar i förväg via e-post till registrerade användare. 
            Om du inte accepterar ändringarna har du rätt att avsluta ditt konto innan de träder i kraft.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 2 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            2. Behörighet och medlemskap
          </Typography>
          <Typography variant="body1" paragraph>
            Denna webbplats är primärt avsedd för medlemmar i BRF Gulmåran. 
            För att få full åtkomst till våra tjänster måste du:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Vara medlem i BRF Gulmåran eller ha behörighet från styrelsen" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Skapa ett användarkonto med korrekta uppgifter" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Vara minst 18 år gammal" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Acceptera våra användarvillkor och integritetspolicy" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 3 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            3. Användning av tjänster
          </Typography>
          <Typography variant="body1" paragraph>
            Du får använda våra digitala tjänster för:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Bokning av gemensamma utrymmen (gästlägenhet, tvättstuga)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Tillgång till föreningsinformation och dokument" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Kommunikation med styrelse och andra medlemmar" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Hantering av dina personuppgifter enligt GDPR" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 4 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            4. Förbjuden användning
          </Typography>
          <Typography variant="body1" paragraph>
            Du får INTE använda webbplatsen för:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Olagliga aktiviteter eller brott mot svenska lagar" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Spridning av skadligt innehåll, virus eller malware" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Försök att komma åt andra användares konton eller data" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Missbruk av bokningssystemet eller andra tjänster" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Kommersiella aktiviteter utan styrelens godkännande" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 5 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            5. Bokningsregler
          </Typography>
          <Typography variant="body1" paragraph>
            Särskilda regler gäller för bokningar:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Endast medlemmar får boka gemensamma utrymmen" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Bokningar görs i egen ordning och kan inte överlåtas" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Avbokning måste göras enligt fastställda regler" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Avgifter för bokningar regleras av föreningens beslut" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Överträdelse av bokningsregler kan leda till begränsningar" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 6 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            6. Ansvar och garantier
          </Typography>
          <Typography variant="body1" paragraph>
            BRF Gulmåran strävar efter att erbjuda pålitliga digitala tjänster. Vårt ansvar regleras enligt svensk lag:
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Viktigt om ansvar</AlertTitle>
            Vi ansvarar alltid fullt ut för skada som orsakats av vårt uppsåt eller vår grava vårdslöshet. 
            Denna ansvarsbegränsning gäller endast i den utsträckning svensk lag tillåter.
          </Alert>

          <List>
            <ListItem>
              <ListItemText 
                primary="Drifttid och tillgänglighet" 
                secondary="Vi strävar efter hög tillgänglighet men garanterar inte 100% drifttid på grund av underhåll, uppdateringar och tekniska problem"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Dataförlust" 
                secondary="Vi tar regelbundna säkerhetskopior men rekommenderar att du sparar viktig information lokalt"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Tredje parts tjänster" 
                secondary="Vi ansvarar inte för avbrott eller problem hos våra underleverantörer (Google, Supabase, Vercel)"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Användargenererat innehåll" 
                secondary="Du ansvarar för allt innehåll du laddar upp eller delar via tjänsten"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 6b: Force Majeure */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            6b. Force Majeure (Oförutsedda händelser)
          </Typography>
          <Typography variant="body1" paragraph>
            Vi ansvarar inte för dröjsmål eller misslyckanden i prestanda som orsakas av omständigheter 
            utanför vår rimliga kontroll, inklusive men inte begränsat till:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Naturkatastrofer, krig, terrorism eller pandemier" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Strömavbrott, internetavbrott eller telekommunikationsproblem" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Cyberattacker, hackning eller andra säkerhetsincidenter" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Myndighetsbeslut, lagändringar eller andra officiella åtgärder" />
            </ListItem>
          </List>
          <Typography variant="body1" paragraph>
            I sådana fall kommer vi att informera användarna så snart som möjligt och arbeta för att 
            återställa normal service.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 7 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            7. Personuppgifter och integritet
          </Typography>
          <Typography variant="body1" paragraph>
            Hantering av dina personuppgifter regleras av vår{' '}
            <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
              integritetspolicy
            </Typography>{' '}
            som du hittar på{' '}
            <Typography component="span" color="primary" sx={{ fontWeight: 'bold' }}>
              /privacy-policy
            </Typography>. 
            Vi följer EU:s dataskyddsförordning (GDPR) och svensk dataskyddslagstiftning.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Dina GDPR-rättigheter</AlertTitle>
            Du har rätt att få åtkomst till, rätta, radera, begränsa eller överföra dina personuppgifter. 
            Använd vårt GDPR-formulär på /data-deletion eller kontakta gulmaranbrf@gmail.com.
          </Alert>

          <Typography variant="body1" paragraph>
            <strong>Cookie-användning:</strong> Vi använder cookies enligt vår cookiepolicy (/cookie-policy). 
            Du kan när som helst ändra dina cookie-inställningar via banderollen på webbplatsen.
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Databehandlingsansvarig:</strong> Bostadsrättsförening Gulmåran är ansvarig för 
            behandlingen av dina personuppgifter. Vid frågor eller klagomål kan du även kontakta 
            Integritetsskyddsmyndigheten (IMY): imy@imy.se eller 08-657 61 00.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 8 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            8. Uppsägning och avstängning
          </Typography>
          <Typography variant="body1" paragraph>
            Ditt konto kan stängas av eller raderas om:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Du inte längre är medlem i BRF Gulmåran" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Du bryter mot dessa användarvillkor" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Du begär radering enligt GDPR" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Du är inaktiv under en längre period (över 2 år)" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 9 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            9. Tillämplig lag och tvistlösning
          </Typography>
          <Typography variant="body1" paragraph>
            Dessa användarvillkor styrs av svensk lag. Eventuella tvister ska lösas enligt följande ordning:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary="1. Direktkontakt" 
                secondary="Kontakta oss först på gulmaranbrf@gmail.com för att lösa tvisten i godo"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. Allmänna reklamationsnämnden (ARN)" 
                secondary="För konsumenttvister kan du vända dig till ARN (www.arn.se) för kostnadsfri tviståsning"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="3. EU:s plattform för tvistlösning online" 
                secondary="EU-medborgare kan använda ODR-plattformen: ec.europa.eu/consumers/odr"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="4. Svensk domstol" 
                secondary="Om ingen annan lösning fungerar avgörs tvisten av svensk domstol med svensk lag"
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Information för medlemmar</AlertTitle>
            Som medlem i BRF Gulmåran kan du också ta upp frågor på föreningens årsstämma eller 
            kontakta styrelsen direkt enligt föreningens stadgar.
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 10: Accessibility */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            10. Tillgänglighet och användbarhet
          </Typography>
          <Typography variant="body1" paragraph>
            Vi strävar efter att göra våra digitala tjänster tillgängliga för alla medlemmar:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Webbstandarder" 
                secondary="Webbplatsen följer WCAG 2.1 riktlinjer för tillgänglighet"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Mobilvänlighet" 
                secondary="Alla funktioner fungerar på mobila enheter och surfplattor"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Teknisk support" 
                secondary="Kontakta oss om du har svårigheter att använda tjänsterna"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Section 11 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            11. Kontakt och support
          </Typography>
          <Typography variant="body1" paragraph>
            För frågor om dessa användarvillkor eller våra tjänster:
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
            <Typography variant="body1">
              <strong>BRF Gulmåran</strong><br />
              E-post: gulmaranbrf@gmail.com<br />
              Ämnesrad: "Användarvillkor" eller "Teknisk support"<br />
              Svarstid: Vi strävar efter att svara inom 3 arbetsdagar
            </Typography>
          </Box>

          <Alert severity="success" sx={{ mt: 2 }}>
            <AlertTitle>Snabb hjälp</AlertTitle>
            För akuta tekniska problem eller bokningsfrågor, kontakta styrelsen direkt eller 
            använd kontaktformuläret på webbplatsen.
          </Alert>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Versionsinformation
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Version:</strong> 2.0<br/>
            <strong>Giltig från:</strong> {new Date().toLocaleDateString('sv-SE')}<br/>
            <strong>Språk:</strong> Svenska<br/>
            <strong>Senast granskad:</strong> {new Date().toLocaleDateString('sv-SE')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Viktig information:</strong> Vi rekommenderar att du sparar eller skriver ut en kopia 
            av dessa villkor för dina egna register. Villkoren finns alltid tillgängliga på webbplatsen.
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            <strong>Relaterade dokument:</strong> Integritetspolicy (/privacy-policy), 
            Cookiepolicy (/cookie-policy), GDPR-formulär (/data-deletion)
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfService; 