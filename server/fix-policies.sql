-- Drop existing policies
DROP POLICY IF EXISTS "Public can view published and visible pages" ON public.pages;
DROP POLICY IF EXISTS "Authenticated users can view all pages" ON public.pages;
DROP POLICY IF EXISTS "Admin users can manage all pages" ON public.pages;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin users can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin users can manage all users" ON public.users;

-- Create policies for pages table
CREATE POLICY "Public can view published and visible pages" ON public.pages
  FOR SELECT USING (ispublished = true AND show = true);

CREATE POLICY "Authenticated users can view all pages" ON public.pages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin users can manage all pages" ON public.pages
  FOR ALL TO authenticated USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Create policies for bookings table
CREATE POLICY "Enable read access for all users" ON public.bookings
  FOR SELECT USING (true);

CREATE POLICY "Admin users can manage all bookings" ON public.bookings
  FOR ALL TO authenticated USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (
    auth.jwt() ->> 'email' = email
  );

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT TO authenticated USING (
    auth.jwt() ->> 'email' = email
  );

CREATE POLICY "Admin users can manage all users" ON public.users
  FOR ALL TO authenticated USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Revoke all access by default
REVOKE ALL ON public.pages FROM anon, authenticated;
REVOKE ALL ON public.bookings FROM anon, authenticated;
REVOKE ALL ON public.users FROM anon, authenticated;

-- Grant specific permissions
GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE ON public.pages TO authenticated;

GRANT SELECT, INSERT ON public.bookings TO authenticated;

GRANT SELECT ON public.users TO authenticated; 