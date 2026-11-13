CREATE OR REPLACE FUNCTION public.get_my_keluarga()
RETURNS SETOF public.data_warga
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT d.* FROM public.data_warga d
  WHERE d.no_kk = (SELECT w.no_kk FROM public.data_warga w
                   WHERE w.nik = split_part(auth.jwt() ->> 'email', '@', 1) LIMIT 1)
  ORDER BY CASE WHEN lower(d.status_hub_keluarga) LIKE '%kepala keluarga%' THEN 1
                WHEN lower(d.status_hub_keluarga) LIKE '%istri%' THEN 2
                WHEN lower(d.status_hub_keluarga) LIKE '%anak%' THEN 3 ELSE 4 END,
           d.tanggal_lahir;
$$;
REVOKE ALL ON FUNCTION public.get_my_keluarga() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_keluarga() TO authenticated;

CREATE OR REPLACE FUNCTION public.isi_biodata_surat()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE w public.data_warga; my_kk text;
BEGIN
 SELECT * INTO w FROM public.data_warga WHERE nik = NEW.nik LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'NIK % tidak terdaftar sebagai warga RT 06.', NEW.nik USING ERRCODE='42501'; END IF;
 IF NOT public.is_admin() THEN
   SELECT no_kk INTO my_kk FROM public.data_warga WHERE nik = split_part(auth.jwt() ->> 'email','@',1) LIMIT 1;
   IF my_kk IS NULL OR w.no_kk <> my_kk THEN
     RAISE EXCEPTION 'Anda hanya dapat mengajukan surat untuk diri sendiri atau anggota KK Anda.' USING ERRCODE='42501';
   END IF;
 END IF;
 NEW.email_pembuat := auth.jwt() ->> 'email';
 NEW.nama_pemohon := w.nama_lengkap;
 NEW.tempat_tgl_lahir := w.tempat_lahir || ', ' || to_char(w.tanggal_lahir,'DD-MM-YYYY');
 NEW.jenis_kelamin := w.jenis_kelamin; NEW.agama := w.agama; NEW.pekerjaan := w.pekerjaan; NEW.alamat := w.alamat;
 NEW.created_at := now();
 IF btrim(coalesce(NEW.keperluan,'')) = '' THEN RAISE EXCEPTION 'Keperluan surat wajib diisi.'; END IF;
 RETURN NEW;
END; $function$;