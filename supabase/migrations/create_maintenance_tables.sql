-- Create maintenance_tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    notes TEXT,
    category TEXT CHECK (category IN ('spring', 'summer', 'autumn', 'winter', 'ongoing')),
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create major_projects table
CREATE TABLE IF NOT EXISTS major_projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    estimated_year INTEGER NOT NULL,
    estimated_cost DECIMAL(12,2),
    status TEXT CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned',
    completed_year INTEGER,
    actual_cost DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_year ON maintenance_tasks(year);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_category ON maintenance_tasks(category);
CREATE INDEX IF NOT EXISTS idx_major_projects_estimated_year ON major_projects(estimated_year);
CREATE INDEX IF NOT EXISTS idx_major_projects_status ON major_projects(status);

-- Enable Row Level Security
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE major_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance_tasks
CREATE POLICY "Enable read access for authenticated users" ON maintenance_tasks
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON maintenance_tasks
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON maintenance_tasks
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON maintenance_tasks
FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for major_projects
CREATE POLICY "Enable read access for authenticated users" ON major_projects
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON major_projects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON major_projects
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON major_projects
FOR DELETE USING (auth.role() = 'authenticated');