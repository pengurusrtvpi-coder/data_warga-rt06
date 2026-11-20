import { useState } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, BarChart, ResponsiveContainer } from 'recharts';
import { Plus, Pencil, Trash2, Printer, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Choice } from './Choice';
import { BayarIuranTab } from './BayarIuranTab';
import { financeOptions } from '@/lib/portal-queries';
import {
  BULAN,
  jakartaToday,
  rupiah,
  financeSummary,
  yearSeries,
  analyseYear,
  saveTransaksi,
  deleteTransaksi,
  transaksiSchema,
  type Transaksi,
  type TransaksiInput,
  type AccessRole,
} from '@/lib/warga';

const KATEGORI_KEUANGAN = [
  'Iuran Bulanan',
  'Iuran Keamanan & Kebersihan',
  'Sumbangan / Donasi',
  'Kas Sosial / Kematian',
  'Operasional RT',
  'Perbaikan Fasilitas',
  'Kegiatan Warga / 17 Agustus',
  'Lainnya',
];

const UMUM_OPTION = '__UMUM__';
const MANUAL_OPTION = '__MANUAL__';

export function FinanceView({ role, monthly = false }: { role: AccessRole; monthly?: boolean }) {
  const { data } = useSuspenseQuery(financeOptions);
  const qc = useQueryClient();
  const today = jakartaToday(),
    currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear),
    [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [editing, setEditing] = useState<Transaksi | null>(null),
    [open, setOpen] = useState(false),
    [deleting, setDeleting] = useState<Transaksi | null>(null),
    [busy, setBusy] = useState(false);
const [showIuran, setShowIuran] = useState(false);
  const series = yearSeries(data.bulanan, year),
    analysis = analyseYear(series),
    all = financeSummary(data.transaksi);
  const current = financeSummary(data.transaksi.filter((r) => r.tanggal.startsWith(today.slice(0, 7))));
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const filtered = data.transaksi.filter((r) => r.tanggal.startsWith(prefix)),
    summary = financeSummary(filtered);
  const years = Array.from(
    new Set([
      currentYear,
      ...data.transaksi.map((r) => Number(r.tanggal.slice(0, 4))),
      ...data.bulanan.map((r) => Number(r.tahun_angka)).filter(Boolean),
    ])
  ).sort((a, b) => b - a);

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteTransaksi(deleting.id);
      setDeleting(null);
      await qc.invalidateQueries({ queryKey: ['finance'] });
      toast.success('Transaksi dihapus.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus.');
    } finally {
      setBusy(false);
    }
  }

  return (
   <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 print:px-0 print:py-0">
      <div className="hidden print:block mb-5">
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
          <h2 className="text-base font-extrabold uppercase underline text-slate-900">
            {monthly ? 'LAPORAN BULANAN KEUANGAN RT 06' : 'LAPORAN KEUANGAN RT 06 / RW 07 VPI-2'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Periode Tahun {year} · Dicetak:{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <div className="no-print mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary-deep">RT 06 / RW 07 · VPI-2</p>
          <h1 className="mt-1 text-3xl font-extrabold">{monthly ? 'Laporan Bulanan' : 'Keuangan RT'}</h1>
        </div>
  {(role === 'admin' || (role as string) === 'bendahara') && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer />
              Cetak Laporan
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus />
              Tambah Transaksi
            </Button>
          </div>
        )}
        <Button
          variant={showIuran ? 'default' : 'outline'}
          onClick={() => setShowIuran(!showIuran)}
          className={
            !showIuran
              ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }
        >
          {showIuran ? '← Kembali ke Laporan Keuangan' : 'Bayar Iuran Warga'}
        </Button>
</div>
      {showIuran ? (
        <BayarIuranTab />
      ) : (
        <>
              <div className="no-print mb-6 flex flex-wrap items-end gap-4">
        {monthly && (
          <div className="w-44">
            <Label>Bulan</Label>
            <Choice
              label="Bulan"
              value={String(month)}
              onChange={(v) => setMonth(Number(v))}
              options={BULAN.map((b, i) => ({ value: String(i + 1), label: b }))}
            />
          </div>
        )}
        <div className="w-32">
          <Label>Tahun</Label>
          <Choice
            label="Tahun"
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
      </div>

      {!monthly && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Kas RT saat ini', value: all.saldo, Icon: Wallet },
              { label: 'Pemasukan bulan ini', value: current.pemasukan, Icon: TrendingUp },
              { label: 'Pengeluaran bulan ini', value: current.pengeluaran, Icon: TrendingDown },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="rounded-lg border bg-card p-5">
                <Icon className="mb-3 h-5 w-5 text-primary-deep" />
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 break-words text-2xl font-bold">{rupiah(value)}</p>
              </div>
            ))}
          </div>

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold">Pemasukan & Pengeluaran · {year}</h2>
            <div className="finance-chart h-80 w-full" role="img" aria-label={`Grafik pemasukan dan pengeluaran 12 bulan tahun ${year}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ left: 5, right: 10 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="bulan" tickFormatter={(v) => v.slice(0, 3)} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis width={70} tickFormatter={(v) => `${Number(v) / 1000000} jt`} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    formatter={(v) => rupiah(Number(v))}
                    contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                  <Legend />
                  <Bar isAnimationActive={false} name="Pemasukan" dataKey="pemasukan" fill="var(--chart-2)" radius={3} />
                  <Bar isAnimationActive={false} name="Pengeluaran" dataKey="pengeluaran" fill="var(--chart-1)" radius={3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mb-8 border-y py-5">
            <h2 className="mb-3 font-bold">Analisa Keuangan Otomatis</h2>
            {analysis ? (
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                <li>
                  Pengeluaran tertinggi: <strong>{analysis.highestExpense.bulan} · {rupiah(analysis.highestExpense.pengeluaran)}</strong>
                </li>
                <li>
                  Pengeluaran terendah (bulan tercatat): <strong>{analysis.lowestExpense.bulan} · {rupiah(analysis.lowestExpense.pengeluaran)}</strong>
                </li>
                <li>
                  Pemasukan tertinggi: <strong>{analysis.highestIncome.bulan} · {rupiah(analysis.highestIncome.pemasukan)}</strong>
                </li>
                <li>
                  {analysis.saldo < 0 ? 'Defisit' : analysis.saldo > 0 ? 'Surplus' : 'Seimbang'} tahun {year}: <strong>{rupiah(analysis.saldo)}</strong> · Kas saat ini {all.saldo < 0 ? 'defisit' : all.saldo > 0 ? 'surplus' : 'seimbang'}
                </li>
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada transaksi untuk tahun {year}.</p>
            )}
          </section>

          <div className="report-scroll">
            <table className="report-table">
              <caption>Laporan Tahunan {year}</caption>
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Pemasukan</th>
                  <th>Pengeluaran</th>
                  <th>Surplus / Defisit</th>
                </tr>
              </thead>
              <tbody>
                {series.map((r) => (
                  <tr key={r.bulan}>
                    <td>{r.bulan}</td>
                    <td>{rupiah(r.pemasukan)}</td>
                    <td>{rupiah(r.pengeluaran)}</td>
                    <td>{rupiah(r.saldo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th>{rupiah(series.reduce((s, r) => s + r.pemasukan, 0))}</th>
                  <th>{rupiah(series.reduce((s, r) => s + r.pengeluaran, 0))}</th>
                  <th>{rupiah(series.reduce((s, r) => s + r.saldo, 0))}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {monthly && (
        <>
          <div className="mb-5 flex flex-wrap gap-6 text-sm">
            <p>
              Pemasukan: <strong>{rupiah(summary.pemasukan)}</strong>
            </p>
            <p>
              Pengeluaran: <strong>{rupiah(summary.pengeluaran)}</strong>
            </p>
            <p>
              Surplus / Defisit: <strong>{rupiah(summary.saldo)}</strong>
            </p>
          </div>
          <div className="report-scroll">
            <table className="report-table">
              <caption>
                {BULAN[month - 1]} {year}
              </caption>
              <thead>
                <tr>
                  {['Tanggal', 'Nama Warga', 'Kategori', 'Keterangan', 'Jenis', 'Jumlah'].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                  {role === 'admin' && <th className="no-print">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(`${r.tanggal}T00:00:00`).toLocaleDateString('id-ID')}</td>
                    <td>{r.nama_warga || '—'}</td>
                    <td>{r.kategori}</td>
                    <td className="max-w-xs whitespace-normal">{r.keterangan || '—'}</td>
                    <td>{r.jenis}</td>
                    <td>{rupiah(r.jumlah)}</td>
                    {(role === 'admin' || (role as string) === 'bendahara') && (
                      <td className="no-print">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit transaksi"
                            aria-label={`Edit transaksi ${r.kategori}`}
                            onClick={() => {
                              setEditing(r);
                              setOpen(true);
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Hapus transaksi"
                            aria-label={`Hapus transaksi ${r.kategori}`}
                            onClick={() => setDeleting(r)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={role === 'admin' ? 7 : 6} className="py-12 text-center">
                      Belum ada transaksi pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

     {(role === 'admin' || (role as string) === 'bendahara') && (
        <>
          <TransactionForm
            key={`${open}-${editing?.id}`}
            open={open}
            onClose={() => setOpen(false)}
            row={editing}
            onSaved={async () => {
              setOpen(false);
              await qc.invalidateQueries({ queryKey: ['finance'] });
            }}
          />
          <Dialog open={!!deleting} onOpenChange={(v) => !busy && !v && setDeleting(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus Transaksi?</DialogTitle>
                <DialogDescription>
                  Transaksi <strong>{deleting?.kategori}</strong> sebesar{' '}
                  <strong>{deleting ? rupiah(deleting.jumlah) : ''}</strong> akan dihapus permanen.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>
                  Batal
                </Button>
                <Button variant="destructive" disabled={busy} onClick={remove}>
                  {busy ? 'Menghapus…' : 'Hapus Transaksi'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
      </>
      )}
    </main>
  );
}

function TransactionForm({
  open,
  onClose,
  row,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  row: Transaksi | null;
  onSaved: () => Promise<void>;
}) {
  const { data: kepalaKeluargaList = [] } = useQuery({
  queryKey: ['data-warga-kk-keuangan'],
  queryFn: async () => {
    const { data, error } = await (supabase as any).rpc('get_kepala_keluarga_keuangan');
    if (error || !data) return [];
    return [...data].sort((a: any, b: any) =>
      String(a.nama_lengkap || '').localeCompare(String(b.nama_lengkap || ''), 'id')
    );
  },
  enabled: open,
});

  const initialNama = row?.nama_warga || '';
  const isInitialInKK =
    !initialNama || kepalaKeluargaList.some((k: any) => k.nama_lengkap === initialNama);

  const [tanggal, setTanggal] = useState(row?.tanggal || jakartaToday());
  const [jenis, setJenis] = useState<'Pemasukan' | 'Pengeluaran'>(
    (row?.jenis as 'Pemasukan' | 'Pengeluaran') || 'Pemasukan'
  );
  const [kategori, setKategori] = useState(row?.kategori || 'Iuran Bulanan');
  const [selectedWarga, setSelectedWarga] = useState<string>(
    !initialNama ? UMUM_OPTION : isInitialInKK ? initialNama : MANUAL_OPTION
  );
  const [manualNama, setManualNama] = useState<string>(isInitialInKK ? '' : initialNama);
  const [jumlah, setJumlah] = useState(row?.jumlah ? String(row.jumlah) : '');
  const [keterangan, setKeterangan] = useState(row?.keterangan || '');
  const [saving, setSaving] = useState(false);

  const isManualMode = selectedWarga === MANUAL_OPTION;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const namaFinal =
      selectedWarga === UMUM_OPTION
        ? ''
        : isManualMode
        ? manualNama.trim()
        : selectedWarga.trim();

    const payload: TransaksiInput = {
      tanggal,
      jenis,
      kategori: kategori.trim() || 'Lainnya',
      nama_warga: namaFinal || undefined,
      jumlah: Number(jumlah),
      keterangan: keterangan.trim() || undefined,
    };

    const parsed = transaksiSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues.at(0)?.message || 'Periksa kembali isian transaksi.');
      return;
    }

    setSaving(true);
    try {
      await saveTransaksi(parsed.data, row?.id);
      toast.success(row ? 'Transaksi diperbarui.' : 'Transaksi ditambahkan.');
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
          <DialogDescription>
            Pilih perwakilan Kepala Keluarga (1 per rumah) atau ketik nama secara manual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tx-tanggal">Tanggal</Label>
            <Input
              id="tx-tanggal"
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Jenis</Label>
            <Choice
              label="Jenis"
              value={jenis}
              onChange={(v) => setJenis(v as 'Pemasukan' | 'Pengeluaran')}
              options={[
                { value: 'Pemasukan', label: 'Pemasukan' },
                { value: 'Pengeluaran', label: 'Pengeluaran' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Choice
              label="Kategori"
              value={kategori}
              onChange={setKategori}
              options={KATEGORI_KEUANGAN.map((k) => ({ value: k, label: k }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nama Warga (Perwakilan Kepala Keluarga / Manual)</Label>
            <Choice
              label="Nama Warga"
              value={selectedWarga}
              onChange={(v) => {
                setSelectedWarga(v);
                if (v !== MANUAL_OPTION) setManualNama('');
              }}
              options={[
                { value: UMUM_OPTION, label: '— Tanpa Nama Warga (Umum) —' },
                { value: MANUAL_OPTION, label: '+ Ketik Nama Manual (Non-KK / Lainnya)' },
                ...kepalaKeluargaList.map((k: any) => {
                  const blokMatch = String(k.alamat || '').match(
                    /BLOK\s*[A-Z0-9]+\s*NO\.?\s*[0-9A-Z]+/i
                  );
                  const infoBlok =
                    blokMatch && blokMatch[0] ? ` (${blokMatch[0].toUpperCase()})` : '';
                  return {
                    value: k.nama_lengkap,
                    label: `${k.nama_lengkap}${infoBlok}`,
                  };
                }),
              ]}
            />
            {isManualMode && (
              <Input
                autoComplete="off"
                placeholder="Ketik nama warga / donatur / penerima secara manual..."
                value={manualNama}
                onChange={(e) => setManualNama(e.target.value)}
                required
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-jumlah">Jumlah (Rp)</Label>
            <Input
              id="tx-jumlah"
              type="number"
              inputMode="numeric"
              min={1}
              required
              placeholder="Contoh: 50000"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-ket">Keterangan</Label>
            <Textarea
              id="tx-ket"
              rows={2}
              placeholder="Catatan tambahan (opsional)..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan Transaksi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
