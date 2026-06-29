
CREATE TABLE IF NOT EXISTS public.vcard_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vcard_id UUID NOT NULL REFERENCES public.vcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT,
  visitor_phone TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'new',
  message TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcard_leads TO authenticated;
GRANT INSERT ON public.vcard_leads TO anon;
GRANT ALL ON public.vcard_leads TO service_role;

ALTER TABLE public.vcard_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their leads" ON public.vcard_leads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can insert their leads" ON public.vcard_leads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can submit a lead via contact form" ON public.vcard_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    source IN ('contact_form', 'chat', 'appointment')
    AND user_id = (SELECT v.user_id FROM public.vcards v WHERE v.id = vcard_id AND v.is_active = true)
  );

CREATE POLICY "Owners can update their leads" ON public.vcard_leads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their leads" ON public.vcard_leads
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_vcard_leads_user ON public.vcard_leads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vcard_leads_vcard ON public.vcard_leads(vcard_id);
CREATE INDEX IF NOT EXISTS idx_vcard_leads_status ON public.vcard_leads(user_id, status);

CREATE TRIGGER update_vcard_leads_updated_at
  BEFORE UPDATE ON public.vcard_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
