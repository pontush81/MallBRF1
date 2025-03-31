import React from 'react';
import { Container, Typography, Box, Paper, Divider, Button } from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';

const DataDeletion: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Begäran om radering av användardata
          </Typography>
          
          <Typography variant="subtitle1" paragraph align="center" sx={{ mb: 4 }}>
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </Typography>
          
          <Typography variant="body1" paragraph>
            I enlighet med gällande dataskyddslagstiftning respekterar vi din rätt att begära radering av dina personuppgifter från vår tjänst. Denna sida förklarar hur du kan begära radering av dina uppgifter.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Hur du begär radering
          </Typography>
          
          <Typography variant="body1" paragraph>
            För att begära radering av dina personuppgifter från MallBRF, kan du använda någon av följande metoder:
          </Typography>
          
          <Typography variant="body1" component="ol" sx={{ pl: 4, mb: 3 }}>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Via e-post:</strong> Skicka en begäran om radering till pontus.hberg@gmail.com med ämnesraden "Begäran om radering av data".
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Via kontaktformuläret:</strong> Använd kontaktformuläret på vår webbplats och välj "Begäran om radering" som ärende.
              </Typography>
            </li>
            <li>
              <Typography variant="body1" paragraph>
                <strong>Direkt i appen:</strong> I dina kontoinställningar finns en funktion för att begära radering av ditt konto och tillhörande data.
              </Typography>
            </li>
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<EmailIcon />}
              href="mailto:pontus.hberg@gmail.com?subject=Begäran%20om%20radering%20av%20data"
              sx={{ px: 3, py: 1 }}
            >
              Skicka begäran via e-post
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Information att inkludera
          </Typography>
          
          <Typography variant="body1" paragraph>
            För att hjälpa oss att behandla din begäran effektivt, vänligen inkludera följande information:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>Ditt fullständiga namn</li>
            <li>E-postadressen kopplad till ditt konto</li>
            <li>Lägenhetsnummer (om tillämpligt)</li>
            <li>Eventuell annan information som kan hjälpa oss att identifiera ditt konto</li>
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Vad händer efter din begäran
          </Typography>
          
          <Typography variant="body1" paragraph>
            När vi mottagit din begäran om radering:
          </Typography>
          
          <Typography variant="body1" component="ol" sx={{ pl: 4 }}>
            <li>Vi bekräftar mottagandet av din begäran inom 7 arbetsdagar.</li>
            <li>Vi kan be om ytterligare information för att verifiera din identitet.</li>
            <li>Vi bearbetar din begäran inom 30 dagar från mottagandet av all nödvändig information.</li>
            <li>Vi meddelar dig när raderingen är slutförd.</li>
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Begränsningar
          </Typography>
          
          <Typography variant="body1" paragraph>
            I vissa fall kan vi behöva behålla viss information av följande skäl:
          </Typography>
          
          <Typography variant="body1" component="ul" sx={{ pl: 4 }}>
            <li>För att uppfylla lagkrav</li>
            <li>För att genomföra pågående transaktioner</li>
            <li>För att skydda våra rättigheter och säkerhet</li>
            <li>För att uppfylla bostadsrättsföreningens administrativa krav</li>
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            I sådana fall kommer vi att informera dig om vilken information vi behåller och varför.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h5" component="h2" gutterBottom>
            Kontakta oss
          </Typography>
          
          <Typography variant="body1" paragraph>
            Om du har frågor om processen för dataradering eller behöver hjälp med din begäran, kontakta oss på:
          </Typography>
          
          <Typography variant="body1" paragraph>
            E-post: pontus.hberg@gmail.com
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default DataDeletion; 