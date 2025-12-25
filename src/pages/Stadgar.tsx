import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  Gavel as GavelIcon,
  Balance as BalanceIcon,
  Payments as PaymentsIcon,
  HowToVote as HowToVoteIcon,
  BusinessCenter as BusinessCenterIcon,
  VerifiedUser as VerifiedUserIcon,
  Home as HomeIcon,
  Build as BuildIcon,
  Apartment as ApartmentIcon,
  VpnKey as VpnKeyIcon,
  Email as EmailIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material';
import { bastadTheme } from '../theme/bastadTheme';
import CompactHero from '../components/common/CompactHero';

// Stadgar data - strukturerad för enkel uppdatering
interface StadgarSection {
  id: string;
  title: string;
  body: string[];
  icon: React.ReactNode;
  color: string;
}

const stadgarSections: StadgarSection[] = [
  {
    id: 'om-foreningen',
    title: 'Om föreningen',
    body: [
      'Bostadsrättsföreningen Gulmåran är en bostadsrättsförening vars ändamål är att främja medlemmarnas ekonomiska intressen genom att upplåta bostäder med bostadsrätt.',
      'Föreningen har sitt säte i Båstads kommun. Medlemmar i föreningen är de som innehar bostadsrätt i föreningens fastighet.',
    ],
    icon: <InfoIcon />,
    color: bastadTheme.colors.twilight[500],
  },
  {
    id: 'medlemskap',
    title: 'Medlemskap',
    body: [
      'Medlemskap i föreningen krävs för att få inneha en bostadsrätt.',
      'Medlemskap prövas och beviljas av föreningens styrelse i samband med överlåtelse.',
      'Föreningen tillämpar likabehandlingsprincipen och gällande lagstiftning vid prövning av medlemskap.',
    ],
    icon: <PeopleIcon />,
    color: bastadTheme.colors.seagreen[500],
  },
  {
    id: 'avgifter',
    title: 'Avgifter – översikt',
    body: [
      'Medlemmar betalar avgifter till föreningen för att täcka kostnader för drift, underhåll och förvaltning.',
      'Beslut om avgifter fattas enligt föreningens stadgar av föreningsstämman eller styrelsen.',
    ],
    icon: <PaymentsIcon />,
    color: bastadTheme.colors.terracotta[500],
  },
  {
    id: 'foreningsstamma',
    title: 'Föreningsstämma och demokrati',
    body: [
      'Föreningsstämman är föreningens högsta beslutande organ och hålls normalt en gång per år.',
      'På stämman behandlas frågor som rör föreningens ekonomi, styrelsens arbete och val av förtroendevalda.',
      'Medlemmar har möjlighet att lämna motioner och därigenom påverka föreningens utveckling.',
    ],
    icon: <HowToVoteIcon />,
    color: bastadTheme.colors.ocean[700],
  },
  {
    id: 'styrelse',
    title: 'Styrelse och ansvar',
    body: [
      'Styrelsen ansvarar för den löpande förvaltningen av föreningen och företräder föreningen utåt.',
      'Styrelsen verkställer beslut fattade av föreningsstämman och ansvarar för att gällande lagar och stadgar följs.',
    ],
    icon: <BusinessCenterIcon />,
    color: bastadTheme.colors.twilight[500],
  },
  {
    id: 'revision',
    title: 'Revision och kontroll',
    body: [
      'Föreningen har revisor som granskar styrelsens arbete och föreningens räkenskaper.',
      'Revisionen bidrar till insyn och kontroll i föreningens förvaltning.',
    ],
    icon: <VerifiedUserIcon />,
    color: bastadTheme.colors.seagreen[500],
  },
  {
    id: 'ansvar-lagenhet',
    title: 'Ansvar i lägenheten',
    body: [
      'Bostadsrättshavaren ansvarar för att hålla lägenheten i gott skick och utföra normalt underhåll.',
      'Föreningen ansvarar för fastighetens gemensamma delar och byggnadens yttre.',
    ],
    icon: <HomeIcon />,
    color: bastadTheme.colors.terracotta[500],
  },
  {
    id: 'forandringar',
    title: 'Förändringar och renovering',
    body: [
      'Vissa förändringar i lägenheten kräver tillstånd från styrelsen.',
      'Arbeten ska utföras fackmannamässigt.',
    ],
    icon: <BuildIcon />,
    color: bastadTheme.colors.ocean[600],
  },
  {
    id: 'anvandning',
    title: 'Användning av bostaden',
    body: [
      'Lägenheten ska användas för sitt avsedda ändamål.',
      'Sundhet, ordning och gott skick ska upprätthållas.',
    ],
    icon: <ApartmentIcon />,
    color: bastadTheme.colors.twilight[500],
  },
  {
    id: 'andrahandsuthyrning',
    title: 'Andrahandsuthyrning',
    body: [
      'Upplåtelse av lägenheten i andra hand kräver styrelsens godkännande.',
      'Ansökan ska göras skriftligen.',
    ],
    icon: <VpnKeyIcon />,
    color: bastadTheme.colors.seagreen[500],
  },
  {
    id: 'kommunikation',
    title: 'Kommunikation från föreningen',
    body: [
      'Föreningen informerar medlemmarna via exempelvis webbplats, e-post och anslag.',
    ],
    icon: <EmailIcon />,
    color: bastadTheme.colors.terracotta[500],
  },
  {
    id: 'underhall',
    title: 'Underhåll och långsiktig planering',
    body: [
      'Föreningen arbetar långsiktigt med fastighetens underhåll och planering.',
    ],
    icon: <CalendarMonthIcon />,
    color: bastadTheme.colors.ocean[700],
  },
  {
    id: 'juridik',
    title: 'Juridisk information',
    body: [
      'Denna sida är en förenklad sammanfattning.',
      'Vid juridisk tolkning gäller alltid föreningens stadgar i original samt tillämplig lagstiftning.',
    ],
    icon: <BalanceIcon />,
    color: bastadTheme.colors.ocean[900],
  },
];

const Stadgar: React.FC = () => {
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  return (
    <Box
      sx={{
        background: bastadTheme.colors.sand[50],
        minHeight: '100vh',
        pb: { xs: 8, md: 12 },
      }}
    >
      {/* Hero */}
      <CompactHero
        title="Digitala stadgar"
        subtitle="En förenklad och lättläst sammanfattning av föreningens stadgar"
      />

      <Container maxWidth="md" sx={{ mt: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Juridisk disclaimer */}
        <Alert
          severity="info"
          icon={<GavelIcon sx={{ color: bastadTheme.colors.ocean[700] }} />}
          sx={{
            mb: { xs: 3, md: 4 },
            borderRadius: bastadTheme.borderRadius.lg,
            backgroundColor: bastadTheme.colors.ocean[50],
            border: `1px solid ${bastadTheme.colors.ocean[200]}`,
            '& .MuiAlert-message': {
              fontFamily: bastadTheme.typography.fontFamily.body,
              color: bastadTheme.colors.ocean[800],
              fontSize: { xs: '0.8125rem', md: '0.875rem' },
              lineHeight: 1.6,
            },
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              display: 'block',
              mb: 0.5,
              fontFamily: bastadTheme.typography.fontFamily.heading,
              fontSize: { xs: '0.875rem', md: '0.9375rem' },
            }}
          >
            Viktig information
          </Typography>
          Denna sida innehåller en förenklad och pedagogisk sammanfattning av föreningens stadgar. 
          De fullständiga och juridiskt bindande stadgarna finns fastställda i originalhandling och 
          kan inte återges i sin helhet här.
        </Alert>

        {/* Info om originalstadgar */}
        <Box
          sx={{
            mb: { xs: 3, md: 4 },
            p: { xs: 2, md: 2.5 },
            backgroundColor: bastadTheme.colors.sand[100],
            borderRadius: bastadTheme.borderRadius.lg,
            border: `1px solid ${bastadTheme.colors.sand[300]}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.body,
              color: bastadTheme.colors.ocean[700],
              fontSize: { xs: '0.8125rem', md: '0.875rem' },
              lineHeight: 1.6,
            }}
          >
            Vid tolkning eller tillämpning gäller alltid föreningens stadgar i original samt tillämplig lagstiftning.
          </Typography>
        </Box>

        {/* Snabbnavigering */}
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: bastadTheme.colors.ocean[600],
              fontFamily: bastadTheme.typography.fontFamily.body,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 1.5,
            }}
          >
            Snabbnavigering
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{ mb: 2 }}
          >
            {stadgarSections.slice(0, 6).map((section) => (
              <Chip
                key={section.id}
                label={section.title}
                size="small"
                onClick={() => {
                  setExpandedPanel(section.id);
                  document.getElementById(`section-${section.id}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                }}
                sx={{
                  fontFamily: bastadTheme.typography.fontFamily.body,
                  fontSize: '0.75rem',
                  backgroundColor: bastadTheme.colors.white,
                  border: `1px solid ${bastadTheme.colors.sand[300]}`,
                  color: bastadTheme.colors.ocean[700],
                  transition: bastadTheme.transitions.fast,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: bastadTheme.colors.sand[100],
                    borderColor: bastadTheme.colors.terracotta[300],
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Accordions med stadgar-sektioner */}
        <Box
          sx={{
            backgroundColor: bastadTheme.colors.white,
            borderRadius: bastadTheme.borderRadius.xl,
            border: `1px solid ${bastadTheme.colors.sand[300]}`,
            boxShadow: bastadTheme.shadows.card,
            overflow: 'hidden',
          }}
        >
          {stadgarSections.map((section, index) => (
            <Accordion
              key={section.id}
              id={`section-${section.id}`}
              expanded={expandedPanel === section.id}
              onChange={handleAccordionChange(section.id)}
              disableGutters
              elevation={0}
              sx={{
                '&:before': { display: 'none' },
                borderBottom:
                  index < stadgarSections.length - 1
                    ? `1px solid ${bastadTheme.colors.sand[200]}`
                    : 'none',
                '&.Mui-expanded': {
                  backgroundColor: bastadTheme.colors.sand[50],
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    sx={{
                      color: bastadTheme.colors.ocean[600],
                      transition: bastadTheme.transitions.fast,
                    }}
                  />
                }
                sx={{
                  minHeight: { xs: 64, md: 72 },
                  px: { xs: 2, md: 3 },
                  '&:hover': {
                    backgroundColor: bastadTheme.colors.sand[50],
                  },
                  '& .MuiAccordionSummary-content': {
                    my: { xs: 1.5, md: 2 },
                    alignItems: 'center',
                    gap: { xs: 1.5, md: 2 },
                  },
                }}
              >
                {/* Ikon */}
                <Box
                  sx={{
                    width: { xs: 40, md: 44 },
                    height: { xs: 40, md: 44 },
                    borderRadius: bastadTheme.borderRadius.md,
                    backgroundColor: `${section.color}15`,
                    border: `1px solid ${section.color}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    '& .MuiSvgIcon-root': {
                      color: section.color,
                      fontSize: { xs: 20, md: 22 },
                    },
                  }}
                >
                  {section.icon}
                </Box>

                {/* Titel */}
                <Typography
                  sx={{
                    fontFamily: bastadTheme.typography.fontFamily.heading,
                    fontWeight: 600,
                    color: bastadTheme.colors.ocean[900],
                    fontSize: { xs: '0.9375rem', md: '1.0625rem' },
                    lineHeight: 1.3,
                  }}
                >
                  {section.title}
                </Typography>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  px: { xs: 2, md: 3 },
                  pb: { xs: 2.5, md: 3 },
                  pt: 0,
                }}
              >
                <Box
                  sx={{
                    pl: { xs: 0, md: 7 },
                    borderLeft: {
                      xs: 'none',
                      md: `3px solid ${section.color}25`,
                    },
                    ml: { xs: 0, md: 0 },
                  }}
                >
                  {section.body.map((paragraph, pIndex) => (
                    <Typography
                      key={pIndex}
                      sx={{
                        fontFamily: bastadTheme.typography.fontFamily.body,
                        color: bastadTheme.colors.ocean[700],
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                        lineHeight: 1.7,
                        mb: pIndex < section.body.length - 1 ? 2 : 0,
                      }}
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            mt: { xs: 4, md: 5 },
            p: { xs: 2.5, md: 3 },
            backgroundColor: bastadTheme.colors.sand[100],
            borderRadius: bastadTheme.borderRadius.lg,
            border: `1px solid ${bastadTheme.colors.sand[300]}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: bastadTheme.typography.fontFamily.body,
              color: bastadTheme.colors.ocean[600],
              fontSize: '0.75rem',
              lineHeight: 1.6,
              display: 'block',
            }}
          >
            <strong>Källa:</strong> Stadgar i original (PDF), Bostadsrättslagen, Övrig tillämplig lagstiftning.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Stadgar;
