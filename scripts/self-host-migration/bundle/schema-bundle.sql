-- Consolidated schema bundle for timescard self-hosted Supabase
-- Generated: 2026-07-23T18:04:16Z
-- Source: supabase/migrations/*.sql (timestamp order, 42 files)
-- Apply: psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f schema-bundle.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;


-- ============================================================
-- FILE: 20251227111148_d2fc54f0-a0c3-4028-a023-ec7ceebc33ee.sql
-- ============================================================
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create vcards table for digital business cards
CREATE TABLE public.vcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  job_title TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  bio TEXT,
  template TEXT DEFAULT 'freelancer',
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  github_url TEXT,
  is_active BOOLEAN DEFAULT true,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on vcards
ALTER TABLE public.vcards ENABLE ROW LEVEL SECURITY;

-- VCards policies
CREATE POLICY "Users can view their own vcards"
  ON public.vcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vcards"
  ON public.vcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vcards"
  ON public.vcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vcards"
  ON public.vcards FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view active vcards by slug
CREATE POLICY "Public can view active vcards"
  ON public.vcards FOR SELECT
  USING (is_active = true AND slug IS NOT NULL);

-- Create vcard_analytics table for tracking
CREATE TABLE public.vcard_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcard_id UUID REFERENCES public.vcards(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'link_click', 'qr_scan', 'nfc_tap')),
  link_name TEXT,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on analytics
ALTER TABLE public.vcard_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies - users can view analytics for their own vcards
CREATE POLICY "Users can view their vcard analytics"
  ON public.vcard_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vcards 
    WHERE vcards.id = vcard_analytics.vcard_id 
    AND vcards.user_id = auth.uid()
  ));

-- Anyone can insert analytics (for public vcard views)
CREATE POLICY "Anyone can insert analytics"
  ON public.vcard_analytics FOR INSERT
  WITH CHECK (true);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on cart
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can view their cart"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to cart"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their cart"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from cart"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cod',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order items policies
CREATE POLICY "Users can view their order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vcards_updated_at
  BEFORE UPDATE ON public.vcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FILE: 20251227115050_5d5ad1ee-01e6-4626-8662-3a81a8d2c1ca.sql
-- ============================================================
-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Add photo_url column to vcards table
ALTER TABLE public.vcards ADD COLUMN photo_url text;

-- Storage policies for profile photos
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- FILE: 20251227121205_242f75b8-88ce-45d4-9625-62b4cb399ee4.sql
-- ============================================================
-- Add QR customization fields to vcards
ALTER TABLE public.vcards 
ADD COLUMN qr_foreground_color text DEFAULT '#000000',
ADD COLUMN qr_background_color text DEFAULT '#FFFFFF',
ADD COLUMN notification_email text,
ADD COLUMN notify_on_view boolean DEFAULT false,
ADD COLUMN notify_on_click boolean DEFAULT false;

-- ============================================================
-- FILE: 20251227121735_d0383209-0715-4d74-8db3-7c91756c4baa.sql
-- ============================================================
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

-- ============================================================
-- FILE: 20251227121803_ad873659-d53c-4b1e-9f19-75b947ede185.sql
-- ============================================================
-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false);

-- Create storage bucket for QR logos
INSERT INTO storage.buckets (id, name, public) VALUES ('qr-logos', 'qr-logos', true);

-- Storage policies for payment screenshots (private - only owner can see)
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their payment screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for QR logos (public viewing, auth upload)
CREATE POLICY "Anyone can view QR logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-logos');

CREATE POLICY "Authenticated users can upload QR logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'qr-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own QR logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'qr-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own QR logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'qr-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- FILE: 20251227125209_d003994f-ff43-4b8d-b80a-a9e04e5f7f71.sql
-- ============================================================
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policy: Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update subscriptions (for approval)
CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles (for admin dashboard)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FILE: 20251227141256_4ae0f22b-8e69-4705-93da-0bd1d5c6f7cc.sql
-- ============================================================
-- Create table for NFC guest orders (before user registration)
CREATE TABLE public.nfc_guest_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  sender_number TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  payment_screenshot_url TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nfc_guest_orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (guest checkout)
CREATE POLICY "Anyone can create guest orders"
ON public.nfc_guest_orders
FOR INSERT
WITH CHECK (true);

-- Only admins can view all guest orders
CREATE POLICY "Admins can view all guest orders"
ON public.nfc_guest_orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update guest orders
CREATE POLICY "Admins can update guest orders"
ON public.nfc_guest_orders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_nfc_guest_orders_updated_at
BEFORE UPDATE ON public.nfc_guest_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FILE: 20251227142315_023a5136-6f8a-467d-a1a0-fd4af9494299.sql
-- ============================================================
-- Allow anyone to check NFC order status by email (for auth page validation)
CREATE POLICY "Anyone can check order status by email"
ON public.nfc_guest_orders
FOR SELECT
USING (true);

-- ============================================================
-- FILE: 20251227151923_3f8c37b3-a7cb-4755-bfd0-18c94c5ce319.sql
-- ============================================================
-- Create table for custom vcard sections with drag-drop ordering
CREATE TABLE public.vcard_custom_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vcard_id UUID NOT NULL REFERENCES public.vcards(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('text', 'image_gallery', 'service_card')),
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_vcard_custom_sections_vcard_id ON public.vcard_custom_sections(vcard_id);
CREATE INDEX idx_vcard_custom_sections_sort_order ON public.vcard_custom_sections(vcard_id, sort_order);

-- Enable RLS
ALTER TABLE public.vcard_custom_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage sections for their own vcards
CREATE POLICY "Users can view their own vcard sections"
ON public.vcard_custom_sections
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vcards 
  WHERE vcards.id = vcard_custom_sections.vcard_id 
  AND vcards.user_id = auth.uid()
));

CREATE POLICY "Users can create sections for their vcards"
ON public.vcard_custom_sections
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.vcards 
  WHERE vcards.id = vcard_custom_sections.vcard_id 
  AND vcards.user_id = auth.uid()
));

CREATE POLICY "Users can update their own vcard sections"
ON public.vcard_custom_sections
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.vcards 
  WHERE vcards.id = vcard_custom_sections.vcard_id 
  AND vcards.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own vcard sections"
ON public.vcard_custom_sections
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.vcards 
  WHERE vcards.id = vcard_custom_sections.vcard_id 
  AND vcards.user_id = auth.uid()
));

-- Public can view sections for active vcards (for public vcard display)
CREATE POLICY "Public can view sections of active vcards"
ON public.vcard_custom_sections
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vcards 
  WHERE vcards.id = vcard_custom_sections.vcard_id 
  AND vcards.is_active = true 
  AND vcards.slug IS NOT NULL
));

-- Add updated_at trigger
CREATE TRIGGER update_vcard_custom_sections_updated_at
BEFORE UPDATE ON public.vcard_custom_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add shipping_status column to nfc_guest_orders for timeline tracking
ALTER TABLE public.nfc_guest_orders 
ADD COLUMN shipping_status TEXT DEFAULT 'payment_received' 
CHECK (shipping_status IN ('payment_received', 'verified', 'shipped', 'delivered'));

-- Add shipping_status to orders table as well for registered users
ALTER TABLE public.orders 
ADD COLUMN shipping_status TEXT DEFAULT 'payment_received' 
CHECK (shipping_status IN ('payment_received', 'verified', 'shipped', 'delivered'));

-- ============================================================
-- FILE: 20251227152837_a1ab9288-8331-4ae5-ad7c-76e44e0af88f.sql
-- ============================================================
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

-- ============================================================
-- FILE: 20251227154703_1db98de2-7a1f-4ddd-b9ee-d78e90483fb9.sql
-- ============================================================
-- Add cover image column to vcards table
ALTER TABLE public.vcards ADD COLUMN cover_image_url text;

-- ============================================================
-- FILE: 20251227160033_490ee14d-862c-4a17-8303-6f506585387a.sql
-- ============================================================
-- Add length constraints on orders table for server-side validation
ALTER TABLE public.orders 
ADD CONSTRAINT check_shipping_name_length CHECK (char_length(shipping_name) <= 255),
ADD CONSTRAINT check_shipping_address_length CHECK (char_length(shipping_address) <= 500),
ADD CONSTRAINT check_shipping_city_length CHECK (char_length(shipping_city) <= 100),
ADD CONSTRAINT check_shipping_phone_length CHECK (char_length(shipping_phone) <= 20);

-- Add length constraints on nfc_guest_orders table for server-side validation
ALTER TABLE public.nfc_guest_orders
ADD CONSTRAINT check_full_name_length CHECK (char_length(full_name) <= 255),
ADD CONSTRAINT check_guest_email_length CHECK (char_length(email) <= 255),
ADD CONSTRAINT check_guest_shipping_address_length CHECK (char_length(shipping_address) <= 500),
ADD CONSTRAINT check_guest_shipping_city_length CHECK (char_length(shipping_city) <= 100),
ADD CONSTRAINT check_guest_phone_length CHECK (char_length(phone) <= 20),
ADD CONSTRAINT check_transaction_id_length CHECK (char_length(transaction_id) <= 50);

-- ============================================================
-- FILE: 20251228122556_0f13684e-60e2-42e2-a317-7881c8efae3c.sql
-- ============================================================
-- Create home page content table for admin-managed content
CREATE TABLE public.home_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read home page content (public facing)
CREATE POLICY "Anyone can read home page content"
ON public.home_page_content
FOR SELECT
USING (true);

-- Only admins can modify home page content
CREATE POLICY "Admins can insert home page content"
ON public.home_page_content
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update home page content"
ON public.home_page_content
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete home page content"
ON public.home_page_content
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_home_page_content_updated_at
BEFORE UPDATE ON public.home_page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content for each section
INSERT INTO public.home_page_content (section_key, title, subtitle, content, sort_order) VALUES
('hero', 'Create Your Business Card', 'Transform your networking with professional digital business cards. Share your contact info instantly with NFC technology.', 
 '{"badge_text": "IT Solution", "cta_primary": "Start Free Trial", "cta_secondary": "NFC Card Explained", "stats": [{"value": "10K+", "label": "Active Users"}, {"value": "50+", "label": "Countries"}, {"value": "99%", "label": "Satisfaction"}]}', 1),

('features', 'Powerful Features for Modern Networking', 'Everything you need to create, share, and manage your digital business presence.',
 '{"features": [{"title": "QR Code Generation", "description": "Generate unique QR codes for instant contact sharing.", "icon": "QrCode"}, {"title": "NFC Technology", "description": "Tap-to-share functionality with NFC-enabled devices.", "icon": "Nfc"}, {"title": "Analytics & Insights", "description": "Track views, clicks, and engagement metrics.", "icon": "BarChart3"}, {"title": "Quick Setup", "description": "Create your digital business card in under 5 minutes.", "icon": "Zap"}, {"title": "Professional Network", "description": "Join thousands of professionals using our platform.", "icon": "Users"}, {"title": "Trusted by Industry Leaders", "description": "Secure and trusted by businesses worldwide.", "icon": "Shield"}]}', 2),

('about', 'About Times Business Card', 'We are passionate about transforming how professionals connect.',
 '{"story_title": "Empowering Professional Connections Since 2025", "story_text": "Founded by a team of networking enthusiasts and technology experts, Times Card was born from the frustration of outdated paper business cards.", "ecosystem": [{"name": "Times Travel", "desc": "Premium travel experiences"}, {"name": "Times IT", "desc": "IT solutions & consulting"}, {"name": "Times Graphics", "desc": "Creative design services"}, {"name": "Times Media", "desc": "Digital marketing agency"}]}', 3),

('testimonials', 'What Our Users Say', 'Hear from professionals who have transformed their networking.',
 '{"testimonials": [{"name": "Sarah Chen", "role": "Marketing Director", "company": "TechCorp", "content": "This platform has revolutionized how I network at conferences.", "rating": 5}, {"name": "Michael Johnson", "role": "Freelance Designer", "company": "MJ Studios", "content": "The NFC cards are a game-changer. Clients are always impressed.", "rating": 5}]}', 4),

('faq', 'Frequently Asked Questions', 'Find answers to common questions about our digital business cards.',
 '{"faqs": [{"question": "How does NFC work?", "answer": "Simply tap your NFC card on any NFC-enabled smartphone to instantly share your contact information."}, {"question": "Can I update my card info?", "answer": "Yes! You can update your digital card information anytime from your dashboard."}, {"question": "What devices are compatible?", "answer": "Most modern smartphones support NFC. iPhone 7 and newer, and most Android devices."}]}', 5),

('cta', 'Ready to Transform Your Networking?', 'Join thousands of professionals who have already made the switch to digital business cards.',
 '{"button_text": "Get Started Free", "secondary_text": "No credit card required"}', 6),

('contact', 'Get in Touch', 'Have questions? We are here to help you get started.',
 '{"email": "support@timescard.com", "phone": "+880 1234-567890", "address": "Dhaka, Bangladesh", "social_links": {"facebook": "", "twitter": "", "linkedin": "", "instagram": ""}}', 7);

-- ============================================================
-- FILE: 20260104155624_e2da1cef-05bf-45c1-b01a-106ed16fe3b4.sql
-- ============================================================
-- Add admin CRUD policies for packages table
CREATE POLICY "Admins can insert packages" 
ON public.packages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update packages" 
ON public.packages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete packages" 
ON public.packages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- FILE: 20260113092549_65d751d8-1969-4a95-9414-0e8bb6f7f3eb.sql
-- ============================================================
-- Insert contact section if not exists
INSERT INTO public.home_page_content (section_key, title, subtitle, content, sort_order, is_visible)
VALUES (
  'contact',
  'Get in Touch',
  'Have a question or want to work together? We''d love to hear from you.',
  '{"email": "support@timesdigitalbd.com", "phone": "+880 1XXX-XXXXXX", "address": "Anderkilla, Chattagram, Bangladesh", "businessHours": "Sat - Thu: 9AM - 6PM", "socialLinks": {"facebook": "", "linkedin": "", "instagram": ""}}'::jsonb,
  7,
  true
)
ON CONFLICT (section_key) DO NOTHING;

-- ============================================================
-- FILE: 20260122051547_d404ff8f-aa19-4919-9783-a474452a93cf.sql
-- ============================================================
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

-- ============================================================
-- FILE: 20260123121233_369abc2c-0e6f-42f2-98b1-7ca52305d3a2.sql
-- ============================================================
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

-- ============================================================
-- FILE: 20260124060007_78fe98a4-1cdb-448e-a11f-e45d8c5fccd0.sql
-- ============================================================
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

-- ============================================================
-- FILE: 20260124063646_8804e809-0c83-467a-b048-ce4cb1715b38.sql
-- ============================================================
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

-- ============================================================
-- FILE: 20260124070133_f315dd31-0f9c-436c-a846-2f65683c6196.sql
-- ============================================================
-- Add chat and payment fields to vcards table
ALTER TABLE public.vcards
ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS telegram_username text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS chat_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_bkash text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_nagad text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_rocket text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_bank_details text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_button_text text DEFAULT 'Send Payment';

-- Add comments
COMMENT ON COLUMN public.vcards.whatsapp_number IS 'WhatsApp number for live chat widget';
COMMENT ON COLUMN public.vcards.telegram_username IS 'Telegram username for live chat';
COMMENT ON COLUMN public.vcards.payment_enabled IS 'Enable payment/donation button on vcard';

-- ============================================================
-- FILE: 20260124071013_265262fa-d770-4b7c-a3e3-b8cc82b35b5f.sql
-- ============================================================
-- Add appointment booking fields to vcards table
ALTER TABLE public.vcards
ADD COLUMN IF NOT EXISTS appointment_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS appointment_title text DEFAULT 'Book an Appointment',
ADD COLUMN IF NOT EXISTS appointment_description text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS appointment_duration_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS appointment_available_days jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
ADD COLUMN IF NOT EXISTS appointment_start_time text DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS appointment_end_time text DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS appointment_email text DEFAULT NULL;

-- Create appointment bookings table
CREATE TABLE IF NOT EXISTS public.vcard_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vcard_id uuid NOT NULL REFERENCES public.vcards(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  visitor_email text NOT NULL,
  visitor_phone text,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  notes text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vcard_appointments ENABLE ROW LEVEL SECURITY;

-- Anyone can create appointments (visitors)
CREATE POLICY "Anyone can create appointments"
ON public.vcard_appointments FOR INSERT
WITH CHECK (true);

-- Users can view appointments for their vcards
CREATE POLICY "Users can view their vcard appointments"
ON public.vcard_appointments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM vcards WHERE vcards.id = vcard_appointments.vcard_id AND vcards.user_id = auth.uid()
));

-- Users can update appointments for their vcards
CREATE POLICY "Users can update their vcard appointments"
ON public.vcard_appointments FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM vcards WHERE vcards.id = vcard_appointments.vcard_id AND vcards.user_id = auth.uid()
));

-- Users can delete appointments for their vcards
CREATE POLICY "Users can delete their vcard appointments"
ON public.vcard_appointments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM vcards WHERE vcards.id = vcard_appointments.vcard_id AND vcards.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_vcard_appointments_updated_at
BEFORE UPDATE ON public.vcard_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FILE: 20260124084804_ffbf909a-d509-41d0-847d-f6d8c83a6791.sql
-- ============================================================
-- Allow all supported vCard custom section types
ALTER TABLE public.vcard_custom_sections
  DROP CONSTRAINT IF EXISTS vcard_custom_sections_section_type_check;

ALTER TABLE public.vcard_custom_sections
  ADD CONSTRAINT vcard_custom_sections_section_type_check
  CHECK (
    section_type = ANY (
      ARRAY[
        'text'::text,
        'image_gallery'::text,
        'service_card'::text,
        'video'::text,
        'testimonial'::text,
        'product_catalog'::text,
        'product_gallery'::text,
        'social_proof'::text,
        'faq'::text,
        'contact_form'::text
      ]
    )
  );

-- ============================================================
-- FILE: 20260126011731_74a2b3b9-7513-41fd-bf4d-5309fed91ecd.sql
-- ============================================================
-- Add VCard and Landing Page limits to packages table
ALTER TABLE public.packages 
ADD COLUMN vcard_limit integer NOT NULL DEFAULT 1,
ADD COLUMN landing_page_limit integer NOT NULL DEFAULT 1;

-- Update existing packages with limits based on pricing tiers
-- Basic (299 BDT): 1 VCard, 1 Landing Page
UPDATE public.packages SET vcard_limit = 1, landing_page_limit = 1 WHERE price = 299;

-- Pro (599 BDT): 3 VCards, 2 Landing Pages  
UPDATE public.packages SET vcard_limit = 3, landing_page_limit = 2 WHERE price = 599;

-- Business (1499 BDT): 7 VCards, 4 Landing Pages
UPDATE public.packages SET vcard_limit = 7, landing_page_limit = 4 WHERE price = 1499;

-- ============================================================
-- FILE: 20260126012710_f2d7642c-1d80-4c59-95dc-279ad208a47e.sql
-- ============================================================
-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================================
-- FILE: 20260617101704_f373398f-222c-4dee-bdf2-a18ed05a2f25.sql
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vcards_user_created ON public.vcards (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_created ON public.subscriptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vcard_analytics_vcard_created ON public.vcard_analytics (vcard_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vcard_analytics_event_type ON public.vcard_analytics (vcard_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);


-- ============================================================
-- FILE: 20260628114039_835b454d-c23b-47dd-a707-b5ea74851e16.sql
-- ============================================================

-- ===== NOTIFICATIONS TABLE =====
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','payment','subscription','order','appointment')),
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ===== SUPPORT TICKETS TABLE =====
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general','technical','billing','feature_request','bug_report','account')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  admin_reply TEXT,
  replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete tickets" ON public.support_tickets
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Add phone column to profiles if not exists =====
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;


-- ============================================================
-- FILE: 20260629070156_179802e3-0ae6-404e-865c-dacf0507ce50.sql
-- ============================================================

-- Add columns to profiles for onboarding and referral
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- COUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_amount NUMERIC NOT NULL DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  applicable_packages UUID[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins manage coupons insert"
  ON public.coupons FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage coupons update"
  ON public.coupons FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage coupons delete"
  ON public.coupons FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read all coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COUPON REDEMPTIONS
CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_request_id UUID,
  discount_amount NUMERIC NOT NULL,
  original_amount NUMERIC NOT NULL,
  final_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own redemptions"
  ON public.coupon_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own redemptions"
  ON public.coupon_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);

-- REFERRALS
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_days INTEGER NOT NULL DEFAULT 0,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update referrals"
  ON public.referrals FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate referral code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN := false;
BEGIN
  WHILE NOT done LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    BEGIN
      PERFORM 1 FROM public.profiles WHERE referral_code = new_code;
      IF NOT FOUND THEN
        done := true;
      END IF;
    END;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Backfill referral codes for existing profiles
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- Update handle_new_user to include referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code TEXT;
  referrer UUID;
BEGIN
  ref_code := public.generate_referral_code();

  -- Check if signed up with a referral code in metadata
  IF NEW.raw_user_meta_data ? 'referred_by_code' THEN
    SELECT id INTO referrer
    FROM public.profiles
    WHERE referral_code = upper(NEW.raw_user_meta_data ->> 'referred_by_code')
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    ref_code,
    referrer
  );

  IF referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, status)
    VALUES (referrer, NEW.id, upper(NEW.raw_user_meta_data ->> 'referred_by_code'), 'pending');
  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================
-- FILE: 20260629070228_31128a0a-5a43-497d-a796-d149ed1c2cd6.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN := false;
BEGIN
  WHILE NOT done LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    PERFORM 1 FROM public.profiles WHERE referral_code = new_code;
    IF NOT FOUND THEN
      done := true;
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated, service_role;


-- ============================================================
-- FILE: 20260629072142_787bdef0-92d8-4b18-9942-badaa14f5794.sql
-- ============================================================

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


-- ============================================================
-- FILE: 20260629083650_8e485aa7-655a-4997-9d79-90ff207d4293.sql
-- ============================================================
-- Phase 9.2: Lead tags + auto in-app notification on new lead

ALTER TABLE public.vcard_leads
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_vcard_leads_tags ON public.vcard_leads USING GIN (tags);

-- Allow 'lead' type in notifications
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY['info','success','warning','error','payment','subscription','order','appointment','lead']));

-- Trigger function: notify owner on new lead
CREATE OR REPLACE FUNCTION public.notify_owner_on_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    'নতুন Lead এসেছে',
    COALESCE(NEW.visitor_name, 'একজন ভিজিটর') ||
      CASE WHEN NEW.visitor_email IS NOT NULL THEN ' (' || NEW.visitor_email || ')' ELSE '' END ||
      ' আপনার কার্ডে যোগাযোগ করেছেন।',
    'lead',
    '/leads'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_owner_on_new_lead ON public.vcard_leads;
CREATE TRIGGER trg_notify_owner_on_new_lead
  AFTER INSERT ON public.vcard_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_new_lead();


-- ============================================================
-- FILE: 20260629084346_831e23eb-c656-40f8-91db-d16457d3c8a6.sql
-- ============================================================
-- Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_new_lead BOOLEAN NOT NULL DEFAULT true,
  email_new_lead BOOLEAN NOT NULL DEFAULT true,
  weekly_digest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prefs"
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notification_prefs_updated
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed prefs for new users (extend existing handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ref_code TEXT;
  referrer UUID;
BEGIN
  ref_code := public.generate_referral_code();

  IF NEW.raw_user_meta_data ? 'referred_by_code' THEN
    SELECT id INTO referrer
    FROM public.profiles
    WHERE referral_code = upper(NEW.raw_user_meta_data ->> 'referred_by_code')
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    ref_code,
    referrer
  );

  IF referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, status)
    VALUES (referrer, NEW.id, upper(NEW.raw_user_meta_data ->> 'referred_by_code'), 'pending');
  END IF;

  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;


-- ============================================================
-- FILE: 20260629084854_7c1a979d-d568-4daa-92c5-25d64693568b.sql
-- ============================================================

-- ============ PHASE 9.5: Teams + RBAC ============

-- 1) Team role enum
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- 2) Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 3) Team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX team_members_user_idx ON public.team_members(user_id);
CREATE INDEX team_members_team_idx ON public.team_members(team_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 4) Team invitations
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.team_role NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX team_invitations_email_idx ON public.team_invitations(lower(email));
CREATE INDEX team_invitations_token_idx ON public.team_invitations(token);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invitations TO authenticated;
GRANT ALL ON public.team_invitations TO service_role;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- 5) Security definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_team_role(_team_id UUID, _user_id UUID)
RETURNS public.team_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.team_members
  WHERE team_id = _team_id AND user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_team_role(_team_id UUID, _user_id UUID, _min public.team_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = _team_id AND tm.user_id = _user_id
      AND (
        CASE tm.role
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'editor' THEN 2
          WHEN 'viewer' THEN 1
        END
      ) >= (
        CASE _min
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'editor' THEN 2
          WHEN 'viewer' THEN 1
        END
      )
  )
$$;

-- 6) RLS Policies — teams
CREATE POLICY "Team members can view team"
  ON public.teams FOR SELECT TO authenticated
  USING (public.is_team_member(id, auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners/admins can update team"
  ON public.teams FOR UPDATE TO authenticated
  USING (public.has_team_role(id, auth.uid(), 'admin'));

CREATE POLICY "Only owner can delete team"
  ON public.teams FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND is_personal = false);

-- 7) RLS — team_members
CREATE POLICY "Members can view team roster"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Admins can add members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.has_team_role(team_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.team_members FOR UPDATE TO authenticated
  USING (public.has_team_role(team_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can remove members or self-leave"
  ON public.team_members FOR DELETE TO authenticated
  USING (public.has_team_role(team_id, auth.uid(), 'admin') OR user_id = auth.uid());

-- 8) RLS — invitations
CREATE POLICY "Admins can view team invitations"
  ON public.team_invitations FOR SELECT TO authenticated
  USING (public.has_team_role(team_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
  ON public.team_invitations FOR INSERT TO authenticated
  WITH CHECK (public.has_team_role(team_id, auth.uid(), 'admin') AND invited_by = auth.uid());

CREATE POLICY "Admins can delete invitations"
  ON public.team_invitations FOR DELETE TO authenticated
  USING (public.has_team_role(team_id, auth.uid(), 'admin'));

CREATE POLICY "Invited users can mark accepted"
  ON public.team_invitations FOR UPDATE TO authenticated
  USING (accepted_at IS NULL AND expires_at > now());

-- 9) updated_at trigger on teams
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10) Add optional team_id to ownership tables
ALTER TABLE public.vcards ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.landing_pages ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.vcard_leads ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
CREATE INDEX vcards_team_idx ON public.vcards(team_id);
CREATE INDEX landing_pages_team_idx ON public.landing_pages(team_id);
CREATE INDEX vcard_leads_team_idx ON public.vcard_leads(team_id);

-- 11) Extend RLS on vcards to allow team members (editor+) full access; viewer read-only
CREATE POLICY "Team members can view team vcards"
  ON public.vcards FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team editors can modify team vcards"
  ON public.vcards FOR UPDATE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

CREATE POLICY "Team editors can insert team vcards"
  ON public.vcards FOR INSERT TO authenticated
  WITH CHECK (team_id IS NULL OR public.has_team_role(team_id, auth.uid(), 'editor'));

CREATE POLICY "Team admins can delete team vcards"
  ON public.vcards FOR DELETE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'admin'));

-- Same for landing_pages
CREATE POLICY "Team members can view team landing pages"
  ON public.landing_pages FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team editors can modify team landing pages"
  ON public.landing_pages FOR UPDATE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

CREATE POLICY "Team editors can insert team landing pages"
  ON public.landing_pages FOR INSERT TO authenticated
  WITH CHECK (team_id IS NULL OR public.has_team_role(team_id, auth.uid(), 'editor'));

CREATE POLICY "Team admins can delete team landing pages"
  ON public.landing_pages FOR DELETE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'admin'));

-- Same for vcard_leads
CREATE POLICY "Team members can view team leads"
  ON public.vcard_leads FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team editors can modify team leads"
  ON public.vcard_leads FOR UPDATE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

-- 12) Auto-create personal team on signup; backfill for existing users
CREATE OR REPLACE FUNCTION public.create_personal_team_for_user(_user_id UUID, _name TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_team_id UUID;
BEGIN
  INSERT INTO public.teams (name, owner_id, is_personal)
  VALUES (COALESCE(NULLIF(_name, ''), 'আমার Team'), _user_id, true)
  RETURNING id INTO new_team_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, _user_id, 'owner');

  RETURN new_team_id;
END;
$$;

-- Update handle_new_user to also create personal team
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_code TEXT;
  referrer UUID;
BEGIN
  ref_code := public.generate_referral_code();

  IF NEW.raw_user_meta_data ? 'referred_by_code' THEN
    SELECT id INTO referrer FROM public.profiles
    WHERE referral_code = upper(NEW.raw_user_meta_data ->> 'referred_by_code') LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, referral_code, referred_by)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    ref_code, referrer
  );

  IF referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, status)
    VALUES (referrer, NEW.id, upper(NEW.raw_user_meta_data ->> 'referred_by_code'), 'pending');
  END IF;

  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

  -- Create personal team
  PERFORM public.create_personal_team_for_user(NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', '') || ' এর Team');

  RETURN NEW;
END;
$$;

-- Backfill personal teams for existing users without one
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN
    SELECT p.id, p.full_name FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.teams t WHERE t.owner_id = p.id AND t.is_personal = true
    )
  LOOP
    PERFORM public.create_personal_team_for_user(u.id, COALESCE(u.full_name, '') || ' এর Team');
  END LOOP;
END $$;

-- 13) Accept invitation function
CREATE OR REPLACE FUNCTION public.accept_team_invitation(_token TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD;
  current_email TEXT;
BEGIN
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  IF current_email IS NULL THEN
    RAISE EXCEPTION 'লগইন প্রয়োজন';
  END IF;

  SELECT * INTO inv FROM public.team_invitations
  WHERE token = _token AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation invalid বা expired';
  END IF;

  IF lower(inv.email) <> lower(current_email) THEN
    RAISE EXCEPTION 'এই invitation আপনার email-এর জন্য নয়';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (inv.team_id, auth.uid(), inv.role)
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.team_invitations SET accepted_at = now() WHERE id = inv.id;

  RETURN inv.team_id;
END;
$$;


-- ============================================================
-- FILE: 20260629084918_73046492-1c4e-4dda-94d5-8de5d7de8a7f.sql
-- ============================================================

-- Tighten insert policies (avoid team_id IS NULL bypass)
DROP POLICY IF EXISTS "Team editors can insert team vcards" ON public.vcards;
CREATE POLICY "Team editors can insert team vcards"
  ON public.vcards FOR INSERT TO authenticated
  WITH CHECK (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Team editors can insert team landing pages" ON public.landing_pages;
CREATE POLICY "Team editors can insert team landing pages"
  ON public.landing_pages FOR INSERT TO authenticated
  WITH CHECK (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

-- Remove broad invitation update; force RPC usage
DROP POLICY IF EXISTS "Invited users can mark accepted" ON public.team_invitations;

-- Revoke public execute on SECURITY DEFINER helpers (keep authenticated)
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_team_role(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_team_role(UUID, UUID, public.team_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_team_invitation(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_personal_team_for_user(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_team_role(UUID, UUID, public.team_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(TEXT) TO authenticated;


-- ============================================================
-- FILE: 20260629090302_d30bf778-2a2e-457c-8de3-33e7cc5c98f6.sql
-- ============================================================
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

-- ============================================================
-- FILE: 20260629090316_afcce6f8-c01f-46eb-b3a8-8e21363511d5.sql
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, INT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;

-- ============================================================
-- FILE: 20260629091126_9fe1419d-314b-4038-8d30-043ceb7b7b64.sql
-- ============================================================

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


-- ============================================================
-- FILE: 20260629091917_e08e0e79-abd2-47cf-8dbf-a8d80150b839.sql
-- ============================================================

ALTER TABLE public.vcards
  ADD COLUMN IF NOT EXISTS zapier_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS mailchimp_api_key TEXT,
  ADD COLUMN IF NOT EXISTS mailchimp_audience_id TEXT,
  ADD COLUMN IF NOT EXISTS hubspot_token TEXT,
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

ALTER TABLE public.vcard_appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON public.vcard_appointments(appointment_date, reminder_sent_at);


-- ============================================================
-- FILE: 20260629092526_33f8f49b-b5b8-4f3e-9480-c9d088ec5e6d.sql
-- ============================================================

ALTER TABLE public.vcards
  ADD COLUMN IF NOT EXISTS brand_color TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT,
  ADD COLUMN IF NOT EXISTS animated_background BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_font TEXT;

ALTER TABLE public.vcard_leads
  ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_followup ON public.vcard_leads(follow_up_at) WHERE follow_up_at IS NOT NULL AND follow_up_sent_at IS NULL;

ALTER TABLE public.vcard_analytics
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS scroll_depth INT;

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  rollout_percent INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_feature_flags_updated BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- FILE: 20260629093348_1cbcdc03-2f92-4a1d-9119-33443be8491d.sql
-- ============================================================

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


-- ============================================================
-- FILE: 20260723135315_7d1a4be2-624e-41aa-81c5-a8dde8be0f52.sql
-- ============================================================

DROP POLICY IF EXISTS "Anyone can check order status by email" ON public.nfc_guest_orders;

CREATE OR REPLACE FUNCTION public.get_guest_order_status(_email text, _order_id uuid)
RETURNS TABLE(id uuid, status text, shipping_status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.id, o.status, o.shipping_status, o.created_at
  FROM public.nfc_guest_orders o
  WHERE o.id = _order_id AND lower(o.email) = lower(_email)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_guest_order_status(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_order_status(text, uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Users can upload payment screenshots" ON storage.objects;
CREATE POLICY "Users can upload their own payment screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Anyone can submit testimonial" ON public.vcard_testimonials;
CREATE POLICY "Anyone can submit testimonial for active vcard"
ON public.vcard_testimonials FOR INSERT
WITH CHECK (
  approved = false
  AND EXISTS (
    SELECT 1 FROM public.vcards v
    WHERE v.id = vcard_testimonials.vcard_id AND v.is_active = true
  )
);

DROP POLICY IF EXISTS "Anyone can insert landing page analytics" ON public.landing_page_analytics;
CREATE POLICY "Anyone can insert analytics for published pages"
ON public.landing_page_analytics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.landing_pages lp
    WHERE lp.id = landing_page_analytics.landing_page_id
      AND lp.is_published = true AND lp.is_active = true
  )
);


-- ============================================================
-- FILE: 20260723135351_fd443e9c-dcba-40f7-a5cc-a28d2a03aea1.sql
-- ============================================================

DROP FUNCTION IF EXISTS public.get_guest_order_status(text, uuid);

CREATE OR REPLACE FUNCTION public.get_guest_order_status(_email text, _order_id uuid)
RETURNS SETOF public.nfc_guest_orders
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.*
  FROM public.nfc_guest_orders o
  WHERE o.id = _order_id AND lower(o.email) = lower(_email)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_guest_order_status(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_order_status(text, uuid) TO anon, authenticated;


-- ============================================================
-- FILE: 20260723165520_a89e132b-92a4-45ba-91fa-98a2d017f490.sql
-- ============================================================

-- Admin RLS + validation deep-dive: harden SECURITY DEFINER function exposure.
-- Trigger-only and internal-helper SECURITY DEFINER functions must not be callable
-- via PostgREST by anon/authenticated. Functions used inside RLS policies
-- (has_role, is_team_member, get_team_role, has_team_role) or invoked as RPCs
-- (accept_team_invitation, request_account_deletion, get_guest_order_status)
-- keep their existing EXECUTE grants.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owner_on_new_lead() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_personal_team_for_user(uuid, text) FROM PUBLIC, anon, authenticated;

-- Ensure service_role retains execute for triggers/edge functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_owner_on_new_lead() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_personal_team_for_user(uuid, text) TO service_role;

-- rate_limits table: RLS is on with no policies. Data API cannot reach it
-- (only service_role via SECURITY DEFINER check_rate_limit uses it). Belt-and-braces:
-- lock down direct Data API grants explicitly.
REVOKE ALL ON TABLE public.rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;


COMMIT;
