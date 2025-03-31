import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista över tillåtna domäner
const ALLOWED_ORIGINS = [
  'https://www.gulmaran.com',    // Produktion med www
  'https://gulmaran.com',        // Produktion utan www
  'http://www.gulmaran.com',     // Produktion med www (http)
  'http://gulmaran.com',         // Produktion utan www (http)
  'https://stage.gulmaran.com',  // Staging
  'http://localhost:3000',       // Lokal utveckling
  process.env.CORS_ORIGIN || 'http://localhost:3000'
].filter(Boolean);

export const config = {
  matcher: '/api/:path*',
  runtime: 'edge',
};

export function middleware(request: NextRequest) {
  // Hämta origin från olika headers
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const forwardedHost = request.headers.get('x-forwarded-host');
  
  // Bestäm den faktiska originen
  const actualOrigin = origin || referer || `https://${forwardedHost}`;
  
  console.log('Middleware - Request details:', {
    method: request.method,
    url: request.url,
    origin,
    referer,
    forwardedHost,
    actualOrigin,
    headers: Object.fromEntries(request.headers.entries())
  });
  console.log('Middleware - Allowed origins:', ALLOWED_ORIGINS);

  // Hantera CORS för preflight requests
  if (request.method === 'OPTIONS') {
    const allowedOrigin = actualOrigin && ALLOWED_ORIGINS.includes(actualOrigin) ? actualOrigin : null;
    console.log('Middleware - OPTIONS request, allowed origin:', allowedOrigin);

    if (allowedOrigin) {
      const response = new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
      console.log('Middleware - Sending CORS headers:', Object.fromEntries(response.headers.entries()));
      return response;
    }

    console.log('Middleware - Origin not allowed, sending 403');
    return new NextResponse(null, { status: 403 });
  }

  // För alla andra requests, lägg till CORS headers om origin är tillåten
  const allowedOrigin = actualOrigin && ALLOWED_ORIGINS.includes(actualOrigin) ? actualOrigin : null;
  console.log('Middleware - Regular request, allowed origin:', allowedOrigin);

  if (allowedOrigin) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
    console.log('Middleware - Added CORS headers to response:', Object.fromEntries(response.headers.entries()));
    return response;
  }

  return NextResponse.next();
} 