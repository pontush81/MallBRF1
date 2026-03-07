import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

interface SessionExpiredModalProps {
  open: boolean;
  onLoginAgain: () => void;
}

/**
 * Modal shown when session has expired and token refresh failed.
 * Guides the user to log in again with a clear, actionable message.
 */
const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ open, onLoginAgain }) => {
  return (
    <Dialog
      open={open}
      onClose={onLoginAgain}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-description"
    >
      <DialogTitle id="session-expired-title" component="h2">
        Din session har gått ut
      </DialogTitle>
      <DialogContent>
        <Typography id="session-expired-description" color="text.secondary">
          Du har varit inaktiv för länge eller din inloggning har upphört. Logga in igen för att
          fortsätta med bokningar och andra funktioner.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          startIcon={<LoginIcon />}
          onClick={onLoginAgain}
          size="large"
        >
          Logga in igen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionExpiredModal;
