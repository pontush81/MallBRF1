-- Add end_date column to maintenance_tasks table
-- This column stores the end date for recurring tasks (when to stop generating instances)

ALTER TABLE maintenance_tasks 
ADD COLUMN end_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN maintenance_tasks.end_date IS 'End date for recurring tasks - when to stop generating new instances';