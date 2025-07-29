import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import GDPRRequestForm from '../components/GDPRRequestForm';

const DataDeletion: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* GDPR Request Form */}
        <GDPRRequestForm />

        {/* Information Section */}
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Utöva dina GDPR-rättigheter
          </Typography>
          
          <Typography variant="subtitle1" paragraph align="center" sx={{ mb: 2 }}>
            Version 2.0 | Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </Typography>
          
          <Typography variant="body2" paragraph align="center" sx={{ mb: 4, color: 'text.secondary' }}>
            BRF Gulmåran (Org.nr: 769639-5420) | Personuppgiftsansvarig enligt GDPR
          </Typography>
          
          <Typography variant="body1" paragraph>
            I enlighet med gällande dataskyddslagstiftning (GDPR) respekterar vi din rätt att begära åtkomst till, 
            korrigering av, eller radering av dina personuppgifter från vår tjänst. Denna sida förklarar dina rättigheter 
            och hur du kan utöva dem.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Alla dina rättigheter enligt GDPR
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mb: 3, fontStyle: 'italic' }}>
            Du har följande rättigheter när vi behandlar dina personuppgifter. Alla förfrågningar är kostnadsfria 
            och behandlas på svenska.
          </Typography>
          
          <Typography variant="body1" component="ol" sx={{ pl: 4, mb: 3 }}>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Rätt till information (Artikel 13-14):</strong> Du har rätt att få tydlig information 
                om hur vi behandlar dina personuppgifter, inklusive rättslig grund, ändamål och lagringstider.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Rätt till åtkomst (Artikel 15):</strong> Du har rätt att få bekräftelse på om vi behandlar 
                dina personuppgifter och i så fall få en fullständig kopia av all data vi har om dig.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Rätt till rättelse (Artikel 16):</strong> Du har rätt att begära rättelse av felaktiga 
                personuppgifter eller komplettering av ofullständiga uppgifter inom 72 timmar.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Rätt till radering (Artikel 17):</strong> Du har rätt att begära radering av dina 
                personuppgifter när de inte längre behövs, behandlingen är olaglig, eller du återkallar samtycke.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Rätt till begränsning (Artikel 18):</strong> Du kan begära att vi pausar behandlingen 
                av dina uppgifter under utredning av riktighet, invändning eller tills radering kan genomföras.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Rätt att invända (Artikel 21):</strong> Du har rätt att när som helst invända mot 
                behandling baserad på berättigat intresse eller för marknadsföring. Vi måste då sluta behandla 
                uppgifterna såvida vi inte har tvingande skäl.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Rätt till dataportabilitet (Artikel 20):</strong> Du har rätt att få ut dina personuppgifter 
                i strukturerat, maskinläsbart format (JSON/CSV) för överföring till annan tjänst.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Rätt att inte utsättas för automatiserat beslutsfattande (Artikel 22):</strong> Du har rätt 
                att inte bli föremål för beslut baserade enbart på automatisk behandling som får rättslig verkan. 
                <em> (Vi använder för närvarande ingen automatiserad beslutsfattning.)</em>
              </Typography>
            </li>
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Behandlingstider och process
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vi behandlar alla GDPR-förfrågningar enligt EU:s bestämmelser:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><strong>Bekräftelse:</strong> Vi bekräftar mottagandet av din begäran inom 72 timmar.</li>
            <li><strong>Identitetsverifiering:</strong> Vi kan begära ytterligare information för att säkert identifiera dig.</li>
            <li><strong>Behandlingstid:</strong> Vi svarar inom 30 dagar från mottagandet av fullständig begäran.</li>
            <li><strong>Förlängning:</strong> För komplexa eller många begäranden kan vi förlänga med ytterligare 60 dagar (totalt 90 dagar). Du informeras om detta inom den första månaden.</li>
            <li><strong>Kostnadsfritt:</strong> Alla förfrågningar behandlas utan kostnad för dig.</li>
            <li><strong>Språk:</strong> All kommunikation sker på svenska om inget annat begärs.</li>
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Tredjepartsnotifikation: Om vi rättar, raderar eller begränsar dina uppgifter kommer vi också att 
            informera alla tredjeparter som fått denna data (såsom Google/Firebase, Supabase) om inte det är 
            omöjligt eller kräver oproportionerlig ansträngning.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Begränsningar och undantag
          </Typography>
          
          <Typography variant="body1" paragraph>
            Dina GDPR-rättigheter kan begränsas i vissa fall enligt EU-rätt och svensk lag:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><strong>Rättsliga förpliktelser:</strong> Bokföringslagar, skatteregler (7 år), Bostadsrättslagen</li>
            <li><strong>Pågående åtaganden:</strong> Aktiva medlemskap, bokningar, ekonomiska transaktioner</li>
            <li><strong>Rättsskydd:</strong> Försvar av rättsanspråk, avtal eller föreningens intressen</li>
            <li><strong>Allmänt intresse:</strong> Myndighetskrav, registerdata för föreningsdrift</li>
            <li><strong>Säkerhet:</strong> Skydd mot bedrägerier, säkerställa systemintegritet</li>
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
            Vi kommer alltid att förklara specifikt vilken information vi behåller, varför, och hur länge. 
            Du har fortfarande rätt att ifrågasätta dessa beslut och kontakta IMY om du är missnöjd.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Barn och vårdnadshavare
          </Typography>
          
          <Typography variant="body1" paragraph>
            I Sverige gäller följande för barn och GDPR-rättigheter:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li><strong>Ålder för digitalt samtycke:</strong> 13 år (lägre än EU:s standard på 16 år)</li>
            <li><strong>Under 13 år:</strong> Vårdnadshavare måste utöva GDPR-rättigheter för barnet</li>
            <li><strong>13-18 år:</strong> Barnet kan själv begära rättelse, åtkomst och radering</li>
            <li><strong>Verifiering:</strong> Vi kan begära bevis på vårdnad eller ålder</li>
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Säkerhet och verifiering
          </Typography>
          
          <Typography variant="body1" paragraph>
            För att skydda din integritet kräver vi verifiering av din identitet innan vi behandlar GDPR-begäran. 
            Detta kan innebära att vi ber om ytterligare information eller dokumentation.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Kontakt och klagomål
          </Typography>
          
          <Typography variant="body1" paragraph>
            För frågor om GDPR-rättigheter eller hjälp med din begäran:
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
            <Typography variant="body1">
              <strong>Personuppgiftsansvarig:</strong> Bostadsrättsförening Gulmåran<br />
              <strong>Organisationsnummer:</strong> 769639-5420<br />
              <strong>Kontaktperson:</strong> BRF Gulmåran<br />
              <strong>E-post:</strong> gulmaranbrf@gmail.com<br />
              <strong>Ämnesrad:</strong> "GDPR-begäran" eller "Användarrättigheter"<br />
              <strong>Adress:</strong> Köpmansgatan 80, 269 31 Båstad<br />
              <strong>Svarstid:</strong> Bekräftelse inom 72 timmar, svar inom 30 dagar
            </Typography>
          </Box>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Klagomål till tillsynsmyndighet
          </Typography>
          
          <Typography variant="body1" paragraph>
            Om du anser att vi behandlar dina personuppgifter felaktigt har du rätt att lämna klagomål till 
            Sveriges tillsynsmyndighet för dataskydd:
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'error.50', borderRadius: 1, mb: 2 }}>
            <Typography variant="body1">
              <strong>Integritetsskyddsmyndigheten (IMY)</strong><br />
              🌐 Webbplats: <Typography component="a" href="https://www.imy.se" target="_blank" color="primary">www.imy.se ↗</Typography><br />
              ✉️ E-post: imy@imy.se<br />
              📞 Telefon: 08-657 61 00<br />
              📍 Adress: Box 8114, 104 20 Stockholm
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            <strong>EU-medborgare:</strong> Du kan också använda EU:s ODR-plattform för tvistlösning: 
            <Typography component="a" href="https://ec.europa.eu/consumers/odr" target="_blank" color="primary"> ec.europa.eu/consumers/odr ↗</Typography>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default DataDeletion; 