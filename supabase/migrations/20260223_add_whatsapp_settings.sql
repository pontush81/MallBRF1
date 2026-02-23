ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT FALSE;

ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS whatsapp_phones TEXT[] DEFAULT '{}';
