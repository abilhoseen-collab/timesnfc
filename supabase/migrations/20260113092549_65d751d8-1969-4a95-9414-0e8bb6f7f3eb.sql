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