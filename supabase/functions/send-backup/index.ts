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
  format?: 'json' | 'excel' | 'pdf'
  sendEmail?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // No authorization check needed - Edge Function uses Service Role Key internally
    console.log('Starting backup process...')

    // Parse request parameters (support both GET and POST)
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';
    const sendEmailParam = url.searchParams.get('sendEmail') === 'true';
    
    const requestBody: BackupRequest = req.method === 'POST' ? await req.json() : {};
    const { 
      tables = ['bookings'], 
      includeFiles = false, 
      customEmail,
      format: bodyFormat,
      sendEmail: bodySendEmail
    } = requestBody;
    
    // URL parameters take precedence over body parameters
    const finalFormat = format || bodyFormat || 'json';
    const finalSendEmail = sendEmailParam || bodySendEmail || false;

    // Initialize Supabase client with service role key (same as original)
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

    const backupData: Record<string, any[]> = {}
    let totalRecords = 0

    // Backup each requested table
    for (const table of tables) {
      console.log(`Backing up table: ${table}`)
      
      let query = supabase.from(table).select('*');
      
      // Use appropriate sort column based on table
      if (table === 'bookings') {
        query = query.order('startdate', { ascending: false });
      } else {
        query = query.order('createdat', { ascending: false });
      }
      
      const { data, error } = await query;

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
Namn: ${booking.name || 'Okand'}
E-post: ${booking.email || 'Saknas'}
Telefon: ${booking.phone || 'Saknas'}
Typ: ${booking.type || 'laundry'}
Datum: ${booking.date || 'Saknas'}
Tid: ${booking.start_time || 'Saknas'} - ${booking.end_time || 'Saknas'}
Lagenhet: ${booking.apartment || 'Saknas'}
Vaning: ${booking.floor || 'Saknas'}
Status: ${booking.status || 'pending'}
Meddelande: ${booking.message || 'Inget'}
Skapad: ${booking.createdat ? new Date(booking.createdat).toLocaleString('sv-SE') : 'Okant'}
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

    // Generate content based on format
    const fileContent = generateBackupContent(backupData, finalFormat, timestamp);
    const fileName = `backup-${timestamp}.${getFileExtension(finalFormat)}`;
    const contentType = getContentType(finalFormat);

    // If not sending email, return file for download
    if (!finalSendEmail) {
      return new Response(fileContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }

    // Get backup email address
    const backupEmail = customEmail || Deno.env.get('BACKUP_EMAIL')
    if (!backupEmail) {
      throw new Error('No backup email configured')
    }

    // Prepare email content
    const subject = `Bokningsbackup - ${new Date().toLocaleDateString('sv-SE')}`
    const textContent = `
Har ar en backup av databasen skapad ${new Date().toLocaleString('sv-SE')}

Tabeller som backades upp: ${tables.join(', ')}
Totalt antal poster: ${totalRecords}

${formattedText || 'Ingen data att visa i textformat.'}

JSON-data ar bifogad som fil.
    `.trim()

    // Call send-email Edge Function
    const authHeader = `Bearer ${supabaseServiceRoleKey}`
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
        type: 'backup-notification'
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

function generateBackupContent(backupData: Record<string, any[]>, format: string, timestamp: string): Uint8Array {
  switch (format) {
    case 'excel':
      return generateExcelBackup(backupData, timestamp);
    case 'pdf':
      return generatePdfBackup(backupData, timestamp);
    case 'json':
    default:
      return new TextEncoder().encode(JSON.stringify(backupData, null, 2));
  }
}

function generateExcelBackup(backupData: Record<string, any[]>, timestamp: string): Uint8Array {
  // Simple CSV format for Excel compatibility
  let content = `BACKUP RAPPORT - ${new Date().toLocaleDateString('sv-SE')}\n`;
  content += `Skapad: ${timestamp}\n\n`;
  
  Object.entries(backupData).forEach(([tableName, records]) => {
    content += `\n${tableName.toUpperCase()} (${records.length} poster)\n`;
    content += '='.repeat(50) + '\n';
    
    if (records.length > 0) {
      // Header row
      const headers = Object.keys(records[0]);
      content += headers.join(',') + '\n';
      
      // Data rows
      records.forEach(record => {
        const values = headers.map(header => {
          const value = record[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        content += values.join(',') + '\n';
      });
    }
    content += '\n';
  });
  
  return new TextEncoder().encode(content);
}

function generatePdfBackup(backupData: Record<string, any[]>, timestamp: string): Uint8Array {
  // For now, generate text content that could be converted to PDF
  let content = `BACKUP RAPPORT\n`;
  content += `Skapad: ${timestamp}\n`;
  content += `Datum: ${new Date().toLocaleDateString('sv-SE')}\n\n`;
  
  Object.entries(backupData).forEach(([tableName, records]) => {
    content += `${tableName.toUpperCase()}\n`;
    content += '='.repeat(30) + '\n';
    content += `Antal poster: ${records.length}\n\n`;
    
    if (records.length > 0 && tableName === 'bookings') {
      records.forEach((booking: any, index: number) => {
        content += `${index + 1}. ${booking.name || 'N/A'}\n`;
        content += `   E-post: ${booking.email || 'N/A'}\n`;
        content += `   Datum: ${booking.startdate || 'N/A'} - ${booking.enddate || 'N/A'}\n`;
        content += `   Status: ${booking.status || 'N/A'}\n`;
        content += `   Parkering: ${booking.parkering ? 'Ja' : 'Nej'}\n`;
        if (booking.notes) {
          content += `   Anteckningar: ${booking.notes}\n`;
        }
        content += '\n';
      });
    }
    content += '\n';
  });
  
  return new TextEncoder().encode(content);
}

function getFileExtension(format: string): string {
  switch (format) {
    case 'excel': return 'csv';
    case 'pdf': return 'txt'; // Simple text for now, could be enhanced to actual PDF
    case 'json':
    default: return 'json';
  }
}

function getContentType(format: string): string {
  switch (format) {
    case 'excel': return 'text/csv';
    case 'pdf': return 'text/plain'; // Would be 'application/pdf' for real PDF
    case 'json':
    default: return 'application/json';
  }
}