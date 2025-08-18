import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Breadcrumbs } from '../components/ui';

// Definiera ansvarstyper
type ResponsibilityType = 'Boende' | 'BRF' | 'Kommunen';

interface MaintenanceTask {
  task: string;
  responsibility: ResponsibilityType;
  comment?: string;
}

interface MaintenanceSection {
  title: string;
  icon: string;
  tasks: MaintenanceTask[];
}

interface SeasonalSection {
  title: string;
  icon: string;
  seasons: {
    summer?: MaintenanceTask[];
    winter?: MaintenanceTask[];
    yearRound?: MaintenanceTask[];
  };
}

const MaintenancePlan: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  // Få färg för ansvar
  const getResponsibilityColor = (responsibility: ResponsibilityType) => {
    switch (responsibility) {
      case 'Boende': return 'primary';
      case 'BRF': return 'secondary';
      case 'Kommunen': return 'success';
      default: return 'default';
    }
  };

  // Utomhus sektioner
  const outdoorSections: SeasonalSection[] = [
    {
      title: 'Ellagården',
      icon: '🏡',
      seasons: {
        summer: [
          { task: 'Klippa häcken', responsibility: 'Boende' },
          { task: 'Rensa stensättning', responsibility: 'Boende' },
          { task: 'Rensa rabatter', responsibility: 'Boende' },
          { task: 'Sköta blommor', responsibility: 'Boende' },
        ],
        winter: [
          { task: 'Sandning', responsibility: 'Boende' },
          { task: 'Snöröjning', responsibility: 'Boende' },
        ],
        yearRound: [
          { task: 'Sopning', responsibility: 'Boende' },
          { task: 'Kratta löv', responsibility: 'Boende', comment: 'Lövsug/blås inköpt. Förvaring i källare.' },
          { task: 'Byta lampor till fasadbelysning', responsibility: 'Boende' },
          { task: 'Städa trapporna', responsibility: 'Boende' },
        ]
      }
    },
    {
      title: 'Bilparkering + Bilväg ICA',
      icon: '🚗',
      seasons: {
        summer: [
          { task: 'Klippa häcken', responsibility: 'Kommunen' },
        ],
        winter: [
          { task: 'Sandning', responsibility: 'Boende' },
          { task: 'Snöröjning', responsibility: 'Boende', comment: '+ Inhyrd snöröjning' },
        ],
        yearRound: [
          { task: 'Sopning', responsibility: 'Boende' },
          { task: 'Rensa rabatter', responsibility: 'Boende' },
        ]
      }
    }
  ];

  // Inomhus sektioner
  const indoorSections: MaintenanceSection[] = [
    {
      title: 'Soprum',
      icon: '🗑️',
      tasks: [
        { task: 'Städning golv', responsibility: 'BRF' },
        { task: 'Städning sopkärl', responsibility: 'BRF' },
        { task: 'Smörja lås', responsibility: 'BRF' },
        { task: 'Underhålla verktyg', responsibility: 'BRF' },
      ]
    },
    {
      title: 'Lägenheter',
      icon: '🏠',
      tasks: [
        { task: 'Köpa filter ventilation', responsibility: 'BRF' },
        { task: 'Byta filter till ventilation', responsibility: 'Boende' },
        { task: 'Klippa gräs uteplats framsida', responsibility: 'Boende' },
        { task: 'Klippa gräs uteplats baksida', responsibility: 'Boende' },
      ]
    },
    {
      title: 'Korridor Plan 2',
      icon: '🚪',
      tasks: [
        { task: 'Städa golv', responsibility: 'Boende', comment: 'Varje vecka nov-jan. Varannan vecka övrig tid.' },
        { task: 'Putsa fönster', responsibility: 'Boende' },
        { task: 'Damma runt fönster, belysning och fönstersmyg', responsibility: 'Boende' },
        { task: 'Smörja lås ytterdörr', responsibility: 'BRF' },
        { task: 'Kontroll och underhåll dörrstängare', responsibility: 'BRF' },
        { task: 'Byta lampor', responsibility: 'BRF' },
        { task: 'Byta dörrmattor', responsibility: 'BRF' },
      ]
    },
    {
      title: 'Källare',
      icon: '🏠',
      tasks: [
        { task: 'Städa korridor, allmänna ytor', responsibility: 'Boende' },
        { task: 'Städa styrelserum', responsibility: 'BRF' },
        { task: 'Städa pannrum', responsibility: 'BRF' },
        { task: 'Städa gästlägenhet?', responsibility: 'BRF' },
        { task: 'Tömma soptunna', responsibility: 'BRF' },
        { task: 'Smörja lås ytterdörr', responsibility: 'BRF' },
        { task: 'Kontroll och underhåll dörrstängare', responsibility: 'BRF' },
        { task: 'Byta lampor/lysrör', responsibility: 'BRF' },
      ]
    },
    {
      title: 'Tvättstuga',
      icon: '👕',
      tasks: [
        { task: 'Städa golv', responsibility: 'Boende' },
        { task: 'Städa övriga ytor inkl. maskiner', responsibility: 'Boende' },
        { task: 'Servicekontroll maskiner', responsibility: 'BRF' },
        { task: 'Tömma soptunna', responsibility: 'BRF' },
        { task: 'Byta lampor/lysrör', responsibility: 'BRF' },
      ]
    }
  ];

  // Övriga sektioner
  const otherSections: MaintenanceSection[] = [
    {
      title: 'Fasad/Tak m.m.',
      icon: '🏢',
      tasks: [
        { task: 'Kontroll av tak', responsibility: 'BRF' },
        { task: 'Rengöra stuprör', responsibility: 'BRF' },
        { task: 'Kontrollera utvändig brunn till källare', responsibility: 'BRF' },
        { task: 'Kontroll yttre fönster', responsibility: 'BRF' },
        { task: 'Kontroll målning', responsibility: 'BRF' },
        { task: 'Kontroll fasad', responsibility: 'BRF' },
        { task: 'Staket framsida', responsibility: 'BRF' },
        { task: 'Staket mot parkering', responsibility: 'BRF' },
      ]
    },
    {
      title: 'Övrigt',
      icon: '🔥',
      tasks: [
        { task: 'Brandskyddsrond', responsibility: 'BRF' },
      ]
    }
  ];

  // Render tabell för vanliga sektioner
  const renderMaintenanceTable = (section: MaintenanceSection) => (
    <Box key={section.title} sx={{ mb: 4 }}>
      <Typography variant="h5" component="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
        {section.title}
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Uppgift</strong></TableCell>
              <TableCell><strong>Ansvar</strong></TableCell>
              <TableCell><strong>Kommentar</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {section.tasks.map((task, index) => (
              <TableRow key={index}>
                <TableCell>{task.task}</TableCell>
                <TableCell>
                  <Chip 
                    label={task.responsibility}
                    color={getResponsibilityColor(task.responsibility) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontStyle: task.comment ? 'italic' : 'normal', color: 'text.secondary' }}>
                  {task.comment || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Render säsongsbaserade tabeller
  const renderSeasonalTable = (section: SeasonalSection) => (
    <Box key={section.title} sx={{ mb: 5 }}>
      <Typography variant="h5" component="h3" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
        {section.title}
      </Typography>

      {/* Sommar */}
      {section.seasons.summer && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            🌞 Sommar
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Uppgift</strong></TableCell>
                  <TableCell><strong>Ansvar</strong></TableCell>
                  <TableCell><strong>Kommentar</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {section.seasons.summer.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell>{task.task}</TableCell>
                    <TableCell>
                      <Chip 
                        label={task.responsibility}
                        color={getResponsibilityColor(task.responsibility) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontStyle: task.comment ? 'italic' : 'normal', color: 'text.secondary' }}>
                      {task.comment || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Vinter */}
      {section.seasons.winter && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            ❄️ Vinter
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Uppgift</strong></TableCell>
                  <TableCell><strong>Ansvar</strong></TableCell>
                  <TableCell><strong>Kommentar</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {section.seasons.winter.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell>{task.task}</TableCell>
                    <TableCell>
                      <Chip 
                        label={task.responsibility}
                        color={getResponsibilityColor(task.responsibility) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontStyle: task.comment ? 'italic' : 'normal', color: 'text.secondary' }}>
                      {task.comment || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Året runt */}
      {section.seasons.yearRound && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            🗓️ Året runt
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Uppgift</strong></TableCell>
                  <TableCell><strong>Ansvar</strong></TableCell>
                  <TableCell><strong>Kommentar</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {section.seasons.yearRound.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell>{task.task}</TableCell>
                    <TableCell>
                      <Chip 
                        label={task.responsibility}
                        color={getResponsibilityColor(task.responsibility) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontStyle: task.comment ? 'italic' : 'normal', color: 'text.secondary' }}>
                      {task.comment || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, pb: 6 }}>
        <Breadcrumbs />
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h3" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            🏠 Skötselplan
          </Typography>
        </Box>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Underhållslista för Boende och BRF
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* Ansvarsnyckel */}
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            📋 Ansvarsnyckel
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Chip label="Boende" color="primary" />
            <Chip label="BRF" color="secondary" />
            <Chip label="Kommunen" color="success" />
          </Box>
        </Paper>

        {/* Utomhus */}
        <Typography variant="h4" component="h2" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          🌳 UTOMHUS
        </Typography>
        {outdoorSections.map(renderSeasonalTable)}

        <Divider sx={{ my: 5 }} />

        {/* Inomhus */}
        <Typography variant="h4" component="h2" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          🏠 INOMHUS
        </Typography>
        {indoorSections.map(renderMaintenanceTable)}

        <Divider sx={{ my: 5 }} />

        {/* Övriga sektioner */}
        {otherSections.map(renderMaintenanceTable)}

        {/* Footer info */}
        <Paper sx={{ p: 3, mt: 5, bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Uppdaterad:</strong> {new Date().toLocaleDateString('sv-SE')}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default MaintenancePlan;
