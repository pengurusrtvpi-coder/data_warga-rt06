CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_pengurus_rt()
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

REVOKE ALL ON FUNCTION private.is_pengurus_rt() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_pengurus_rt() TO authenticated;

DROP POLICY IF EXISTS "Pengurus RT akses penuh" ON public.data_warga;
CREATE POLICY "Pengurus RT akses penuh"
ON public.data_warga
FOR ALL
TO authenticated
USING (private.is_pengurus_rt())
WITH CHECK (private.is_pengurus_rt());

CREATE OR REPLACE FUNCTION public.lindungi_kolom_data_warga()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF private.is_pengurus_rt() THEN
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

REVOKE ALL ON FUNCTION public.lindungi_kolom_data_warga() FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.is_pengurus_rt();