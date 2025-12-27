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