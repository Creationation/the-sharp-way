-- ============================================================
-- Cron jobs setup — REQUIRES pg_cron + pg_net extensions
-- ============================================================
-- BEFORE RUNNING THIS:
-- 1. Go to Supabase Dashboard > Database > Extensions
-- 2. Enable "pg_cron" and "pg_net"
-- 3. Replace <YOUR_SERVICE_ROLE_KEY> with the key from
--    Supabase Dashboard > Project Settings > API
-- 4. Run this in the SQL Editor
-- ============================================================

-- Remove existing schedules (safe to re-run)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-reminders-30min') THEN
    PERFORM cron.unschedule('process-reminders-30min');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-attendance-daily') THEN
    PERFORM cron.unschedule('process-attendance-daily');
  END IF;
END;
$$;

-- Email reminders: every 30 minutes
SELECT cron.schedule(
  'process-reminders-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ogijqobntknjlkxejvmu.supabase.co/functions/v1/process-reminders',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Auto-stamp attendance: daily at 20:00 UTC (= 21:00 Vienna CET / 22:00 CEST)
-- Marks all unanswered past bookings as 'attended' and awards stamps
SELECT cron.schedule(
  'process-attendance-daily',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ogijqobntknjlkxejvmu.supabase.co/functions/v1/process-attendance',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
