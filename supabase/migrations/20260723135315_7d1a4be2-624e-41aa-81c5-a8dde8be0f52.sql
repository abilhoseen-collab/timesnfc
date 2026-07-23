
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
