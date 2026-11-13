DROP FUNCTION public.get_my_access_role();

GRANT SELECT ON public.user_roles TO authenticated;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna dapat membaca peran sendiri"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);