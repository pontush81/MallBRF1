-- Fix bookings table timestamps
ALTER TABLE public.bookings 
  ALTER COLUMN createdat SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Fix users table timestamps
ALTER TABLE public.users 
  ALTER COLUMN createdat SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Fix pages table timestamps
ALTER TABLE public.pages 
  ALTER COLUMN createdat SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updatedat SET DEFAULT CURRENT_TIMESTAMP; 