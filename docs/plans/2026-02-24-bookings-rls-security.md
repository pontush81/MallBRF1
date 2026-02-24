# Bookings RLS Security

## Problem

The `bookings` table has no Row Level Security (RLS) policies. Anyone with the anon key (exposed in the frontend bundle) can read, create, update, and delete all bookings via the Supabase REST API. This exposes personal data (name, email, phone) and is a GDPR violation.

## Design

### Database Migration

1. **Enable RLS** on `bookings` table
2. **Create RLS policies:**
   - SELECT: authenticated users only
   - INSERT: authenticated users only
   - UPDATE: admin/board for all; regular users for own bookings (email match)
   - DELETE: admin/board for all; regular users for own bookings (email match)
3. **Create `booking_availability` view** exposing only `id`, `startdate`, `enddate`, `status` — accessible to anon role for public calendar

### Frontend Changes

1. **bookingServiceSupabase.ts**: Replace hardcoded `directRestCall()` with `authenticatedRestCall()` from supabaseClient.ts. Add public calendar fetch via `booking_availability` view.
2. **BookingPage.tsx**: Split data fetching into public (availability) and authenticated (full details).

### Access Matrix

| Operation | anon | authenticated (user) | authenticated (board) | authenticated (admin) |
|-----------|------|---------------------|-----------------------|----------------------|
| View calendar dates | booking_availability view | bookings table | bookings table | bookings table |
| View guest details | No | Yes | Yes | Yes |
| Create booking | No | Yes | Yes | Yes |
| Edit own booking | No | Yes (email match) | Yes (all) | Yes (all) |
| Delete own booking | No | Yes (email match) | Yes (all) | Yes (all) |

## Implementation Steps

1. Write SQL migration with RLS policies and view
2. Update bookingServiceSupabase.ts to use authenticated calls
3. Split BookingPage data fetching (public vs authenticated)
4. Test locally
