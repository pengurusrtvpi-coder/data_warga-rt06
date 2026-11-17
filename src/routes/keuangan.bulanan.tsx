import { createFileRoute } from "@tanstack/react-router";
import { financeOptions } from "@/lib/portal-queries";
import { FinanceView } from "@/components/warga/FinanceView";
export const Route = createFileRoute("/keuangan/bulanan")({
  loader: ({ context }) => context.queryClient.ensureQueryData(financeOptions),
  head: () => ({
    meta: [
      { title: "Laporan Keuangan Bulanan — RT 06 VPI-2" },
      {
        name: "description",
        content:
          "Rincian transaksi pemasukan dan pengeluaran RT 06 VPI-2 berdasarkan bulan dan tahun.",
      },
      { property: "og:title", content: "Laporan Keuangan Bulanan — RT 06 VPI-2" },
      {
        property: "og:description",
        content: "Laporan bulanan keuangan RT dengan rincian transaksi dan cetak laporan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => {
    const { accessRole } = Route.useRouteContext();
    return <FinanceView role={accessRole} monthly />;
  },
});
