import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

    // Get Gmail credentials from environment
    const emailUser = process.env.EMAIL_USER; // pontus.hberg@gmail.com
    const emailPassword = process.env.EMAIL_APP_PASSWORD; // same app password
    
    if (!emailUser || !emailPassword) {
      console.error('Missing Gmail credentials');
      return NextResponse.json(
        { error: 'Gmail email service not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Sending email via Gmail SMTP...');
    console.log('From:', emailUser);
    console.log('To:', to);
    console.log('Subject:', subject);

    // Create Gmail transporter (same config as original server/routes/backup.js)
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter
    await transporter.verify();

    // Prepare email content with attachments
    let emailContent = text;
    
    if (attachments && attachments.length > 0) {
      emailContent += '\n\n=== BACKUP DATA ATTACHED ===\n';
      attachments.forEach(att => {
        emailContent += `\n📎 ${att.filename}\n`;
        if (att.contentType === 'application/json') {
          // Include the JSON backup data inline
          emailContent += '\n' + att.content + '\n';
        }
      });
    }

    // Send email
    const info = await transporter.sendMail({
      from: emailUser,
      to: to,
      subject: subject,
      text: emailContent,
      html: html || emailContent.replace(/\n/g, '<br>'),
    });

    console.log('✅ Email sent successfully via Gmail:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Email sent via Gmail successfully',
      messageId: info.messageId,
      to: to,
      subject: subject,
      from: emailUser
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown email error',
      details: error instanceof Error ? error.stack : undefined
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
} 