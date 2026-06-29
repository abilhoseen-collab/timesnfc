
ALTER TABLE public.vcards
  ADD COLUMN IF NOT EXISTS require_phone_verification BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_whatsapp_number TEXT;

ALTER TABLE public.vcard_appointments
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.ab_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key TEXT NOT NULL,
  variant TEXT NOT NULL,
  event TEXT NOT NULL DEFAULT 'assign',
  vcard_id UUID REFERENCES public.vcards(id) ON DELETE CASCADE,
  session_id TEXT,
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ab_events TO anon;
GRANT SELECT, INSERT ON public.ab_events TO authenticated;
GRANT ALL ON public.ab_events TO service_role;

ALTER TABLE public.ab_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log AB events"
  ON public.ab_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Card owners can read AB events for their cards"
  ON public.ab_events FOR SELECT TO authenticated
  USING (
    vcard_id IS NULL
    OR EXISTS (SELECT 1 FROM public.vcards v WHERE v.id = vcard_id AND v.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS ab_events_experiment_idx ON public.ab_events (experiment_key, variant, event);
CREATE INDEX IF NOT EXISTS ab_events_vcard_idx ON public.ab_events (vcard_id);
