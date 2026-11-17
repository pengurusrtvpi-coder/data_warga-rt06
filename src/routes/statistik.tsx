import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalNav } from "@/components/warga/PortalNav";
import { getMyAccessRole, hasActiveSession, type Warga } from "@/lib/warga";
import {
  BarChart3,
  Printer,
  Users,
  Briefcase,
  HeartHandshake,
  MousePointerClick,
} from "lucide-react";

export const Route = createFileRoute("/statistik")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: "/login", replace: true });
    return { accessRole: await getMyAccessRole() };
  },
  component: StatistikUsiaPage,
});

const MASTER_KAT = [
  { kategori: "Balita", rentang_usia: "0 – 4 Tahun", urutan: 1 },
  { kategori: "Anak-anak", rentang_usia: "5 – 12 Tahun", urutan: 2 },
  { kategori: "Remaja", rentang_usia: "13 – 17 Tahun", urutan: 3 },
  { kategori: "Pemuda / Dewasa Muda", rentang_usia: "18 – 25 Tahun", urutan: 4 },
  { kategori: "Dewasa Produktif", rentang_usia: "26 – 59 Tahun", urutan: 5 },
  { kategori: "Lansia", rentang_usia: "60+ Tahun", urutan: 6 },
];

const COLORS = [
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-600",
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-purple-600 to-fuchsia-600",
];

function hitungUmur(tgl: string): number {
  const lahir = new Date(tgl);
  if (isNaN(lahir.getTime())) return -1;
  const now = new Date();
  let umur = now.getFullYear() - lahir.getFullYear();
  const m = now.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) umur--;
  return umur;
}

function getKategori(umur: number): string {
  if (umur < 5) return "Balita";
  if (umur <= 12) return "Anak-anak";
  if (umur <= 17) return "Remaja";
  if (umur <= 25) return "Pemuda / Dewasa Muda";
  if (umur <= 59) return "Dewasa Produktif";
  return "Lansia";
}

function StatistikUsiaPage() {
  const { accessRole } = Route.useRouteContext();
  const r = (accessRole || "warga") as string;
  const canViewDetail = r === "admin" || r === "bendahara" || r === "kesra_pkk" || r === "seksi_rt";
  const canPrint = r === "admin" || r === "kesra_pkk";

  const [stats, setStats] = useState<any[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [selectedKat, setSelectedKat] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      let allWarga: Warga[] = [];

      if (canViewDetail) {
        const { data: rpcWarga, error: rpcWargaErr } = await (supabase as any).rpc(
          "get_warga_statistik_usia_admin",
        );
        if (!rpcWargaErr && Array.isArray(rpcWarga)) {
          allWarga = rpcWarga as Warga[];
          setWargaList(allWarga);
        } else if (r === "admin") {
          const { data } = await (supabase as any)
            .from("data_warga")
            .select("*")
            .order("nama_lengkap", { ascending: true });
          if (Array.isArray(data)) {
            allWarga = (data as Warga[]).filter((w) => {
              const st = (w.status_warga || "tetap").trim().toLowerCase();
              return st === "tetap" || st === "kontrak/kost";
            });
            setWargaList(allWarga);
          }
        }
      }

      const { data: statData, error: rpcErr } = await (supabase as any).rpc(
        "get_statistik_usia_rt06",
      );
      if (!rpcErr && Array.isArray(statData) && statData.length > 0) {
        setStats(statData);
      } else if (allWarga.length > 0) {
        const hitungLokal = MASTER_KAT.map((m) => {
          const cocok = allWarga.filter((w) => {
            if (!w.tanggal_lahir) return false;
            const u = hitungUmur(w.tanggal_lahir);
            return u >= 0 && getKategori(u) === m.kategori;
          });
          const lk = cocok.filter((w) =>
            (w.jenis_kelamin || "").trim().toUpperCase().startsWith("L"),
          ).length;
          const pr = cocok.filter((w) =>
            (w.jenis_kelamin || "").trim().toUpperCase().startsWith("P"),
          ).length;
          return { ...m, laki_laki: lk, perempuan: pr, total: cocok.length };
        });
        setStats(hitungLokal);
      } else {
        setStats(MASTER_KAT.map((m) => ({ ...m, laki_laki: 0, perempuan: 0, total: 0 })));
      }

      setLoading(false);
    }
    loadData();
  }, [canViewDetail, r]);

  function handleSelectKategori(kat: string) {
    if (!canViewDetail) return;
    setSelectedKat(kat);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  const totalWarga = stats.reduce((a, c) => a + Number(c.total || 0), 0);
  const totalLaki = stats.reduce((a, c) => a + Number(c.laki_laki || 0), 0);
  const totalPerempuan = stats.reduce((a, c) => a + Number(c.perempuan || 0), 0);
  const maxVal = Math.max(...stats.map((s) => Number(s.total || 0)), 1);

  const filteredWarga = wargaList.filter((w) => {
    if (!w.tanggal_lahir) return false;
    const u = hitungUmur(w.tanggal_lahir);
    if (u < 0) return false;
    return selectedKat === "Semua" || getKategori(u) === selectedKat;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 print:bg-white print:pb-0">
      <PortalNav role={accessRole} />

      {/* Kop Surat Khusus Cetak PDF (Hanya Logo Kota Bekasi) */}
      <div className="hidden print:block px-6 pt-4 mb-6">
        <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-3">
          <img
            src="/logo_kota_bekasi.jpg"
            alt="Logo Kota Bekasi"
            className="h-16 w-16 object-contain shrink-0"
          />
          <div className="text-center flex-1 pr-8">
            <p className="text-base font-extrabold text-slate-900">
              PENGURUS RUKUN TETANGGA 06 / RW 07
            </p>
            <p className="text-sm font-bold text-slate-800">VILLA PADURENAN INDAH 2 (VPI-2)</p>
            <p className="text-xs italic text-slate-700">Motto: BERUBAH - PEDULI - BERBAGI</p>
            <p className="text-[11px] text-slate-600">
              Kelurahan Padurenan, Kecamatan Mustikajaya, Kota Bekasi
            </p>
          </div>
        </div>
        <div className="text-center mt-4">
          <h2 className="text-base font-bold uppercase underline">
            LAPORAN STATISTIK KEPENDUDUKAN BERDASARKAN USIA
            {selectedKat !== "Semua" ? ` — KATEGORI ${selectedKat.toUpperCase()}` : ""}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Tanggal Cetak:{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Header Banner Layar */}
      <div className="no-print bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 text-white py-9 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" /> Pemetaan Kependudukan RT 06
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              Statistik Warga Berdasarkan Usia
            </h1>
            <p className="text-emerald-100 text-xs md:text-sm mt-1">
              Data demografi otomatis Villa Padurenan Indah 2 • Periode 2025–2030
            </p>
          </div>
          {canPrint && (
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Download PDF / Cetak Laporan
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            Menghitung statistik kependudukan...
          </div>
        ) : (
          <>
            {/* Ringkasan 3 Kartu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border p-5 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Penduduk Terdata</p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {totalWarga} <span className="text-xs font-normal text-slate-500">Jiwa</span>
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-5 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Warga Laki-laki</p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {totalLaki}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      ({totalWarga ? Math.round((totalLaki / totalWarga) * 100) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-5 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Warga Perempuan</p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {totalPerempuan}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      ({totalWarga ? Math.round((totalPerempuan / totalWarga) * 100) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tabel Rekapitulasi Kategori Usia */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-800 text-base">
                    Rekapitulasi per Kategori Usia
                  </h2>
                  {canViewDetail && (
                    <p className="no-print text-xs text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                      <MousePointerClick className="w-3.5 h-3.5" /> Klik salah satu baris kategori
                      di bawah untuk melihat rincian nama, usia, dan alamat warga
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100/80 text-slate-600 text-xs uppercase font-bold border-b">
                    <tr>
                      <th className="px-4 py-3 text-center w-12">No</th>
                      <th className="px-4 py-3">Kategori Usia</th>
                      <th className="px-4 py-3">Rentang Umur</th>
                      <th className="px-4 py-3 text-center">Laki-laki</th>
                      <th className="px-4 py-3 text-center">Perempuan</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 w-44 no-print">Proporsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.map((row, idx) => {
                      const val = Number(row.total || 0);
                      const pct = totalWarga ? ((val / totalWarga) * 100).toFixed(1) : "0.0";
                      const barWidth = Math.round((val / maxVal) * 100);
                      const isSelected = canViewDetail && selectedKat === row.kategori;
                      return (
                        <tr
                          key={row.kategori}
                          onClick={() => handleSelectKategori(row.kategori)}
                          title={
                            canViewDetail
                              ? `Klik untuk melihat daftar warga kategori ${row.kategori}`
                              : undefined
                          }
                          className={`transition ${
                            canViewDetail ? "cursor-pointer hover:bg-emerald-50/80" : ""
                          } ${isSelected ? "bg-emerald-50 font-semibold" : ""}`}
                        >
                          <td className="px-4 py-3.5 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">
                            <span
                              className={
                                canViewDetail
                                  ? "underline decoration-emerald-400 underline-offset-4"
                                  : ""
                              }
                            >
                              {row.kategori}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{row.rentang_usia}</td>
                          <td className="px-4 py-3.5 text-center text-sky-700 font-semibold">
                            {row.laki_laki}
                          </td>
                          <td className="px-4 py-3.5 text-center text-pink-700 font-semibold">
                            {row.perempuan}
                          </td>
                          <td className="px-4 py-3.5 text-center font-extrabold text-slate-900">
                            {val}{" "}
                            <span className="text-[11px] font-normal text-slate-500">({pct}%)</span>
                          </td>
                          <td className="px-4 py-3.5 no-print">
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${COLORS[idx % COLORS.length]}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100/90 font-extrabold text-slate-900 border-t-2">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-right uppercase text-xs tracking-wider"
                      >
                        Jumlah Keseluruhan
                      </td>
                      <td className="px-4 py-3 text-center text-sky-800">{totalLaki}</td>
                      <td className="px-4 py-3 text-center text-pink-800">{totalPerempuan}</td>
                      <td className="px-4 py-3 text-center">{totalWarga} Jiwa</td>
                      <td className="no-print" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Rincian Data Lengkap Nama, Usia & Alamat — UNTUK SELURUH PENGURUS */}
            {canViewDetail && (
              <div
                ref={detailRef}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden scroll-mt-24"
              >
                <div className="px-5 py-4 border-b bg-emerald-50/60 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">
                      Rincian Data Warga — Kategori:{" "}
                      <span className="text-emerald-800">{selectedKat}</span>
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Menampilkan {filteredWarga.length} warga terdata
                    </p>
                  </div>
                  <div className="no-print flex flex-wrap items-center gap-1.5">
                    {["Semua", ...MASTER_KAT.map((m) => m.kategori)].map((kat) => (
                      <button
                        key={kat}
                        type="button"
                        onClick={() => setSelectedKat(kat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          selectedKat === kat
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "bg-white border text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {kat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">No</th>
                        <th className="px-4 py-3">Nama Lengkap</th>
                        <th className="px-4 py-3 text-center w-24">Usia</th>
                        <th className="px-4 py-3 text-center w-28">Jenis Kelamin</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">Alamat / Blok Rumah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredWarga.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            Tidak ada data warga pada kategori ini.
                          </td>
                        </tr>
                      ) : (
                        filteredWarga.map((w, idx) => {
                          const umur = w.tanggal_lahir ? hitungUmur(w.tanggal_lahir) : 0;
                          return (
                            <tr key={w.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 text-center text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-900">
                                {w.nama_lengkap}
                              </td>
                              <td className="px-4 py-2.5 text-center font-bold text-emerald-800">
                                {umur} Thn
                              </td>
                              <td className="px-4 py-2.5 text-center text-slate-600">
                                {w.jenis_kelamin}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">
                                {getKategori(umur)}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600">{w.alamat || "-"}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
