import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { AdminPanel } from "@/components/warga/AdminPanel";
import { EditWargaDialog } from "@/components/warga/EditWargaDialog";
import { WargaCard } from "@/components/warga/WargaCard";
import { PortalNav } from "@/components/warga/PortalNav";
import {
  fetchKeluargaSaya,
  getMyAccessRole,
  canAccessResidentPages,
  hasActiveSession,
  type Warga,
} from "@/lib/warga";

export const Route = createFileRoute("/keluarga")({
  // Session and own-role RLS checks run in the browser for this external Supabase project.
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: "/login", replace: true });
    const accessRole = await getMyAccessRole();
    if (!canAccessResidentPages(accessRole)) throw redirect({ to: "/keuangan", replace: true });
    return { accessRole };
  },
  head: () => ({
    meta: [
      { title: "Data Warga & Keluarga — Portal RT 06 VPI-2" },
      {
        name: "description",
        content:
          "Kelola data warga sebagai pengurus RT atau perbarui data keluarga Anda di RT 06 VPI-2.",
      },
      { property: "og:title", content: "Data Warga & Keluarga — Portal RT 06 VPI-2" },
      {
        property: "og:description",
        content: "Portal data keluarga warga dan pengelolaan data oleh pengurus RT 06 VPI-2.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KeluargaPage,
});

function KeluargaPage() {
  const { accessRole } = Route.useRouteContext();

  return (
    <div className="min-h-screen bg-background">
      <PortalNav role={accessRole} />

      {accessRole === "admin" ? <AdminPanel /> : <ResidentPanel />}
    </div>
  );
}

function ResidentPanel() {
  const [activeKk, setActiveKk] = useState<string | null>(null);
  const [rows, setRows] = useState<Warga[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Warga | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKeluargaSaya();
      setRows(data);
      setActiveKk(data[0]?.no_kk ?? null);
    } catch (err) {
      setRows(null);
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <section className="bg-sky-gradient">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Data Keluarga
          </h1>
          <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
            Data anggota keluarga sesuai Kartu Keluarga akun Anda. Anda dapat memperbarui data yang
            diizinkan.
          </p>
        </div>
      </section>

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
            <p className="mt-3 font-semibold text-foreground">Data tidak ditemukan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              NIK akun Anda belum terhubung dengan data KK. Hubungi pengurus RT.
            </p>
          </div>
        )}

        {rows && rows.length > 0 && (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                KK <span className="font-mono text-foreground">{activeKk}</span>
              </h2>
              <span className="text-sm text-muted-foreground">{rows.length} anggota</span>
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((warga) => (
                <WargaCard key={warga.id} warga={warga} onEdit={setEditing} />
              ))}
            </div>
          </>
        )}
      </main>

      <EditWargaDialog warga={editing} onClose={() => setEditing(null)} onSaved={() => load()} />
    </>
  );
}
