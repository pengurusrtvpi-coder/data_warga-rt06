-- 1. Trusted check for RT committee (pengurus RT), based on public.user_roles (not user-editable metadata)
CREATE OR REPLACE FUNCTION public.is_pengurus_rt()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_pengurus_rt() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_pengurus_rt() TO authenticated;

-- 2. Replace policies that trusted user_metadata (editable by any signed-in user)
DROP POLICY IF EXISTS "Admin akses penuh" ON public.data_warga;
DROP POLICY IF EXISTS "Warga lihat data sendiri" ON public.data_warga;
DROP POLICY IF EXISTS "Warga update data sendiri" ON public.data_warga;

CREATE POLICY "Pengurus RT akses penuh"
ON public.data_warga
FOR ALL
TO authenticated
USING (public.is_pengurus_rt())
WITH CHECK (public.is_pengurus_rt());

-- 3. Column guard: only pengurus RT (or server/service roles) may change identity & admin columns
CREATE OR REPLACE FUNCTION public.lindungi_kolom_data_warga()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Server-side roles (service_role, postgres, dashboard) are not restricted
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF public.is_pengurus_rt() THEN
    RETURN NEW;
  END IF;

  IF NEW.nik IS DISTINCT FROM OLD.nik THEN
    RAISE EXCEPTION 'NIK hanya dapat diubah oleh pengurus RT.' USING ERRCODE = '42501';
  END IF;
  IF NEW.no_kk IS DISTINCT FROM OLD.no_kk THEN
    RAISE EXCEPTION 'Nomor KK hanya dapat diubah oleh pengurus RT.' USING ERRCODE = '42501';
  END IF;
  IF NEW.rt IS DISTINCT FROM OLD.rt OR NEW.rw IS DISTINCT FROM OLD.rw THEN
    RAISE EXCEPTION 'RT/RW hanya dapat diubah oleh pengurus RT.' USING ERRCODE = '42501';
  END IF;
  IF NEW.status_warga IS DISTINCT FROM OLD.status_warga THEN
    RAISE EXCEPTION 'Status warga hanya dapat diubah oleh pengurus RT.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lindungi_kolom_data_warga ON public.data_warga;
CREATE TRIGGER lindungi_kolom_data_warga
BEFORE UPDATE ON public.data_warga
FOR EACH ROW
EXECUTE FUNCTION public.lindungi_kolom_data_warga();