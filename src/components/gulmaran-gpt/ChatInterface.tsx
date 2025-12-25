import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  Link,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as UserIcon,
  SmartToy as BotIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { gulmaranGPTAuthContext as gulmaranGPT, type ChatMessage, type ChatSource } from '../../services/gulmaran-gpt-auth-context';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hej! Jag är Gulmåran-GPT, din assistent för BRF Gulmåran. Jag kan hjälpa dig att hitta information i föreningens dokument. Vad vill du veta?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await gulmaranGPT.chat(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ursäkta, något gick fel. Försök igen eller kontakta administratören om problemet kvarstår.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error(error instanceof Error ? error.message : 'Något gick fel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Kopierat till urklipp');
    } catch (error) {
      toast.error('Kunde inte kopiera text');
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hej! Jag är Gulmåran-GPT, din assistent för BRF Gulmåran. Jag kan hjälpa dig att hitta information i föreningens dokument. Vad vill du veta?',
        timestamp: new Date(),
      },
    ]);
  };

  const formatDate = (date: Date) => {
    return format(date, 'HH:mm', { locale: sv });
  };

  const getSourceText = (source: ChatSource) => {
    let text = source.title;
    if (source.date) {
      text += ` (${format(new Date(source.date), 'yyyy-MM-dd', { locale: sv })})`;
    }
    text += ` • ${source.filetype.toUpperCase()}`;
    if (source.pageStart) {
      if (source.pageEnd && source.pageEnd !== source.pageStart) {
        text += ` • s. ${source.pageStart}–${source.pageEnd}`;
      } else {
        text += ` • s. ${source.pageStart}`;
      }
    }
    return text;
  };

  return (
    <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon color="primary" />
          <Typography variant="h6">Gulmåran-GPT</Typography>
        </Box>
        <Tooltip title="Rensa chatt">
          <IconButton onClick={clearChat} size="small">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message) => (
          <Box key={message.id} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar
                sx={{
                  bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                  width: 32,
                  height: 32,
                }}
              >
                {message.role === 'user' ? <UserIcon /> : <BotIcon />}
              </Avatar>
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {message.role === 'user' ? 'Du' : 'Gulmåran-GPT'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(message.timestamp)}
                  </Typography>
                  {message.role === 'assistant' && (
                    <Tooltip title="Kopiera svar">
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(message.content)}
                        sx={{ ml: 'auto' }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: message.role === 'user' ? 'primary.50' : 'grey.50',
                    borderColor: message.role === 'user' ? 'primary.200' : 'grey.200',
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </Paper>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Källor:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {message.sources.map((source, index) => (
                        <Paper
                          key={index}
                          variant="outlined"
                          sx={{ p: 1.5, bgcolor: 'background.paper' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2">
                              {getSourceText(source)}
                            </Typography>
                            {source.url && (
                              <Tooltip title="Öppna källa">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(source.url, '_blank')}
                                >
                                  <OpenIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        ))}
        
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
              <BotIcon />
            </Avatar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Gulmåran-GPT tänker...
              </Typography>
            </Box>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ställ en fråga om föreningens dokument..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Tryck Enter för att skicka, Shift+Enter för ny rad
        </Typography>
      </Box>
    </Paper>
  );
};

export default ChatInterface;
