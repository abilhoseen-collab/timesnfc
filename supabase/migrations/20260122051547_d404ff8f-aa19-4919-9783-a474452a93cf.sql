-- Create landing_pages table for user landing pages
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  custom_domain VARCHAR(255),
  ssl_status VARCHAR(50) DEFAULT 'pending',
  domain_verified BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- SEO Settings
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image_url TEXT,
  favicon_url TEXT,
  
  -- Theme Settings
  theme_color VARCHAR(50) DEFAULT '#14b8a6',
  font_family VARCHAR(100) DEFAULT 'Inter',
  background_color VARCHAR(50) DEFAULT '#ffffff',
  text_color VARCHAR(50) DEFAULT '#1f2937',
  
  -- Analytics
  total_views INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create landing_page_sections table for page content
CREATE TABLE public.landing_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  content JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create domain_verifications table for tracking domain verification
CREATE TABLE public.domain_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  verification_token VARCHAR(255) NOT NULL,
  txt_record VARCHAR(255),
  a_record VARCHAR(50) DEFAULT '185.158.133.1',
  verified_at TIMESTAMP WITH TIME ZONE,
  last_check_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_pages
CREATE POLICY "Users can view their own landing pages"
ON public.landing_pages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own landing pages"
ON public.landing_pages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own landing pages"
ON public.landing_pages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own landing pages"
ON public.landing_pages FOR DELETE
USING (auth.uid() = user_id);

-- Public access for published pages (by slug or domain)
CREATE POLICY "Anyone can view published landing pages"
ON public.landing_pages FOR SELECT
USING (is_published = true AND is_active = true);

-- RLS Policies for landing_page_sections
CREATE POLICY "Users can manage sections of their landing pages"
ON public.landing_page_sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.landing_pages
    WHERE id = landing_page_sections.landing_page_id
    AND user_id = auth.uid()
  )
);

-- Public can view sections of published pages
CREATE POLICY "Anyone can view sections of published pages"
ON public.landing_page_sections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.landing_pages
    WHERE id = landing_page_sections.landing_page_id
    AND is_published = true AND is_active = true
  )
);

-- RLS Policies for domain_verifications
CREATE POLICY "Users can manage their domain verifications"
ON public.domain_verifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.landing_pages
    WHERE id = domain_verifications.landing_page_id
    AND user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_landing_pages_user_id ON public.landing_pages(user_id);
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_custom_domain ON public.landing_pages(custom_domain);
CREATE INDEX idx_landing_page_sections_page_id ON public.landing_page_sections(landing_page_id);

-- Triggers for updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_page_sections_updated_at
BEFORE UPDATE ON public.landing_page_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();