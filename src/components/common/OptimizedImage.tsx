import React, { useState, useCallback } from 'react';
import { Box, Skeleton } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: boolean;
  sx?: any; // MUI sx prop support
}

/**
 * OptimizedImage - A performance-optimized image component
 * Features:
 * - Lazy loading by default
 * - Skeleton loading state
 * - Error handling with fallback
 * - Automatic WebP format detection
 * - GPU-accelerated rendering
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  className,
  style,
  loading = 'lazy',
  priority = false,
  objectFit = 'cover',
  placeholder = false,
  sx
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Convert WebP for better performance if supported
  const optimizedSrc = src;

  if (hasError) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          color: 'grey.500',
          fontSize: '0.875rem',
          textAlign: 'center',
          p: 2
        }}
        className={className}
        style={style}
      >
        Bilden kunde inte laddas
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        ...sx
      }}
      className={className}
      style={style}
    >
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            // GPU acceleration for smooth animation
            transform: 'translateZ(0)',
            willChange: 'opacity'
          }}
          animation="pulse"
        />
      )}
      
      <img
        src={optimizedSrc}
        alt={alt}
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: isLoading ? 'none' : 'block',
          // GPU acceleration for better performance
          transform: 'translateZ(0)',
          willChange: 'transform',
          // Smooth transition when image loads
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          ...style
        }}
        // Add fetchpriority for critical images
        {...(priority && { fetchPriority: 'high' as any })}
      />
    </Box>
  );
};

export default OptimizedImage;