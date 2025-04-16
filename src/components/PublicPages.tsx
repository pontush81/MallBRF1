import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Skeleton,
  useTheme as useMuiTheme,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Page } from '../types/Page';
import pageService from '../services/pageService';
import { useTheme } from '../context/ThemeContext';
import StyledMarkdown from './StyledMarkdown';

const PublicPages: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const { mode } = useTheme();
  
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const fetchedPages = await pageService.getVisiblePages();
        setPages(fetchedPages);
      } catch (err) {
        console.error('Fel vid hämtning av sidor:', err);
        setError('Ett fel uppstod vid hämtning av innehållet');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPages();
  }, []);

  // Scrolla till rätt sektion baserat på hash
  useEffect(() => {
    if (location.hash && !loading) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      
      if (element) {
        // Lägg till en kort fördröjning för att säkerställa att sidan är renderad
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else if (!location.hash && !loading) {
      // Om ingen hash, scrolla till toppen
      window.scrollTo(0, 0);
    }
  }, [location.hash, loading, pages]);

  if (loading) {
    return (
      <Container>
        <Box my={4}>
          <Skeleton variant="rectangular" height={60} />
          <Box mt={4}>
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="text" height={30} width="80%" />
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box my={4}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <div className="public-pages">
      {pages.map(page => (
        <article key={page.id} id={page.id} className="page">
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              position: 'relative',
              fontWeight: 900,
              color: mode === 'dark' ? '#FFFFFF !important' : '#212121',
              textShadow: mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.8) !important' : 'none',
              pb: 1.5,
              letterSpacing: mode === 'dark' ? '0.03em' : 'normal',
              textTransform: 'uppercase',
              fontSize: mode === 'dark' ? '2.2rem' : '2rem',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '150px',
                height: '4px',
                background: mode === 'dark' 
                  ? 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)'
                  : `linear-gradient(90deg, ${muiTheme.palette.primary.main} 0%, rgba(0,0,0,0) 100%)`,
                borderRadius: '2px'
              }
            }}
          >
            {page.title}
          </Typography>
          <StyledMarkdown data-testid="markdown">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </StyledMarkdown>
          
          {page.files && page.files.length > 0 && (
            <div className="attachments">
              <Typography variant="h6" gutterBottom>
                Bilagor
              </Typography>
              <ul>
                {page.files.map(file => (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {file.originalName || file.filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default PublicPages; 