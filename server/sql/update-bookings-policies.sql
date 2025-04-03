-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bookings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.bookings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.bookings;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin users can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

-- Create new policies
-- Allow anyone to view bookings
CREATE POLICY "Enable read access for all users" ON public.bookings
    FOR SELECT USING (true);

-- Allow authenticated users to create bookings
CREATE POLICY "Enable insert for authenticated users only" ON public.bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow admin users to update any booking
CREATE POLICY "Enable update for admin users only" ON public.bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id::uuid = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Allow admin users to delete any booking
CREATE POLICY "Enable delete for admin users only" ON public.bookings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id::uuid = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Grant appropriate permissions
REVOKE ALL ON public.bookings FROM anon, authenticated;
GRANT SELECT ON public.bookings TO anon;
GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT UPDATE, DELETE ON public.bookings TO authenticated; 