import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer@6.9.12"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  text: string
  html?: string
  type?: string
  attachments?: Array<{
    filename: string
    content: number[] | string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, text, html, type, attachments }: EmailRequest = await req.json()

    if (!to || !subject || !text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const SMTP_USER = Deno.env.get('SMTP_USER')
    const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER

    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error('Missing SMTP credentials')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Sending email via Gmail SMTP to: ${to}`)
    console.log(`Subject: ${subject} | Type: ${type || 'general'}`)

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    })

    const mailOptions: any = {
      from: `BRF Gulmåran <${FROM_EMAIL}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || undefined,
    }

    if (attachments?.length) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: Array.isArray(att.content) ? Buffer.from(att.content) : att.content,
      }))
    }

    const info = await transporter.sendMail(mailOptions)

    console.log(`✅ Email sent to ${to} (messageId: ${info.messageId})`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
        to: to,
        subject: subject,
        type: type || 'general'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown email error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
