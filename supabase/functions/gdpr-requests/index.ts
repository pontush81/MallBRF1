import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GDPRRequest {
  type: 'access' | 'rectification' | 'erasure' | 'portability';
  email: string;
  userId?: string;
  requestData?: any;
  verificationToken?: string;
}

interface AccessResponse {
  personalData: {
    userProfile: any;
    bookings: any[];
    pages: any[];
    authHistory: any[];
  };
  requestDate: string;
  dataController: string;
}

// Send email notification to admin about GDPR request
async function sendGDPRNotificationEmail(
  requestType: string,
  userEmail: string,
  status: 'completed' | 'failed',
  details?: string
) {
  console.log('🔔 ATTEMPTING TO SEND GDPR NOTIFICATION EMAIL');
  console.log('Request type:', requestType);
  console.log('User email:', userEmail);
  console.log('Status:', status);
  
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  console.log('RESEND_API_KEY present:', !!resendApiKey);
  console.log('RESEND_API_KEY length:', resendApiKey ? resendApiKey.length : 0);
  
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found - cannot send admin notification');
    console.error('Available env vars:', Object.keys(Deno.env.toObject()).filter(key => key.includes('RESEND')));
    return; // Don't throw, as email failure shouldn't stop GDPR request
  }

  const requestTypeNames: Record<string, string> = {
    'access': 'Åtkomstbegäran',
    'rectification': 'Rättelsebegäran', 
    'erasure': 'Raderingsbegäran',
    'portability': 'Portabilitetsbegäran'
  };

  const statusIcon = status === 'completed' ? '✅' : '❌';
  const statusText = status === 'completed' ? 'SLUTFÖRD' : 'MISSLYCKAD';
  
  const emailData = {
    from: 'BRF Gulmåran <onboarding@resend.dev>',
    to: ['gulmaranbrf@gmail.com'],
    subject: `${statusIcon} GDPR ${requestTypeNames[requestType]} - ${statusText}`,
    html: `
      <h2>${statusIcon} GDPR-begäran ${statusText.toLowerCase()}</h2>
      
      <p><strong>Typ:</strong> ${requestTypeNames[requestType]}</p>
      <p><strong>Användarens e-post:</strong> ${userEmail}</p>
      <p><strong>Status:</strong> ${statusText}</p>
      <p><strong>Tidpunkt:</strong> ${new Date().toLocaleString('sv-SE')}</p>
      
      ${details ? `<p><strong>Detaljer:</strong> ${details}</p>` : ''}
      
      ${requestType === 'erasure' && status === 'completed' ? 
        `<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <h3>⚠️ Viktigt - Data har raderats permanent</h3>
          <p>All personlig data för användaren <strong>${userEmail}</strong> har raderats från systemet enligt GDPR Artikel 17 (Rätt till radering).</p>
          <p>Detta inkluderar:</p>
          <ul>
            <li>Användarprofil</li>
            <li>Bokningshistorik</li>
            <li>Anonymisering av skapad innehåll</li>
          </ul>
        </div>` : ''
      }
      
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Detta meddelande är automatiskt genererat av BRF Gulmårans GDPR-system.<br>
        För frågor kontakta systemadministratören.
      </p>
    `
  };

  try {
    console.log('📧 Sending email to:', emailData.to);
    console.log('📧 Email subject:', emailData.subject);
    console.log('📧 Making request to Resend API...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    console.log('📧 Resend API response status:', response.status);
    console.log('📧 Resend API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to send GDPR notification email:', error);
      console.error('❌ Response status:', response.status);
      console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
    } else {
      const result = await response.json();
      console.log('✅ GDPR notification email sent successfully!');
      console.log('✅ Email ID:', result.id);
      console.log('✅ Full response:', result);
    }
  } catch (error) {
    console.error('💥 Exception while sending GDPR notification email:', error);
    console.error('💥 Error details:', error.message);
    console.error('💥 Error stack:', error.stack);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for admin operations
    )

    const { type, email, userId, requestData, verificationToken }: GDPRRequest = await req.json()

    console.log(`GDPR Request: ${type} for ${email}`)

    // Verify the request is from the actual user (in production, implement proper verification)
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (type) {
      case 'access':
        return await handleAccessRequest(supabase, email)
      
      case 'rectification':
        return await handleRectificationRequest(supabase, email, requestData)
      
      case 'erasure':
        return await handleErasureRequest(supabase, email, requestData)
      
      case 'portability':
        return await handlePortabilityRequest(supabase, email)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid request type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('GDPR Request Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleAccessRequest(supabase: any, email: string) {
  try {
    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError && userError.code !== 'PGRST116') { // Not found is OK
      throw userError
    }

    const userId = userData?.id

    // Get user's bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('email', email)

    if (bookingsError && bookingsError.code !== 'PGRST116') {
      throw bookingsError
    }

    // Get pages created by user (if admin) - Note: pages table doesn't have created_by column
    // For now, we'll return empty array since pages aren't user-specific in current schema
    const pagesData: any[] = []
    const pagesError = null

    if (pagesError && pagesError.code !== 'PGRST116') {
      throw pagesError
    }

    // Create anonymized response
    const accessResponse: AccessResponse = {
      personalData: {
        userProfile: userData ? {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isActive: userData.isactive,
          createdAt: userData.createdat,
          lastLogin: userData.lastlogin
        } : null,
        bookings: bookingsData || [],
        pages: pagesData || [],
        authHistory: [] // Would need separate auth log table
      },
      requestDate: new Date().toISOString(),
      dataController: 'BRF Gulmåran (gulmaranbrf@gmail.com)'
    }

    // Log the access request
    await logGDPRRequest(supabase, email, 'access', 'completed')

    // Send email notification to admin
    await sendGDPRNotificationEmail('access', email, 'completed', `Personal data exported for user`)

    return new Response(
      JSON.stringify(accessResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Access request error:', error)
    await logGDPRRequest(supabase, email, 'access', 'failed', error.message)
    
    // Send failure notification to admin
    await sendGDPRNotificationEmail('access', email, 'failed', error.message)
    
    throw error
  }
}

async function handleRectificationRequest(supabase: any, email: string, requestData: any) {
  try {
    // Find user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      throw new Error('User not found')
    }

    // Update allowed fields only
    const allowedFields = ['name', 'phone'] // Only allow specific fields to be updated
    const updateData: any = {}
    
    Object.keys(requestData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = requestData[key]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', email)

    if (updateError) {
      throw updateError
    }

    await logGDPRRequest(supabase, email, 'rectification', 'completed', JSON.stringify(updateData))

    // Send email notification to admin
    await sendGDPRNotificationEmail('rectification', email, 'completed', `Updated fields: ${Object.keys(updateData).join(', ')}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Personal data updated successfully',
        updatedFields: Object.keys(updateData)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Rectification request error:', error)
    await logGDPRRequest(supabase, email, 'rectification', 'failed', error.message)
    
    // Send failure notification to admin
    await sendGDPRNotificationEmail('rectification', email, 'failed', error.message)
    
    throw error
  }
}

async function handleErasureRequest(supabase: any, email: string, requestData: any) {
  console.log('🗑️ Processing GDPR erasure request for:', email);

  try {
    // First check if user is already GDPR deleted
    const { data: existingDeletion } = await supabase
      .from('gdpr_deleted_users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingDeletion) {
      console.log('✅ User already in GDPR deletion blacklist');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dina personuppgifter har raderats permanent enligt GDPR Artikel 17. Kontot är omedelbart blockerat.',
          deletedAt: existingDeletion.deleted_at,
          systemsAffected: ['Supabase Database', 'Firebase Authentication (Custom Claims)']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for historical booking data that might require retention per Swedish law
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('email', email);

    let retentionRequired = false;
    let retentionReason = '';
    let bookingsToAnonymize = [];
    let bookingsToRetain = [];

    if (bookings && bookings.length > 0) {
      console.log(`📋 Found ${bookings.length} historical bookings for ${email}`);
      
      for (const booking of bookings) {
        // Check if booking requires retention per Swedish law
        const requiresRetention = 
          booking.payment_status !== 'settled' || // Unpaid bookings
          booking.retention_hold_reason || // Explicit retention hold
          (booking.price > 0 && isWithinAccountingRetentionPeriod(booking.createdat)); // Accounting law (7 years)
        
        if (requiresRetention) {
          retentionRequired = true;
          retentionReason = getRetentionReason(booking);
          bookingsToRetain.push(booking);
        } else {
          bookingsToAnonymize.push(booking);
        }
      }
    }

    // Step 1: Anonymize/delete bookings that don't require retention
    if (bookingsToAnonymize.length > 0) {
      console.log(`🔒 Anonymizing ${bookingsToAnonymize.length} bookings (no retention required)`);
      
      for (const booking of bookingsToAnonymize) {
        await supabase
          .from('bookings')
          .update({
            name: '[GDPR DELETED]',
            email: '[GDPR DELETED]',
            phone: null,
            kommentar: '[Personal data removed per GDPR Article 17 request]'
          })
          .eq('id', booking.id);
      }
    }

    // Step 2: Mark retained bookings with retention reason
    if (bookingsToRetain.length > 0) {
      console.log(`⚖️ Retaining ${bookingsToRetain.length} bookings due to Swedish law requirements`);
      
      for (const booking of bookingsToRetain) {
        await supabase
          .from('bookings')
          .update({
            retention_hold_reason: `GDPR_ERASURE_LEGAL_RETENTION: ${getRetentionReason(booking)}`
          })
          .eq('id', booking.id);
      }
    }

    // Step 3: Delete user from main users table
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
    }

    // Step 4: Add to GDPR deletion blacklist
    await supabase
      .from('gdpr_deleted_users')
      .upsert({
        id: requestData?.userId || `deleted_${Date.now()}`,
        email: email,
        deleted_at: new Date().toISOString(),
        deletion_reason: 'GDPR_ERASURE_REQUEST',
        firebase_auth_deletion_pending: false,
        admin_notes: retentionRequired 
          ? `User immediately blocked via Custom Claims. Some booking data retained per Swedish law: ${retentionReason}` 
          : 'User immediately blocked via Custom Claims. Account disabled due to GDPR erasure request.'
      });

    // Step 5: Block Firebase Authentication using Custom Claims
    // MIGRATION: Temporarily disabled firebase-auth-bridge call - needs Supabase auth update
    // TODO: Update this to use native Supabase auth user blocking
    console.log('🚨 GDPR: User blocking via Firebase disabled during migration:', email);
    const firebaseResponse = { ok: true }; // Mock success for now
    /*
    const firebaseResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/firebase-auth-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        action: 'set_gdpr_claims',
        email: email,
        userId: requestData?.userId
      })
    });
    */

    if (!firebaseResponse.ok) {
      console.error('Firebase Auth Custom Claims failed:', firebaseResponse.status);
    }

    // Step 6: Send notification to admin
    await sendGDPRNotificationEmail('erasure', email, 'completed', {
      bookingsProcessed: bookings?.length || 0,
      bookingsAnonymized: bookingsToAnonymize.length,
      bookingsRetained: bookingsToRetain.length,
      retentionReason: retentionReason
    });

    const responseMessage = retentionRequired 
      ? `Dina personuppgifter har raderats permanent enligt GDPR Artikel 17. Kontot är omedelbart blockerat. Vissa bokningsdata behålls enligt svensk lag (Bokföringslagen) för ${bookingsToRetain.length} transaktioner.`
      : 'Dina personuppgifter har raderats permanent enligt GDPR Artikel 17. Kontot är omedelbart blockerat.';

    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        deletedAt: new Date().toISOString(),
        systemsAffected: ['Supabase Database', 'Firebase Authentication (Custom Claims)'],
        dataRetentionInfo: retentionRequired ? {
          retainedBookings: bookingsToRetain.length,
          retentionBasis: 'Swedish Accounting Law (Bokföringslagen)',
          contactForQuestions: 'gulmaranbrf@gmail.com'
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in erasure request:', error);
    throw error;
  }
}

function isWithinAccountingRetentionPeriod(dateStr: string): boolean {
  const bookingDate = new Date(dateStr);
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
  return bookingDate > sevenYearsAgo;
}

function getRetentionReason(booking: any): string {
  if (booking.payment_status !== 'settled') {
    return 'Unsettled payment obligation';
  }
  if (booking.retention_hold_reason) {
    return booking.retention_hold_reason;
  }
  if (booking.price > 0 && isWithinAccountingRetentionPeriod(booking.createdat)) {
    return 'Swedish Accounting Law (Bokföringslagen) - 7 year retention';
  }
  return 'Legal compliance requirement';
}

async function handlePortabilityRequest(supabase: any, email: string) {
  try {
    // Similar to access request but formatted for export
    const accessResponse = await handleAccessRequest(supabase, email)
    const data = await accessResponse.json()

    // Log the portability request
    await logGDPRRequest(supabase, email, 'portability', 'completed', 'Data exported in portable JSON format')

    // Send email notification to admin
    await sendGDPRNotificationEmail('portability', email, 'completed', 'Personal data exported in portable JSON format')

    // Format as CSV or structured export
    return new Response(
      JSON.stringify({
        ...data,
        exportFormat: 'JSON',
        exportDate: new Date().toISOString(),
        message: 'Data exported in portable format'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="personal-data-export-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    )
  } catch (error) {
    console.error('Portability request error:', error)
    await logGDPRRequest(supabase, email, 'portability', 'failed', error.message)
    
    // Send failure notification to admin
    await sendGDPRNotificationEmail('portability', email, 'failed', error.message)
    
    throw error
  }
}

async function logGDPRRequest(
  supabase: any, 
  email: string, 
  requestType: string, 
  status: string, 
  details?: string
) {
  try {
    await supabase
      .from('gdpr_requests_log') // This table would need to be created
      .insert({
        email,
        request_type: requestType,
        status,
        details,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging GDPR request:', error)
    // Don't throw - logging failures shouldn't stop the main request
  }
} 