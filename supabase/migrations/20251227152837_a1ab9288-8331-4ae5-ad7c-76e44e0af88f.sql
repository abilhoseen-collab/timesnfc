-- Create site_settings table for admin-controlled settings
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read site settings
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can update site settings
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES 
('templates_visible', '{"enabled": false}'::jsonb);

-- Create upgrade_requests table for package upgrades
CREATE TABLE public.upgrade_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_subscription_id UUID REFERENCES public.subscriptions(id),
  target_package_id UUID REFERENCES public.packages(id),
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  sender_number TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  payment_screenshot_url TEXT,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own upgrade requests
CREATE POLICY "Users can view their own upgrade requests"
ON public.upgrade_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create upgrade requests
CREATE POLICY "Users can create upgrade requests"
ON public.upgrade_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all upgrade requests
CREATE POLICY "Admins can view all upgrade requests"
ON public.upgrade_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update upgrade requests
CREATE POLICY "Admins can update upgrade requests"
ON public.upgrade_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_upgrade_requests_updated_at
BEFORE UPDATE ON public.upgrade_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();