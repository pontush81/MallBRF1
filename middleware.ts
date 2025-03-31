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
  // Logga request information
  console.log('[Middleware] Request URL:', request.url);
  console.log('[Middleware] Request method:', request.method);
  
  // Rensa bort alla existerande CORS headers
  const cleanHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!key.toLowerCase().startsWith('access-control-')) {
      cleanHeaders.set(key, value);
    }
  }

  // Hämta origin från request
  const origin = request.headers.get('origin');
  console.log('[Middleware] Request origin:', origin);
  console.log('[Middleware] Clean headers:', JSON.stringify(Object.fromEntries([...cleanHeaders.entries()]), null, 2));

  // Om ingen origin finns, låt requesten fortsätta utan CORS headers
  if (!origin) {
    console.log('[Middleware] No origin found, continuing without CORS headers');
    return NextResponse.next({
      request: {
        headers: cleanHeaders,
      },
    });
  }

  // Kontrollera om origin är tillåten
  if (ALLOWED_ORIGINS.includes(origin)) {
    console.log('[Middleware] Origin allowed:', origin);
    
    // För preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      console.log('[Middleware] Handling OPTIONS request');
      const response = new NextResponse(null, { status: 200 });
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
      
      console.log('[Middleware] OPTIONS response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));
      return response;
    }

    // För alla andra requests
    console.log('[Middleware] Handling regular request');
    const response = NextResponse.next({
      request: {
        headers: cleanHeaders,
      },
    });

    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    console.log('[Middleware] Regular response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));
    return response;
  }

  // Om origin inte är tillåten, logga och returnera 403
  console.log('[Middleware] Origin not allowed:', origin);
  return new NextResponse(null, { status: 403 });
}

export const config = {
  matcher: '/api/:path*',
}; 