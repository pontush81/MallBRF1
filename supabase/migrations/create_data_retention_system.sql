-- Data Retention System för BRF Gulmåran
-- Säker automatisk datahantering enligt GDPR och svensk lag

-- 1. Skapa data_deletion_log tabell för att spåra alla raderingar
CREATE TABLE IF NOT EXISTS data_deletion_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    deletion_reason TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by TEXT NOT NULL,
    record_snapshot JSONB, -- Säkerhetskopia av raderad data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Lägg till säkerhetskolumner i users-tabellen
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS personal_data_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS retention_hold_reason TEXT,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Lägg till index för prestanda
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_membership_status ON users(membership_status);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity_date);

-- 4. Lägg till säkerhetskolumner i bookings-tabellen
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'settled',
ADD COLUMN IF NOT EXISTS retention_hold_reason TEXT,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 5. Skapa audit_logs tabell om den inte finns
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    table_name TEXT,
    record_id TEXT,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Skapa security_investigations tabell för att spåra aktiva utredningar
CREATE TABLE IF NOT EXISTS security_investigations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id TEXT NOT NULL,
    related_log_id UUID REFERENCES audit_logs(id),
    status TEXT NOT NULL DEFAULT 'active', -- active, closed, pending
    investigator TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Skapa index för prestanda
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_bookings_createdat ON bookings(createdat);
CREATE INDEX IF NOT EXISTS idx_data_deletion_log_table_name ON data_deletion_log(table_name);
CREATE INDEX IF NOT EXISTS idx_security_investigations_status ON security_investigations(status);

-- 8. Skapa en säker vy för retention-kandidater
CREATE OR REPLACE VIEW retention_candidates AS
SELECT 
    'users' as table_name,
    id::text as record_id,
    deleted_at as retention_date,
    CASE 
        WHEN deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '730 days' THEN true
        ELSE false
    END as eligible_for_deletion,
    membership_status,
    personal_data_deleted,
    retention_hold_reason
FROM users
WHERE deleted_at IS NOT NULL

UNION ALL

SELECT 
    'bookings' as table_name,
    id::text as record_id,
    createdat as retention_date,
    CASE 
        WHEN createdat < NOW() - INTERVAL '1095 days' THEN true
        ELSE false
    END as eligible_for_deletion,
    status as membership_status,
    false as personal_data_deleted,
    retention_hold_reason
FROM bookings

UNION ALL

SELECT 
    'audit_logs' as table_name,
    id::text as record_id,
    created_at as retention_date,
    CASE 
        WHEN created_at < NOW() - INTERVAL '365 days' THEN true
        ELSE false
    END as eligible_for_deletion,
    'N/A' as membership_status,
    false as personal_data_deleted,
    'N/A' as retention_hold_reason
FROM audit_logs;

-- 9. Skapa RLS (Row Level Security) policyer
ALTER TABLE data_deletion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Endast administratörer kan läsa deletion logs
CREATE POLICY "Admins can read data_deletion_log" ON data_deletion_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- Endast administratörer kan läsa audit logs
CREATE POLICY "Admins can read audit_logs" ON audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Endast administratörer kan läsa investigations
CREATE POLICY "Admins can read security_investigations" ON security_investigations
    FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Skapa en trigger för att uppdatera last_activity_date automatiskt
CREATE OR REPLACE FUNCTION update_user_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_activity_date = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Skapa triggers för olika aktiviteter
CREATE TRIGGER update_last_activity_on_booking
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_activity();

-- 11. Skapa en funktion för säker soft delete av användare
CREATE OR REPLACE FUNCTION safe_delete_user(user_id_param UUID, reason TEXT DEFAULT 'user_request')
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    safety_checks JSONB;
    result JSONB;
BEGIN
    -- Hämta användardata
    SELECT * INTO user_record FROM users WHERE id = user_id_param;
    
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "User not found"}'::JSONB;
    END IF;
    
    -- Utför säkerhetskontroller
    safety_checks := jsonb_build_object(
        'has_future_bookings', (
            SELECT COUNT(*) > 0 
            FROM bookings 
            WHERE email = user_record.email 
            AND date >= CURRENT_DATE
        ),
        'has_recent_activity', (
            user_record.last_activity_date > NOW() - INTERVAL '6 months'
        ),
        'membership_active', (
            user_record.membership_status = 'active'
        )
    );
    
    -- Om säkerhetskontroller misslyckas, avbryt
    IF (safety_checks->>'has_future_bookings')::boolean = true OR
       (safety_checks->>'membership_active')::boolean = true THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User has active bookings or membership',
            'safety_checks', safety_checks
        );
    END IF;
    
    -- Genomför soft delete
    UPDATE users SET
        deleted_at = NOW(),
        email = 'deleted_' || id || '@deleted.local',
        personal_data_deleted = true,
        retention_hold_reason = CASE 
            WHEN (safety_checks->>'has_recent_activity')::boolean THEN 'recent_activity'
            ELSE reason
        END
    WHERE id = user_id_param;
    
    -- Logga raderingen
    INSERT INTO data_deletion_log (table_name, record_id, deletion_reason, deleted_by, record_snapshot)
    VALUES ('users', user_id_param::text, reason, 'safe_delete_function', to_jsonb(user_record));
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', user_id_param,
        'safety_checks', safety_checks,
        'deleted_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- 12. Skapa en funktion för att kontrollera retention-status
CREATE OR REPLACE FUNCTION get_retention_summary()
RETURNS TABLE(
    table_name TEXT,
    total_records BIGINT,
    eligible_for_deletion BIGINT,
    oldest_record_age INTERVAL,
    retention_period_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'users'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '730 days')::BIGINT,
        NOW() - MIN(created_at),
        730
    FROM users
    
    UNION ALL
    
    SELECT 
        'bookings'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE createdat < NOW() - INTERVAL '1095 days')::BIGINT,
        NOW() - MIN(createdat),
        1095
    FROM bookings
    
    UNION ALL
    
    SELECT 
        'audit_logs'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '365 days')::BIGINT,
        NOW() - MIN(created_at),
        365
    FROM audit_logs;
END;
$$ LANGUAGE plpgsql;

-- 13. Kommentarer för dokumentation
COMMENT ON TABLE data_deletion_log IS 'Loggar alla automatiska och manuella raderingar för GDPR-compliance';
COMMENT ON TABLE security_investigations IS 'Spårar aktiva säkerhetsutredningar som kan påverka data retention';
COMMENT ON FUNCTION safe_delete_user IS 'Säker soft delete med automatiska säkerhetskontroller';
COMMENT ON FUNCTION get_retention_summary IS 'Ger överblick över retention-status för alla tabeller';
COMMENT ON VIEW retention_candidates IS 'Visar alla poster som är kandidater för automatisk radering';

-- 14. Sätt initial data för test
INSERT INTO data_deletion_log (table_name, record_id, deletion_reason, deleted_by, record_snapshot)
VALUES ('system', 'initial', 'Data retention system installed', 'migration', '{"version": "1.0"}'::JSONB)
ON CONFLICT DO NOTHING; 