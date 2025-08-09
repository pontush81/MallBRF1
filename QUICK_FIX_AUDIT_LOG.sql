-- 🚨 KÖR DENNA SQL I SUPABASE DASHBOARD > SQL EDITOR
-- Fixa data_access_log constraint-problemet

-- Steg 1: Ta bort felaktig constraint
ALTER TABLE data_access_log DROP CONSTRAINT IF EXISTS data_access_log_access_type_check;

-- Steg 2: Lägg till korrekt constraint  
ALTER TABLE data_access_log 
ADD CONSTRAINT data_access_log_access_type_check 
CHECK (access_type IN ('read', 'write', 'delete', 'export'));

-- Steg 3: Testa att det fungerar
SELECT 'Constraint fixed successfully!' as result;
