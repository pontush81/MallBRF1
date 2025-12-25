import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
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
      'Föreningsstämman är föreningens högsta beslutande organ.',
      'Ordinarie stämma hålls senast i juni varje år.',
      'Motioner ska lämnas senast den 1 februari.',
      'Varje medlem har en röst, oavsett antal lägenheter.',
      'Du kan företrädas av ombud med skriftlig fullmakt.',
      'Kallelse skickas ut 2–6 veckor före stämman.',
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
      'Du som bostadsrättshavare ansvarar för ytskikt på väggar, golv och tak, innerdörrar, fönsterbeslag, lås och nycklar, el från säkringsskåp, vitvaror, sanitetsporslin och brandvarnare.',
      'I våtrum ansvarar du även för tätskikt, golvbrunn och tvättmaskin. I kök för vitvaror, köksfläkt och diskmaskin.',
      'Föreningen ansvarar för fastighetens gemensamma delar, byggnadens yttre samt stamledningar för vatten och avlopp.',
      'Balkong och altan: Du ansvarar för renhållning och snöskottning.',
    ],
    icon: <HomeIcon />,
    color: bastadTheme.colors.terracotta[500],
  },
  {
    id: 'forandringar',
    title: 'Förändringar och renovering',
    body: [
      'Styrelsens tillstånd krävs för ingrepp i bärande konstruktion, ändring av ledningar för avlopp, värme, gas eller vatten, samt annan väsentlig förändring av lägenheten.',
      'Styrelsen får endast neka om åtgärden är till påtaglig skada för föreningen.',
      'Alla förändringar ska utföras fackmässigt och du ansvarar för att inhämta eventuella myndighetstillstånd.',
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
      'Upplåtelse i andra hand kräver skriftligt samtycke från styrelsen.',
      'I ansökan ska du ange skälet till upplåtelsen, vilken tid den ska pågå och till vem lägenheten ska upplåtas.',
      'Tillstånd ges om du har skäl för upplåtelsen och föreningen inte har befogad anledning att neka.',
      'Styrelsens beslut kan överklagas till hyresnämnden.',
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
            Obs!
          </Typography>
          Detta är en förenklad sammanfattning – inte de fullständiga stadgarna.
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
