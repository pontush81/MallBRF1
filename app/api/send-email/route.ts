import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin, Accept, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

interface EmailRequest {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html, attachments }: EmailRequest = await request.json();

    // Validate required fields
    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, text' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.error('Missing Resend API key');
      return NextResponse.json(
        { error: 'Resend email service not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Sending email via Resend...');
    console.log('To:', to);
    console.log('Subject:', subject);

    // Prepare attachments for Resend format
    let resendAttachments: Array<{filename: string, content: Buffer | string}> = [];
    
    if (attachments && attachments.length > 0) {
      resendAttachments = attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'utf-8') // Convert string content to Buffer
      }));
    }

    // Send email using Resend
    const emailData = await resend.emails.send({
      from: 'MallBRF Backup <noreply@resend.dev>', // Use Resend's default domain for now
      to: [to],
      subject: subject,
      text: text,
      html: html || text.replace(/\n/g, '<br>'),
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    });

    console.log('✅ Email sent successfully via Resend:', emailData.data?.id);

    return NextResponse.json({
      success: true,
      message: 'Email sent via Resend successfully',
      messageId: emailData.data?.id,
      to: to,
      subject: subject,
      service: 'Resend'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Resend email error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown email error',
      details: error instanceof Error ? error.stack : undefined
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
} 