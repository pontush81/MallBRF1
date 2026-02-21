import React from 'react';
import { styled } from '@mui/material/styles';

const MarkdownContainer = styled('div')(({ theme }) => ({
  '& h1': {
    ...theme.typography.h4,
    marginBottom: theme.spacing(2),
    fontWeight: 500,
  },
  '& h2': {
    ...theme.typography.h5,
    marginBottom: theme.spacing(2),
    fontWeight: 500,
  },
  '& h3': {
    ...theme.typography.h6,
    marginBottom: theme.spacing(2),
    fontWeight: 500,
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

interface StyledMarkdownProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const StyledMarkdown: React.FC<StyledMarkdownProps> = ({ children, className, ...props }) => {
  return (
    <MarkdownContainer className={className} {...props}>
      {children}
    </MarkdownContainer>
  );
};

export default StyledMarkdown;
