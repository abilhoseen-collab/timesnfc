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