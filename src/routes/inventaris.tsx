import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Package,
  Plus,
  Camera,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Search,
  MapPin,
  Loader2,
  X,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PortalNav } from '@/components/warga/PortalNav';
import { getMyAccessRole, type AccessRole } from '@/lib/warga';

export const Route = createFileRoute('/inventaris')({
  head: () => ({
    meta: [{ title: 'Inventaris Aset RT — RT 06 VPI-2' }],
  }),
  component: InventarisPage,
});

interface InventarisItem {
  id: string;
  nama_barang: string;
  kode_barang: string | null;
  kategori: string;
  jumlah: number;
  kondisi: string;
  lokasi_simpan: string | null;
  keterangan: string | null;
  foto_url: string | null;
}

const KONDISI_LIST = ['Baik', 'Perlu Perbaikan', 'Rusak Berat'];

function InventarisPage() {
  const [role, setRole] = useState<AccessRole>('warga');
  const [items, setItems] = useState<InventarisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('Semua');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventarisItem | null>(null);
  const [namaBarang, setNamaBarang] = useState('');
  const [kodeBarang, setKodeBarang] = useState('');
  const [kategori, setKategori] = useState('Perlengkapan Umum');
  const [jumlah, setJumlah] = useState('1');
  const [kondisi, setKondisi] = useState('Baik');
  const [lokasiSimpan, setLokasiSimpan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = role === 'admin' || (role as string) === 'kesra_pkk';

  async function loadData() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('inventaris_rt')
      .select('*')
      .order('nama_barang', { ascending: true });
    if (!error && data) setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await getMyAccessRole();
        setRole(r);
      } catch {}
      await loadData();
    })();
  }, []);

  function openForm(item: InventarisItem | null) {
    setEditing(item);
    setNamaBarang(item?.nama_barang || '');
    setKodeBarang(item?.kode_barang || '');
    setKategori(item?.kategori || 'Perlengkapan Umum');
    setJumlah(item?.jumlah ? String(item.jumlah) : '1');
    setKondisi(item?.kondisi || 'Baik');
    setLokasiSimpan(item?.lokasi_simpan || '');
    setKeterangan(item?.keterangan || '');
    setFotoFile(null);
    setFotoPreview(item?.foto_url || null);
    setOpen(true);
  }

  function handleSelectPhoto(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5 MB.');
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!namaBarang.trim()) return;
    setSaving(true);
    try {
      let finalFotoUrl = editing?.foto_url || null;
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop() || 'jpg';
        const path = `inventaris/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('dokumen-rt06')
          .upload(path, fotoFile, { upsert: true });
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage.from('dokumen-rt06').getPublicUrl(path);
        finalFotoUrl = pub.publicUrl;
      } else if (!fotoPreview) {
        finalFotoUrl = null;
      }

      const payload = {
        nama_barang: namaBarang.trim(),
        kode_barang: kodeBarang.trim() || null,
        kategori: kategori.trim() || 'Perlengkapan Umum',
        jumlah: Math.max(1, Number(jumlah) || 1),
        kondisi,
        lokasi_simpan: lokasiSimpan.trim() || null,
        keterangan: keterangan.trim() || null,
        foto_url: finalFotoUrl,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await (supabase as any)
          .from('inventaris_rt')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw new Error(error.message);
        toast.success('Data inventaris diperbarui.');
      } else {
        const { error } = await (supabase as any).from('inventaris_rt').insert([payload]);
        if (error) throw new Error(error.message);
        toast.success('Barang inventaris ditambahkan.');
      }
      setOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan data inventaris.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: InventarisItem) {
    if (!confirm(`Hapus barang "${item.nama_barang}" dari daftar inventaris?`)) return;
    const { error } = await (supabase as any).from('inventaris_rt').delete().eq('id', item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Barang inventaris dihapus.');
    await loadData();
  }

  const filtered = items.filter((item) => {
    const matchKondisi = filterKondisi === 'Semua' || item.kondisi === filterKondisi;
    const q = query.toLowerCase();
    const matchText =
      !q ||
      item.nama_barang.toLowerCase().includes(q) ||
      (item.kode_barang || '').toLowerCase().includes(q) ||
      (item.lokasi_simpan || '').toLowerCase().includes(q);
    return matchKondisi && matchText;
  });

  const totalUnit = items.reduce((s, r) => s + (r.jumlah || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/60">
      <PortalNav role={role} />
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
              RT 06 / RW 07 · VPI-2
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Inventaris Aset RT</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Total {items.length} jenis aset ({totalUnit} unit tercatat)
            </p>
          </div>
         {isAdmin && (
            <div className="no-print flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer /> Cetak / Download
              </Button>
              <Button onClick={() => openForm(null)}>
                <Plus /> Tambah Aset
              </Button>
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama barang, kode, atau lokasi simpan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-white pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Semua', ...KONDISI_LIST].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilterKondisi(k)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  filterKondisi === k
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'border bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center text-sm text-muted-foreground">
            Belum ada data inventaris yang sesuai.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const badgeColor =
                item.kondisi === 'Baik'
                  ? 'bg-emerald-100 text-emerald-800'
                  : item.kondisi === 'Perlu Perbaikan'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800';
              return (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full bg-slate-100">
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt={item.nama_barang}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                        <Package className="h-10 w-10" />
                        <span className="mt-1 text-[11px]">Tanpa Foto</span>
                      </div>
                    )}
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shadow-xs ${badgeColor}`}
                    >
                      {item.kondisi}
                      </span>
                    <span className="absolute bottom-3 left-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white">
                      {item.jumlah} Unit
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div>
                      {item.kode_barang && (
                        <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                          {item.kode_barang}
                        </p>
                      )}
                      <h2 className="text-base font-extrabold text-slate-900">
                        {item.nama_barang}
                      </h2>
                    </div>

                    {item.lokasi_simpan && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>Lokasi: {item.lokasi_simpan}</span>
                      </p>
                    )}

                    {item.keterangan && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.keterangan}</p>
                    )}

                    {isAdmin && (
                      <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                        <Button size="sm" variant="outline" onClick={() => openForm(item)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Aset Inventaris' : 'Tambah Aset Inventaris'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nama Barang *</Label>
                  <Input
                    required
                    placeholder="Contoh: Tenda Terop 4x6m / Kursi Plastik"
                    value={namaBarang}
                    onChange={(e) => setNamaBarang(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Kode Barang</Label>
                    <Input
                      placeholder="Contoh: INV-RT06-01"
                      value={kodeBarang}
                      onChange={(e) => setKodeBarang(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Jumlah Unit *</Label>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={jumlah}
                      onChange={(e) => setJumlah(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Kondisi</Label>
                    <select
                      value={kondisi}
                      onChange={(e) => setKondisi(e.target.value)}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      {KONDISI_LIST.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Lokasi Simpan</Label>
                    <Input
                      placeholder="Contoh: Gudang Balai Warga"
                      value={lokasiSimpan}
                      onChange={(e) => setLokasiSimpan(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Keterangan Tambahan</Label>
                  <Textarea
                    rows={2}
                    placeholder="Catatan kondisi atau kelengkapan barang..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Foto Barang (Kamera / Galeri HP)</Label>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700">
                      <Camera className="h-4 w-4" /> Ambil Foto Kamera
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleSelectPhoto(e.target.files?.[0])}
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      <ImageIcon className="h-4 w-4" /> Pilih dari Galeri
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSelectPhoto(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  {fotoPreview && (
                    <div className="relative mt-2 inline-block">
                      <img
                        src={fotoPreview}
                        alt="Pratinjau foto"
                        className="h-36 w-56 rounded-xl border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFotoFile(null);
                          setFotoPreview(null);
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white shadow"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Menyimpan…' : 'Simpan Aset'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
