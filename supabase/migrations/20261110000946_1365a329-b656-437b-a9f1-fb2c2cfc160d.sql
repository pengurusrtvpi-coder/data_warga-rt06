DROP POLICY "Hanya Admin yang bisa menambah transaksi" ON public.transaksi_keuangan;
DROP POLICY "Hanya Admin yang bisa mengubah transaksi" ON public.transaksi_keuangan;
DROP POLICY "Hanya Admin yang bisa menghapus transaksi" ON public.transaksi_keuangan;
CREATE POLICY "Pengurus mengelola keuangan" ON public.transaksi_keuangan FOR ALL TO authenticated USING (private.is_pengurus_rt()) WITH CHECK (private.is_pengurus_rt());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaksi_keuangan TO authenticated;
GRANT ALL ON public.transaksi_keuangan TO service_role;
REVOKE ALL ON public.transaksi_keuangan FROM anon;
ALTER VIEW public.view_laporan_keuangan_bulanan SET (security_invoker = true);
GRANT SELECT ON public.view_laporan_keuangan_bulanan TO authenticated;
REVOKE ALL ON public.view_laporan_keuangan_bulanan FROM anon;
DROP POLICY "Semua user login bisa melihat surat" ON public.pelayanan_surat;
DROP POLICY "Semua user login bisa mengajukan surat" ON public.pelayanan_surat;
DROP POLICY "Hanya Admin yang bisa mengubah surat" ON public.pelayanan_surat;
DROP POLICY "Hanya Admin yang bisa menghapus surat" ON public.pelayanan_surat;
CREATE POLICY "Baca surat keluarga atau pengurus" ON public.pelayanan_surat FOR SELECT TO authenticated USING (private.is_pengurus_rt() OR EXISTS (SELECT 1 FROM public.data_warga w WHERE w.nik = pelayanan_surat.nik AND w.no_kk = public.get_my_kk()));
CREATE POLICY "Ajukan surat keluarga atau pengurus" ON public.pelayanan_surat FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.data_warga w WHERE w.nik = pelayanan_surat.nik AND (private.is_pengurus_rt() OR w.no_kk = public.get_my_kk())));
CREATE POLICY "Pengurus hapus surat" ON public.pelayanan_surat FOR DELETE TO authenticated USING (private.is_pengurus_rt());
GRANT SELECT, INSERT, DELETE ON public.pelayanan_surat TO authenticated;
REVOKE UPDATE ON public.pelayanan_surat FROM authenticated;
REVOKE ALL ON public.pelayanan_surat FROM anon;
GRANT ALL ON public.pelayanan_surat TO service_role;
GRANT USAGE ON SEQUENCE public.seq_nomor_surat TO authenticated;
CREATE OR REPLACE FUNCTION public.isi_biodata_surat() RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE w public.data_warga;
BEGIN
 SELECT * INTO w FROM public.data_warga WHERE nik = NEW.nik LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'NIK tidak ditemukan atau tidak dapat diakses.' USING ERRCODE='42501'; END IF;
 NEW.nama_pemohon := w.nama_lengkap;
 NEW.tempat_tgl_lahir := w.tempat_lahir || ', ' || to_char(w.tanggal_lahir,'DD-MM-YYYY');
 NEW.jenis_kelamin := w.jenis_kelamin; NEW.agama := w.agama; NEW.pekerjaan := w.pekerjaan; NEW.alamat := w.alamat;
 NEW.created_at := now();
 IF btrim(NEW.keperluan) = '' THEN RAISE EXCEPTION 'Keperluan surat wajib diisi.'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER isi_biodata_sebelum_surat BEFORE INSERT ON public.pelayanan_surat FOR EACH ROW EXECUTE FUNCTION public.isi_biodata_surat();
CREATE OR REPLACE FUNCTION public.validasi_transaksi_rt() RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
 IF NEW.jenis NOT IN ('Pemasukan','Pengeluaran') OR NEW.jumlah <= 0 OR NEW.jumlah::text IN ('NaN','Infinity','-Infinity') OR btrim(NEW.kategori) = '' THEN RAISE EXCEPTION 'Jenis, kategori, atau jumlah transaksi tidak valid.'; END IF;
 IF NEW.kategori = 'Iuran Bulanan' AND (NEW.nama_warga IS NULL OR NOT EXISTS (SELECT 1 FROM public.data_warga WHERE nama_lengkap = NEW.nama_warga)) THEN RAISE EXCEPTION 'Pilih nama warga untuk Iuran Bulanan.'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER validasi_transaksi_rt BEFORE INSERT OR UPDATE ON public.transaksi_keuangan FOR EACH ROW EXECUTE FUNCTION public.validasi_transaksi_rt();