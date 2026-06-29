
-- Tighten insert policies (avoid team_id IS NULL bypass)
DROP POLICY IF EXISTS "Team editors can insert team vcards" ON public.vcards;
CREATE POLICY "Team editors can insert team vcards"
  ON public.vcards FOR INSERT TO authenticated
  WITH CHECK (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Team editors can insert team landing pages" ON public.landing_pages;
CREATE POLICY "Team editors can insert team landing pages"
  ON public.landing_pages FOR INSERT TO authenticated
  WITH CHECK (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

-- Remove broad invitation update; force RPC usage
DROP POLICY IF EXISTS "Invited users can mark accepted" ON public.team_invitations;

-- Revoke public execute on SECURITY DEFINER helpers (keep authenticated)
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_team_role(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_team_role(UUID, UUID, public.team_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_team_invitation(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_personal_team_for_user(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_team_role(UUID, UUID, public.team_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(TEXT) TO authenticated;
