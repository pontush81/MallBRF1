import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  question: string;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    docId: string;
    title: string;
    date: string | null;
    pageStart: number | null;
    pageEnd: number | null;
    url: string;
    filetype: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is admin using JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid token', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id, user.email);

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, isactive')
      .eq('id', user.id)
      .single();

    console.log('User data from DB:', userData, 'Error:', userError);

    if (userError || !userData || userData.role !== 'admin' || !userData.isactive) {
      return new Response(JSON.stringify({ 
        error: 'Access denied. Admin role required.',
        details: userError?.message || 'User not admin or inactive'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { question }: ChatRequest = await req.json();
    if (!question || question.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startTime = Date.now();

    // Generate embedding for the question
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: question,
        model: 'text-embedding-3-small',
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI embedding failed: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const questionEmbedding = embeddingData.data[0].embedding;

    // Search for relevant chunks using vector similarity
    const { data: chunks, error: searchError } = await supabase.rpc('search_chunks', {
      query_embedding: questionEmbedding,
      match_threshold: 0.3, // Lower threshold for better recall
      match_count: 6,
    });

    if (searchError) {
      console.error('Search error:', searchError);
      return new Response(JSON.stringify({ error: 'Search failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Search completed. Found ${chunks?.length || 0} chunks`);
    if (chunks && chunks.length > 0) {
      console.log('📄 First chunk preview:', chunks[0].content?.substring(0, 100));
    }

    // If no relevant chunks found
    if (!chunks || chunks.length === 0) {
      const response: ChatResponse = {
        answer: "Hittar inget underlag i källorna för att svara på din fråga.",
        sources: [],
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context from chunks
    let context = '';
    let tokenCount = 0;
    const maxTokens = 8000;
    const usedDocuments = new Map();

    for (const chunk of chunks) {
      const chunkText = `Källa: ${chunk.title} (${chunk.doc_date || 'Okänt datum'}) • ${chunk.filetype} • s. ${chunk.page || '?'}\nInnehåll: ${chunk.content}\n\n`;
      
      // Rough token estimation (1 token ≈ 4 characters for Swedish)
      const estimatedTokens = Math.ceil(chunkText.length / 4);
      
      if (tokenCount + estimatedTokens > maxTokens) {
        break;
      }
      
      context += chunkText;
      tokenCount += estimatedTokens;
      
      // Track document for source citations
      if (!usedDocuments.has(chunk.document_id)) {
        usedDocuments.set(chunk.document_id, {
          docId: chunk.document_id,
          title: chunk.title,
          date: chunk.doc_date,
          pageStart: chunk.page,
          pageEnd: chunk.page,
          filetype: chunk.filetype,
          storage_path: chunk.storage_path,
        });
      } else {
        // Update page range
        const doc = usedDocuments.get(chunk.document_id);
        if (chunk.page) {
          doc.pageStart = Math.min(doc.pageStart || chunk.page, chunk.page);
          doc.pageEnd = Math.max(doc.pageEnd || chunk.page, chunk.page);
        }
      }
    }

    // System prompt for the AI
    const systemPrompt = `Du är "Gulmåran-GPT": en strikt och hjälpsam assistent för Brf Gulmåran.

Regler:
- Svara endast utifrån tillhandahållna källutdrag (RAG-context). Om underlag saknas: skriv "Hittar inget underlag i källorna."
- Var kort och konkret. Lista viktigaste siffror/beslut tydligt.
- Ange alltid källhänvisningar i slutet under rubriken "Källor" i punktlista.
  Format per källa: Titel (YYYY-MM-DD) • FILTYP • s. X–Y
- Om flera källor motsäger varandra: påpeka det, visa båda.
- Gör inga antaganden om individer eller personuppgifter.
- Svara på svenska.
- Aldrig hallucinera; återge siffror/datum exakt som i utdragen.`;

    const userPrompt = `Fråga: ${question}

Källutdrag:
${context}`;

    // Call OpenAI Chat API
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`OpenAI chat failed: ${chatResponse.statusText}`);
    }

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0].message.content;

    // Generate signed URLs for sources
    const sources = await Promise.all(
      Array.from(usedDocuments.values()).map(async (doc) => {
        const { data: signedUrlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.storage_path, 900); // 15 minutes TTL

        return {
          docId: doc.docId,
          title: doc.title,
          date: doc.date,
          pageStart: doc.pageStart,
          pageEnd: doc.pageEnd,
          url: signedUrlData?.signedUrl || '',
          filetype: doc.filetype,
        };
      })
    );

    // Log the interaction (minimal data)
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    await supabase.from('chat_logs').insert({
      user_id: user.id,
      question_hash: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(question)).then(
        buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      ),
      top_doc_ids: Array.from(usedDocuments.keys()),
      token_input: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
      token_output: Math.ceil(answer.length / 4),
      latency_ms: latency,
      model_used: 'gpt-4o-mini',
    });

    const response: ChatResponse = {
      answer,
      sources,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
