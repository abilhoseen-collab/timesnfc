
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN := false;
BEGIN
  WHILE NOT done LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    PERFORM 1 FROM public.profiles WHERE referral_code = new_code;
    IF NOT FOUND THEN
      done := true;
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated, service_role;
