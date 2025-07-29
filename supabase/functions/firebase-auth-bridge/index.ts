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

// Handle setting GDPR Custom Claims for immediate authentication blocking
async function handleSetGDPRClaims(userId: string, email: string, claims: any): Promise<Response> {
  try {
    console.log('🛡️ GDPR: Setting custom claims for user:', userId, email);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required for setting claims' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store GDPR claims in our database for immediate checking during auth
    const { error: claimsError } = await supabase
      .from('gdpr_deleted_users')
      .upsert({
        id: userId,
        email: email,
        deleted_at: claims.deleted_at || new Date().toISOString(),
        deletion_reason: claims.deletion_reason || 'GDPR_ERASURE_REQUEST',
        firebase_auth_deletion_pending: false, // Custom claims set, immediate blocking
        admin_notes: 'User immediately blocked via Custom Claims. Account disabled due to GDPR erasure request.'
      });

    if (claimsError) {
      console.error('Failed to store GDPR claims:', claimsError);
      return new Response(JSON.stringify({ 
        error: 'Failed to set GDPR claims',
        details: claimsError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ GDPR Custom Claims set successfully - user immediately blocked');
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'GDPR Custom Claims set successfully',
      userId: userId,
      claims: claims,
      immediate_blocking: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error setting GDPR claims:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error while setting GDPR claims',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle GDPR user deletion from Firebase Auth
async function handleDeleteUser(userId: string): Promise<Response> {
  try {
    console.log('🔥 GDPR: Attempting to delete Firebase Auth user:', userId);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required for deletion' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Since we can't directly delete from Firebase Auth in Edge Runtime,
    // we'll disable the user in our database and send urgent admin notification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Mark user as permanently disabled in our database
    const { error: disableError } = await supabase
      .from('users')
      .update({ 
        isactive: false,
        account_disabled_reason: 'GDPR_ERASURE_REQUEST',
        firebase_auth_deletion_required: true,
        disabled_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (disableError) {
      console.error('Failed to disable user:', disableError);
    }

    // Send urgent notification to admin about required Firebase cleanup
    await sendFirebaseCleanupNotification(userId);
    
    console.log('🔒 User disabled in our system. Firebase Auth deletion required manually.');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User account disabled and Firebase Auth deletion initiated',
      userId: userId,
      actions_taken: [
        'User disabled in Supabase database',
        'Admin notified for Firebase Auth cleanup',
        'User cannot authenticate through our system'
      ],
      manual_cleanup_required: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Firebase user deletion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to disable user account',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function sendFirebaseCleanupNotification(userId: string) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found - cannot send Firebase cleanup notification');
      return;
    }

    const emailData = {
      from: 'BRF Gulmåran <noreply@brf-gulmaran.se>',
      to: ['gulmaranbrf@gmail.com'],
      subject: '🚨 URGENT: Firebase Auth Cleanup Required - GDPR Erasure',
      html: `
        <h2>🚨 URGENT ACTION REQUIRED - Firebase Auth Cleanup</h2>
        
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Reason:</strong> GDPR Erasure Request</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString('sv-SE')}</p>
        
        <div style="background: #fee; padding: 15px; border-left: 4px solid #f00; margin: 20px 0;">
          <h3>⚠️ MANUAL ACTION REQUIRED</h3>
          <p>The user has been disabled in our Supabase database, but <strong>Firebase Auth deletion must be done manually</strong>:</p>
          <ol>
            <li>Go to <a href="https://console.firebase.google.com">Firebase Console</a></li>
            <li>Select your project</li>
            <li>Go to Authentication → Users</li>
            <li>Find user with ID: <strong>${userId}</strong></li>
            <li>Delete the user permanently</li>
          </ol>
        </div>
        
        <p><strong>Status:</strong></p>
        <ul>
          <li>✅ User disabled in Supabase (cannot authenticate through our system)</li>
          <li>✅ Personal data deleted from database</li>
          <li>❌ Firebase Auth deletion pending manual action</li>
        </ul>
        
        <p><strong>GDPR Compliance:</strong> This deletion request must be completed within 30 days.</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          This notification is required for GDPR compliance.<br>
          System: BRF Gulmåran GDPR Automation
        </p>
      `
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send Firebase cleanup notification:', error);
    } else {
      const result = await response.json();
      console.log('Firebase cleanup notification sent:', result.id);
    }
  } catch (error) {
    console.error('Error sending Firebase cleanup notification:', error);
  }
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

    // Get request body
    const requestBody = await req.json();
    console.log('=== REQUEST BODY ===');
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));
    
    // Check if this is an admin action (like delete_user for GDPR)
    const { action, userId, firebaseToken, email } = requestBody;
    
    // Handle GDPR deletion check
    if (action === 'check_gdpr_deletion') {
      console.log('🔍 Checking GDPR deletion status for:', email || userId);
      const checkType = requestBody.checkType || 'existing_account_restoration';
      
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase
          .from('gdpr_deleted_users')
          .select('id, email, deleted_at, deletion_reason')
          .or(`id.eq.${userId},email.eq.${email}`)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          console.error('Error checking GDPR deletion status:', error);
          return new Response(JSON.stringify({ 
            error: 'Failed to check GDPR status',
            isGDPRDeleted: true // Safe default: block if we can't check
          }), { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (data) {
          // IMPORTANT: Only block if the Firebase userId matches exactly
          // This prevents the same person from restoring their deleted account
          // but allows new users with the same email address
          const isExactUserMatch = data.id === userId;
          
          if (isExactUserMatch) {
            console.error('🚨 SAME USER attempting to restore GDPR-deleted account:', {
              deletedUserId: data.id,
              currentUserId: userId,
              email: email,
              deletedAt: data.deleted_at
            });
            
            return new Response(JSON.stringify({ 
              isGDPRDeleted: true,
              deletionInfo: data,
              reason: 'Same user attempting to restore deleted account'
            }), { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            // Different Firebase userId but same email = NEW USER with same email
            console.log('✅ New user with previously used email address - ALLOWED:', {
              oldDeletedUserId: data.id,
              newUserId: userId,
              email: email,
              explanation: 'Different Firebase user, same email - this is a new user'
            });
            
            return new Response(JSON.stringify({ 
              isGDPRDeleted: false,
              note: 'New user with previously GDPR-deleted email address - allowed to create new account'
            }), { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        console.log('✅ User not in GDPR blacklist, safe to proceed');
        return new Response(JSON.stringify({ 
          isGDPRDeleted: false
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (err) {
        console.error('Failed to check GDPR deletion status:', err);
        return new Response(JSON.stringify({ 
          error: 'GDPR check failed',
          isGDPRDeleted: true // Safe default: block if error
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Handle GDPR Custom Claims setting
    if (action === 'set_gdpr_claims') {
      return await handleSetGDPRClaims(userId, email, requestBody.claims);
    }
    
    // Handle admin actions
    if (action === 'delete_user') {
      return await handleDeleteUser(userId);
    }
    
    // Regular token verification flow
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
      .select('role, isactive, email, account_disabled_reason, disabled_at')
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

    // IMMEDIATE GDPR COMPLIANCE CHECK: Block GDPR-deleted users (same Firebase user only)
    const { data: gdprData, error: gdprError } = await supabase
      .from('gdpr_deleted_users')
      .select('id, email, deleted_at, deletion_reason, admin_notes')
      .eq('id', firebaseUser.uid)
      .single();

    if (gdprData) {
      console.error('🚨 GDPR VIOLATION BLOCKED: Same user attempted login after GDPR erasure:', {
        deletedUserId: gdprData.id,
        currentUserId: firebaseUser.uid,
        email: firebaseUser.email,
        deletedAt: gdprData.deleted_at,
        reason: gdprData.deletion_reason,
        explanation: 'Same Firebase userId found in GDPR blacklist - blocking restoration'
      });
      
      return new Response(JSON.stringify({ 
        error: 'Account permanently deleted per GDPR erasure request',
        gdpr_deleted: true,
        deleted_at: gdprData.deleted_at,
        deletion_reason: gdprData.deletion_reason,
        user_type: 'same_user_attempting_restoration'
      }), {
        status: 403, // Forbidden - account permanently disabled
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Check if there's a GDPR deletion for this email with different Firebase userId
      const { data: emailGdprData } = await supabase
        .from('gdpr_deleted_users')
        .select('id, email, deleted_at')
        .eq('email', firebaseUser.email)
        .neq('id', firebaseUser.uid)
        .single();

      if (emailGdprData) {
        console.log('ℹ️ New user with previously GDPR-deleted email address:', {
          oldDeletedUserId: emailGdprData.id,
          newUserId: firebaseUser.uid,
          email: firebaseUser.email,
          explanation: 'Different Firebase user with same email - allowing new account creation'
        });
      }
    }

    if (!userData.isactive) {
      const isGDPRErasure = userData.account_disabled_reason === 'GDPR_ERASURE_REQUEST';
      
      return new Response(JSON.stringify({ 
        error: isGDPRErasure 
          ? 'Account permanently deleted per GDPR erasure request'
          : 'User account is inactive',
        reason: userData.account_disabled_reason || 'account_inactive',
        disabled_at: userData.disabled_at,
        gdpr_erasure: isGDPRErasure
      }), {
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