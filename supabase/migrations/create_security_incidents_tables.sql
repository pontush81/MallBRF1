-- Create security incidents table for breach notification system
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('confidentiality', 'integrity', 'availability')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    affected_systems TEXT[] NOT NULL,
    affected_data_types TEXT[] NOT NULL,
    estimated_records INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    discovery_time TIMESTAMPTZ NOT NULL,
    reporter_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'reported' 
        CHECK (status IN ('reported', 'assessed', 'authority_notified', 'data_subjects_notified', 'data_subjects_partially_notified', 'resolved', 'closed')),
    
    -- Risk Assessment
    risk_assessment JSONB,
    assessed_at TIMESTAMPTZ,
    
    -- Authority Notification
    authority_notified_at TIMESTAMPTZ,
    authority_notification_details JSONB,
    
    -- Data Subject Notification
    data_subjects_notified_at TIMESTAMPTZ,
    data_subjects_notification_count INTEGER DEFAULT 0,
    data_subjects_notification_failures INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- Create scheduled notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id VARCHAR(100) NOT NULL,
    notification_type VARCHAR(100) NOT NULL CHECK (notification_type IN (
        'authority_deadline_reminder',
        'data_subject_deadline_reminder',
        'escalation_reminder',
        'follow_up_reminder'
    )),
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (incident_id) REFERENCES security_incidents(incident_id) ON DELETE CASCADE
);

-- Create incident timeline table for detailed logging
CREATE TABLE IF NOT EXISTS incident_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT NOT NULL,
    event_data JSONB,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (incident_id) REFERENCES security_incidents(incident_id) ON DELETE CASCADE
);

-- Create incident contacts table
CREATE TABLE IF NOT EXISTS incident_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(100) NOT NULL,
    notification_preference VARCHAR(20) DEFAULT 'email' CHECK (notification_preference IN ('email', 'sms', 'both')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_incidents_incident_id ON security_incidents(incident_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_discovery_time ON security_incidents(discovery_time);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created_at ON security_incidents(created_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_incident_id ON scheduled_notifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);

CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident_id ON incident_timeline(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_event_timestamp ON incident_timeline(event_timestamp);

-- Enable RLS (Row Level Security)
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_incidents (admin and incident team only)
CREATE POLICY "Admins can view all security incidents"
ON security_incidents FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'incident_commander')
        AND users.isactive = true
    )
);

CREATE POLICY "Service role can manage security incidents"
ON security_incidents FOR ALL
TO service_role
USING (true);

-- RLS Policies for scheduled_notifications
CREATE POLICY "Admins can view scheduled notifications"
ON scheduled_notifications FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'incident_commander')
        AND users.isactive = true
    )
);

CREATE POLICY "Service role can manage scheduled notifications"
ON scheduled_notifications FOR ALL
TO service_role
USING (true);

-- RLS Policies for incident_timeline
CREATE POLICY "Admins can view incident timeline"
ON incident_timeline FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'incident_commander')
        AND users.isactive = true
    )
);

CREATE POLICY "Service role can manage incident timeline"
ON incident_timeline FOR ALL
TO service_role
USING (true);

-- RLS Policies for incident_contacts
CREATE POLICY "Admins can manage incident contacts"
ON incident_contacts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        AND users.isactive = true
    )
);

CREATE POLICY "Service role can access incident contacts"
ON incident_contacts FOR SELECT
TO service_role
USING (true);

-- Insert default incident response team contacts
INSERT INTO incident_contacts (name, email, role, notification_preference) VALUES
    ('Pontus Hörberg', 'gulmaranbrf@gmail.com', 'Incident Commander', 'both'),
    ('Styrelseordförande', 'styrelse@brfgulmaran.se', 'Communications Lead', 'email'),
    ('IT Support', 'it@brfgulmaran.se', 'Technical Lead', 'email')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_security_incidents_updated_at 
    BEFORE UPDATE ON security_incidents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_contacts_updated_at 
    BEFORE UPDATE ON incident_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically log incident timeline events
CREATE OR REPLACE FUNCTION log_incident_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Log status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO incident_timeline (incident_id, event_type, event_description, event_data)
        VALUES (
            NEW.incident_id,
            'status_change',
            'Incident status changed from ' || OLD.status || ' to ' || NEW.status,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'changed_at', NOW()
            )
        );
    END IF;
    
    -- Log authority notification
    IF TG_OP = 'UPDATE' AND OLD.authority_notified_at IS NULL AND NEW.authority_notified_at IS NOT NULL THEN
        INSERT INTO incident_timeline (incident_id, event_type, event_description, event_data)
        VALUES (
            NEW.incident_id,
            'authority_notified',
            'Authority (IMY) has been notified of the incident',
            jsonb_build_object(
                'notified_at', NEW.authority_notified_at,
                'details', NEW.authority_notification_details
            )
        );
    END IF;
    
    -- Log data subject notification
    IF TG_OP = 'UPDATE' AND OLD.data_subjects_notified_at IS NULL AND NEW.data_subjects_notified_at IS NOT NULL THEN
        INSERT INTO incident_timeline (incident_id, event_type, event_description, event_data)
        VALUES (
            NEW.incident_id,
            'data_subjects_notified',
            'Data subjects have been notified of the incident',
            jsonb_build_object(
                'notified_at', NEW.data_subjects_notified_at,
                'notification_count', NEW.data_subjects_notification_count,
                'failures', NEW.data_subjects_notification_failures
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic timeline logging
CREATE TRIGGER log_security_incident_events
    AFTER UPDATE ON security_incidents
    FOR EACH ROW EXECUTE FUNCTION log_incident_event();

-- Create function to check GDPR compliance deadlines
CREATE OR REPLACE FUNCTION check_gdpr_deadlines()
RETURNS TABLE (
    incident_id VARCHAR(100),
    hours_since_discovery INTEGER,
    authority_notification_overdue BOOLEAN,
    data_subject_notification_overdue BOOLEAN,
    severity VARCHAR(20),
    requires_authority_notification BOOLEAN,
    requires_data_subject_notification BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.incident_id,
        EXTRACT(EPOCH FROM (NOW() - si.discovery_time)) / 3600 AS hours_since_discovery,
        (EXTRACT(EPOCH FROM (NOW() - si.discovery_time)) / 3600 > 72 
         AND si.authority_notified_at IS NULL 
         AND (si.severity IN ('high', 'critical') OR si.estimated_records > 100)) AS authority_notification_overdue,
        (EXTRACT(EPOCH FROM (NOW() - si.discovery_time)) / 3600 > 72 
         AND si.data_subjects_notified_at IS NULL 
         AND (si.severity IN ('high', 'critical') OR (si.risk_assessment->>'high_risk_to_individuals')::boolean = true)) AS data_subject_notification_overdue,
        si.severity,
        (si.severity IN ('high', 'critical') OR si.estimated_records > 100) AS requires_authority_notification,
        (si.severity IN ('high', 'critical') OR (si.risk_assessment->>'high_risk_to_individuals')::boolean = true) AS requires_data_subject_notification
    FROM security_incidents si
    WHERE si.status NOT IN ('resolved', 'closed')
    ORDER BY si.discovery_time DESC;
END;
$$ language 'plpgsql';

-- Add comments for documentation
COMMENT ON TABLE security_incidents IS 'Central table for tracking all security incidents and data breaches';
COMMENT ON TABLE scheduled_notifications IS 'Scheduled notifications for GDPR deadline reminders and escalations';
COMMENT ON TABLE incident_timeline IS 'Detailed timeline of all events related to security incidents';
COMMENT ON TABLE incident_contacts IS 'Contact information for incident response team members';

COMMENT ON COLUMN security_incidents.incident_id IS 'Unique identifier for the incident (human-readable)';
COMMENT ON COLUMN security_incidents.type IS 'Type of breach: confidentiality, integrity, or availability';
COMMENT ON COLUMN security_incidents.severity IS 'Severity level for initial risk assessment and prioritization';
COMMENT ON COLUMN security_incidents.affected_systems IS 'Array of system names affected by the incident';
COMMENT ON COLUMN security_incidents.affected_data_types IS 'Array of data types affected (e.g., personal_id, financial, health)';
COMMENT ON COLUMN security_incidents.estimated_records IS 'Estimated number of records/individuals affected';
COMMENT ON COLUMN security_incidents.risk_assessment IS 'Detailed risk assessment results in JSON format';
COMMENT ON COLUMN security_incidents.authority_notification_details IS 'Details of notification sent to authorities';

COMMENT ON FUNCTION check_gdpr_deadlines() IS 'Function to check GDPR compliance deadlines for all active incidents'; 