
-- Batch B: Discovery & Growth
ALTER TABLE public.vcards
  ADD COLUMN IF NOT EXISTS listed_in_directory BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS directory_category TEXT,
  ADD COLUMN IF NOT EXISTS linktree_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS testimonials_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_vcards_directory ON public.vcards(listed_in_directory) WHERE listed_in_directory = true;

-- Testimonials
CREATE TABLE IF NOT EXISTS public.vcard_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcard_id UUID NOT NULL REFERENCES public.vcards(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_avatar_url TEXT,
  content TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcard_testimonials TO authenticated;
GRANT SELECT, INSERT ON public.vcard_testimonials TO anon;
GRANT ALL ON public.vcard_testimonials TO service_role;
ALTER TABLE public.vcard_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved testimonials"
  ON public.vcard_testimonials FOR SELECT
  USING (approved = true OR EXISTS (SELECT 1 FROM public.vcards v WHERE v.id = vcard_id AND v.user_id = auth.uid()));

CREATE POLICY "Anyone can submit testimonial"
  ON public.vcard_testimonials FOR INSERT
  WITH CHECK (approved = false);

CREATE POLICY "Owner can update testimonials"
  ON public.vcard_testimonials FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vcards v WHERE v.id = vcard_id AND v.user_id = auth.uid()));

CREATE POLICY "Owner can delete testimonials"
  ON public.vcard_testimonials FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.vcards v WHERE v.id = vcard_id AND v.user_id = auth.uid()));

CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON public.vcard_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Saved contacts (card-to-card)
CREATE TABLE IF NOT EXISTS public.vcard_saved_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vcard_id UUID NOT NULL REFERENCES public.vcards(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vcard_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vcard_saved_contacts TO authenticated;
GRANT ALL ON public.vcard_saved_contacts TO service_role;
ALTER TABLE public.vcard_saved_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved contacts"
  ON public.vcard_saved_contacts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
