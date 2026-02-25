-- HSB Report Schedule and Log tables
-- Used by the hsb-cron edge function for automatic report sending

-- Schedule configuration table
CREATE TABLE IF NOT EXISTS hsb_report_schedule (
  id SERIAL PRIMARY KEY,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly')) DEFAULT 'monthly',
  recipient_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Execution log table
CREATE TABLE IF NOT EXISTS hsb_report_log (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER REFERENCES hsb_report_schedule(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying recent logs
CREATE INDEX IF NOT EXISTS idx_hsb_report_log_created_at ON hsb_report_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hsb_report_log_schedule_id ON hsb_report_log(schedule_id);

-- Enable RLS
ALTER TABLE hsb_report_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsb_report_log ENABLE ROW LEVEL SECURITY;

-- RLS policies: only admin users can read/write schedule
CREATE POLICY "Admin can manage HSB schedules"
  ON hsb_report_schedule
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- RLS policies: only admin users can read logs
CREATE POLICY "Admin can read HSB report logs"
  ON hsb_report_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Service role can insert logs (from edge functions)
CREATE POLICY "Service role can insert HSB report logs"
  ON hsb_report_log
  FOR INSERT
  WITH CHECK (true);

-- Insert a default inactive schedule as a starting point
INSERT INTO hsb_report_schedule (frequency, recipient_email, is_active)
VALUES ('monthly', 'admin@example.com', false)
ON CONFLICT DO NOTHING;

-- pg_cron job: Run on the 1st of each month at 08:00 UTC
-- NOTE: pg_cron must be enabled on the Supabase project (Extensions > pg_cron)
-- The following statement should be run manually or via the Supabase dashboard
-- since pg_cron.schedule requires superuser privileges:
--
-- SELECT cron.schedule(
--   'hsb-monthly-report',
--   '0 8 1 * *',
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/hsb-cron',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
