-- Fix: users_admin_all RLS policy insecurely references user_metadata
-- user_metadata is editable by end users and must NEVER be used for authorization.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0015_rls_references_user_metadata
--
-- Solution: Create a SECURITY DEFINER function to safely check admin status
-- (avoids RLS recursion on the users table), then replace the insecure policy.

-- 1. Create a helper function that bypasses RLS to check admin status.
--    SECURITY DEFINER runs with the privileges of the function owner,
--    so it can read from `users` without triggering RLS policies on that table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text
    AND role = 'admin'
    AND isactive = true
  );
$$;

-- 2. Drop the insecure policy that references user_metadata
DROP POLICY IF EXISTS "users_admin_all" ON public.users;

-- 3. Create secure replacement using is_admin() function
CREATE POLICY "users_admin_all" ON public.users
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);
