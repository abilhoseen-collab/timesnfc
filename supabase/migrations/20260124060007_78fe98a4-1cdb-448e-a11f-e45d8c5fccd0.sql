-- Add footer configuration columns to landing_pages table
ALTER TABLE public.landing_pages
ADD COLUMN IF NOT EXISTS footer_copyright_text text DEFAULT '© 2024 All rights reserved.',
ADD COLUMN IF NOT EXISTS footer_social_links jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS footer_additional_links jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS footer_show_powered_by boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS footer_background_color varchar DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.landing_pages.footer_social_links IS 'JSON array of social links: [{platform: string, url: string, icon: string}]';
COMMENT ON COLUMN public.landing_pages.footer_additional_links IS 'JSON array of additional links: [{label: string, url: string}]';