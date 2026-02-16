-- Add DELETE policy for fault_reports table
-- Allows authenticated admin users to delete fault reports
CREATE POLICY "Admins can delete fault reports"
ON fault_reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'admin'
  )
);
