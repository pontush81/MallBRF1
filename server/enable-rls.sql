-- Enable RLS on all tables
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for pages table
CREATE POLICY "Public can view published and visible pages" ON public.pages
  FOR SELECT USING (ispublished = true AND show = true);

CREATE POLICY "Authenticated users can view all pages" ON public.pages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin users can manage all pages" ON public.pages
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::uuid = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for bookings table
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admin users can manage all bookings" ON public.bookings
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::uuid = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT TO authenticated USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admin users can manage all users" ON public.users
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::uuid = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Grant appropriate permissions
GRANT SELECT ON public.pages TO anon;
GRANT SELECT ON public.pages TO authenticated;
GRANT ALL ON public.pages TO authenticated;

GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO authenticated;

GRANT SELECT ON public.users TO authenticated;
GRANT ALL ON public.users TO authenticated; 