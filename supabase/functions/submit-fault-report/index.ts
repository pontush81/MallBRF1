import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://gulmaran.com',
  'https://www.gulmaran.com',
  'https://mallbrf1.vercel.app',
  'https://mall-brf-1-git-development-pontush81s-projects.vercel.app',
]

function getCorsHeaders(origin?: string | null) {
  const requestOrigin = origin || ''
  const allowOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// Locations must match frontend
const VALID_LOCATIONS = ['lagenhet', 'gastlagenhet', 'trappuppgang', 'tvattstuga', 'kallare', 'parkering', 'ellagarden', 'ovrigt']

const LOCATION_LABELS: Record<string, string> = {
  lagenhet: 'I lägenheten', gastlagenhet: 'Gästlägenhet', trappuppgang: 'Trappuppgång', tvattstuga: 'Tvättstuga',
  kallare: 'Källare', parkering: 'Parkering', ellagarden: 'Ellagården', ovrigt: 'Övrigt',
}

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY not configured, skipping verification')
    return true
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
    })
    const data = await response.json()
    if (!data.success) {
      console.log('Turnstile verification failed:', data['error-codes'])
    }
    return data.success === true
  } catch (err) {
    console.error('Turnstile verification error:', err)
    return false
  }
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const {
      apartment_number,
      contact_email,
      contact_phone,
      category,
      location,
      description,
      turnstileToken,
      honeypot,
    } = body

    // Layer 1: Honeypot check
    if (honeypot && honeypot.trim() !== '') {
      console.log('Honeypot triggered')
      return new Response(
        JSON.stringify({ error: 'Ogiltig indata.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Layer 2: Turnstile verification
    const clientIp = getClientIp(req)
    if (turnstileToken) {
      const isHuman = await verifyTurnstile(turnstileToken, clientIp)
      if (!isHuman) {
        return new Response(
          JSON.stringify({ error: 'Verifieringen misslyckades. Försök igen.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // No token — allow but log (graceful degradation if Turnstile CDN is down)
      console.warn('No Turnstile token provided, allowing with other protections')
    }

    // Layer 3: Server-side rate limit (real IP)
    const ipHash = await hashIp(clientIp)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error: rateLimitError } = await supabase
      .from('fault_reports')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', twentyFourHoursAgo)

    if (!rateLimitError && (count || 0) >= 5) {
      console.log(`Rate limit exceeded for IP hash: ${ipHash}`)
      return new Response(
        JSON.stringify({ error: 'Du har nått maxgränsen (5 anmälningar per dag). Försök igen imorgon.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validation
    if (!apartment_number || !location || !description?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Alla obligatoriska fält måste fyllas i.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Beskrivningen måste vara minst 10 tecken.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!VALID_LOCATIONS.includes(location)) {
      return new Response(
        JSON.stringify({ error: 'Ogiltig plats.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
      return new Response(
        JSON.stringify({ error: 'Ogiltig e-postadress.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DB insert
    const { data, error: insertError } = await supabase
      .from('fault_reports')
      .insert({
        apartment_number,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        category: 'ovrigt',
        location,
        description: description.trim(),
        ip_hash: ipHash,
        status: 'new',
      })
      .select()
      .single()

    if (insertError) {
      console.error('DB insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Kunde inte skicka felanmälan. Försök igen.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const report = data

    // Send notifications (fire-and-forget, don't block response)
    const notificationPromises: Promise<void>[] = []

    // Admin notification(s)
    notificationPromises.push((async () => {
      try {
        const { data: settings } = await supabase
          .from('notification_settings')
          .select('email_notifications, fault_report_notifications, admin_email, fault_report_emails')
          .limit(1)
          .single()

        if (!settings?.email_notifications || !settings?.fault_report_notifications) return

        // Build list of recipients: fault_report_emails array, falling back to admin_email
        const recipients: string[] = settings.fault_report_emails?.length
          ? settings.fault_report_emails
          : settings.admin_email ? [settings.admin_email] : []

        const emailSubject = `Ny felanmälan: ${report.reference_number} - ${LOCATION_LABELS[location] || location}`
        const emailText = `En ny felanmälan har inkommit.\n\nReferensnummer: ${report.reference_number}\nLägenhet: ${apartment_number}\nPlats: ${LOCATION_LABELS[location] || location}\nBeskrivning: ${description}\n\nLogga in för att hantera ärendet.`
        const emailHtml = `<h2>Ny felanmälan</h2><p><strong>Referensnummer:</strong> ${report.reference_number}</p><p><strong>Lägenhet:</strong> ${apartment_number}</p><p><strong>Plats:</strong> ${LOCATION_LABELS[location] || location}</p><p><strong>Beskrivning:</strong><br/>${description}</p><p><a href="https://www.gulmaran.com/admin/felanmalningar">Logga in för att hantera ärendet</a></p>`

        for (const recipient of recipients) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: recipient,
                subject: emailSubject,
                text: emailText,
                html: emailHtml,
                type: 'user-notification',
              }),
            })
          } catch (sendErr) {
            console.error(`Failed to send to ${recipient}:`, sendErr)
          }
        }
      } catch (err) {
        console.error('Admin notification failed:', err)
      }
    })())

    // WhatsApp notification(s)
    notificationPromises.push((async () => {
      try {
        const { data: waSettings } = await supabase
          .from('notification_settings')
          .select('whatsapp_notifications, whatsapp_phones')
          .limit(1)
          .single()

        if (!waSettings?.whatsapp_notifications || !waSettings?.whatsapp_phones?.length) return

        const WHATSAPP_TEMPLATE = Deno.env.get('WHATSAPP_TEMPLATE_NAME')
        const waMessage = `Ny felanmälan (${report.reference_number})\nLägenhet: ${apartment_number}\nPlats: ${LOCATION_LABELS[location] || location}\nBeskrivning: ${description}`

        for (const phone of waSettings.whatsapp_phones) {
          try {
            const payload: Record<string, unknown> = { to: phone }

            if (WHATSAPP_TEMPLATE) {
              // Use template message (works in production without prior opt-in)
              payload.template = {
                name: WHATSAPP_TEMPLATE,
                language: 'sv',
                parameters: [
                  report.reference_number,
                  apartment_number,
                  LOCATION_LABELS[location] || location,
                  description.substring(0, 100),
                ],
              }
            } else {
              // Free text (works in dev mode after recipient opt-in)
              payload.message = waMessage
            }

            await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            })
          } catch (sendErr) {
            console.error(`Failed to send WhatsApp to ${phone}:`, sendErr)
          }
        }
      } catch (err) {
        console.error('WhatsApp notification failed:', err)
      }
    })())

    // Reporter confirmation
    if (contact_email) {
      notificationPromises.push((async () => {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: contact_email,
              subject: `Bekräftelse felanmälan ${report.reference_number}`,
              text: `Tack för din felanmälan!\n\nDitt referensnummer är: ${report.reference_number}\n\nDu kan följa statusen på din anmälan här:\nhttps://www.gulmaran.com/felanmalan/status?ref=${report.reference_number}\n\nVi återkommer så snart vi har åtgärdat felet.\n\nMed vänlig hälsning,\nBRF Gulmåran`,
              html: `<h2>Tack för din felanmälan!</h2><p><strong>Ditt referensnummer:</strong> ${report.reference_number}</p><p><strong>Plats:</strong> ${LOCATION_LABELS[location] || location}</p><p><strong>Beskrivning:</strong><br/>${description}</p><hr/><p><a href="https://www.gulmaran.com/felanmalan/status?ref=${report.reference_number}">Följ statusen på din anmälan</a></p><p>Vi återkommer så snart vi har åtgärdat felet.</p><p>Med vänlig hälsning,<br/>BRF Gulmåran</p>`,
              type: 'user-notification',
            }),
          })
        } catch (err) {
          console.error('Reporter confirmation failed:', err)
        }
      })())
    }

    // Wait for emails (with timeout so we don't hang)
    await Promise.race([
      Promise.allSettled(notificationPromises),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ])

    console.log(`Fault report created: ${report.reference_number} (IP hash: ${ipHash})`)

    return new Response(
      JSON.stringify({ success: true, data: report }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('submit-fault-report error:', error)
    return new Response(
      JSON.stringify({ error: 'Ett oväntat fel uppstod.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
