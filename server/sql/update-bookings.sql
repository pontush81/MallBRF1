-- Update bookings to standardize format
UPDATE bookings
SET 
  -- Standardize date format to include time
  startdate = CASE 
    WHEN startdate ~ '^\d{4}-\d{2}-\d{2}$' THEN startdate || 'T12:00:00.000Z'
    ELSE startdate
  END,
  enddate = CASE 
    WHEN enddate ~ '^\d{4}-\d{2}-\d{2}$' THEN enddate || 'T12:00:00.000Z'
    ELSE enddate
  END,
  -- Set default status to 'pending' if empty
  status = CASE 
    WHEN status = '' OR status IS NULL THEN 'pending'
    ELSE status
  END,
  -- Fix character encoding in notes
  notes = CASE 
    WHEN notes LIKE '%%' THEN 
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(notes, '', 'ö'),
              '', 'ä'),
              '', 'å'),
              '', 'Ö'),
              '', 'Ä')
    ELSE notes
  END,
  -- Ensure parking is boolean
  parkering = CASE 
    WHEN parkering = 't' OR parkering = 'true' OR parkering = '1' THEN true
    WHEN parkering = 'f' OR parkering = 'false' OR parkering = '0' THEN false
    ELSE false
  END
WHERE 
  -- Only update records that need changes
  startdate ~ '^\d{4}-\d{2}-\d{2}$' OR
  enddate ~ '^\d{4}-\d{2}-\d{2}$' OR
  status = '' OR
  status IS NULL OR
  notes LIKE '%%' OR
  parkering NOT IN (true, false);

-- Verify the updates
SELECT id, name, startdate, enddate, status, notes, parkering
FROM bookings
WHERE 
  startdate ~ '^\d{4}-\d{2}-\d{2}$' OR
  enddate ~ '^\d{4}-\d{2}-\d{2}$' OR
  status = '' OR
  status IS NULL OR
  notes LIKE '%%' OR
  parkering NOT IN (true, false); 