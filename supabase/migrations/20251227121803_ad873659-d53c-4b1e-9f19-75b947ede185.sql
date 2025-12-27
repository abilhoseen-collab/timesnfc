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