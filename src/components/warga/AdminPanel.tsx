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
  const [view, setView] = useState<"data" | "audit">("data");

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
                onClick={() => setView((current) => (current === "data" ? "audit" : "data"))}
              >
                {view === "data" ? <History /> : <Users />}
                {view === "data" ? "Riwayat Audit" : "Data Warga"}
              </Button>
              {view === "data" && (
                <Button size="lg" className="font-semibold" onClick={() => setCreating(true)}>
                  <Plus />
                  Tambah Warga
                </Button>
              )}
            </div>
          </div>

          {view === "data" && (
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {activeQuery ? <>Hasil untuk <span className="text-foreground">“{activeQuery}”</span></> : "Seluruh data warga"}
              </h2>
              <span className="text-sm text-muted-foreground">{rows.length} warga</span>
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((warga) => (
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
