-- ============================================================================
-- FIX RLS: users, residents, notification_settings, pages
-- ============================================================================
-- Problem: These tables have old permissive policies using {public} role,
-- which means EVERYONE (including anon) can read/write all data.
-- This exposes personal information (emails, phone numbers, addresses).
--
-- This migration:
-- 1. Drops all old insecure {public} policies
-- 2. Keeps correct authenticated/service_role policies where they exist
-- 3. Adds missing secure policies
-- ============================================================================

-- ============================
-- USERS TABLE
-- ============================
-- Old insecure policies to remove (all use {public} role):
DROP POLICY IF EXISTS "Allow public to insert users" ON users;
DROP POLICY IF EXISTS "Firebase sync can upsert users" ON users;
DROP POLICY IF EXISTS "Public can read users" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "oauth_user_creation" ON users;
DROP POLICY IF EXISTS "oauth_user_select" ON users;
DROP POLICY IF EXISTS "oauth_user_upsert" ON users;

-- Keep existing correct policies:
-- "users_admin_all" (authenticated, ALL, uses is_admin())
-- "users_all_service" (service_role, ALL)
-- "users_insert_own" (authenticated, INSERT)
-- "users_select_own" (authenticated, SELECT)
-- "users_update_own" (authenticated, UPDATE)

-- Add email-based self-lookup for Firebase migration case
-- (user authenticates via OAuth, needs to find their old Firebase profile by email)
DROP POLICY IF EXISTS "users_select_own_by_email" ON users;
CREATE POLICY "users_select_own_by_email"
ON users FOR SELECT TO authenticated
USING (email = (auth.jwt()->>'email'));

-- ============================
-- RESIDENTS TABLE
-- ============================
-- Remove all old insecure policies:
DROP POLICY IF EXISTS "Admin users can access residents" ON residents;
DROP POLICY IF EXISTS "Service role can access residents" ON residents;
DROP POLICY IF EXISTS "allow_anon_read_residents" ON residents;

-- Ensure RLS is enabled
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Admin and board can read/manage residents
DROP POLICY IF EXISTS "Admin and board can manage residents" ON residents;
CREATE POLICY "Admin and board can manage residents"
ON residents FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('admin', 'board')
    AND users.isactive = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('admin', 'board')
    AND users.isactive = true
  )
);

-- Service role full access (for Edge Functions like HSB form)
DROP POLICY IF EXISTS "Service role can manage residents" ON residents;
CREATE POLICY "Service role can manage residents"
ON residents FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ============================
-- NOTIFICATION_SETTINGS TABLE
-- ============================
-- Remove old insecure policies:
DROP POLICY IF EXISTS "Admin can manage notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Anyone can read notification settings for notifications" ON notification_settings;

-- Ensure RLS is enabled
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admin can manage notification settings
DROP POLICY IF EXISTS "Admin can manage notification_settings" ON notification_settings;
CREATE POLICY "Admin can manage notification_settings"
ON notification_settings FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'admin'
    AND users.isactive = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'admin'
    AND users.isactive = true
  )
);

-- Service role full access (for Edge Functions sending notifications)
DROP POLICY IF EXISTS "Service role can manage notification_settings" ON notification_settings;
CREATE POLICY "Service role can manage notification_settings"
ON notification_settings FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ============================
-- PAGES TABLE
-- ============================
-- Remove old insecure {public} policies:
DROP POLICY IF EXISTS "Authenticated users can read all pages" ON pages;
DROP POLICY IF EXISTS "Public can read published pages" ON pages;
DROP POLICY IF EXISTS "Service role can manage pages" ON pages;

-- Keep correct policies:
-- "allow_anon_read_published_pages" (anon+authenticated, SELECT) - public website content
-- "allow_authenticated_read_all_pages" (authenticated, SELECT) - logged-in users see drafts

-- Ensure RLS is enabled
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Admin can manage pages (create, update, delete)
DROP POLICY IF EXISTS "Admin can manage pages" ON pages;
CREATE POLICY "Admin can manage pages"
ON pages FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'admin'
    AND users.isactive = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'admin'
    AND users.isactive = true
  )
);

-- Service role full access (for Edge Functions)
DROP POLICY IF EXISTS "Service role can manage pages" ON pages;
CREATE POLICY "Service role can manage pages"
ON pages FOR ALL TO service_role
USING (true)
WITH CHECK (true);
