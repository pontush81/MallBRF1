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
  try {
    // Backup functionality is now handled by Supabase Edge Functions
    // This route can be removed once all references are updated
    return NextResponse.json({ 
      message: 'Backup functionality has been migrated to Supabase Edge Functions',
      redirect: '/functions/v1/send-backup'
    }, {
      status: 200,
    });

  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
} 