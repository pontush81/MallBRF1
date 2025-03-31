import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista över tillåtna domäner
const ALLOWED_ORIGINS = [
  'https://www.gulmaran.com',    // Produktion med www
  'https://gulmaran.com',        // Produktion utan www
  'https://stage.gulmaran.com',  // Staging
  'https://www.stage.gulmaran.com', // Staging med www
  'http://localhost:3000',       // Lokal utveckling
];

export function middleware(request: NextRequest) {
  // Hämta origin från olika headers
  const origin = request.headers.get('origin');
  console.log('Middleware - Request origin:', origin);

  // Skapa ett nytt headers-objekt utan några CORS-headers
  const cleanHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!key.toLowerCase().startsWith('access-control-')) {
      cleanHeaders.set(key, value);
    }
  }

  // Hantera CORS för preflight requests
  if (request.method === 'OPTIONS') {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    return new NextResponse(null, { status: 403 });
  }

  // För alla andra requests
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    const response = NextResponse.next({
      request: {
        headers: cleanHeaders,
      },
    });

    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  }

  return NextResponse.next({
    request: {
      headers: cleanHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
}; 