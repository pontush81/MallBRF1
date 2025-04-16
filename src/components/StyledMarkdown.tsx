import React from 'react';
import { styled } from '@mui/material/styles';
import { useTheme } from '../context/ThemeContext';

// Styled component för markdown-innehåll med förbättrad kontrast i mörkt läge
const MarkdownContainer = styled('div')(({ theme }) => ({
  '& h1': {
    ...theme.typography.h4,
    marginBottom: theme.spacing(2),
    color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.typography.h4.color,
    textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.6)' : 'none',
    fontWeight: theme.palette.mode === 'dark' ? 700 : 500,
  },
  '& h2': {
    ...theme.typography.h5,
    marginBottom: theme.spacing(2),
    color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.typography.h5.color,
    textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.6)' : 'none',
    fontWeight: theme.palette.mode === 'dark' ? 700 : 500,
  },
  '& h3': {
    ...theme.typography.h6,
    marginBottom: theme.spacing(2),
    color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.typography.h6.color,
    textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.6)' : 'none',
    fontWeight: theme.palette.mode === 'dark' ? 700 : 500,
  },
  '& p': {
    ...theme.typography.body1,
    marginBottom: theme.spacing(2),
    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : theme.typography.body1.color,
  },
  '& ul, & ol': {
    ...theme.typography.body1,
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(3),
    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : theme.typography.body1.color,
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

interface StyledMarkdownProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const StyledMarkdown: React.FC<StyledMarkdownProps> = ({ children, className, ...props }) => {
  const { mode } = useTheme();
  
  return (
    <MarkdownContainer 
      className={className} 
      {...props} 
      sx={{
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          color: mode === 'dark' ? '#FFFFFF !important' : undefined,
          textShadow: mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.6) !important' : undefined,
          fontWeight: mode === 'dark' ? 700 : undefined,
        }
      }}
    >
      {children}
    </MarkdownContainer>
  );
};

export default StyledMarkdown; 