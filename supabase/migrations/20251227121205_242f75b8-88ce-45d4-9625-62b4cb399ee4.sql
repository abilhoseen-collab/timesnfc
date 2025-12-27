-- Add QR customization fields to vcards
ALTER TABLE public.vcards 
ADD COLUMN qr_foreground_color text DEFAULT '#000000',
ADD COLUMN qr_background_color text DEFAULT '#FFFFFF',
ADD COLUMN notification_email text,
ADD COLUMN notify_on_view boolean DEFAULT false,
ADD COLUMN notify_on_click boolean DEFAULT false;