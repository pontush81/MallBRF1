-- Drop existing pages policies
DROP POLICY IF EXISTS "Public can view published and visible pages" ON public.pages;
DROP POLICY IF EXISTS "Authenticated users can view all pages" ON public.pages;
DROP POLICY IF EXISTS "Admin users can manage all pages" ON public.pages;

-- Create more restrictive policies for pages table
CREATE POLICY "Public can view published and visible pages" ON public.pages
  FOR SELECT 
  USING (ispublished = true AND show = true);

CREATE POLICY "Authenticated users can view all pages" ON public.pages
  FOR SELECT 
  TO authenticated 
  USING (
    CASE 
      WHEN auth.jwt() ->> 'role' = 'admin' THEN true
      WHEN ispublished = true AND show = true THEN true
      ELSE false
    END
  );

CREATE POLICY "Admin users can manage all pages" ON public.pages
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Revoke and regrant permissions
REVOKE ALL ON public.pages FROM anon, authenticated;
GRANT SELECT ON public.pages TO anon;
GRANT SELECT ON public.pages TO authenticated; 