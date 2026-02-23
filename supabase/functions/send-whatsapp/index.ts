import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppRequest {
  to: string
  message: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message }: WhatsAppRequest = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('Missing WhatsApp credentials')
      return new Response(
        JSON.stringify({ error: 'WhatsApp service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📱 Sending WhatsApp message to: ${to}`)

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', JSON.stringify(data))
      return new Response(
        JSON.stringify({ error: data.error?.message || 'WhatsApp API error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`WhatsApp message sent to ${to} (id: ${data.messages?.[0]?.id})`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: data.messages?.[0]?.id,
        to: to,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WhatsApp sending error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown WhatsApp error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
