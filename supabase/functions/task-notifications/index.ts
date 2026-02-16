import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'TASK_ASSIGNED' | 'TASK_DUE_REMINDER' | 'TASK_OVERDUE' | 'TASK_COMPLETED';
  taskId: string;
  assigneeId?: string;
  assignedBy?: string;
  taskName?: string;
  dueDate?: string;
  description?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { type, taskId, assigneeId, assignedBy, taskName, dueDate, description }: NotificationRequest = await req.json()

    console.log(`📧 Processing notification: ${type} for task ${taskId}`)

    // Get assignee details
    let recipientEmail = ''
    let recipientName = ''
    
    if (assigneeId) {
      const { data: assignee } = await supabase.auth.admin.getUserById(assigneeId)
      if (assignee?.user) {
        recipientEmail = assignee.user.email || ''
        recipientName = assignee.user.user_metadata?.full_name || 
                       assignee.user.user_metadata?.name || 
                       recipientEmail.split('@')[0]
      }
    }

    // Get assigner details if available
    let assignerName = 'Systemet'
    if (assignedBy) {
      const { data: assigner } = await supabase.auth.admin.getUserById(assignedBy)
      if (assigner?.user) {
        assignerName = assigner.user.user_metadata?.full_name || 
                      assigner.user.user_metadata?.name || 
                      assigner.user.email?.split('@')[0] || 'Systemet'
      }
    }

    // Check user notification preferences
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', assigneeId)
      .single()

    const shouldSendEmail = preferences?.email_notifications !== false
    const shouldSendInApp = preferences?.in_app_notifications !== false

    // Generate email template based on notification type
    const template = generateEmailTemplate(type, {
      taskName: taskName || 'Underhållsuppgift',
      dueDate,
      description,
      recipientName,
      assignerName,
      taskId
    })

    let emailSent = false
    let emailError = null

    // Send email notification if enabled
    if (shouldSendEmail && recipientEmail) {
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: recipientEmail,
            subject: template.subject,
            text: template.subject,
            html: template.html,
            type: 'task-notification',
          }),
        })

        if (emailResponse.ok) {
          emailSent = true
          console.log(`✅ Email sent successfully to ${recipientEmail}`)
        } else {
          const errorData = await emailResponse.text()
          emailError = `Email failed: ${errorData}`
          console.error(`❌ Email failed:`, errorData)
        }
      } catch (error) {
        emailError = `Email error: ${error.message}`
        console.error('❌ Email sending error:', error)
      }
    }

    // Log notification to database
    const notificationLogEntry = {
      task_id: taskId,
      recipient_id: assigneeId,
      notification_type: type,
      channel: 'EMAIL',
      status: emailSent ? 'SENT' : 'FAILED',
      error_message: emailError,
      metadata: {
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        assigner_name: assignerName,
        task_name: taskName,
        due_date: dueDate
      }
    }

    const { error: logError } = await supabase
      .from('notification_log')
      .insert(notificationLogEntry)

    if (logError) {
      console.error('❌ Failed to log notification:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailSent,
        error: emailError
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Notification function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateEmailTemplate(type: string, data: any): EmailTemplate {
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1976d2; margin: 0;">🏢 BRF Gulmåran</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Underhållshantering</p>
        </div>
  `

  const baseFooter = `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            Med vänliga hälsningar,<br>
            <strong>BRF Gulmåran Underhållssystem</strong>
          </p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
            Detta är ett automatiskt meddelande från underhållssystemet.
          </p>
        </div>
      </div>
    </div>
  `

  switch (type) {
    case 'TASK_ASSIGNED':
      return {
        subject: `🔧 Ny underhållsuppgift tilldelad: ${data.taskName}`,
        html: `${baseStyle}
          <h2 style="color: #1976d2; margin-bottom: 20px;">📋 Ny uppgift tilldelad</h2>
          <p>Hej ${data.recipientName}!</p>
          <p>Du har blivit tilldelad en ny underhållsuppgift av <strong>${data.assignerName}</strong>.</p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1565c0;">📝 Uppgiftsdetaljer</h3>
            <p style="margin: 5px 0;"><strong>Uppgift:</strong> ${data.taskName}</p>
            ${data.dueDate ? `<p style="margin: 5px 0;"><strong>Förfaller:</strong> ${data.dueDate}</p>` : ''}
            ${data.description ? `<p style="margin: 5px 0;"><strong>Beskrivning:</strong> ${data.description}</p>` : ''}
          </div>
          
          <p>Logga in i underhållssystemet för att se alla detaljer och markera uppgiften som slutförd när den är klar.</p>
          ${baseFooter}`
      }

    case 'TASK_DUE_REMINDER':
      return {
        subject: `⏰ Påminnelse: ${data.taskName} förfaller snart`,
        html: `${baseStyle}
          <h2 style="color: #f57c00; margin-bottom: 20px;">⏰ Uppgift förfaller snart</h2>
          <p>Hej ${data.recipientName}!</p>
          <p>Detta är en påminnelse om att din underhållsuppgift förfaller snart.</p>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f57c00;">
            <h3 style="margin: 0 0 10px 0; color: #e65100;">📝 Uppgiftsdetaljer</h3>
            <p style="margin: 5px 0;"><strong>Uppgift:</strong> ${data.taskName}</p>
            <p style="margin: 5px 0;"><strong>Förfaller:</strong> ${data.dueDate}</p>
            ${data.description ? `<p style="margin: 5px 0;"><strong>Beskrivning:</strong> ${data.description}</p>` : ''}
          </div>
          
          <p>Vänligen slutför uppgiften så snart som möjligt och markera den som klar i systemet.</p>
          ${baseFooter}`
      }

    case 'TASK_OVERDUE':
      return {
        subject: `🚨 FÖRSENAD: ${data.taskName} är försenad`,
        html: `${baseStyle}
          <h2 style="color: #d32f2f; margin-bottom: 20px;">🚨 Försenad uppgift</h2>
          <p>Hej ${data.recipientName}!</p>
          <p><strong>VIKTIGT:</strong> Din underhållsuppgift är nu försenad och behöver omedelbar uppmärksamhet.</p>
          
          <div style="background: #ffebee; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <h3 style="margin: 0 0 10px 0; color: #c62828;">📝 Försenad uppgift</h3>
            <p style="margin: 5px 0;"><strong>Uppgift:</strong> ${data.taskName}</p>
            <p style="margin: 5px 0;"><strong>Skulle varit klar:</strong> ${data.dueDate}</p>
            ${data.description ? `<p style="margin: 5px 0;"><strong>Beskrivning:</strong> ${data.description}</p>` : ''}
          </div>
          
          <p>Kontakta styrelsen om det finns problem med att slutföra uppgiften i tid.</p>
          ${baseFooter}`
      }

    case 'TASK_COMPLETED':
      return {
        subject: `✅ Uppgift slutförd: ${data.taskName}`,
        html: `${baseStyle}
          <h2 style="color: #388e3c; margin-bottom: 20px;">✅ Uppgift slutförd</h2>
          <p>Hej ${data.recipientName}!</p>
          <p>Bra jobbat! Din underhållsuppgift har markerats som slutförd.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #388e3c;">
            <h3 style="margin: 0 0 10px 0; color: #2e7d32;">📝 Slutförd uppgift</h3>
            <p style="margin: 5px 0;"><strong>Uppgift:</strong> ${data.taskName}</p>
            ${data.description ? `<p style="margin: 5px 0;"><strong>Beskrivning:</strong> ${data.description}</p>` : ''}
          </div>
          
          <p>Tack för ditt bidrag till att hålla BRF Gulmåran i toppskick! 🏢</p>
          ${baseFooter}`
      }

    default:
      return {
        subject: `🔔 Underhållsnotifiering: ${data.taskName}`,
        html: `${baseStyle}
          <h2 style="color: #1976d2;">🔔 Underhållsnotifiering</h2>
          <p>Hej ${data.recipientName}!</p>
          <p>Du har en notifiering angående uppgiften: <strong>${data.taskName}</strong></p>
          ${baseFooter}`
      }
  }
}