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