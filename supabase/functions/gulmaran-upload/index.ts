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

// Unstructured.io API integration for robust document processing
async function processWithUnstructured(fileBuffer: ArrayBuffer, filename: string): Promise<string> {
  const unstructuredApiKey = Deno.env.get('UNSTRUCTURED_API_KEY');
  
  if (!unstructuredApiKey) {
    console.log('⚠️ UNSTRUCTURED_API_KEY not found, falling back to basic parsing');
    throw new Error('Unstructured.io API key not configured');
  }

  try {
    console.log('🚀 Processing with Unstructured.io API...');
    console.log(`📄 File: ${filename}, Size: ${fileBuffer.byteLength} bytes`);
    
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
    formData.append('files', blob, filename);
    console.log('📦 FormData created successfully');
    
    // Configure processing strategy for better results
    formData.append('strategy', 'hi_res'); // Use high-resolution processing for better OCR
    formData.append('coordinates', 'true'); // Include coordinate information
    formData.append('pdf_infer_table_structure', 'true'); // Better table extraction
    
    // Try the correct Unstructured.io API endpoint (updated URL and headers)
    console.log('📡 Sending request to Unstructured.io...');
    const response = await fetch('https://api.unstructuredapp.io/general/v0/general', {
      method: 'POST',
      headers: {
        'unstructured-api-key': unstructuredApiKey,
        'Accept': 'application/json',
      },
      body: formData,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    console.log(`📡 Unstructured.io response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Unstructured.io API error:', response.status, errorText);
      throw new Error(`Unstructured.io API error: ${response.status} ${errorText}`);
    }

    const elements = await response.json();
    console.log(`📄 Unstructured.io returned ${elements.length} elements`);
    
    // Extract and combine text from all elements
    const extractedText = elements
      .filter((element: any) => element.text && element.text.trim())
      .map((element: any) => {
        // Include element type information for better context
        const elementType = element.type || 'text';
        const text = element.text.trim();
        
        // Add some structure markers for different element types
        if (elementType === 'Title') {
          return `# ${text}`;
        } else if (elementType === 'Header') {
          return `## ${text}`;
        } else if (elementType === 'Table') {
          return `[TABLE]\n${text}\n[/TABLE]`;
        } else if (elementType === 'ListItem') {
          return `• ${text}`;
        }
        
        return text;
      })
      .join('\n\n');

    console.log(`✅ Extracted ${extractedText.length} characters using Unstructured.io`);
    return extractedText;
    
  } catch (error) {
    console.error('💥 Unstructured.io processing failed:', error);
    throw error;
  }
}

// Fallback processing for when Unstructured.io is not available
async function processWithFallback(fileBuffer: ArrayBuffer, filename: string, filetype: string): Promise<string> {
  console.log('🔄 Using fallback processing...');
  
  try {
    if (filetype === 'txt') {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(fileBuffer);
      
    } else if (filetype === 'csv') {
      const decoder = new TextDecoder('utf-8');
      const csvText = decoder.decode(fileBuffer);
      // Convert CSV to readable text format
      const lines = csvText.split('\n');
      return lines.map(line => line.replace(/,/g, ' | ')).join('\n');
      
    } else if (filetype === 'pdf') {
      // Enhanced PDF fallback - multiple extraction strategies
      console.log('⚠️ Attempting enhanced PDF text extraction (fallback mode)');
      console.log(`📊 PDF file size: ${fileBuffer.byteLength} bytes`);
      
      try {
        // Strategy 1: Try UTF-8 decoding for text-based PDFs
        console.log('🔍 Strategy 1: UTF-8 text extraction...');
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const pdfText = decoder.decode(fileBuffer);
        
        // Look for readable text patterns in PDF
        let extractedText = '';
        
        // Method 1: Extract text from Tj commands (most common)
        const tjMatches = pdfText.match(/\([^)]*\)\s*Tj/g);
        if (tjMatches && tjMatches.length > 0) {
          console.log(`📄 Found ${tjMatches.length} Tj text commands`);
          extractedText = tjMatches
            .map(match => match.replace(/^\(/, '').replace(/\)\s*Tj$/, ''))
            .filter(text => text.length > 0 && !/^[\x00-\x1F\x7F-\xFF]*$/.test(text))
            .join(' ')
            .trim();
        }
        
        // Method 2: Extract from BT/ET blocks if Tj method didn't work
        if (extractedText.length < 50) {
          console.log('🔍 Trying BT/ET block extraction...');
          const textBlocks = pdfText.match(/BT\s+.*?ET/gs);
          if (textBlocks && textBlocks.length > 0) {
            console.log(`📄 Found ${textBlocks.length} text blocks`);
            extractedText = textBlocks
              .map(block => {
                // Clean up PDF commands
                return block
                  .replace(/BT\s+/g, '')
                  .replace(/\s+ET/g, '')
                  .replace(/\/\w+\s+\d+\s+Tf/g, '') // Font commands
                  .replace(/\d+(\.\d+)?\s+\d+(\.\d+)?\s+Td/g, '') // Position commands
                  .replace(/\d+(\.\d+)?\s+TL/g, '') // Leading commands
                  .replace(/\([^)]*\)\s*Tj/g, (match) => {
                    return match.replace(/^\(/, '').replace(/\)\s*Tj$/, '') + ' ';
                  })
                  .trim();
              })
              .filter(text => text.length > 0)
              .join(' ')
              .trim();
          }
        }
        
        // Method 3: Simple text extraction as last resort
        if (extractedText.length < 50) {
          console.log('🔍 Trying simple text pattern extraction...');
          // Look for readable ASCII text sequences
          const readableText = pdfText.match(/[a-zA-ZåäöÅÄÖ\s.,!?;:()"-]{10,}/g);
          if (readableText && readableText.length > 0) {
            extractedText = readableText
              .filter(text => text.trim().length > 10)
              .join(' ')
              .trim();
          }
        }
        
        console.log(`📝 Extracted text length: ${extractedText.length} characters`);
        
        if (extractedText.length > 50) {
          console.log(`✅ PDF fallback extraction successful: ${extractedText.length} characters`);
          console.log(`📄 Sample: "${extractedText.substring(0, 100)}..."`);
          return extractedText;
        }
        
        throw new Error('No readable text found in PDF - may be image-based or encrypted');
        
      } catch (error) {
        console.error('❌ Enhanced PDF extraction failed:', error);
        throw new Error(`PDF processing failed: ${error.message}. This PDF may require OCR (Optical Character Recognition). Please configure UNSTRUCTURED_API_KEY for advanced PDF processing or convert to TXT format.`);
      }
      
    } else if (filetype === 'docx') {
      throw new Error('DOCX processing requires Unstructured.io API. Please configure UNSTRUCTURED_API_KEY or convert to TXT format.');
      
    } else if (filetype === 'xlsx') {
      throw new Error('XLSX processing requires Unstructured.io API. Please configure UNSTRUCTURED_API_KEY or convert to CSV format.');
      
    } else {
      throw new Error(`Unsupported file type: ${filetype}. Supported types: TXT, CSV (fallback) or configure Unstructured.io for PDF, DOCX, XLSX.`);
    }
    
  } catch (error) {
    console.error(`❌ Fallback processing failed for ${filetype}:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let document: any = null; // Declare document variable outside try block for error handling
  
  try {
    console.log('📋 Starting document upload and processing...');

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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

    // Validate file size (max 50MB for Unstructured.io)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 50MB.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine file type - expanded support with Unstructured.io
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

    // Get file buffer for processing
    const fileBuffer = await file.arrayBuffer();

    // Calculate file checksum for deduplication
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const checksum = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Check for duplicate files
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id, title, filename')
      .eq('checksum', checksum)
      .eq('uploaded_by', user.id)
      .single();

    if (existingDoc) {
      console.log(`⚠️ Duplicate file detected: ${existingDoc.filename}`);
      return new Response(JSON.stringify({ 
        error: `File already exists: "${existingDoc.title}" (${existingDoc.filename})` 
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload file to storage
    console.log('☁️ Uploading to storage...');
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log('✅ File uploaded to storage');

    // Create document record with processing status
    const { data: documentData, error: docError } = await supabase
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
        processing_status: 'processing',
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

    document = documentData; // Assign to outer scope variable
    console.log(`📝 Document record created: ${document.id}`);

    // Process document content
    let extractedText = '';
    
    console.log(`🔄 Starting document processing for ${filetype} file: ${file.name}`);
    console.log(`📊 File size: ${file.size} bytes, Buffer size: ${fileBuffer.byteLength} bytes`);
    
    try {
      // For PDF files, try fallback first to avoid API issues
      if (filetype === 'pdf') {
        console.log('🔄 Using PDF fallback processing for reliability...');
        try {
          extractedText = await processWithFallback(fileBuffer, file.name, filetype);
          console.log('✅ PDF fallback processing successful');
        } catch (fallbackError) {
          console.log('⚠️ PDF fallback failed, trying Unstructured.io...');
          extractedText = await processWithUnstructured(fileBuffer, file.name);
        }
      } else {
        // For other files, try Unstructured.io first
        console.log('🚀 Attempting Unstructured.io processing...');
        try {
          extractedText = await processWithUnstructured(fileBuffer, file.name);
        } catch (unstructuredError) {
          console.log('⚠️ Unstructured.io processing failed, trying fallback...');
          extractedText = await processWithFallback(fileBuffer, file.name, filetype);
        }
      }
      
    } catch (processingError) {
      console.error('❌ All processing methods failed:', processingError);
      throw new Error(`Document processing failed: ${processingError.message}. For best results with PDF/DOCX/XLSX files, please configure UNSTRUCTURED_API_KEY.`);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    console.log(`📝 Successfully extracted ${extractedText.length} characters`);

    // Chunk the text for better retrieval
    const chunks = chunkText(extractedText, 800, 200);
    console.log(`🔪 Created ${chunks.length} text chunks`);

    // Process chunks and generate embeddings
    const chunkRecords = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Generate embedding using OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: chunk.text,
            model: 'text-embedding-3-small',
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          throw new Error(`OpenAI embedding API error: ${embeddingResponse.status} ${errorText}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        chunkRecords.push({
          document_id: document.id,
          chunk_index: i,
          content: chunk.text,
          page: chunk.page,
          start_char: chunk.startChar,
          end_char: chunk.endChar,
          token_count: Math.ceil(chunk.text.length / 4), // Rough estimate
          embedding,
        });

        // Log progress for long documents
        if (i % 10 === 0 || i === chunks.length - 1) {
          console.log(`🔄 Processed ${i + 1}/${chunks.length} chunks`);
        }

      } catch (error) {
        console.error(`❌ Failed to process chunk ${i}:`, error);
        throw new Error(`Chunk processing failed at chunk ${i}: ${error.message}`);
      }
    }

    // Insert all chunks into database
    console.log('💾 Saving chunks to database...');
    const { error: chunksError } = await supabase
      .from('chunks')
      .insert(chunkRecords);

    if (chunksError) {
      console.error('Chunks insertion error:', chunksError);
      throw new Error(`Failed to save chunks: ${chunksError.message}`);
    }

    // Update document status to completed
    await supabase
      .from('documents')
      .update({ 
        processing_status: 'completed',
        processing_error: null,
        pages: Math.max(...chunkRecords.map(c => c.page || 1), 1),
      })
      .eq('id', document.id);

    console.log(`🎉 Document processing completed successfully!`);
    console.log(`📊 Stats: ${chunks.length} chunks, ${extractedText.length} characters`);

    const response: UploadResponse = {
      documentId: document.id,
      message: `Document processed successfully! Created ${chunks.length} searchable chunks from ${extractedText.length} characters.`,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Upload function error:', error);
    
    // Update document status to failed if document was created
    if (document?.id) {
      try {
        await supabase
          .from('documents')
          .update({ 
            processing_status: 'failed',
            processing_error: error.message || 'Processing failed',
          })
          .eq('id', document.id);
        console.log(`📝 Updated document ${document.id} status to failed`);
      } catch (updateError) {
        console.error('❌ Failed to update document status:', updateError);
      }
    }
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Upload processing failed',
      details: 'Check server logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Improved text chunking function with better boundary detection
function chunkText(text: string, chunkSize: number = 800, overlap: number = 200) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentSize = 0;
  let startChar = 0;
  let page = 1; // Simple page estimation based on content length
  
  for (const sentence of sentences) {
    const sentenceSize = Math.ceil(sentence.length / 4); // Rough token estimate
    
    // If adding this sentence would exceed chunk size, finalize current chunk
    if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
      const endChar = startChar + currentChunk.length;
      
      chunks.push({
        text: currentChunk.trim(),
        startChar,
        endChar,
        page: Math.ceil(startChar / 2000) || 1, // Estimate page based on character position
      });
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + ' ' + sentence.trim();
      currentSize = Math.ceil(currentChunk.length / 4);
      startChar = endChar - overlap;
    } else {
      // Add sentence to current chunk
      if (currentChunk.length > 0) {
        currentChunk += ' ';
      }
      currentChunk += sentence.trim();
      currentSize = Math.ceil(currentChunk.length / 4);
    }
  }
  
  // Add final chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      startChar,
      endChar: startChar + currentChunk.length,
      page: Math.ceil(startChar / 2000) || 1,
    });
  }
  
  return chunks;
}