-- Create activity log table for tracking user actions
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);

-- RLS: only admins can read
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
ON activity_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()::text
        AND users.role = 'admin'
        AND users.isactive = true
    )
);

-- Service role can insert (for edge functions) and frontend inserts via anon
CREATE POLICY "Service role full access"
ON activity_log FOR ALL
TO service_role
USING (true);

-- Authenticated users can insert their own activity
CREATE POLICY "Authenticated users can insert own activity"
ON activity_log FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);
