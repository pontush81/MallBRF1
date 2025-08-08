import React, { useState } from 'react';
import {
    Box,
    Container,
    Tab,
    Tabs,
    Typography,
    Paper
} from '@mui/material';
// MIGRATION: BackupManager disabled - depends on Firebase

const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Adminpanel
                </Typography>

                <Paper sx={{ mb: 4 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Dashboard" />
                        <Tab label="Bokningar" />
                        <Tab label="Användare" />
                        <Tab label="Inställningar" />
                    </Tabs>
                </Paper>

                <Box sx={{ mt: 3 }}>
                    {activeTab === 0 && (
                        <Typography>Sidhantering kommer här</Typography>
                    )}
                    {activeTab === 1 && (
                        <Typography>Bokningshantering kommer här</Typography>
                    )}
                    {activeTab === 2 && (
                        <Typography>Användarhantering kommer här</Typography>
                    )}
                    {activeTab === 3 && (
                        <Typography>Backup hantering ej tillgänglig under migration</Typography>
                    )}
                </Box>
            </Box>
        </Container>
    );
};

export default AdminPage; 