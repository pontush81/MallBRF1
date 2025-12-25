import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

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
    
    // Configure processing strategy for OCR support
    formData.append('strategy', 'hi_res'); // Use hi_res strategy for OCR on scanned documents
    formData.append('coordinates', 'false'); // Disable coordinates for speed
    formData.append('extract_image_block_types', '["Image", "Table"]'); // Extract images and tables
    
    // Try the correct Unstructured.io API endpoint
    console.log('📡 Sending request to Unstructured.io...');
    const response = await fetch('https://api.unstructuredapp.io/general/v0/general', {
      method: 'POST',
      headers: {
        'unstructured-api-key': unstructuredApiKey,
        'Accept': 'application/json',
      },
      body: formData,
      // Add timeout to prevent hanging (OCR takes longer)
      signal: AbortSignal.timeout(120000), // 120 second timeout for OCR processing
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

// Enhanced fallback processing for when Unstructured.io is not available
async function processWithFallback(fileBuffer: ArrayBuffer, filename: string, filetype: string): Promise<string> {
  console.log('🔄 Using enhanced fallback processing...');
  
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
      
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const pdfText = decoder.decode(fileBuffer);
      
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
              return block
                .replace(/BT\s+/g, '')
                .replace(/\s+ET/g, '')
                .replace(/\/\w+\s+\d+\s+Tf/g, '')
                .replace(/\d+(\.\d+)?\s+\d+(\.\d+)?\s+Td/g, '')
                .replace(/\d+(\.\d+)?\s+TL/g, '')
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
        console.log(`✅ PDF fallback extraction successful`);
        return extractedText;
      }
      
      throw new Error('No readable text found in PDF - may be image-based or encrypted');
      
    } else {
      throw new Error(`Unsupported file type: ${filetype}. Supported types: TXT, CSV, PDF (with fallback). For DOCX/XLSX files, please configure UNSTRUCTURED_API_KEY.`);
    }
    
  } catch (error) {
    console.error(`❌ Fallback processing failed for ${filetype}:`, error);
    throw error;
  }
}

// Improved text chunking function with better boundary detection
function chunkText(text: string, chunkSize: number = 800, overlap: number = 200) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentSize = 0;
  let startChar = 0;
  
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting background document processing...');

    // Initialize Supabase with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if specific document ID was provided
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const specificDocumentId = body.documentId;

    let documentsToProcess = [];

    if (specificDocumentId) {
      // Process specific document
      console.log(`🎯 Processing specific document: ${specificDocumentId}`);
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', specificDocumentId)
        .eq('processing_status', 'pending')
        .single();

      if (fetchError) {
        console.error('❌ Error fetching specific document:', fetchError);
        throw fetchError;
      }

      if (doc) {
        documentsToProcess = [doc];
      }
    } else {
      // Find pending documents (scheduled processing)
      console.log('🔍 Looking for pending documents...');
      const { data: pendingDocs, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('processing_status', 'pending')
        .lt('processing_attempts', 3) // Max 3 retry attempts
        .order('created_at', { ascending: true })
        .limit(5); // Process max 5 at a time

      if (fetchError) {
        console.error('❌ Error fetching pending documents:', fetchError);
        throw fetchError;
      }

      documentsToProcess = pendingDocs || [];
    }

    if (documentsToProcess.length === 0) {
      console.log('ℹ️ No pending documents to process');
      return new Response(JSON.stringify({ 
        message: 'No pending documents', 
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found ${documentsToProcess.length} documents to process`);

    let processedCount = 0;
    let errors: string[] = [];

    // Process each document
    for (const doc of documentsToProcess) {
      try {
        console.log(`🔄 Processing document: ${doc.filename} (${doc.id})`);
        
        // Update status to processing
        await supabase
          .from('documents')
          .update({ 
            processing_status: 'processing',
            processing_started_at: new Date().toISOString(),
            processing_attempts: (doc.processing_attempts || 0) + 1,
          })
          .eq('id', doc.id);

        // Download file from storage
        console.log(`📥 Downloading file: ${doc.storage_path}`);
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(doc.storage_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download file: ${downloadError?.message || 'Unknown error'}`);
        }

        const fileBuffer = await fileData.arrayBuffer();
        console.log(`📊 Downloaded ${fileBuffer.byteLength} bytes`);

        // Extract text based on file type
        let extractedText = '';
        
        try {
          // Try Unstructured.io first for complex files
          if (['pdf', 'docx', 'xlsx', 'pptx'].includes(doc.filetype)) {
            console.log('🚀 Attempting Unstructured.io for complex document...');
            try {
              extractedText = await processWithUnstructured(fileBuffer, doc.filename);
            } catch (unstructuredError) {
              console.log('⚠️ Unstructured.io failed, trying fallback...');
              extractedText = await processWithFallback(fileBuffer, doc.filename, doc.filetype);
            }
          } else {
            // Use fallback for simple files
            console.log('🔄 Using fallback processing for simple file...');
            extractedText = await processWithFallback(fileBuffer, doc.filename, doc.filetype);
          }
        } catch (extractionError) {
          throw new Error(`Text extraction failed: ${extractionError.message}`);
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
              document_id: doc.id,
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
            processing_completed_at: new Date().toISOString(),
          })
          .eq('id', doc.id);

        processedCount++;
        console.log(`✅ Successfully processed: ${doc.filename} (${chunks.length} chunks)`);

      } catch (error) {
        console.error(`❌ Failed to process ${doc.filename}:`, error);
        errors.push(`${doc.filename}: ${error.message}`);
        
        // Update document status to failed
        await supabase
          .from('documents')
          .update({ 
            processing_status: 'failed',
            processing_error: error.message,
            processing_completed_at: new Date().toISOString(),
          })
          .eq('id', doc.id);
      }
    }

    const result = {
      message: `Processed ${processedCount} documents`,
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('🎉 Background processing completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Background processing failed:', error);
    return new Response(JSON.stringify({ 
      error: 'Background processing failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
