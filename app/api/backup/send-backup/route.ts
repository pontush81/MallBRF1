import { NextResponse } from 'next/server';

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

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  console.log('OPTIONS request received with origin:', origin);

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      },
    });
  }

  return new NextResponse(null, { status: 403 });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  console.log('POST request received with origin:', origin);

  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized origin' }), {
      status: 403,
      headers: {
        'Vary': 'Origin',
      },
    });
  }

  try {
    // Your backup logic here
    // ...

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create backup' }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin, Accept, X-Requested-With, x-vercel-protection-bypass',
          'Access-Control-Allow-Credentials': 'true',
          'Vary': 'Origin',
        },
      }
    );
  }
} 