import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Typography, styled } from '@mui/material';
import pageService from '../services/pageService';
import { Page } from '../types/Page';

const StyledMarkdown = styled('div')(({ theme }) => ({
  '& h1': {
    ...theme.typography.h4,
    marginBottom: theme.spacing(2),
  },
  '& h2': {
    ...theme.typography.h5,
    marginBottom: theme.spacing(2),
  },
  '& h3': {
    ...theme.typography.h6,
    marginBottom: theme.spacing(2),
  },
  '& p': {
    ...theme.typography.body1,
    marginBottom: theme.spacing(2),
  },
  '& ul, & ol': {
    ...theme.typography.body1,
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(3),
  },
  '& li': {
    marginBottom: theme.spacing(1),
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& blockquote': {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    borderLeft: `4px solid ${theme.palette.divider}`,
    paddingLeft: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  '& code': {
    ...theme.typography.body2,
    backgroundColor: theme.palette.action.hover,
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
  },
  '& pre': {
    ...theme.typography.body2,
    backgroundColor: theme.palette.action.hover,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    overflow: 'auto',
  },
}));

const PublicPages: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const loadedPages = await pageService.getVisiblePages();
      setPages(loadedPages);
    } catch (err) {
      setError('Ett fel uppstod vid laddning av sidorna');
      // Fallback to hardcoded pages if API fails
      setPages([
        {
          id: "fallback-1",
          title: "Välkomstsida",
          content: "# Välkommen\n\nDetta är vår välkomstsida.",
          slug: "valkomstsida",
          isPublished: true,
          show: true,
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "fallback-2",
          title: "Information",
          content: "# Information\n\nViktig information om föreningen.",
          slug: "information",
          isPublished: true,
          show: true,
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Laddar...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (pages.length === 0) {
    return <div>Inga sidor tillgängliga</div>;
  }

  return (
    <div className="public-pages">
      {pages.map(page => (
        <article key={page.id} className="page">
          <Typography variant="h4" gutterBottom>
            {page.title}
          </Typography>
          <StyledMarkdown>
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