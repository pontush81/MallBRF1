# Admin Functions Setup Guide

## 🎯 Problem
Admin-sidorna (`/admin/users`, `/admin/allowlist`, `/admin/notifications`) visar fel:
> "relation "public.notification_settings" does not exist"

## 🔧 Lösning: Kör databasmigrationen

### Steg 1: Öppna Supabase Dashboard
1. Gå till [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt: `qhdgqevdmvkrwnzpwikz`
3. Gå till **SQL Editor** i vänstermenyn

### Steg 2: Kör SQL-migrationen
Kopiera och klistra in följande SQL i SQL Editor och tryck **RUN**:

```sql
-- Migration: Create admin management tables
-- Date: 2025-01-XX  
-- Description: Tables for user management, allowlist, and notification settings

-- Create allowed emails table
CREATE TABLE IF NOT EXISTS allowed_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create allowed domains table  
CREATE TABLE IF NOT EXISTS allowed_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT TRUE,
    booking_confirmations BOOLEAN DEFAULT TRUE,
    maintenance_reminders BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT TRUE,
    admin_email VARCHAR(255),
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_user VARCHAR(255),
    smtp_password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for allowed_emails
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage allowed emails"
ON allowed_emails
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        AND users.isactive = true
    )
);

-- Add RLS policies for allowed_domains
ALTER TABLE allowed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage allowed domains"
ON allowed_domains
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        AND users.isactive = true
    )
);

-- Add RLS policies for notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage notification settings"
ON notification_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        AND users.isactive = true
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);
CREATE INDEX IF NOT EXISTS idx_allowed_domains_domain ON allowed_domains(domain);

-- Insert some default allowed domains (customize as needed)
INSERT INTO allowed_domains (domain, created_by) 
VALUES 
    ('gmail.com', 'system'),
    ('outlook.com', 'system'),
    ('hotmail.com', 'system')
ON CONFLICT (domain) DO NOTHING;

-- Insert default notification settings
INSERT INTO notification_settings (
    email_notifications,
    booking_confirmations, 
    maintenance_reminders,
    system_alerts,
    admin_email
) VALUES (
    true,
    true,
    true,
    true,
    'admin@brf.se'
) ON CONFLICT DO NOTHING;
```

### Steg 3: Verifiera
1. Gå till **Table Editor** i Supabase Dashboard
2. Kontrollera att följande tabeller nu existerar:
   - `allowed_emails`
   - `allowed_domains` 
   - `notification_settings`

### Steg 4: Testa admin-sidorna
1. Gå tillbaka till din app
2. Navigera till `/admin/notifications`
3. Sidan ska nu fungera utan fel!

## 🎉 Resultat
När migrationen är klar kommer alla admin-sidor att fungera:
- **`/admin/users`** - Användarhantering
- **`/admin/allowlist`** - Tillåtna användare  
- **`/admin/notifications`** - Notifikationsinställningar

## 🔍 Troubleshooting
Om det fortfarande inte fungerar:
1. Kontrollera att du är inloggad som admin
2. Kolla att RLS-policies är aktiva
3. Verifiera att tabellerna skapades korrekt i Table Editor

