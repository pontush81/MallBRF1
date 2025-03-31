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
].filter(Boolean); // Ta bort eventuella undefined/null värden

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  console.log('OPTIONS request received with origin:', origin);
  console.log('Allowed origins:', ALLOWED_ORIGINS);
  
  // Kontrollera om origin finns i listan över tillåtna domäner
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    console.log('Origin allowed, sending CORS headers');
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  console.log('Origin not allowed, sending 403');
  return new NextResponse(null, { status: 403 });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  console.log('POST request received with origin:', origin);
  console.log('Allowed origins:', ALLOWED_ORIGINS);
  
  // Kontrollera om origin finns i listan över tillåtna domäner
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    console.log('Origin not allowed, sending 403');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized origin' }), {
      status: 403,
    });
  }

  try {
    // Add CORS headers to the response
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Your backup logic here
    // ...

    console.log('Backup successful, sending response with CORS headers');
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create backup' }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
} 