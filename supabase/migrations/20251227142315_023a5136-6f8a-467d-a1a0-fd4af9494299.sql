-- Allow anyone to check NFC order status by email (for auth page validation)
CREATE POLICY "Anyone can check order status by email"
ON public.nfc_guest_orders
FOR SELECT
USING (true);