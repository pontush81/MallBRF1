import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from '@mui/icons-material';
import { designTokens } from '../../theme/designSystem';

interface BreadcrumbItem {
  label: string;
  path?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  autoGenerate?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, autoGenerate = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-generate breadcrumbs from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Hem', path: '/' }];

    // Path mappings for better labels
    const pathLabels: { [key: string]: string } = {
      'admin': 'Administration',
      'pages': 'Sidor',
      'booking': 'Bokning',
      'hsb-report': 'HSB Rapport',
      'maintenance': 'Underhåll',
      'residents': 'Boende',
      'settings': 'Inställningar',
      'gastlagenhet': 'Gästlägenhet',
      'about': 'Om oss',
      'contact': 'Kontakt',
      'privacy': 'Integritet',
      'terms': 'Villkor',
    };

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      breadcrumbs.push({
        label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: isLast ? undefined : currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || (autoGenerate ? generateBreadcrumbs() : []);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={
          <ChevronRight 
            sx={{ 
              fontSize: designTokens.typography.fontSize.sm,
              color: designTokens.colors.secondary[400],
            }} 
          />
        }
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
          },
        }}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          if (isLast || !item.path) {
            return (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  color: designTokens.colors.secondary[600],
                  fontWeight: designTokens.typography.fontWeight.medium,
                  fontSize: designTokens.typography.fontSize.sm,
                }}
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path!);
              }}
              sx={{
                color: designTokens.colors.secondary[500],
                textDecoration: 'none',
                fontSize: designTokens.typography.fontSize.sm,
                fontWeight: designTokens.typography.fontWeight.normal,
                cursor: 'pointer',
                transition: designTokens.transitions.color,
                
                '&:hover': {
                  color: designTokens.colors.primary[600],
                  textDecoration: 'underline',
                },
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
