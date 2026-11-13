CREATE OR REPLACE FUNCTION public.get_my_access_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT CASE
    WHEN private.is_pengurus_rt() THEN 'admin'::text
    ELSE 'warga'::text
  END;
$$;

REVOKE ALL ON FUNCTION public.get_my_access_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_access_role() TO authenticated;