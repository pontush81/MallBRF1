-- ============================================================================
-- BOOKINGS TABLE: Enable Row Level Security
-- ============================================================================
-- Problem: The bookings table had insecure permissive policies (allow_anon_access,
-- bookings_public_access, Public can read/create bookings) that allowed anyone
-- with the anon key to read/write all booking data including personal information.
-- This was a GDPR violation.
--
-- Solution:
-- 1. Remove all old insecure policies
-- 2. Enable RLS on bookings table
-- 3. Authenticated users can SELECT/INSERT bookings
-- 4. Admin/board can UPDATE/DELETE any booking; regular users only their own
-- 5. Service role retains full access for Edge Functions
-- 6. Public booking_availability view for anonymous calendar access (no personal data)
-- ============================================================================

-- Step 1: Drop ALL old insecure policies
DROP POLICY IF EXISTS "allow_anon_access" ON bookings;
DROP POLICY IF EXISTS "bookings_public_access" ON bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Public can read bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON bookings;
DROP POLICY IF EXISTS "Service role can manage bookings" ON bookings;

-- Drop new policies too (idempotent re-run safety)
DROP POLICY IF EXISTS "Authenticated users can read bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Admin board or owner can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admin board or owner can delete bookings" ON bookings;

-- Step 2: Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Step 3: SELECT policy - all authenticated users can read all bookings
CREATE POLICY "Authenticated users can read bookings"
ON bookings FOR SELECT TO authenticated
USING (true);

-- Step 4: INSERT policy - all authenticated users can create bookings
CREATE POLICY "Authenticated users can create bookings"
ON bookings FOR INSERT TO authenticated
WITH CHECK (true);

-- Step 5: UPDATE policy - admin/board can update any, users can update own (email match)
CREATE POLICY "Admin board or owner can update bookings"
ON bookings FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('admin', 'board')
    AND users.isactive = true
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.isactive = true
    AND users.email = bookings.email
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('admin', 'board')
    AND users.isactive = true
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.isactive = true
    AND users.email = bookings.email
  )
);

-- Step 6: DELETE policy - admin/board can delete any, users can delete own (email match)
CREATE POLICY "Admin board or owner can delete bookings"
ON bookings FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('admin', 'board')
    AND users.isactive = true
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.isactive = true
    AND users.email = bookings.email
  )
);

-- Step 7: Service role retains full access (for Edge Functions)
CREATE POLICY "Service role can manage bookings"
ON bookings FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PUBLIC BOOKING AVAILABILITY VIEW
-- ============================================================================
-- This view exposes ONLY date/status data for the public calendar.
-- No personal information (name, email, phone, notes) is included.
-- Accessible to the anon role without authentication.
-- The view owner (postgres) bypasses RLS, so it can read the bookings table.
-- ============================================================================

DROP VIEW IF EXISTS booking_availability;

CREATE VIEW booking_availability AS
SELECT
  id,
  startdate,
  enddate,
  status
FROM bookings
WHERE status != 'cancelled';

-- Grant anon role access to the view (for public calendar)
GRANT SELECT ON booking_availability TO anon;

-- Grant authenticated role access too (they can use either)
GRANT SELECT ON booking_availability TO authenticated;
