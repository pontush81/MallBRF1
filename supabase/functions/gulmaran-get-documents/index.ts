import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client for user authentication
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Client for database operations (service role)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get and verify user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('❌ No authorization header')
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token)
    
    if (authError || !user) {
      console.log('❌ Invalid token:', authError?.message)
      return new Response('Invalid token', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    console.log('✅ User authenticated:', user.email)

    // Check if user exists and has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, isactive')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.log('❌ User not found in database:', userError?.message)
      return new Response('User not found', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    if (userData.role !== 'admin' || !userData.isactive) {
      console.log('❌ User not admin or inactive:', userData)
      return new Response('Access denied - admin role required', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    console.log('✅ User has admin access')

    // Fetch documents using service role
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (docsError) {
      console.error('❌ Database error:', docsError)
      return new Response('Database error', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    console.log('📊 Fetched documents:', documents?.length || 0)

    return new Response(JSON.stringify(documents || []), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    })

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
