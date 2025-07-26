import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  text: string
  html?: string
  type: 'booking-confirmation' | 'user-notification' | 'backup-notification'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Basic authorization check (same as original Express route)
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
    const { to, subject, text, html, type }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, text' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const SMTP_USER = Deno.env.get('SMTP_USER')
    const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER

    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error('Missing SMTP credentials')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create SMTP client
    const client = new SmtpClient()

    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USER,
      password: SMTP_PASSWORD,
    })

    // Send email
    await client.send({
      from: FROM_EMAIL!,
      to: to,
      subject: subject,
      content: html || text,
      html: html ? html : undefined,
    })

    await client.close()

    console.log(`Email sent successfully: ${type} to ${to}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        type: type
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 