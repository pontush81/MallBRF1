import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  useMediaQuery,
  alpha,
  Card,
  CardContent
} from '@mui/material';
import { 
  TextFields 
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme } from '../context/ThemeContext';
import { ThemeDesign, ThemeFont, fontFamilies } from '../theme/theme';

// Komponent för att visa en förhandsvisning av ett tema
const ThemePreviewChip: React.FC<{ design: ThemeDesign }> = ({ design }) => {
  const muiTheme = useMuiTheme();
  const { getPreviewColors } = useTheme();
  const colors = getPreviewColors(design);
  
  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
      <Box 
        sx={{ 
          width: 36, 
          height: 36, 
          borderRadius: '50%', 
          bgcolor: colors.primary,
          boxShadow: `0 2px 4px ${alpha('#000', 0.2)}`
        }} 
      />
      <Box 
        sx={{ 
          width: 36, 
          height: 36, 
          borderRadius: '50%', 
          bgcolor: colors.secondary,
          boxShadow: `0 2px 4px ${alpha('#000', 0.2)}`
        }} 
      />
      <Box 
        sx={{ 
          width: 36, 
          height: 36, 
          borderRadius: '50%', 
          bgcolor: colors.accent,
          boxShadow: `0 2px 4px ${alpha('#000', 0.2)}`
        }} 
      />
    </Box>
  );
};

// Designväljare för administratörsgränssnittet
const ThemeDesignSelector: React.FC = () => {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { 
    design, 
    fontFamily,
    changeThemeDesign, 
    setFontFamily
  } = useTheme();

  // Tema alternativ
  const themeOptions: { value: ThemeDesign, label: string, description: string }[] = [
    {
      value: 'light',
      label: 'Fräscht & Ljust',
      description: 'Ljus och fräsch blå färgkombination med moderna toner'
    },
    {
      value: 'nordic',
      label: 'Nordic',
      description: 'Elegant slate-blå och terrakotta med skandinavisk känsla'
    },
    {
      value: 'sunset',
      label: 'Sunset',
      description: 'Varm kombination av lila och orange som solnedgångens färger'
    },
    {
      value: 'ocean',
      label: 'Ocean',
      description: 'Lugna turkos- och korallnyanser inspirerade av havet'
    }
  ];

  // Skapa en typsnittsväljare
  const fontOptions = [
    { value: 'roboto', label: 'Roboto (Standard)' },
    { value: 'montserrat', label: 'Montserrat' },
    { value: 'playfair', label: 'Playfair Display' },
    { value: 'opensans', label: 'Open Sans' },
    { value: 'lato', label: 'Lato' }
  ];

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3,
        borderRadius: 2,
        background: alpha(muiTheme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Anpassa gränssnittet
      </Typography>
      
      {/* Typsnittsväljare */}
      <Box mt={3} mb={3}>
        <FormControl fullWidth>
          <InputLabel id="font-select-label">Typsnitt</InputLabel>
          <Select
            labelId="font-select-label"
            value={fontFamily}
            label="Typsnitt"
            onChange={(e) => setFontFamily(e.target.value as ThemeFont)}
          >
            {fontOptions.map(option => (
              <MenuItem 
                key={option.value} 
                value={option.value}
                sx={{ 
                  fontFamily: fontFamilies[option.value as ThemeFont],
                  fontSize: '1rem' 
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="body2" sx={{ mt: 1, ml: 1, fontStyle: 'italic' }}>
            Förhandsvisning av typsnitt: 
            <span style={{ 
              fontFamily: fontFamilies[fontFamily], 
              fontWeight: 'bold',
              marginLeft: 8
            }}>
              Gulmåran Bostadsrättsförening
            </span>
          </Typography>
        </FormControl>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Box mt={3}>
        <FormLabel component="legend" sx={{ mb: 2 }}>Designschema</FormLabel>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 2,
          mt: 2
        }}>
          {themeOptions.map((option) => (
            <Card 
              key={option.value}
              sx={{
                cursor: 'pointer',
                border: '2px solid',
                borderColor: design === option.value ? 'primary.main' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={() => changeThemeDesign(option.value)}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  {option.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {option.description}
                </Typography>
                
                <ThemePreviewChip design={option.value} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default ThemeDesignSelector; 