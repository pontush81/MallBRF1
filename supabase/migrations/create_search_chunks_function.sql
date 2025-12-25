-- Create search_chunks function for vector similarity search
-- This function enables the RAG (Retrieval-Augmented Generation) functionality

CREATE OR REPLACE FUNCTION search_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  page integer,
  chunk_index integer,
  similarity float,
  title text,
  filename text,
  doc_date date,
  filetype text,
  storage_path text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.document_id,
    c.content,
    c.page,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.title,
    d.filename,
    d.doc_date,
    d.filetype,
    d.storage_path
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE 
    d.processing_status = 'completed'
    AND d.visibility = 'admin'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION search_chunks IS 'Vector similarity search for document chunks using cosine similarity. Used by RAG chat system to find relevant content.';
