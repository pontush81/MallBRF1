import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';

const PrivacyPolicy: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Integritetspolicy
          </Typography>
          
          <Typography variant="subtitle1" paragraph align="center" sx={{ mb: 4 }}>
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </Typography>
          
          <Typography variant="body1" paragraph>
            Denna integritetspolicy beskriver hur MallBRF samlar in, använder och delar personuppgifter när du använder vår tjänst.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Information vi samlar in
          </Typography>
          
          <Typography variant="body1" paragraph>
            När du registrerar dig för och använder MallBRF kan vi samla in följande typer av information:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Personuppgifter som namn, e-postadress och kontaktinformation</li>
            <li>Lägenhetsnummer och boendeuppgifter för administration av bostadsrättsföreningen</li>
            <li>Information om bokningar och användning av gemensamma utrymmen</li>
            <li>Kommunikation mellan dig och föreningen</li>
            <li>Inloggningsuppgifter och aktivitet i tjänsten</li>
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Hur vi använder informationen
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vi använder den insamlade informationen för att:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Tillhandahålla, underhålla och förbättra vår tjänst</li>
            <li>Hantera medlemskap i bostadsrättsföreningen</li>
            <li>Administrera bokningar av gemensamma utrymmen</li>
            <li>Kommunicera viktig information om föreningen</li>
            <li>Skicka meddelanden om underhåll, evenemang och andra föreningsaktiviteter</li>
            <li>Förhindra bedrägerier och öka säkerheten för vår tjänst</li>
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Delning av information
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vi delar inte dina personuppgifter med utomstående parter förutom i följande fall:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Med tjänsteleverantörer som hjälper oss att driva vår tjänst (t.ex. hosting, molntjänster)</li>
            <li>Med styrelsemedlemmar som behöver informationen för föreningens administration</li>
            <li>Om det krävs enligt lag eller för att skydda våra rättigheter</li>
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Datalagring
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vi lagrar dina personuppgifter så länge som du är medlem i föreningen eller använder vår tjänst, samt under en rimlig period därefter för administrativa ändamål och för att uppfylla lagkrav.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Dina rättigheter
          </Typography>
          
          <Typography variant="body1" paragraph>
            Du har rätt att:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Få åtkomst till dina personuppgifter</li>
            <li>Korrigera felaktig information</li>
            <li>Begära radering av dina uppgifter (med förbehåll för lagkrav)</li>
            <li>Motsätta dig vissa typer av behandling</li>
            <li>Dra tillbaka ditt samtycke när som helst</li>
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Säkerhet
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vi prioriterar säkerheten för dina personuppgifter och använder lämpliga tekniska och organisatoriska åtgärder för att skydda dem mot obehörig åtkomst, förlust eller ändring.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Användning av inloggningstjänster
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vår tjänst erbjuder möjligheten att logga in med inloggningstjänster från tredje part, såsom Google och Facebook. När du väljer att använda dessa tjänster kan vi få tillgång till viss information från ditt konto hos dessa tjänsteleverantörer, såsom ditt namn och e-postadress. Denna information används endast för att skapa och hantera ditt konto i vår tjänst.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Ändringar i policyn
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vi kan uppdatera denna integritetspolicy från tid till annan. Vi meddelar dig om väsentliga ändringar genom att publicera den nya policyn på denna sida och informera dig via e-post eller genom ett meddelande i vår tjänst.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Kontakta oss
          </Typography>
          
          <Typography variant="body1" paragraph>
            Om du har frågor eller funderingar kring denna integritetspolicy eller vår hantering av dina personuppgifter, vänligen kontakta oss på:
          </Typography>
          
          <Typography variant="body1" paragraph>
            E-post: pontus.hberg@gmail.com
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default PrivacyPolicy; 