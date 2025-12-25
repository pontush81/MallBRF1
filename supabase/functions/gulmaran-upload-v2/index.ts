import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadResponse {
  documentId: string;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Starting fast document upload (async architecture)...');

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with anon key for user auth verification
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Authenticated user: ${user.email}`);

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const docDate = formData.get('docDate') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📁 Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 50MB.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine file type - expanded support
    let filetype = 'txt';
    if (file.type === 'application/pdf') filetype = 'pdf';
    else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') filetype = 'docx';
    else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') filetype = 'xlsx';
    else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') filetype = 'pptx';
    else if (file.type === 'text/csv') filetype = 'csv';
    else if (file.type === 'text/html') filetype = 'html';
    else if (file.type === 'application/rtf') filetype = 'rtf';
    else if (file.type === 'application/epub+zip') filetype = 'epub';

    console.log(`📄 Detected file type: ${filetype}`);

    // Generate storage path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const storagePath = `${user.id}/${timestamp}-${file.name}`;

    // Calculate simple checksum for deduplication (avoid memory issues with large files)
    console.log('🔐 Calculating metadata-based checksum...');
    const checksumData = `${file.name}-${file.size}-${file.type}-${user.id}`;
    const checksumBuffer = new TextEncoder().encode(checksumData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', checksumBuffer);
    const checksum = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log(`✅ Checksum calculated: ${checksum.substring(0, 16)}...`);

    // Check for duplicate files
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id, title, filename, processing_status')
      .eq('checksum', checksum)
      .eq('uploaded_by', user.id)
      .single();

    if (existingDoc) {
      console.log(`⚠️ Duplicate file detected: ${existingDoc.filename}`);
      return new Response(JSON.stringify({ 
        error: `File already exists: "${existingDoc.title}" (${existingDoc.filename})`,
        existingDocumentId: existingDoc.id,
        status: existingDoc.processing_status
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload file to storage (stream the file directly without reading into memory)
    console.log('☁️ Uploading to storage...');
    let uploadError: any = null;
    
    try {
      // Use the File object directly for streaming upload
      const { error } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });
      uploadError = error;
    } catch (streamError) {
      console.error('Stream upload failed, trying buffer method:', streamError);
      
      // Fallback to buffer method if streaming fails
      try {
        const fileBuffer = await file.arrayBuffer();
        console.log(`📊 File buffer size: ${fileBuffer.byteLength} bytes`);
        
        const { error } = await supabase.storage
          .from('documents')
          .upload(storagePath, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });
        uploadError = error;
      } catch (bufferError) {
        console.error('Buffer upload also failed:', bufferError);
        throw new Error(`Both streaming and buffer upload failed: ${bufferError.message}`);
      }
    }

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log('✅ File uploaded to storage');

    // Create document record - ONLY metadata, no processing
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        title: title || file.name,
        filename: file.name,
        filetype,
        doc_date: docDate ? new Date(docDate).toISOString().split('T')[0] : null,
        storage_path: storagePath,
        file_size: file.size,
        checksum,
        uploaded_by: user.id,
        processing_status: 'pending', // Will be processed by background function
        processing_attempts: 0,
        visibility: 'admin',
      })
      .select()
      .single();

    if (docError) {
      console.error('Document creation error:', docError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([storagePath]);
      throw new Error(`Failed to create document record: ${docError.message}`);
    }

    console.log(`📝 Document record created: ${document.id}`);
    console.log('🚀 Document queued for background processing');

    // Trigger immediate processing (optional - processor will pick it up anyway)
    try {
      console.log('🔔 Triggering background processing...');
      const triggerResponse = await fetch(`${supabaseUrl}/functions/v1/gulmaran-process-documents-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: document.id }),
      });
      
      if (triggerResponse.ok) {
        console.log('✅ Background processing triggered successfully');
      } else {
        const errorText = await triggerResponse.text();
        console.log(`⚠️ Background processing trigger failed (${triggerResponse.status}): ${errorText}`);
      }
    } catch (triggerError) {
      console.log('⚠️ Could not trigger immediate processing (will be picked up by scheduler):', triggerError.message);
    }

    const response: UploadResponse = {
      documentId: document.id,
      message: `File uploaded successfully! Processing will begin shortly. You can monitor progress in the document list.`,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Upload function error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Upload failed',
      details: 'Check server logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
