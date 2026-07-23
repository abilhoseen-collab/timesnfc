-- Phase 7: Scheduled edge function invocations via pg_cron + pg_net
-- Runs on target self-hosted Supabase.
-- Replace <API_BASE> and <SERVICE_ROLE_KEY> before applying.

-- \set api_base 'https://api.timescard.cloud'
-- \set service_key 'YOUR_SERVICE_ROLE_KEY'

-- Weekly digest — every Monday 09:00 UTC
SELECT cron.schedule(
  'weekly-digest',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://api.timescard.cloud/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Appointment reminders — every 15 minutes
SELECT cron.schedule(
  'appointment-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://api.timescard.cloud/functions/v1/appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Subscription expiry notification — daily 08:00 UTC
SELECT cron.schedule(
  'subscription-expiry',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://api.timescard.cloud/functions/v1/subscription-expiry-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Lead follow-up reminders — daily 10:00 UTC
SELECT cron.schedule(
  'lead-followup',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://api.timescard.cloud/functions/v1/lead-followup-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify:
-- SELECT jobname, schedule, active FROM cron.job;
