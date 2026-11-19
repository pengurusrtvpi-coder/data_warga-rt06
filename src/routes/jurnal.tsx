import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import {
  BookOpen,
  Plus,
  Printer,
  Camera,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  UserCheck,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PortalNav } from '@/components/warga/PortalNav';
import { getMyAccessRole, jakartaToday, type AccessRole } from '@/lib/warga';

export const Route = createFileRoute('/jurnal')({
  head: () => ({
    meta: [{ title: 'Jurnal Kegiatan RT — RT 06 VPI-2' }],
  }),
  component: JurnalKegiatanPage,
});

interface JurnalItem {
  id: string;
  judul: string;
  tanggal_kegiatan: string;
  lokasi: string | null;
  penanggung_jawab: string | null;
  deskripsi: string;
  foto_url: string | null;
}

function JurnalKegiatanPage() {
  const [role, setRole] = useState<AccessRole>('warga');
  const [items, setItems] = useState<JurnalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JurnalItem | null>(null);
  const [judul, setJudul] = useState('');
  const [tanggal, setTanggal] = useState(jakartaToday());
  const [lokasi, setLokasi] = useState('');
  const [pj, setPj] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const r = role as string;
  const isAdmin = r === 'admin' || r === 'kesra_pkk' || r === 'seksi_rt';

  async function loadData() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('jurnal_kegiatan')
      .select('*')
      .order('tanggal_kegiatan', { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      try {
        const currentRole = await getMyAccessRole();
        setRole(currentRole);
      } catch {}
      await loadData();
    })();
  }, []);


  function openForm(item: JurnalItem | null) {
    setEditing(item);
    setJudul(item?.judul || '');
    setTanggal(item?.tanggal_kegiatan || jakartaToday());
    setLokasi(item?.lokasi || 'Lingkungan RT 06 VPI-2');
    setPj(item?.penanggung_jawab || 'Pengurus RT 06');
    setDeskripsi(item?.deskripsi || '');
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
    if (!judul.trim() || !deskripsi.trim()) return;
    setSaving(true);
    try {
      let finalFotoUrl = editing?.foto_url || null;
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop() || 'jpg';
        const path = `jurnal/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
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
        judul: judul.trim(),
        tanggal_kegiatan: tanggal,
        lokasi: lokasi.trim() || null,
        penanggung_jawab: pj.trim() || null,
        deskripsi: deskripsi.trim(),
        foto_url: finalFotoUrl,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await (supabase as any)
          .from('jurnal_kegiatan')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw new Error(error.message);
        toast.success('Jurnal kegiatan diperbarui.');
      } else {
        const { error } = await (supabase as any).from('jurnal_kegiatan').insert([payload]);
        if (error) throw new Error(error.message);
        toast.success('Jurnal kegiatan ditambahkan.');
      }
      setOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan jurnal kegiatan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: JurnalItem) {
    if (!confirm(`Hapus dokumentasi kegiatan "${item.judul}"?`)) return;
    const { error } = await (supabase as any).from('jurnal_kegiatan').delete().eq('id', item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Jurnal kegiatan dihapus.');
    await loadData();
  }

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50/60 print:bg-white">
      <PortalNav role={role} />
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 print:max-w-none print:px-0 print:py-0">
        {/* Header Layar (Sembunyi saat Print) */}
        <div className="no-print mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">
              RT 06 / RW 07 · VPI-2
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Jurnal Kegiatan RT</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Dokumentasi kerja bakti, rapat warga, ronda, dan kegiatan sosial lingkungan
            </p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer /> Cetak / Download
              </Button>
              <Button onClick={() => openForm(null)}>
                <Plus /> Tambah Kegiatan
              </Button>
            </div>
          )}
        </div>

        {/* Tampilan Layar (Kartu Galeri Dokumentasi) */}
        <div className="no-print">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border bg-white p-12 text-center text-sm text-muted-foreground">
              Belum ada dokumentasi jurnal kegiatan yang dicatat.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:shadow-md"
                >
                  {item.foto_url ? (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      <img
                        src={item.foto_url}
                        alt={item.judul}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/7] w-full items-center justify-center bg-gradient-to-r from-sky-50 to-emerald-50 text-sky-700">
                      <BookOpen className="h-9 w-9 opacity-60" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-sky-700">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(`${item.tanggal_kegiatan}T00:00:00`).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      {item.lokasi && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-amber-600" />
                          {item.lokasi}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2.5 text-lg font-extrabold text-slate-900">{item.judul}</h2>
                    <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {item.deskripsi}
                    </p>

                    {item.penanggung_jawab && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Koordinator: {item.penanggung_jawab}
                      </p>
                    )}

      {isAdmin && (
                      <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                        <Button size="sm" variant="outline" onClick={() => openForm(item)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Tampilan Khusus Cetak / PDF (Tabel Laporan Resmi A4) */}
        <section className="hidden print:block w-full text-black">
         <style>{`
            @media print {
              @page { size: A4 portrait; margin: 12mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `}</style>

          <header
  style={{
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "0 4px 10px 4px",
    borderBottom: "4px double #000",
    marginBottom: "16px",
    fontFamily: "'Times New Roman', Times, serif",
  }}
>
  <img
    src="/logo_kota_bekasi.jpg"
    alt="Logo Kota Bekasi"
    style={{
      height: "90px",
      width: "auto",
      objectFit: "contain",
      flexShrink: 0,
      position: "relative",
      left: "18px",
    }}
  />
  <div style={{ flex: 1, textAlign: "center", lineHeight: 1.32 }}>
    <p
      style={{
        fontSize: "20px",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        margin: 0,
      }}
    >
      PENGURUS RUKUN TETANGGA 06 / RW 07
    </p>
    <p
      style={{
        fontSize: "19px",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "4.2px",
        wordSpacing: "6px",
        margin: "2px 0",
      }}
    >
      VILLA PADURENAN INDAH 2
    </p>
    <p
      style={{
        fontSize: "13px",
        fontStyle: "italic",
        fontWeight: "bold",
        margin: "2px 0",
      }}
    >
      Motto: BERUBAH - PEDULI - BERBAGI
    </p>
    <p style={{ fontSize: "12px", margin: 0 }}>
      Sekretariat: Villa Padurenan Indah 2 Blok C No. 5 | HP: 08961149233
    </p>
  </div>
</header>
          <div className="mt-3 text-center">
            <h2 className="text-base font-extrabold uppercase underline">
              LAPORAN JURNAL & DOKUMENTASI KEGIATAN RT 06
            </h2>
            <p className="mt-0.5 text-[11px]">
              Dicetak tanggal: {tanggalCetak} · Total: {items.length} Kegiatan Tercatat
            </p>
          </div>      
          <table className="mt-4 w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-slate-100 text-left font-bold">
                <th className="w-8 border border-black px-2 py-2 text-center">No</th>
                <th className="w-24 border border-black px-2 py-2 text-center">Foto</th>
                <th className="w-28 border border-black px-2 py-2">Tanggal & Lokasi</th>
                <th className="w-44 border border-black px-2 py-2">Nama Kegiatan</th>
                <th className="border border-black px-2 py-2">Ringkasan & Hasil Kegiatan</th>
                <th className="w-32 border border-black px-2 py-2">Koordinator</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-black px-3 py-6 text-center">
                    Belum ada data jurnal kegiatan.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className="break-inside-avoid align-top">
                    <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                    <td className="border border-black p-1 text-center">
                      {item.foto_url ? (
                        <img
                          src={item.foto_url}
                          alt={item.judul}
                          className="mx-auto h-14 w-20 rounded object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border border-black px-2 py-1.5">
                      <p className="font-semibold">
                        {new Date(`${item.tanggal_kegiatan}T00:00:00`).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      {item.lokasi && <p className="mt-0.5 text-[11px]">{item.lokasi}</p>}
                    </td>
                    <td className="border border-black px-2 py-1.5 font-bold">{item.judul}</td>
                    <td className="border border-black px-2 py-1.5 whitespace-pre-line">
                      {item.deskripsi}
                    </td>
                    <td className="border border-black px-2 py-1.5">
                      {item.penanggung_jawab || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-8 grid grid-cols-2 text-center text-xs">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Ketua RT 06 / RW 07</p>
              <div className="h-16" />
              <p className="font-bold underline">( ........................................ )</p>
            </div>
            <div>
              <p>Bekasi, {tanggalCetak}</p>
              <p className="font-bold">Sekretaris / Seksi Kegiatan RT 06</p>
              <div className="h-16" />
              <p className="font-bold underline">( ........................................ )</p>
            </div>
          </div>
        </section>

        {/* Modal Tambah / Edit Jurnal Kegiatan */}
        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editing ? 'Edit Jurnal Kegiatan' : 'Tambah Dokumentasi Kegiatan'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Judul Kegiatan *</Label>
                  <Input
                    required
                    placeholder="Contoh: Kerja Bakti Pembersihan Saluran Air Blok A-C"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tanggal Kegiatan *</Label>
                    <Input
                      type="date"
                      required
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Lokasi</Label>
                    <Input
                      placeholder="Contoh: Balai Warga RT 06"
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Penanggung Jawab / Koordinator</Label>
                  <Input
                    placeholder="Contoh: Seksi Lingkungan & Kebersihan"
                    value={pj}
                    onChange={(e) => setPj(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Ringkasan & Hasil Kegiatan *</Label>
                  <Textarea
                    rows={3}
                    required
                    placeholder="Tuliskan jalannya kegiatan dan hasil yang dicapai..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Foto Dokumentasi (Kamera / Galeri HP)</Label>
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
                        alt="Pratinjau kegiatan"
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
                    {saving ? 'Menyimpan…' : 'Simpan Kegiatan'}
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
