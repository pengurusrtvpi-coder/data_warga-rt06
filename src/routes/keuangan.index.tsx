import { createFileRoute } from "@tanstack/react-router";
import { financeOptions } from "@/lib/portal-queries";
import { FinanceView } from "@/components/warga/FinanceView";
export const Route = createFileRoute("/keuangan/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(financeOptions),
  head: () => ({
    meta: [
      { title: "Keuangan RT & Laporan Tahunan — RT 06 VPI-2" },
      {
        name: "description",
        content:
          "Dashboard kas RT, tren pemasukan dan pengeluaran, serta laporan tahunan RT 06 VPI-2.",
      },
      { property: "og:title", content: "Keuangan RT & Laporan Tahunan — RT 06 VPI-2" },
      { property: "og:description", content: "Kas RT, grafik dan analisa tahunan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => {
    const { accessRole } = Route.useRouteContext();
    return <FinanceView role={accessRole} />;
  },
});
