import React from 'react';
import { 
  Container, Typography, Box, Paper, Alert, AlertTitle, 
  List, ListItem, ListItemIcon, ListItemText, Button 
} from '@mui/material';
import { Link } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import StorageIcon from '@mui/icons-material/Storage';
import DeleteIcon from '@mui/icons-material/Delete';
import GavelIcon from '@mui/icons-material/Gavel';

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
          <AlertTitle>Kort sammanfattning</AlertTitle>
          Vi samlar endast in den information som behövs för bokningar och medlemshantering. 
          Du har full kontroll över dina uppgifter.
        </Alert>

        {/* Section 1: Vem ansvarar */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Vem ansvarar för dina uppgifter?
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Personuppgiftsansvarig:</strong> BRF Gulmåran (org.nr 769639-5420)<br />
            <strong>Ordförande:</strong> Anders Lindqvist<br />
            <strong>Webbansvarig:</strong> Pontus Hörberg, pontus.hberg@gmail.com
          </Typography>
        </Box>

        {/* Section 2: Vad vi samlar in */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Vad samlar vi in och varför?
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Namn och e-post" 
                secondary="För att du ska kunna logga in och boka"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><StorageIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Bokningshistorik" 
                secondary="För att hantera bokningar av gästlägenhet"
              />
            </ListItem>
          </List>
        </Box>

        {/* Section 3: Hur länge */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Hur länge sparar vi uppgifterna?
          </Typography>
          <Typography variant="body1">
            Medlemsuppgifter sparas så länge du är medlem. Bokningshistorik sparas i 3 år för ekonomisk redovisning.
          </Typography>
        </Box>

        {/* Section 4: Dina rättigheter */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Dina rättigheter
          </Typography>
          <Typography variant="body1" paragraph>
            Du har rätt att:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Få veta vilka uppgifter vi har om dig" />
            </ListItem>
            <ListItem>
              <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Rätta felaktiga uppgifter" />
            </ListItem>
            <ListItem>
              <ListItemIcon><DeleteIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Begära radering av dina uppgifter" />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Kontakta <strong>pontus.hberg@gmail.com</strong> för att utöva dina rättigheter.
          </Typography>
        </Box>

        {/* Section 5: Klagomål */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Klagomål
          </Typography>
          <Typography variant="body1">
            Om du är missnöjd med hur vi hanterar dina uppgifter kan du kontakta 
            Integritetsskyddsmyndigheten (IMY) på <strong>www.imy.se</strong>.
          </Typography>
        </Box>

        {/* Call to action */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mt: 4, 
            bgcolor: 'grey.100',
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom color="primary">
            Vill du radera dina uppgifter?
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link}
            to="/data-deletion"
            startIcon={<GavelIcon />}
          >
            GDPR-förfrågan
          </Button>
        </Paper>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
