-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create function to get current user's ID first
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('app.current_user_id', true)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Then create function to get current user's role
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'anon'
  );
$$;

-- Create function to set current user ID
CREATE OR REPLACE FUNCTION auth.set_current_user_id(user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$; 