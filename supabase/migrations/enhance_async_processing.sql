-- Enhance documents table for async processing
-- Migration: Add fields for robust async document processing
-- Date: 2024-11-10
-- Description: Add retry logic, timing, and better status tracking

-- Add new columns for async processing
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS processing_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

-- Update the processing status check constraint to include new statuses
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_processing_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_processing_status_check 
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'retrying'));

-- Add indexes for efficient background processing queries
CREATE INDEX IF NOT EXISTS idx_documents_processing_queue 
ON documents(processing_status, processing_attempts, created_at) 
WHERE processing_status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_documents_processing_status_created 
ON documents(processing_status, created_at);

CREATE INDEX IF NOT EXISTS idx_documents_failed_processing 
ON documents(processing_status, processing_attempts) 
WHERE processing_status = 'failed';

-- Add function to automatically retry failed documents after some time
CREATE OR REPLACE FUNCTION retry_failed_documents()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  retry_count INTEGER;
BEGIN
  -- Reset documents that failed more than 1 hour ago and have < 3 attempts
  UPDATE documents 
  SET 
    processing_status = 'pending',
    processing_error = NULL,
    last_retry_at = NOW()
  WHERE 
    processing_status = 'failed'
    AND processing_attempts < 3
    AND (processing_completed_at IS NULL OR processing_completed_at < NOW() - INTERVAL '1 hour');
    
  GET DIAGNOSTICS retry_count = ROW_COUNT;
  
  RETURN retry_count;
END;
$$;

-- Add function to clean up old processing locks (documents stuck in 'processing')
CREATE OR REPLACE FUNCTION cleanup_stale_processing()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Reset documents that have been 'processing' for more than 10 minutes
  UPDATE documents 
  SET 
    processing_status = 'pending',
    processing_error = 'Processing timeout - reset for retry'
  WHERE 
    processing_status = 'processing'
    AND processing_started_at < NOW() - INTERVAL '10 minutes';
    
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  RETURN cleanup_count;
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN documents.processing_attempts IS 'Number of processing attempts (max 3)';
COMMENT ON COLUMN documents.processing_started_at IS 'When processing began for current attempt';
COMMENT ON COLUMN documents.processing_completed_at IS 'When processing completed (success or failure)';
COMMENT ON COLUMN documents.last_retry_at IS 'When document was last queued for retry';

COMMENT ON FUNCTION retry_failed_documents() IS 'Automatically retry failed documents that have not exceeded max attempts';
COMMENT ON FUNCTION cleanup_stale_processing() IS 'Reset documents stuck in processing status due to timeouts or crashes';

-- Create a view for monitoring processing status
CREATE OR REPLACE VIEW processing_status_summary AS
SELECT 
  processing_status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(processing_completed_at, NOW()) - processing_started_at))) as avg_processing_time_seconds,
  MAX(processing_attempts) as max_attempts
FROM documents 
WHERE processing_started_at IS NOT NULL
GROUP BY processing_status;

COMMENT ON VIEW processing_status_summary IS 'Summary view for monitoring document processing performance and status';

