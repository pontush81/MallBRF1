import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FirebaseUser {
  uid: string;
  email: string;
  name?: string;
  role?: string;
  isActive?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the Firebase ID token from the request
    const requestBody = await req.json();
    console.log('=== REQUEST BODY ===');
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));
    
    const { firebaseToken } = requestBody;
    console.log('Extracted firebaseToken:', firebaseToken ? `${firebaseToken.substring(0, 50)}...` : 'MISSING');
    
    if (!firebaseToken) {
      return new Response(JSON.stringify({ error: 'Firebase token required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify Firebase token (simplified - decode JWT payload)
    let firebaseUser: any;
    try {
      console.log('Processing Firebase token...');
      
      // Decode the JWT payload (middle part)
      const tokenParts = firebaseToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Firebase token payload:', JSON.stringify(payload, null, 2));
      
      firebaseUser = {
        uid: payload.sub || payload.user_id || payload.uid,
        email: payload.email,
        name: payload.name || payload.display_name,
      };
      
      console.log('Extracted user info:', JSON.stringify(firebaseUser, null, 2));
      
    } catch (error) {
      console.error('Token parsing error:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid Firebase token',
        details: error.message 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!firebaseUser.uid || !firebaseUser.email) {
      return new Response(JSON.stringify({ error: 'Invalid user data in token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up user role from Supabase users table
    console.log(`=== DATABASE LOOKUP ===`);
    console.log(`Looking for user ID: ${firebaseUser.uid}`);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, isactive, email')
      .eq('id', firebaseUser.uid)
      .single();

    console.log('Database query result:', JSON.stringify({ data: userData, error: userError }, null, 2));

    if (userError || !userData) {
      console.log('❌ User not found in database');
      return new Response(JSON.stringify({ 
        error: 'User not found in database',
        searchedFor: firebaseUser.uid,
        dbError: userError?.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Found user:', JSON.stringify(userData, null, 2));

    if (!userData.isactive) {
      return new Response(JSON.stringify({ error: 'User account is inactive' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get JWT secret for signing
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      return new Response(JSON.stringify({ error: 'JWT secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

          // Create Supabase-compatible JWT
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        aud: 'authenticated', // Use built-in Supabase role
        exp: getNumericDate(60 * 60), // 1 hour from now
        iat: now,
        iss: 'supabase',
        sub: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'authenticated', // Use Supabase built-in role
        user_metadata: {
          email: firebaseUser.email,
          name: firebaseUser.name,
          custom_role: userData.role, // Put our role here
        },
        app_metadata: {
          provider: 'firebase',
          custom_role: userData.role, // And here
        },
      };

    // Sign the JWT with Supabase secret
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const supabaseJWT = await create(
      { alg: 'HS256', typ: 'JWT' },
      payload,
      key
    );

    // Return the Supabase-compatible JWT
    return new Response(JSON.stringify({
      access_token: supabaseJWT,
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        role: userData.role,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auth bridge error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 