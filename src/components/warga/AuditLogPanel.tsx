import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Clock3, History, RefreshCw, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AUDIT_LOG_LIMIT,
  fetchAuditWarga,
  formatAuditValue,
  formatAuditWaktu,
  getAuditChanges,
  type AuditLogWarga,
} from "@/lib/warga";

const actionMeta: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  TAMBAH: { label: "Ditambahkan", variant: "default" },
  EDIT: { label: "Diedit", variant: "secondary" },
  HAPUS: { label: "Dihapus", variant: "destructive" },
};

function AuditEntry({ log }: { log: AuditLogWarga }) {
  const changes = getAuditChanges(log.perubahan);
  const action = actionMeta[log.action] ?? { label: log.action, variant: "outline" as const };

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={action.variant}>{action.label}</Badge>
            <h3 className="break-words font-bold text-foreground">{log.warga_nama || "Data warga"}</h3>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">NIK {log.warga_nik || "—"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          <time dateTime={log.created_at}>{formatAuditWaktu(log.created_at)}</time>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
        <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="break-all">{log.actor_email || "Sistem / layanan database"}</span>
      </div>

      {changes.length > 0 && (
        <details className="group mt-4 rounded-xl bg-muted/60 px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
            Lihat {changes.length} {log.action === "EDIT" ? "perubahan" : "rincian data"}
          </summary>
          <div className="mt-3 space-y-3 border-t pt-3">
            {changes.map((change) => (
              <div key={change.key} className="text-sm">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {change.label}
                </p>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
                  {"dari" in change && (
                    <div className="min-w-0 flex-1 rounded-lg bg-card px-3 py-2">
                      <span className="mb-0.5 block text-[11px] font-semibold text-muted-foreground">Sebelum</span>
                      <span className="break-words text-foreground">{formatAuditValue(change.dari)}</span>
                    </div>
                  )}
                  {"dari" in change && "menjadi" in change && (
                    <ArrowRight className="mx-auto hidden h-4 w-4 shrink-0 text-muted-foreground sm:mt-3 sm:block" />
                  )}
                  {"menjadi" in change && (
                    <div className="min-w-0 flex-1 rounded-lg bg-card px-3 py-2">
                      <span className="mb-0.5 block text-[11px] font-semibold text-muted-foreground">Sesudah</span>
                      <span className="break-words font-medium text-foreground">{formatAuditValue(change.menjadi)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLogWarga[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLogs(await fetchAuditWarga());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat audit.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-foreground">Aktivitas terbaru</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Menampilkan hingga {AUDIT_LOG_LIMIT} catatan tambah, edit, dan hapus terbaru.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading} className="shrink-0 self-start sm:self-auto">
          <RefreshCw className={loading ? "animate-spin" : undefined} />
          Muat Ulang
        </Button>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && !logs && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}

      {logs && logs.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <History className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold text-foreground">Belum ada riwayat perubahan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aktivitas tambah, edit, dan hapus berikutnya akan tercatat di sini.
          </p>
        </div>
      )}

      {logs && logs.length > 0 && (
        <div className="space-y-4">
          {logs.map((log) => (
            <AuditEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </main>
  );
}
