-- Maintenance plan spreadsheet storage
-- Stores the entire plan as a JSON blob with append-only versioning
CREATE TABLE IF NOT EXISTS maintenance_plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL DEFAULT 1,
    plan_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Index for fast "get latest version" query
CREATE INDEX IF NOT EXISTS idx_maintenance_plan_versions_version
ON maintenance_plan_versions(version DESC);

-- Enable Row Level Security
ALTER TABLE maintenance_plan_versions ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read and write
CREATE POLICY "Enable read for authenticated users" ON maintenance_plan_versions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON maintenance_plan_versions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No UPDATE or DELETE - append-only versioning
