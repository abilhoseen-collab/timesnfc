
DROP FUNCTION IF EXISTS public.get_guest_order_status(text, uuid);

CREATE OR REPLACE FUNCTION public.get_guest_order_status(_email text, _order_id uuid)
RETURNS SETOF public.nfc_guest_orders
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.*
  FROM public.nfc_guest_orders o
  WHERE o.id = _order_id AND lower(o.email) = lower(_email)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_guest_order_status(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_order_status(text, uuid) TO anon, authenticated;
