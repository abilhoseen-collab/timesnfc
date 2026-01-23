-- Create storage bucket for landing page assets
INSERT INTO storage.buckets (id, name, public) VALUES ('landing-page-assets', 'landing-page-assets', true);

-- Create policies for landing page assets bucket
CREATE POLICY "Users can upload their own landing page assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-page-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own landing page assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'landing-page-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own landing page assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-page-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view landing page assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-page-assets');

-- Add header settings columns to landing_pages table
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS header_logo_url TEXT,
ADD COLUMN IF NOT EXISTS header_title TEXT,
ADD COLUMN IF NOT EXISTS header_nav_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS header_sticky BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS header_show_cta BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS header_cta_text TEXT DEFAULT 'Contact Us',
ADD COLUMN IF NOT EXISTS header_cta_link TEXT DEFAULT '#contact';