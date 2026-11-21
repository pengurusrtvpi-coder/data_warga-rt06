import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, History, Loader2, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AuditLogPanel } from "@/components/warga/AuditLogPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EditWargaDialog } from "@/components/warga/EditWargaDialog";
import { WargaCard } from "@/components/warga/WargaCard";
import { deleteWarga, fetchSemuaWarga,maskNik, type Warga } from "@/lib/warga";

export function AdminPanel() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [rows, setRows] = useState<Warga[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Warga | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Warga | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
const [view, setView] = useState<"data" | "audit" | "pindah">("data");
const wargaAktif = (rows ?? []).filter((w) => {
    const st = (w.status_warga || "tetap").trim().toLowerCase();
    return st === "tetap" || st === "kontrak/kost";
  });

  const wargaPindah = (rows ?? []).filter((w) => {
    const st = (w.status_warga || "").trim().toLowerCase();
    return st === "pindah";
  });
const activeList = view === "pindah" ? wargaPindah : wargaAktif;
  const activeLabel = view === "pindah" ? "DATA WARGA PINDAH" : "DATA WARGA AKTIF";

  function handleDownloadCsv() {
    if (activeList.length === 0) return;
    const headers = [
      "No",
      "NIK",
      "No KK",
      "Nama Lengkap",
      "Hubungan Keluarga",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Jenis Kelamin",
      "Agama",
      "Status Kawin",
      "Pendidikan",
      "Pekerjaan",
      "Alamat",
      "Status Warga",
    ];
    const escapeCsv = (val: unknown) =>
      `"${String(val ?? "").replace(/"/g, '""')}"`;

    const lines = activeList.map((w, idx) =>
      [
        idx + 1,
        `'${w.nik ?? ""}`,
        `'${w.no_kk ?? ""}`,
        w.nama_lengkap,
        w.hubungan_keluarga,
        w.tempat_lahir,
        w.tanggal_lahir,
        w.jenis_kelamin,
        w.agama,
        w.status_perkawinan,
        w.pendidikan,
        w.pekerjaan,
        w.alamat,
        w.status_warga,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = "\uFEFF" + [headers.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const prefix = view === "pindah" ? "data-warga-pindah" : "data-warga-aktif";
    a.download = `${prefix}-rt06-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrintResmi() {
    if (activeList.length === 0) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const logoUrl = `${window.location.origin}/logo_kota_bekasi.jpg`;
    const rowsHtml = activeList
      .map(
        (w, i) => `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${w.nik ?? "-"}</td>
          <td>${w.no_kk ?? "-"}</td>
          <td>${w.nama_lengkap ?? "-"}</td>
          <td>${w.hubungan_keluarga ?? "-"}</td>
          <td>${w.tempat_lahir ?? "-"}, ${w.tanggal_lahir ?? "-"}</td>
          <td style="text-align:center">${w.jenis_kelamin === "Laki-laki" ? "L" : w.jenis_kelamin === "Perempuan" ? "P" : w.jenis_kelamin ?? "-"}</td>
          <td>${w.alamat ?? "-"}</td>
          <td style="text-align:center">${w.status_warga ?? "-"}</td>
        </tr>`
      )
      .join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${activeLabel} - RT 06 RW 07 VPI-2</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 16px; font-size: 11px; }
            .kop { width: 100%; margin-bottom: 12px; }
            .kop-row { display: flex; align-items: center; gap: 12px; padding-bottom: 6px; }
            .kop-text { flex: 1; text-align: center; line-height: 1.15; }
            .kop-line1 { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.2px; margin: 0 0 2px 0; }
            .kop-line2 { font-size: 25px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; line-height: 1.05; margin: 0 0 3px 0; }
            .kop-line3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0; }
            .kop-line4 { font-size: 13px; font-weight: 700; letter-spacing: 0.3px; margin: 0; }
            .garis-tebal { border-bottom: 3px solid #000; margin-top: 2px; }
            .garis-tipis { border-bottom: 1px solid #000; margin-top: 2px; }
            .judul { text-align: center; margin: 14px 0 4px; font-size: 14px; font-weight: 800; text-decoration: underline; }
            .subjudul { text-align: center; margin: 0 0 12px; font-size: 11px; color: #333; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 5px 6px; text-align: left; vertical-align: top; }
            th { background: #eef2f6; font-weight: 700; text-align: center; }
            .ttd { margin-top: 24px; display: flex; justify-content: flex-end; }
            .ttd-box { text-align: center; width: 220px; }
            @media print { @page { size: landscape; margin: 10mm; } }
          </style>
        </head>
        <body>
          <header class="kop">
            <div class="kop-row">
              <img src="${logoUrl}" alt="Logo Kota Bekasi" style="height:84px;width:auto;object-fit:contain;" />
              <div class="kop-text">
                <p class="kop-line1">PEMERINTAH KOTA BEKASI</p>
                <p class="kop-line2">RUKUN TETANGGA 06 RW 07</p>
                <p class="kop-line3">KELURAHAN PADURENAN KECAMATAN MUSTIKAJAYA</p>
                <p class="kop-line4">Sekretariat : Villa Padurenan Indah 2 Blok C No 5 Telp. 08961149233</p>
              </div>
            </div>
            <div class="garis-tebal"></div>
            <div class="garis-tipis"></div>
          </header>

          <div class="judul">REKAPITULASI ${activeLabel}</div>
          <div class="subjudul">
            Total: ${activeList.length} Warga${activeQuery ? ` (Filter pencarian: "${activeQuery}")` : ""} &bull; Dicetak tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:28px">No</th>
                <th style="width:115px">NIK</th>
                <th style="width:115px">No. KK</th>
                <th>Nama Lengkap</th>
                <th style="width:95px">Status Keluarga</th>
                <th style="width:145px">Tempat, Tgl Lahir</th>
                <th style="width:32px">L/P</th>
                <th>Alamat</th>
                <th style="width:78px">Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <div class="ttd">
            <div class="ttd-box">
              <p style="margin:0 0 56px">Bekasi, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br/>Ketua RT 06 RW 07</p>
              <p style="margin:0;font-weight:700;text-decoration:underline;">( ........................................ )</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 350);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSemuaWarga(search);
      setRows(data);
      setActiveQuery(search.trim());
    } catch (err) {
      setRows(null);
      setError(err instanceof Error ? err.message : "Gagal memuat data warga.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void load(query);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteSaving(true);
    try {
      await deleteWarga(deleting.id);
      toast.success(`Data ${deleting.nama_lengkap} berhasil dihapus`);
      setDeleting(null);
      await load(activeQuery);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus data warga");
    } finally {
      setDeleteSaving(false);
    }
  }

  return (
    <>
      <section className="bg-sky-gradient">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-deep">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin · Akses Penuh
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {view === "data" ? "Panel Data Warga" : "Riwayat Audit"}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                {view === "data"
                  ? "Lihat seluruh data, tambah warga, edit semua kolom data, atau hapus data yang tidak lagi diperlukan."
                  : "Pantau siapa yang menambah, mengedit, atau menghapus data warga beserta waktu dan rincian perubahannya."}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
<Button
                type="button"
                size="lg"
                variant="outline"
                className="bg-card font-semibold"
                onClick={() =>
                  setView((current) => (current === "audit" ? "data" : "audit"))
                }
              >
                {view === "audit" ? <Users /> : <History />}
                {view === "audit" ? "Data Warga" : "Riwayat Audit"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant={view === "pindah" ? "default" : "outline"}
                className={view === "pindah" ? "font-semibold" : "bg-card font-semibold"}
                onClick={() =>
                  setView((current) => (current === "pindah" ? "data" : "pindah"))
                }
              >
                {view === "pindah"
                  ? "Kembali ke Warga Aktif"
                  : `Warga Pindah (${wargaPindah.length})`}
              </Button>
{view !== "audit" && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="bg-card font-semibold"
                        disabled={activeList.length === 0}
                      >
                        Print / Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handlePrintResmi}>
                        Print / Simpan PDF (Kop Resmi)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadCsv}>
                        Download Excel (CSV)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    size="lg"
                    className="font-semibold"
                    onClick={() => setCreating(true)}
                  >
                    <Plus />
                    Tambah Warga
                  </Button>
                </>
              )}
            </div>
          </div>

          {view === "audit" && (
          <form
            onSubmit={onSearch}
            className="mt-6 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-lift sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Cari data warga"
                placeholder="Cari nama, NIK, atau No. KK"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 border-0 pl-10 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" size="lg" className="h-11 font-semibold" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Tampilkan Data Warga
            </Button>
          </form>
          )}
        </div>
      </section>

      {view === "audit" ? (
        <AuditLogPanel />
      ) : (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && !rows && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        )}

        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">Data warga tidak ditemukan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeQuery ? `Tidak ada hasil untuk “${activeQuery}”.` : "Belum ada data warga yang tersimpan."}
            </p>
            {activeQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setQuery("");
                  void load("");
                }}
              >
                Tampilkan Semua
              </Button>
            )}
          </div>
        )}

        {rows && rows.length > 0 && (
          <>
{view === "data" && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {activeQuery ? (
                    <>
                      Hasil untuk{" "}
                      <span className="text-primary">"{activeQuery}"</span>
                    </>
                  ) : (
                    "Seluruh data warga"
                  )}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {wargaAktif.length} warga
                </span>
              </div>
              <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wargaAktif.map((warga) => (
                  <WargaCard
                    key={warga.id}
                    warga={warga}
                    isAdmin
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            </>
          )}

          {view === "pindah" && (
            <div className="mt-8 border-t pt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {activeQuery ? (
                    <>
                      Data warga pindah — hasil untuk{" "}
                      <span className="text-primary">"{activeQuery}"</span>
                    </>
                  ) : (
                    "Data warga pindah"
                  )}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {wargaPindah.length} warga
                </span>
              </div>
              <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wargaPindah.map((warga) => (
                  <WargaCard
                    key={warga.id}
                    warga={warga}
                    isAdmin
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </main>
      )}

      <EditWargaDialog
        warga={editing}
        open={creating || Boolean(editing)}
        isAdmin
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => load(activeQuery)}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && !deleteSaving && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data warga?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{deleting?.nama_lengkap}</strong> dengan NIK {maskNik(deleting?.nik)} akan dihapus permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleteSaving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSaving}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleteSaving && <Loader2 className="animate-spin" />}
              Hapus Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
