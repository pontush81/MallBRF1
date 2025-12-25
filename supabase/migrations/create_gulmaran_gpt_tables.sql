-- Gulmåran-GPT Database Schema
-- Migration: Create tables for RAG-based chat assistant
-- Date: 2024-11-09
-- Description: Documents, chunks, and chat logs for AI assistant

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Documents table - metadata for uploaded documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    filetype TEXT NOT NULL CHECK (filetype IN ('pdf', 'docx', 'txt', 'xlsx', 'csv', 'pptx', 'html', 'rtf', 'epub')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    doc_date DATE, -- Document date (e.g., protocol date)
    visibility TEXT NOT NULL DEFAULT 'admin' CHECK (visibility IN ('admin')), -- Only admin for now
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    pages INTEGER,
    file_size BIGINT,
    checksum TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    uploaded_by TEXT REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chunks table - text chunks with embeddings for vector search
CREATE TABLE IF NOT EXISTS chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page INTEGER,
    start_char INTEGER,
    end_char INTEGER,
    token_count INTEGER,
    embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chat logs table - minimal logging without sensitive content
CREATE TABLE IF NOT EXISTS chat_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    session_id UUID DEFAULT gen_random_uuid(),
    question_hash TEXT, -- Hash of question for analytics, not the actual question
    top_doc_ids UUID[], -- Document IDs used in response
    token_input INTEGER,
    token_output INTEGER,
    latency_ms INTEGER,
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_logs_session_id ON chat_logs(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents table
CREATE POLICY "Admin users can access documents" ON documents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
            AND users.isactive = true
        )
    );

CREATE POLICY "Service role can access documents" ON documents
    FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for chunks table (inherits from documents via join)
CREATE POLICY "Admin users can access chunks" ON chunks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM documents d
            JOIN users u ON u.id = auth.uid()::text
            WHERE d.id = chunks.document_id
            AND u.role = 'admin'
            AND u.isactive = true
        )
    );

CREATE POLICY "Service role can access chunks" ON chunks
    FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for chat_logs table
CREATE POLICY "Users can access own chat logs" ON chat_logs
    FOR ALL
    USING (
        user_id = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
            AND users.isactive = true
        )
    );

CREATE POLICY "Service role can access chat logs" ON chat_logs
    FOR ALL
    USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp on documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful comments
COMMENT ON TABLE documents IS 'Metadata for uploaded documents in Gulmåran-GPT system';
COMMENT ON TABLE chunks IS 'Text chunks with embeddings for RAG vector search';
COMMENT ON TABLE chat_logs IS 'Minimal chat logging for analytics without storing sensitive content';
COMMENT ON COLUMN chunks.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON COLUMN chat_logs.question_hash IS 'SHA-256 hash of question for analytics, not the actual question text';
