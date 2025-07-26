import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Container, Typography, Button, Card, CardContent } from '@mui/material';
import { ErrorOutline, Refresh, Home } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to external service if needed
    // logErrorToService(error, errorInfo);
  }

  handleRefresh = () => {
    // Clear any cached data that might be corrupted
    localStorage.removeItem('pages_last_load');
    
    // Reset error state
    this.setState({ hasError: false, error: null });
    
    // Reload the page
    window.location.reload();
  };

  handleGoHome = () => {
    // Clear any cached data that might be corrupted
    localStorage.removeItem('pages_last_load');
    
    // Reset error state and navigate to home
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
          <Card 
            elevation={3} 
            sx={{ 
              textAlign: 'center', 
              p: 4,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: 3
            }}
          >
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <ErrorOutline 
                  sx={{ 
                    fontSize: 64, 
                    color: '#ef4444',
                    mb: 2 
                  }} 
                />
              </Box>
              
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  color: '#1e293b', 
                  fontWeight: 600,
                  mb: 2 
                }}
              >
                Något gick fel
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
              >
                Sidan kunde inte laddas korrekt. Detta kan bero på en tillfällig teknisk störning 
                eller ett problem med din internetanslutning. Försök igen genom att ladda om sidan.
              </Typography>

              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center'
              }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Refresh />}
                  onClick={this.handleRefresh}
                  sx={{
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                    },
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                    px: 3,
                    py: 1.5
                  }}
                >
                  Ladda om sidan
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                  sx={{
                    borderColor: '#94a3b8',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#64748b',
                      color: '#475569',
                      backgroundColor: '#f8fafc'
                    },
                    borderRadius: 2,
                    px: 3,
                    py: 1.5
                  }}
                >
                  Gå till startsidan
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 4, p: 2, bgcolor: '#fef2f2', borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                    Utvecklingsinformation:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="error" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      wordBreak: 'break-word'
                    }}
                  >
                    {this.state.error.message}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 