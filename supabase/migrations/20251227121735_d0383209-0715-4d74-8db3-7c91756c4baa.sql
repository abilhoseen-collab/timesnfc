-- Create packages table
CREATE TABLE public.packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Public can view active packages
CREATE POLICY "Anyone can view active packages"
ON public.packages FOR SELECT
USING (is_active = true);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  package_id uuid REFERENCES public.packages(id),
  status text DEFAULT 'pending',
  payment_method text NOT NULL,
  transaction_id text,
  sender_number text,
  amount numeric NOT NULL,
  payment_screenshot_url text,
  bank_name text,
  account_holder_name text,
  payment_date timestamp with time zone,
  expires_at timestamp with time zone,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users can create subscriptions
CREATE POLICY "Users can create subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add qr_logo_url to vcards
ALTER TABLE public.vcards ADD COLUMN qr_logo_url text;

-- Insert default packages
INSERT INTO public.packages (name, description, price, duration_days, features) VALUES
('Basic', 'Perfect for individuals', 299, 30, '["1 Digital Card", "Basic Templates", "QR Code", "Email Support"]'),
('Pro', 'Best for professionals', 599, 30, '["3 Digital Cards", "All Templates", "Custom QR Colors", "Logo on QR", "Analytics", "Priority Support"]'),
('Business', 'For teams and businesses', 1499, 30, '["10 Digital Cards", "All Templates", "Custom QR Colors", "Logo on QR", "Advanced Analytics", "NFC Card Support", "24/7 Support"]');