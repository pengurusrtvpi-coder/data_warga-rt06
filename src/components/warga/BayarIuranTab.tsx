import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, Loader2, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { BULAN, canManageFinance, getMyAccessRole, jakartaToday, rupiah } from '@/lib/warga';

type WargaOption = {
  id: string;
  nik: string;
  no_kk: string;
  nama_lengkap: string;
  alamat: string;
};

type Pembayaran = {
  id: string;
  nik: string;
  no_kk: string;
  nama_warga: string;
  blok_rumah: string;
  bulan: number;
  tahun: number;
  nominal: number;
  bukti_tf_url: string;
  keterangan: string | null;
  status: string;
  created_at?: string;
};

const today = jakartaToday();
const currentMonth = Number(today.slice(5, 7));
const currentYear = Number(today.slice(0, 4));
const DEFAULT_KETERANGAN = 'Iuran Bulanan RT & Kebersihan';
const BUCKET = 'bukti-iuran';

function dateLabel(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      });
}

function proofStoragePath(url: string) {
  const marker = `/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  try {
    return decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '');
  } catch {
    return null;
  }
}

export function BayarIuranTab() {
  const [role, setRole] = useState<string>('');
  const [email, setEmail] = useState('');
  const [warga, setWarga] = useState<WargaOption | null>(null);
  const [wargaList, setWargaList] = useState<WargaOption[]>([]);
  const [selectedNik, setSelectedNik] = useState('');
  const [searchWarga, setSearchWarga] = useState('');
  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState(DEFAULT_KETERANGAN);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [payments, setPayments] = useState<Pembayaran[]>([]);
  const [listMonth, setListMonth] = useState(currentMonth);
  const [listYear, setListYear] = useState(currentYear);
  const [selectedProof, setSelectedProof] = useState<Pembayaran | null>(null);

  const isResidentAccount = email.toLowerCase().endsWith('@warga.lokal');
  const isManager = canManageFinance(role as Parameters<typeof canManageFinance>[0]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      setInitializing(true);
      try {
        const [{ data, error }, accessRole] = await Promise.all([
          supabase.auth.getUser(),
          getMyAccessRole(),
        ]);
        if (error || !data.user?.email) throw new Error('Sesi login tidak valid. Silakan masuk kembali.');

        const userEmail = data.user.email;
        const residentLogin = userEmail.toLowerCase().endsWith('@warga.lokal');
        if (active) {
          setEmail(userEmail);
          setRole(accessRole);
        }

        if (residentLogin) {
          const nik = userEmail.slice(0, -'@warga.lokal'.length);
          if (!/^\d{16}$/.test(nik)) throw new Error('NIK pada akun login tidak valid.');

          const { data: row, error: wargaError } = await (supabase as any)
            .from('data_warga')
            .select('id, nik, no_kk, nama_lengkap, alamat')
            .eq('nik', nik)
            .maybeSingle();

          if (wargaError) throw new Error(`Gagal memuat data warga: ${wargaError.message}`);
          if (!row) throw new Error('Data warga untuk akun ini tidak ditemukan.');
          if (active) setWarga(row as WargaOption);
        } else if (canManageFinance(accessRole)) {
          const allWarga: WargaOption[] = [];
          for (let from = 0; ; from += 1000) {
            const { data: rows, error: wargaError } = await (supabase as any)
              .from('data_warga')
              .select('id, nik, no_kk, nama_lengkap, alamat')
              .order('nama_lengkap', { ascending: true })
              .range(from, from + 999);
            if (wargaError) throw new Error(`Gagal memuat daftar warga: ${wargaError.message}`);
            allWarga.push(...((rows ?? []) as WargaOption[]));
            if (!rows || rows.length < 1000) break;
          }
          if (active) setWargaList(allWarga);
        } else {
          throw new Error('Fitur ini hanya tersedia untuk warga, admin, atau bendahara.');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal memuat akun dan data warga.');
      } finally {
        if (active) setInitializing(false);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      setLoadingList(true);
      const { data, error } = await (supabase as any)
        .from('pembayaran_iuran')
        .select('*')
        .eq('bulan', listMonth)
        .eq('tahun', listYear)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) {
        toast.error(`Gagal memuat daftar pembayaran: ${error.message}`);
        setPayments([]);
      } else {
        const rows = (data ?? []) as Pembayaran[];
        setPayments(isResidentAccount && warga ? rows.filter((row) => row.nik === warga.nik) : rows);
      }
      setLoadingList(false);
    }

    if (!initializing) void loadPayments();
    return () => {
      active = false;
    };
  }, [initializing, isResidentAccount, listMonth, listYear, warga]);

  const filteredWarga = useMemo(() => {
    const term = searchWarga.trim().toLocaleLowerCase('id');
    if (!term) return wargaList;
    return wargaList.filter((item) =>
      [item.nama_lengkap, item.nik, item.no_kk, item.alamat]
        .some((value) => value.toLocaleLowerCase('id').includes(term)),
    );
  }, [searchWarga, wargaList]);

  const selectedWarga = isResidentAccount
    ? warga
    : wargaList.find((item) => item.nik === selectedNik) ?? null;

  async function reloadPayments() {
    const { data, error } = await (supabase as any)
      .from('pembayaran_iuran')
      .select('*')
      .eq('bulan', listMonth)
      .eq('tahun', listYear)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Gagal memuat daftar pembayaran: ${error.message}`);
    const rows = (data ?? []) as Pembayaran[];
    setPayments(isResidentAccount && warga ? rows.filter((row) => row.nik === warga.nik) : rows);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWarga) {
      toast.error('Pilih warga terlebih dahulu.');
      return;
    }

    const amount = Number(nominal);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Nominal transfer harus lebih dari nol.');
      return;
    }

    if (!buktiFile) {
      toast.error('Unggah bukti transfer terlebih dahulu.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(buktiFile.type)) {
      toast.error('Bukti transfer harus berupa gambar JPG, PNG, atau WEBP.');
      return;
    }
    if (buktiFile.size > 5 * 1024 * 1024) {
      toast.error('Ukuran bukti transfer maksimal 5 MB.');
      return;
    }

    setSaving(true);
    let uploadedPath: string | null = null;
    let transactionId: string | null = null;

    try {
      const ext = buktiFile.type === 'image/png' ? 'png' : buktiFile.type === 'image/webp' ? 'webp' : 'jpg';
      uploadedPath = `${selectedWarga.nik}/${tahun}-${String(bulan).padStart(2, '0')}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(uploadedPath, buktiFile, {
          contentType: buktiFile.type,
          upsert: false,
        });
      if (uploadError) throw new Error(`Gagal mengunggah bukti transfer: ${uploadError.message}`);

      const { data: proofData } = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath);
      const buktiUrl = proofData.publicUrl;
      const financeNote = `Iuran Warga - ${selectedWarga.nama_lengkap} (${bulan}/${tahun})`;

      const { data: transaction, error: transactionError } = await (supabase as any)
        .from('transaksi_keuangan')
        .insert({
          tanggal: jakartaToday(),
          jenis: 'Pemasukan',
          kategori: 'Iuran Bulanan',
          jumlah: amount,
          keterangan: financeNote,
          nama_warga: selectedWarga.nama_lengkap,
        })
        .select('id')
        .single();

      if (transactionError) throw new Error(`Gagal mencatat pemasukan kas RT: ${transactionError.message}`);
      transactionId = transaction?.id ?? null;

      const { error: paymentError } = await (supabase as any)
        .from('pembayaran_iuran')
        .insert({
          nik: selectedWarga.nik,
          no_kk: selectedWarga.no_kk,
          nama_warga: selectedWarga.nama_lengkap,
          blok_rumah: selectedWarga.alamat,
          bulan,
          tahun,
          nominal: amount,
          bukti_tf_url: buktiUrl,
          keterangan: keterangan.trim() || DEFAULT_KETERANGAN,
          status: 'Sudah Bayar',
        });

      if (paymentError) {
        if (transactionId) {
          await (supabase as any).from('transaksi_keuangan').delete().eq('id', transactionId);
        }
        throw new Error(`Gagal menyimpan pembayaran: ${paymentError.message}`);
      }

      toast.success('Pembayaran iuran berhasil dicatat.');
      setNominal('');
      setKeterangan(DEFAULT_KETERANGAN);
      setBuktiFile(null);
      const fileInput = document.getElementById('bukti-iuran-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      await reloadPayments();
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
      }
      toast.error(error instanceof Error ? error.message : 'Pembayaran gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(payment: Pembayaran) {
    if (!isManager) return;
    if (!window.confirm(`Hapus catatan pembayaran ${payment.nama_warga} periode ${payment.bulan}/${payment.tahun}?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('pembayaran_iuran')
        .delete()
        .eq('id', payment.id);
      if (error) throw new Error(`Gagal menghapus catatan pembayaran: ${error.message}`);

      const path = proofStoragePath(payment.bukti_tf_url);
      if (path) {
        const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
        if (storageError) toast.error(`Catatan terhapus, tetapi bukti gagal dihapus: ${storageError.message}`);
      }

      setPayments((current) => current.filter((row) => row.id !== payment.id));
      toast.success('Catatan pembayaran dan bukti transfer dihapus.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus pembayaran.');
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        Silakan transfer iuran ke rekening Bendahara RT 06 sesuai informasi yang dibagikan di Grup WhatsApp Warga, lalu konfirmasi dan unggah bukti transfer di bawah ini.
      </div>

      {initializing ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat data akun…
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="text-lg font-bold">Konfirmasi Pembayaran Iuran</h2>

            {isResidentAccount ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nama Warga</Label>
                  <Input readOnly value={warga?.nama_lengkap ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label>NIK</Label>
                  <Input readOnly value={warga?.nik ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label>No. KK</Label>
                  <Input readOnly value={warga?.no_kk ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label>Blok / Alamat</Label>
                  <Input readOnly value={warga?.alamat ?? ''} />
                </div>
              </div>
            ) : isManager ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cari-warga-iuran">Cari warga</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="cari-warga-iuran"
                      value={searchWarga}
                      onChange={(event) => setSearchWarga(event.target.value)}
                      className="pl-9"
                      placeholder="Cari nama, NIK, No. KK, atau alamat"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pilih-warga-iuran">Warga</Label>
                  <select
                    id="pilih-warga-iuran"
                    value={selectedNik}
                    onChange={(event) => setSelectedNik(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Pilih warga</option>
                    {filteredWarga.map((item) => (
                      <option key={item.id} value={item.nik}>
                        {item.nama_lengkap} · {item.nik} · {item.alamat}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedWarga && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Nama Warga</Label>
                      <Input readOnly value={selectedWarga.nama_lengkap} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>NIK</Label>
                      <Input readOnly value={selectedWarga.nik} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>No. KK</Label>
                      <Input readOnly value={selectedWarga.no_kk} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Blok / Alamat</Label>
                      <Input readOnly value={selectedWarga.alamat} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p role="alert" className="text-sm text-destructive">
                Akun ini tidak memiliki akses untuk mencatat pembayaran iuran.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="iuran-bulan">Bulan</Label>
                <select
                  id="iuran-bulan"
                  value={bulan}
                  onChange={(event) => setBulan(Number(event.target.value))}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {BULAN.map((name, index) => (
                    <option key={name} value={index + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iuran-tahun">Tahun</Label>
                <Input
                  id="iuran-tahun"
                  type="number"
                  min={2000}
                  max={2100}
                  required
                  value={tahun}
                  onChange={(event) => setTahun(Number(event.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iuran-nominal">Nominal Transfer (Rp)</Label>
                <Input
                  id="iuran-nominal"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  required
                  value={nominal}
                  onChange={(event) => setNominal(event.target.value)}
                  placeholder="Contoh: 50000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iuran-bukti">Foto Bukti Transfer (JPG / PNG / WEBP)</Label>
                <Input
                  id="bukti-iuran-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  onChange={(event) => setBuktiFile(event.target.files?.[0] ?? null)}
                />
                {buktiFile && (
                  <p className="text-xs text-muted-foreground">
                    File: {buktiFile.name} · {(buktiFile.size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="iuran-keterangan">Keterangan (opsional)</Label>
              <Textarea
                id="iuran-keterangan"
                rows={2}
                value={keterangan}
                onChange={(event) => setKeterangan(event.target.value)}
              />
            </div>

            <Button type="submit" disabled={saving || !selectedWarga}>
              {saving ? <Loader2 className="animate-spin" /> : <Upload />}
              {saving ? 'Menyimpan…' : 'Konfirmasi & Simpan Pembayaran'}
            </Button>
          </form>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-lg font-bold">Daftar Warga Sudah Bayar</h2>
              <div className="flex gap-2">
                <div>
                  <Label htmlFor="filter-bulan">Bulan</Label>
                  <select
                    id="filter-bulan"
                    value={listMonth}
                    onChange={(event) => setListMonth(Number(event.target.value))}
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    {BULAN.map((name, index) => (
                      <option key={name} value={index + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="filter-tahun">Tahun</Label>
                  <Input
                    id="filter-tahun"
                    type="number"
                    min={2000}
                    max={2100}
                    value={listYear}
                    onChange={(event) => setListYear(Number(event.target.value))}
                    className="w-28"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-3">No</th>
                    <th className="px-3 py-3">Tanggal Bayar</th>
                    <th className="px-3 py-3">Nama Warga</th>
                    <th className="px-3 py-3">Blok / Alamat</th>
                    <th className="px-3 py-3">Periode</th>
                    <th className="px-3 py-3">Nominal</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Bukti</th>
                    {isManager && <th className="px-3 py-3">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {loadingList ? (
                    <tr>
                      <td colSpan={isManager ? 9 : 8} className="px-3 py-8 text-center text-muted-foreground">
                        Memuat pembayaran…
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={isManager ? 9 : 8} className="px-3 py-8 text-center text-muted-foreground">
                        Belum ada pembayaran pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment, index) => (
                      <tr key={payment.id} className="border-t">
                        <td className="px-3 py-3">{index + 1}</td>
                        <td className="px-3 py-3">{dateLabel(payment.created_at)}</td>
                        <td className="px-3 py-3 font-medium">{payment.nama_warga}</td>
                        <td className="px-3 py-3">{payment.blok_rumah || '—'}</td>
                        <td className="px-3 py-3">
                          {BULAN[payment.bulan - 1] ?? payment.bulan}/{payment.tahun}
                        </td>
                        <td className="px-3 py-3">{rupiah(Number(payment.nominal))}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            Sudah Bayar
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Button type="button" size="sm" variant="outline" onClick={() => setSelectedProof(payment)}>
                            <Eye /> Lihat Bukti TF
                          </Button>
                        </td>
                        {isManager && (
                          <td className="px-3 py-3">
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              title="Hapus catatan pembayaran"
                              aria-label={`Hapus pembayaran ${payment.nama_warga}`}
                              onClick={() => void handleDelete(payment)}
                            >
                              <Trash2 />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Dialog open={!!selectedProof} onOpenChange={(open) => !open && setSelectedProof(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bukti Transfer — {selectedProof?.nama_warga}</DialogTitle>
          </DialogHeader>
          {selectedProof?.bukti_tf_url && (
            <img
              src={selectedProof.bukti_tf_url}
              alt={`Bukti transfer ${selectedProof.nama_warga}`}
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}