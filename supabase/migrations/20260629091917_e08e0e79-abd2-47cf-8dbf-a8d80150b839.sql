
ALTER TABLE public.vcards
  ADD COLUMN IF NOT EXISTS zapier_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS mailchimp_api_key TEXT,
  ADD COLUMN IF NOT EXISTS mailchimp_audience_id TEXT,
  ADD COLUMN IF NOT EXISTS hubspot_token TEXT,
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

ALTER TABLE public.vcard_appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON public.vcard_appointments(appointment_date, reminder_sent_at);
