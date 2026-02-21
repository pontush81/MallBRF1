-- Allow board members to read and update fault reports (alongside admins).
-- DELETE stays admin-only (see 20260216164932_add_fault_reports_delete_policy.sql).
--
-- NOTE: Run this AFTER verifying existing SELECT/UPDATE policies in Supabase Dashboard.
-- If SELECT is already open to all authenticated users, the SELECT policy below is redundant.
-- If an admin-only UPDATE policy already exists, you may need to DROP it first to avoid conflicts.

-- Board + Admin can SELECT fault reports
CREATE POLICY "Board and admins can read fault reports"
ON fault_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('admin', 'board')
    AND users.isactive = true
  )
);

-- Board + Admin can UPDATE fault reports
CREATE POLICY "Board and admins can update fault reports"
ON fault_reports
FOR UPDATE
TO authenticated
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
