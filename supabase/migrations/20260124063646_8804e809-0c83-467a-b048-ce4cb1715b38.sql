-- Add visitor tracking columns to vcard_analytics
ALTER TABLE public.vcard_analytics
ADD COLUMN IF NOT EXISTS visitor_id text,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS is_unique boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS time_on_page integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text;

-- Create landing_page_analytics table for visitor tracking
CREATE TABLE IF NOT EXISTS public.landing_page_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  visitor_id text,
  session_id text,
  is_unique boolean DEFAULT true,
  time_on_page integer DEFAULT 0,
  section_id text,
  section_type text,
  visitor_ip text,
  user_agent text,
  referrer text,
  country text,
  city text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert landing page analytics"
ON public.landing_page_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their landing page analytics"
ON public.landing_page_analytics
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM landing_pages
  WHERE landing_pages.id = landing_page_analytics.landing_page_id
  AND landing_pages.user_id = auth.uid()
));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_landing_page_analytics_page_id ON public.landing_page_analytics(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_analytics_created_at ON public.landing_page_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_vcard_analytics_visitor_id ON public.vcard_analytics(visitor_id);