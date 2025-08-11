import React, { useState, useRef, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  borderRadius?: number | string;
  loading?: 'lazy' | 'eager';
  placeholder?: boolean;
  onClick?: () => void;
  sx?: any;
}

/**
 * Optimized image component with lazy loading, WebP support, and placeholder
 * Improves mobile performance by reducing initial load time and preventing layout shifts
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = 0,
  loading = 'lazy',
  placeholder = true,
  onClick,
  sx = {}
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(loading === 'eager');

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before image comes into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  // Set image source when in view or eager loading
  useEffect(() => {
    if (isInView && !imageSrc) {
      // Try WebP first, fallback to original
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      // Check if WebP is supported and if WebP version exists
      const testWebP = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      };

      if (testWebP() && src !== webpSrc) {
        // Test if WebP version exists
        const img = new Image();
        img.onload = () => setImageSrc(webpSrc);
        img.onerror = () => setImageSrc(src);
        img.src = webpSrc;
      } else {
        setImageSrc(src);
      }
    }
  }, [isInView, src, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const containerStyle = {
    width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius,
    overflow: 'hidden',
    position: 'relative' as const,
    cursor: onClick ? 'pointer' : 'default',
    ...sx
  };

  if (hasError) {
    return (
      <Box
        sx={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          color: 'text.secondary',
          fontSize: '0.875rem'
        }}
      >
        Kunde inte ladda bild
      </Box>
    );
  }

  return (
    <Box ref={imgRef} sx={containerStyle} onClick={onClick}>
      {placeholder && !isLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            display: 'block'
          }}
        />
      )}
    </Box>
  );
};

export default OptimizedImage;
