
-- Admin RLS + validation deep-dive: harden SECURITY DEFINER function exposure.
-- Trigger-only and internal-helper SECURITY DEFINER functions must not be callable
-- via PostgREST by anon/authenticated. Functions used inside RLS policies
-- (has_role, is_team_member, get_team_role, has_team_role) or invoked as RPCs
-- (accept_team_invitation, request_account_deletion, get_guest_order_status)
-- keep their existing EXECUTE grants.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_owner_on_new_lead() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_personal_team_for_user(uuid, text) FROM PUBLIC, anon, authenticated;

-- Ensure service_role retains execute for triggers/edge functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_owner_on_new_lead() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_personal_team_for_user(uuid, text) TO service_role;

-- rate_limits table: RLS is on with no policies. Data API cannot reach it
-- (only service_role via SECURITY DEFINER check_rate_limit uses it). Belt-and-braces:
-- lock down direct Data API grants explicitly.
REVOKE ALL ON TABLE public.rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;
