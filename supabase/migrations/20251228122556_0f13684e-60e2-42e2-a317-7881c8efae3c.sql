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