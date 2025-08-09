-- Fixa data_access_log constraint
-- Kör denna SQL i Supabase Dashboard > SQL Editor

-- Ta bort den felaktiga constraint
ALTER TABLE data_access_log DROP CONSTRAINT IF EXISTS data_access_log_access_type_check;

-- Lägg till rätt constraint
ALTER TABLE data_access_log 
ADD CONSTRAINT data_access_log_access_type_check 
CHECK (access_type IN ('read', 'write', 'delete', 'export'));

-- Testa att det fungerar
INSERT INTO data_access_log (
  user_id, 
  user_email, 
  table_name, 
  access_type, 
  record_id, 
  data_categories, 
  purpose
) VALUES (
  '9e44f39b-080b-421d-abdc-ff27611ca41b',
  'pontus.hberg@gmail.com',
  'pages',
  'write',
  '8',
  ARRAY['content', 'metadata'],
  'admin_update_page_Aktivitetsrum'
);

-- Rensa test-data
DELETE FROM data_access_log WHERE purpose = 'admin_update_page_Aktivitetsrum';
