import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // Get document ID from request body
    const { documentId } = await req.json()
    
    if (!documentId) {
      return new Response('Document ID required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    console.log('🗑️ Deleting document:', documentId)

    // Get document info first (for storage cleanup)
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching document:', fetchError)
      return new Response('Document not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    // Delete chunks first (foreign key constraint)
    const { error: chunksError } = await supabase
      .from('chunks')
      .delete()
      .eq('document_id', documentId)

    if (chunksError) {
      console.error('❌ Error deleting chunks:', chunksError)
      return new Response('Failed to delete document chunks', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Delete document record
    const { error: docError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (docError) {
      console.error('❌ Error deleting document:', docError)
      return new Response('Failed to delete document', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Delete file from storage
    if (document.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('gulmaran-documents')
        .remove([document.storage_path])

      if (storageError) {
        console.warn('⚠️ Warning: Failed to delete file from storage:', storageError)
        // Don't fail the whole operation for storage errors
      }
    }

    console.log('✅ Document deleted successfully:', documentId)

    return new Response(JSON.stringify({ success: true }), {
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
