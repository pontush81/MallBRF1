import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Description as DocumentIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import ChatInterface from '../../components/gulmaran-gpt/ChatInterface';
import DocumentUpload from '../../components/gulmaran-gpt/DocumentUpload';
import DocumentList from '../../components/gulmaran-gpt/DocumentList';
import { useAuth } from '../../context/AuthContextNew';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gpt-tabpanel-${index}`}
      aria-labelledby={`gpt-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `gpt-tab-${index}`,
    'aria-controls': `gpt-tabpanel-${index}`,
  };
}

const GulmaranGPT: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    // Switch to documents tab to show the uploaded document
    setTabValue(1);
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Åtkomst nekad</AlertTitle>
          Du behöver administratörsbehörighet för att använda Gulmåran-GPT.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gulmåran-GPT
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Din AI-assistent för BRF Gulmåran. Ställ frågor om föreningens dokument och få svar baserat på protokoll, beslut och andra viktiga handlingar.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="Gulmåran-GPT tabs">
            <Tab 
              icon={<ChatIcon />} 
              label="Chatt" 
              {...a11yProps(0)} 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<DocumentIcon />} 
              label="Dokument" 
              {...a11yProps(1)} 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<InfoIcon />} 
              label="Information" 
              {...a11yProps(2)} 
              sx={{ minHeight: 64 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <ChatInterface />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Ladda upp nytt dokument
              </Typography>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </Box>
            
            <Box>
              <DocumentList refreshTrigger={refreshTrigger} />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              <AlertTitle>Om Gulmåran-GPT</AlertTitle>
              Gulmåran-GPT är en AI-assistent som hjälper dig att hitta information i BRF Gulmårans dokument. 
              Systemet använder avancerad textsökning och artificiell intelligens för att ge dig relevanta svar.
            </Alert>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Så här fungerar det
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Ladda upp dokument:</strong> Använd fliken "Dokument" för att ladda upp PDF-, TXT- eller DOCX-filer.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Automatisk bearbetning:</strong> Dokumenten analyseras och indexeras automatiskt för sökning.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Ställ frågor:</strong> Använd chattfunktionen för att ställa frågor om innehållet i dokumenten.
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2">
                    <strong>Få svar med källor:</strong> AI:n ger dig svar baserat på dokumenten och visar vilka källor som använts.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tips för bästa resultat
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Ställ specifika frågor istället för allmänna
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Använd svenska språket för bäst resultat
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Kontrollera alltid källhänvisningarna för att verifiera informationen
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2">
                    Ladda upp dokument i textformat (TXT) för bäst textextraktion
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Alert severity="warning">
              <AlertTitle>Viktigt att komma ihåg</AlertTitle>
              Gulmåran-GPT svarar endast baserat på de dokument som laddats upp. 
              Kontrollera alltid viktiga beslut och information i originaldokumenten.
            </Alert>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default GulmaranGPT;
