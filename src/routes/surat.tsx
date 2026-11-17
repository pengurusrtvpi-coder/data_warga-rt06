import { createFileRoute, redirect } from "@tanstack/react-router";
import { hasActiveSession, getMyAccessRole, canAccessResidentPages } from "@/lib/warga";
import { suratOptions } from "@/lib/portal-queries";
import { PortalNav } from "@/components/warga/PortalNav";
import { LetterView } from "@/components/warga/LetterView";
export const Route = createFileRoute("/surat")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: "/login", replace: true });
    const accessRole = await getMyAccessRole();
    if (!canAccessResidentPages(accessRole)) throw redirect({ to: "/keuangan", replace: true });
    return { accessRole };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(suratOptions),
  head: () => ({
    meta: [
      { title: "Pelayanan & Riwayat Surat — RT 06 VPI-2" },
      {
        name: "description",
        content: "Pengajuan surat warga, riwayat surat dan cetak dokumen resmi RT 06 RW 07 VPI-2.",
      },
      { property: "og:title", content: "Pelayanan & Riwayat Surat — RT 06 VPI-2" },
      {
        property: "og:description",
        content: "Ajukan surat dan cetak ulang dokumen RT dari riwayat keluarga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => {
    const { accessRole } = Route.useRouteContext();
    return (
      <div className="min-h-screen bg-background">
        <PortalNav role={accessRole} />
        <LetterView role={accessRole} />
      </div>
    );
  },
});
