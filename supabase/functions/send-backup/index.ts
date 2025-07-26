import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackupRequest {
  tables?: string[]
  includeFiles?: boolean
  customEmail?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { tables = ['bookings'], includeFiles = false, customEmail }: BackupRequest = 
      req.method === 'POST' ? await req.json() : {}

    // Initialize Supabase client with service role key
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseServiceRoleKey) {
      throw new Error('Missing Supabase service role key')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      supabaseServiceRoleKey,
      {
        auth: { persistSession: false }
      }
    )

    console.log('Starting backup process...')
    
    const backupData: Record<string, any[]> = {}
    let totalRecords = 0

    // Backup each requested table
    for (const table of tables) {
      console.log(`Backing up table: ${table}`)
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(`Error backing up ${table}:`, error)
        backupData[table] = []
      } else {
        backupData[table] = data || []
        totalRecords += data?.length || 0
        console.log(`Found ${data?.length || 0} records in ${table}`)
      }
    }

    // Format bookings for human-readable text (if bookings are included)
    let formattedText = ''
    if (tables.includes('bookings') && backupData.bookings) {
      formattedText = backupData.bookings.map((booking: any, index: number) => {
        return `
Bokning #${booking.id || index + 1}
Namn: ${booking.name || 'Okänd'}
E-post: ${booking.email || 'Saknas'}
Telefon: ${booking.phone || 'Saknas'}
Typ: ${booking.type || 'laundry'}
Datum: ${booking.date || 'Saknas'}
Tid: ${booking.start_time || 'Saknas'} - ${booking.end_time || 'Saknas'}
Lägenhet: ${booking.apartment || 'Saknas'}
Våning: ${booking.floor || 'Saknas'}
Status: ${booking.status || 'pending'}
Meddelande: ${booking.message || 'Inget'}
Skapad: ${booking.created_at ? new Date(booking.created_at).toLocaleString('sv-SE') : 'Okänt'}
----------------------------------------`
      }).join('\n')
    }

    // Prepare backup content
    const timestamp = new Date().toISOString().split('T')[0]
    const backupContent = {
      timestamp: new Date().toISOString(),
      tables: tables,
      totalRecords: totalRecords,
      data: backupData
    }

    // Get backup email address
    const backupEmail = customEmail || Deno.env.get('BACKUP_EMAIL')
    if (!backupEmail) {
      throw new Error('No backup email configured')
    }

    // Prepare email content
    const subject = `Bokningsbackup - ${new Date().toLocaleDateString('sv-SE')}`
    const textContent = `
Här är en backup av databasen skapad ${new Date().toLocaleString('sv-SE')}

Tabeller som backades upp: ${tables.join(', ')}
Totalt antal poster: ${totalRecords}

${formattedText || 'Ingen data att visa i textformat.'}

JSON-data är bifogad som fil.
    `.trim()

    // Create HTML version
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Backup Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .stats { margin: 20px 0; }
        .data { background: #f9f9f9; padding: 15px; border-left: 4px solid #007cba; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Database Backup Report</h1>
        <p><strong>Datum:</strong> ${new Date().toLocaleString('sv-SE')}</p>
        <p><strong>Tabeller:</strong> ${tables.join(', ')}</p>
        <p><strong>Totalt antal poster:</strong> ${totalRecords}</p>
    </div>
    
    <div class="stats">
        ${Object.entries(backupData).map(([table, data]) => 
          `<p><strong>${table}:</strong> ${data.length} poster</p>`
        ).join('')}
    </div>
    
    ${formattedText ? `
    <div class="data">
        <h3>📋 Bokningsdetaljer</h3>
        <pre>${formattedText}</pre>
    </div>
    ` : ''}
    
    <p><em>Fullständig JSON-data är bifogad som separat fil.</em></p>
</body>
</html>
    `.trim()

    // Call send-email Edge Function
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: backupEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        type: 'backup-notification',
        // For now, we can't easily send attachments via our simple SMTP function
        // but the important data is in the HTML/text content
      })
    })

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text()
      throw new Error(`Failed to send backup email: ${emailError}`)
    }

    console.log('Backup email sent successfully!')

    // Optionally store backup in Supabase Storage for future reference
    try {
      const { error: storageError } = await supabase.storage
        .from('backups')
        .upload(
          `backup-${timestamp}.json`,
          JSON.stringify(backupContent, null, 2),
          {
            contentType: 'application/json',
            cacheControl: '3600'
          }
        )

      if (storageError) {
        console.warn('Could not store backup file:', storageError)
      } else {
        console.log('Backup file stored in Supabase Storage')
      }
    } catch (storageErr) {
      console.warn('Storage backup failed:', storageErr)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Backup skapad och skickad via e-post',
        bookingCount: backupData.bookings?.length || 0,
        totalRecords,
        tables: tables,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating backup:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create backup',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 