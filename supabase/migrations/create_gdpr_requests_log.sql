-- Create GDPR requests logging table
CREATE TABLE IF NOT EXISTS gdpr_requests_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    details TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_email ON gdpr_requests_log(email);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_requests_log(request_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests_log(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_created_at ON gdpr_requests_log(created_at);

-- Create audit logging table for data access
CREATE TABLE IF NOT EXISTS data_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    user_email VARCHAR(255),
    table_name VARCHAR(100) NOT NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('read', 'write', 'delete', 'export')),
    record_id TEXT, -- Single record ID as text to support both UUIDs and integers
    data_categories TEXT[] NOT NULL DEFAULT '{}',
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interest', 'public_task', 'legitimate_interest')),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_data_access_user ON data_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_email ON data_access_log(user_email);
CREATE INDEX IF NOT EXISTS idx_data_access_table ON data_access_log(table_name);
CREATE INDEX IF NOT EXISTS idx_data_access_time ON data_access_log(created_at);
CREATE INDEX IF NOT EXISTS idx_data_access_type ON data_access_log(access_type);
CREATE INDEX IF NOT EXISTS idx_data_access_legal_basis ON data_access_log(legal_basis);

-- Enable RLS (Row Level Security) on both tables
ALTER TABLE gdpr_requests_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_log ENABLE ROW LEVEL SECURITY;

-- Create policies for GDPR requests log (admin only)
CREATE POLICY "Admins can view all GDPR requests"
ON gdpr_requests_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        AND users.isactive = true
    )
);

CREATE POLICY "Service role can insert GDPR requests"
ON gdpr_requests_log FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update GDPR requests"
ON gdpr_requests_log FOR UPDATE
TO service_role
USING (true);

-- Create policies for data access log (admin only)
CREATE POLICY "Admins can view audit logs"
ON data_access_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        AND users.isactive = true
    )
);

CREATE POLICY "Service role can insert audit logs"
ON data_access_log FOR INSERT
TO service_role
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE gdpr_requests_log IS 'Logs all GDPR data subject requests for compliance tracking';
COMMENT ON TABLE data_access_log IS 'Audit trail for all data access operations';

COMMENT ON COLUMN gdpr_requests_log.email IS 'Email address of the data subject making the request';
COMMENT ON COLUMN gdpr_requests_log.request_type IS 'Type of GDPR request: access, rectification, erasure, or portability';
COMMENT ON COLUMN gdpr_requests_log.status IS 'Current status of the request processing';
COMMENT ON COLUMN gdpr_requests_log.details IS 'Additional details about the request processing';

COMMENT ON COLUMN data_access_log.user_id IS 'UUID of the user who accessed the data (if authenticated)';
COMMENT ON COLUMN data_access_log.table_name IS 'Name of the database table that was accessed';
COMMENT ON COLUMN data_access_log.access_type IS 'Type of data access operation performed';
COMMENT ON COLUMN data_access_log.record_id IS 'ID of the specific record that was accessed (supports both UUIDs and integers as text)';
COMMENT ON COLUMN data_access_log.data_categories IS 'Categories of data accessed (e.g., personal_data, financial_data)';
COMMENT ON COLUMN data_access_log.purpose IS 'Business purpose for the data access';
COMMENT ON COLUMN data_access_log.legal_basis IS 'GDPR legal basis for processing the data'; 