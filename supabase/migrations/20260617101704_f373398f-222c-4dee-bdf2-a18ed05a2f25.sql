
CREATE INDEX IF NOT EXISTS idx_vcards_user_created ON public.vcards (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_created ON public.subscriptions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vcard_analytics_vcard_created ON public.vcard_analytics (vcard_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vcard_analytics_event_type ON public.vcard_analytics (vcard_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);
