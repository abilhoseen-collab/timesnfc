
-- ============ PHASE 9.5: Teams + RBAC ============

-- 1) Team role enum
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- 2) Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 3) Team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX team_members_user_idx ON public.team_members(user_id);
CREATE INDEX team_members_team_idx ON public.team_members(team_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 4) Team invitations
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.team_role NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX team_invitations_email_idx ON public.team_invitations(lower(email));
CREATE INDEX team_invitations_token_idx ON public.team_invitations(token);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invitations TO authenticated;
GRANT ALL ON public.team_invitations TO service_role;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- 5) Security definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_team_role(_team_id UUID, _user_id UUID)
RETURNS public.team_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.team_members
  WHERE team_id = _team_id AND user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_team_role(_team_id UUID, _user_id UUID, _min public.team_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = _team_id AND tm.user_id = _user_id
      AND (
        CASE tm.role
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'editor' THEN 2
          WHEN 'viewer' THEN 1
        END
      ) >= (
        CASE _min
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'editor' THEN 2
          WHEN 'viewer' THEN 1
        END
      )
  )
$$;

-- 6) RLS Policies — teams
CREATE POLICY "Team members can view team"
  ON public.teams FOR SELECT TO authenticated
  USING (public.is_team_member(id, auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners/admins can update team"
  ON public.teams FOR UPDATE TO authenticated
  USING (public.has_team_role(id, auth.uid(), 'admin'));

CREATE POLICY "Only owner can delete team"
  ON public.teams FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND is_personal = false);

-- 7) RLS — team_members
CREATE POLICY "Members can view team roster"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Admins can add members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.has_team_role(team_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.team_members FOR UPDATE TO authenticated
  USING (public.has_team_role(team_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can remove members or self-leave"
  ON public.team_members FOR DELETE TO authenticated
  USING (public.has_team_role(team_id, auth.uid(), 'admin') OR user_id = auth.uid());

-- 8) RLS — invitations
CREATE POLICY "Admins can view team invitations"
  ON public.team_invitations FOR SELECT TO authenticated
  USING (public.has_team_role(team_id, auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
  ON public.team_invitations FOR INSERT TO authenticated
  WITH CHECK (public.has_team_role(team_id, auth.uid(), 'admin') AND invited_by = auth.uid());

CREATE POLICY "Admins can delete invitations"
  ON public.team_invitations FOR DELETE TO authenticated
  USING (public.has_team_role(team_id, auth.uid(), 'admin'));

CREATE POLICY "Invited users can mark accepted"
  ON public.team_invitations FOR UPDATE TO authenticated
  USING (accepted_at IS NULL AND expires_at > now());

-- 9) updated_at trigger on teams
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10) Add optional team_id to ownership tables
ALTER TABLE public.vcards ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.landing_pages ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.vcard_leads ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
CREATE INDEX vcards_team_idx ON public.vcards(team_id);
CREATE INDEX landing_pages_team_idx ON public.landing_pages(team_id);
CREATE INDEX vcard_leads_team_idx ON public.vcard_leads(team_id);

-- 11) Extend RLS on vcards to allow team members (editor+) full access; viewer read-only
CREATE POLICY "Team members can view team vcards"
  ON public.vcards FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team editors can modify team vcards"
  ON public.vcards FOR UPDATE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

CREATE POLICY "Team editors can insert team vcards"
  ON public.vcards FOR INSERT TO authenticated
  WITH CHECK (team_id IS NULL OR public.has_team_role(team_id, auth.uid(), 'editor'));

CREATE POLICY "Team admins can delete team vcards"
  ON public.vcards FOR DELETE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'admin'));

-- Same for landing_pages
CREATE POLICY "Team members can view team landing pages"
  ON public.landing_pages FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team editors can modify team landing pages"
  ON public.landing_pages FOR UPDATE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

CREATE POLICY "Team editors can insert team landing pages"
  ON public.landing_pages FOR INSERT TO authenticated
  WITH CHECK (team_id IS NULL OR public.has_team_role(team_id, auth.uid(), 'editor'));

CREATE POLICY "Team admins can delete team landing pages"
  ON public.landing_pages FOR DELETE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'admin'));

-- Same for vcard_leads
CREATE POLICY "Team members can view team leads"
  ON public.vcard_leads FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team editors can modify team leads"
  ON public.vcard_leads FOR UPDATE TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, auth.uid(), 'editor'));

-- 12) Auto-create personal team on signup; backfill for existing users
CREATE OR REPLACE FUNCTION public.create_personal_team_for_user(_user_id UUID, _name TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_team_id UUID;
BEGIN
  INSERT INTO public.teams (name, owner_id, is_personal)
  VALUES (COALESCE(NULLIF(_name, ''), 'আমার Team'), _user_id, true)
  RETURNING id INTO new_team_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, _user_id, 'owner');

  RETURN new_team_id;
END;
$$;

-- Update handle_new_user to also create personal team
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_code TEXT;
  referrer UUID;
BEGIN
  ref_code := public.generate_referral_code();

  IF NEW.raw_user_meta_data ? 'referred_by_code' THEN
    SELECT id INTO referrer FROM public.profiles
    WHERE referral_code = upper(NEW.raw_user_meta_data ->> 'referred_by_code') LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, referral_code, referred_by)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    ref_code, referrer
  );

  IF referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, status)
    VALUES (referrer, NEW.id, upper(NEW.raw_user_meta_data ->> 'referred_by_code'), 'pending');
  END IF;

  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

  -- Create personal team
  PERFORM public.create_personal_team_for_user(NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', '') || ' এর Team');

  RETURN NEW;
END;
$$;

-- Backfill personal teams for existing users without one
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN
    SELECT p.id, p.full_name FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.teams t WHERE t.owner_id = p.id AND t.is_personal = true
    )
  LOOP
    PERFORM public.create_personal_team_for_user(u.id, COALESCE(u.full_name, '') || ' এর Team');
  END LOOP;
END $$;

-- 13) Accept invitation function
CREATE OR REPLACE FUNCTION public.accept_team_invitation(_token TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD;
  current_email TEXT;
BEGIN
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  IF current_email IS NULL THEN
    RAISE EXCEPTION 'লগইন প্রয়োজন';
  END IF;

  SELECT * INTO inv FROM public.team_invitations
  WHERE token = _token AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation invalid বা expired';
  END IF;

  IF lower(inv.email) <> lower(current_email) THEN
    RAISE EXCEPTION 'এই invitation আপনার email-এর জন্য নয়';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (inv.team_id, auth.uid(), inv.role)
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.team_invitations SET accepted_at = now() WHERE id = inv.id;

  RETURN inv.team_id;
END;
$$;
