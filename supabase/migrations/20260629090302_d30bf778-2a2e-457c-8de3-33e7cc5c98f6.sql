-- Batch A: Revenue & Trust schema

-- 1. Custom domain per vCard
CREATE TABLE public.vcard_custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcard_id UUID NOT NULL REFERENCES public.vcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending', -- pending | verified | failed
  verified_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcard_custom_domains TO authenticated;
GRANT SELECT ON public.vcard_custom_domains TO anon; -- public lookup by domain
GRANT ALL ON public.vcard_custom_domains TO service_role;
ALTER TABLE public.vcard_custom_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their custom domains" ON public.vcard_custom_domains
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read verified domains" ON public.vcard_custom_domains
  FOR SELECT USING (status = 'verified');
CREATE TRIGGER trg_vcd_updated BEFORE UPDATE ON public.vcard_custom_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_vcd_vcard ON public.vcard_custom_domains(vcard_id);
CREATE INDEX idx_vcd_domain ON public.vcard_custom_domains(domain);

-- 2. Invoices / receipts
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID,
  subscription_id UUID,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'paid',
  customer_name TEXT,
  customer_email TEXT,
  customer_address TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role inserts invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update invoices" ON public.invoices
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_invoices_user ON public.invoices(user_id);

-- 3. Branding removal + reseller flags
ALTER TABLE public.vcards ADD COLUMN IF NOT EXISTS hide_branding BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_reseller BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reseller_brand_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reseller_logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reseller_primary_color TEXT;

-- 4. Login activity log
CREATE TABLE public.login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  event_type TEXT NOT NULL DEFAULT 'login', -- login | logout | failed_login | password_change
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.login_activity TO authenticated;
GRANT ALL ON public.login_activity TO service_role;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own login activity" ON public.login_activity
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own login activity" ON public.login_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_login_activity_user ON public.login_activity(user_id, created_at DESC);

-- 5. Rate limiting table (window-based counter)
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL, -- e.g. "signup:ip:1.2.3.4" or "form:vcard:xxx:ip:..."
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No public policies; only edge functions (service role) write/read.
CREATE UNIQUE INDEX idx_rate_limits_key_window ON public.rate_limits(key, window_start);

-- Helper: check + increment rate limit (returns true if under limit)
CREATE OR REPLACE FUNCTION public.check_rate_limit(_key TEXT, _max_count INT, _window_seconds INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window TIMESTAMPTZ;
  current_count INT;
BEGIN
  current_window := date_trunc('second', now()) - (extract(epoch from now())::int % _window_seconds) * interval '1 second';
  INSERT INTO public.rate_limits(key, window_start, count)
  VALUES (_key, current_window, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO current_count;
  -- Cleanup old windows occasionally
  IF random() < 0.05 THEN
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  END IF;
  RETURN current_count <= _max_count;
END;
$$;

-- 6. GDPR account deletion helper
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'লগইন প্রয়োজন';
  END IF;
  -- Anonymize profile (auth.users deletion handled by edge function with service role)
  UPDATE public.profiles SET
    full_name = 'Deleted User',
    email = 'deleted-' || id::text || '@deleted.local',
    avatar_url = NULL,
    phone = NULL
  WHERE id = auth.uid();
  -- Mark for deletion via notification (admin processes)
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (auth.uid(), 'Account deletion requested', 'আপনার অ্যাকাউন্ট ৩০ দিনের মধ্যে মুছে ফেলা হবে', 'system');
END;
$$;