import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { ButtonLoading } from './common/StandardLoading';

const LOCAL_STORAGE_KEY = 'hsb_default_recipient_email';

interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (email: string) => void;
  sending: boolean;
  periodLabel: string;
  itemCount: number;
  totalAmount: number;
}

const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  open,
  onClose,
  onSend,
  sending,
  periodLabel,
  itemCount,
  totalAmount
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (open) {
      const savedEmail = localStorage.getItem(LOCAL_STORAGE_KEY) || '';
      setEmail(savedEmail);
      setEmailError('');
    }
  }, [open]);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('E-postadress krävs');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Ogiltig e-postadress');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSend = () => {
    if (!validateEmail(email)) return;
    localStorage.setItem(LOCAL_STORAGE_KEY, email);
    onSend(email);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !sending && onClose()}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '15vh',
        },
        '& .MuiDialog-paper': {
          margin: '0',
          position: 'relative',
          maxHeight: '70vh',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmailIcon color="primary" />
        Skicka rapport via e-post
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Mottagarens e-postadress"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) validateEmail(e.target.value);
          }}
          onBlur={() => email && validateEmail(email)}
          error={!!emailError}
          helperText={emailError}
          sx={{ mt: 1, mb: 2 }}
          disabled={sending}
        />

        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Sammanfattning
          </Typography>
          <Typography variant="body2">
            Period: <strong>{periodLabel}</strong>
          </Typography>
          <Typography variant="body2">
            Antal poster: <strong>{itemCount}</strong>
          </Typography>
          <Typography variant="body2">
            Total summa: <strong>{totalAmount.toLocaleString('sv-SE')} kr</strong>
          </Typography>
        </Box>

        <Alert severity="info" variant="outlined" sx={{ mb: 1 }}>
          Rapporten skickas som PDF-bilaga till angiven e-postadress.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          Avbryt
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={sending || !email.trim()}
          startIcon={sending ? <ButtonLoading /> : <EmailIcon />}
          sx={{ minWidth: 130, minHeight: 42 }}
        >
          {sending ? 'Skickar...' : 'Skicka'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendEmailDialog;
