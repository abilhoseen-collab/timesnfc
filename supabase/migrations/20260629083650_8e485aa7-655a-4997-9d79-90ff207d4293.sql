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
