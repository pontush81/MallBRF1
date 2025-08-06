-- Create residents table to replace hardcoded personal data
-- This is a GDPR-compliance fix to move personal data from source code to secure database

CREATE TABLE IF NOT EXISTS residents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    apartment_number TEXT NOT NULL UNIQUE,
    apartment_code TEXT, -- e.g. "80A", "80B", etc.
    resident_names TEXT NOT NULL, -- e.g. "Annie Hörberg, Pontus Hörberg"
    primary_email TEXT,
    phone TEXT,
    parking_space TEXT,
    storage_space TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_residents_apartment_number ON residents(apartment_number);
CREATE INDEX IF NOT EXISTS idx_residents_primary_email ON residents(primary_email);
CREATE INDEX IF NOT EXISTS idx_residents_active ON residents(is_active);

-- Enable Row Level Security (RLS) for GDPR compliance
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admin users can access resident data
CREATE POLICY "Admin users can access residents" ON residents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.isactive = true
        )
    );

-- Create policy: Service role can access (for Edge Functions)
CREATE POLICY "Service role can access residents" ON residents
    FOR ALL
    USING (auth.role() = 'service_role');

-- Insert current resident data (migrated from hardcoded values)
-- This data was previously exposed in source code - now secured in database
INSERT INTO residents (apartment_number, apartment_code, resident_names, primary_email, phone, parking_space, storage_space) VALUES
    ('1', '80D', 'Anette Malmgren, Leif Nilsson', 'anette-malmgren@hotmail.com', '0702360807', '6', '1'),
    ('2', '80C', 'Manuela Gavrila, Cornel Oancea', 'cornel@telia.com', '0706711766', '4', '2'),
    ('3', '80B', 'Solbritt Fredin', 'soli.fredin@gmail.com', '0705917205', '', '3'),
    ('4', '80A', 'Kristina Utas', 'tinautas@hotmail.com', '0705557008', '9', '4'),
    ('5', '80H', 'Annie Hörberg, Pontus Hörberg', 'annie_malmgren@hotmail.com', '0702882147', '3', '5'),
    ('6', '80G', 'PGN Konsult AB (Per-Göran Nilsson), Tove Nilsson', 'pergorannilsson@hotmail.com', '0709421449', '', '6'),
    ('7', '80F', 'Agnes Adaktusson, Jacob Adaktusson', 'agnes.@upsec.se', '0707953153', '5', '7'),
    ('8', '80E', 'Karin Höjman, Peter Höjman', 'hojman.karin@gmail.com', '0706425150', '7', '8'),
    ('9', '80I', 'David Svenn', 'david.svenn@agriadvokater.se', '0703310995', '2', '9'),
    ('10', '80J', 'Anna-Lena Lindqvist, Anders Lindqvist', 'abytorp70@icloud.com', '0707960909', '7', '10'),
    ('11', '80K', 'Jonas Ahlin', 'ahlinsweden@gmail.com', '0706255107', '', '11')
ON CONFLICT (apartment_number) DO UPDATE SET
    apartment_code = EXCLUDED.apartment_code,
    resident_names = EXCLUDED.resident_names,
    primary_email = EXCLUDED.primary_email,
    phone = EXCLUDED.phone,
    parking_space = EXCLUDED.parking_space,
    storage_space = EXCLUDED.storage_space,
    updated_at = NOW();

-- Log this migration for audit purposes
INSERT INTO audit_logs (event_type, action, table_name, new_values)
VALUES (
    'data_migration', 
    'move_hardcoded_to_database', 
    'residents', 
    '{"reason": "GDPR compliance - moved personal data from source code to secure database with RLS policies"}'
);