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

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  console.log('Middleware - Request origin:', origin);
  console.log('Middleware - Allowed origins:', ALLOWED_ORIGINS);

  // Hantera CORS för preflight requests
  if (request.method === 'OPTIONS') {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      console.log('Middleware - Origin allowed, sending CORS headers');
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    console.log('Middleware - Origin not allowed, sending 403');
    return new NextResponse(null, { status: 403 });
  }

  // För alla andra requests, lägg till CORS headers om origin är tillåten
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}; 