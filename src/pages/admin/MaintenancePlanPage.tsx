import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MaintenancePlan from '../../components/maintenance/MaintenancePlan';

const MaintenancePlanPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Underhållsplan</Typography>
        </Box>
        <Typography variant="body1" paragraph>
          Här kan du hantera föreningens underhållsplan. Lägg till, redigera och håll koll på status för underhållsarbeten över hela året.
        </Typography>
        <Typography variant="body1" paragraph>
          Filtrera efter månad, kategori eller status för att hitta specifika uppgifter. Klicka på redigeringsikonen för att ändra en uppgift.
        </Typography>
      </Paper>
      
      <MaintenancePlan />
    </Box>
  );
};

export default MaintenancePlanPage; 