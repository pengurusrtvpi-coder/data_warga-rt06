import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Warga RT 06 VPI-2" },
      { name: "description", content: "Portal resmi warga RT 06 VPI-2 untuk melihat dan memperbarui data keluarga." },
      { property: "og:title", content: "Portal Warga RT 06 VPI-2" },
      { property: "og:description", content: "Lihat dan perbarui data keluarga Anda secara mandiri." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
