import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalNav } from "@/components/warga/PortalNav";
import { getMyAccessRole, hasActiveSession } from "@/lib/warga";
import {
  Users,
  Shield,
  Award,
  Edit2,
  Plus,
  Trash2,
  Save,
  X,
  Sparkles,
  Target,
  CheckCircle2,
  Crown,
} from "lucide-react";

export const Route = createFileRoute("/pengurus")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: "/login", replace: true });
    return { accessRole: await getMyAccessRole() };
  },
  component: StrukturPengurusPage,
});

const MISI_LIST = [
  {
    title: "Kerukunan & Sosial",
    desc: "Meningkatkan kerukunan, kebersamaan, dan rasa gotong royong antarwarga melalui kegiatan sosial yang aktif.",
  },
  {
    title: "Keamanan & Ketertiban",
    desc: "Bersama-sama menjaga keamanan dan ketertiban lingkungan (siskamling) guna mengantisipasi gangguan.",
  },
  {
    title: "Kebersihan & Kesehatan",
    desc: "Mengajak warga aktif menjaga kebersihan lingkungan, pengelolaan sampah, serta mendukung program kesehatan.",
  },
  {
    title: "Administrasi & Pelayanan",
    desc: "Memberikan pelayanan administrasi kependudukan yang cepat, jujur, ramah, dan transparan.",
  },
  {
    title: "Keterbukaan Keuangan",
    desc: "Melaporkan kondisi dan pengelolaan keuangan RT (iuran warga, kas, pengeluaran) secara berkala dan terbuka.",
  },
  {
    title: "Pemberdayaan & Generasi",
    desc: "Memfasilitasi kegiatan pemuda, olahraga, keagamaan, serta pemberdayaan keluarga.",
  },
];

function StrukturPengurusPage() {
  const { accessRole } = Route.useRouteContext();
  const isAdmin = accessRole === "admin";
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ jabatan: "", nama: "", kategori: "Inti", urutan: 1 });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("pengurus_rt")
      .select("*")
      .order("urutan", { ascending: true });
    if (data) setList(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveEdit = async (id: string) => {
    await (supabase as any)
      .from("pengurus_rt")
      .update({ ...form, urutan: Number(form.urutan) })
      .eq("id", id);
    setEditId(null);
    load();
  };

  const addNew = async () => {
    if (!form.jabatan || !form.nama) return;
    await (supabase as any).from("pengurus_rt").insert([{ ...form, urutan: Number(form.urutan) }]);
    setAdding(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus data pengurus ini?")) return;
    await (supabase as any).from("pengurus_rt").delete().eq("id", id);
    load();
  };

  const ketua = list.find((i) => i.jabatan.toLowerCase().includes("ketua rt"));
  const intiLain = list.filter((i) => i.kategori === "Inti" && i.id !== ketua?.id);
  const seksiList = list.filter((i) => i.kategori === "Seksi");
  const ketuaPKK = list.find((i) => i.jabatan.toLowerCase().includes("ketua kesra"));
  const subPKK = list.filter((i) => i.kategori === "Kesra & PKK" && i.id !== ketuaPKK?.id);

  const renderNode = (item: any, styleType: "gold" | "emerald" | "blue" | "rose") => {
    if (!item) return null;
    const styles = {
      gold: "border-amber-400 bg-gradient-to-b from-amber-50 to-white ring-2 ring-amber-200/60",
      emerald: "border-emerald-300 bg-white",
      blue: "border-sky-200 bg-white",
      rose: "border-rose-200 bg-white",
    };
    const badges = {
      gold: "bg-amber-500 text-white",
      emerald: "bg-emerald-100 text-emerald-800",
      blue: "bg-sky-100 text-sky-800",
      rose: "bg-rose-100 text-rose-800",
    };

    return (
      <div
        key={item.id}
        className={`rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-between ${styles[styleType]}`}
      >
        {editId === item.id ? (
          <div className="space-y-2 text-left">
            <input
              value={form.jabatan}
              onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
            />
            <input
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
            />
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                onClick={() => setEditId(null)}
                className="px-2.5 py-1 text-xs bg-slate-100 rounded-md"
              >
                <X className="w-3 h-3 inline" /> Batal
              </button>
              <button
                onClick={() => saveEdit(item.id)}
                className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-md"
              >
                <Save className="w-3 h-3 inline" /> Simpan
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide mb-2 ${badges[styleType]}`}
              >
                {item.jabatan}
              </span>
              <h3 className="text-base font-extrabold text-slate-800 leading-snug">{item.nama}</h3>
            </div>
            {isAdmin && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setEditId(item.id);
                    setForm({
                      jabatan: item.jabatan,
                      nama: item.nama,
                      kategori: item.kategori,
                      urutan: item.urutan,
                    });
                  }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <PortalNav role={accessRole} />

      {/* Hero Header & Moto */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-cyan-900 text-white py-12 px-4 shadow-md">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            <Shield className="w-3.5 h-3.5 text-amber-300" /> Periode Bakti 2025 – 2030
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Pengurus RT 06 Villa Padurenan Indah 2
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1 mb-6">
            Kelurahan Padurenan, Kecamatan Mustikajaya, Kota Bekasi
          </p>

          {/* Kartu Moto */}
          <div className="inline-block bg-white/10 border border-amber-300/40 backdrop-blur-md rounded-2xl px-8 py-4 shadow-lg">
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300 font-bold mb-1 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Moto Pengurus RT 06{" "}
              <Sparkles className="w-3.5 h-3.5" />
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-white tracking-wide">
              “Berubah – Peduli – Berbagi”
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-6 space-y-10">
        {/* Bagian Visi & Misi */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8">
          {/* Visi */}
          <div className="text-center max-w-3xl mx-auto pb-8 border-b border-slate-100">
            <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-2">
              <Target className="w-4 h-4" /> Visi RT 06
            </div>
            <blockquote className="text-base md:text-xl font-bold text-slate-800 italic leading-relaxed">
              “Mewujudkan lingkungan RT yang aman, nyaman, rukun, bersih, sehat, serta berlandaskan
              kekeluargaan dan transparansi dalam pelayanan kepada warga.”
            </blockquote>
          </div>

          {/* Misi */}
          <div className="pt-7">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" /> Misi Pengurus RT 06
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MISI_LIST.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-50/90 border border-slate-200/70 p-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-slate-800">{m.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-8">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bagian Bagan / Chart Struktur Organisasi */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" /> Bagan Struktur Organisasi
              </h2>
              <p className="text-xs text-slate-500">
                Susunan Kepengurusan RT 06 VPI-2 Periode 2025–2030
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setAdding(!adding);
                  setForm({ jabatan: "", nama: "", kategori: "Seksi", urutan: list.length + 1 });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Pengurus
              </button>
            )}
          </div>

          {isAdmin && adding && (
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                placeholder="Nama Jabatan"
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                className="px-3 py-2 text-sm border rounded-xl"
              />
              <input
                placeholder="Nama Lengkap"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="px-3 py-2 text-sm border rounded-xl"
              />
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className="px-3 py-2 text-sm border rounded-xl"
              >
                <option value="Inti">Inti</option>
                <option value="Seksi">Seksi</option>
                <option value="Kesra & PKK">Kesra & PKK</option>
              </select>
              <button
                onClick={addNew}
                className="bg-emerald-600 text-white text-sm font-semibold rounded-xl px-4 py-2"
              >
                Simpan Pengurus
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center py-12 text-slate-500 text-sm">Memuat bagan kepengurusan...</p>
          ) : (
            <div className="flex flex-col items-center">
              {/* Level 1: Ketua RT */}
              <div className="w-full max-w-sm">{renderNode(ketua, "gold")}</div>

              {/* Garis Penghubung Vertikal */}
              <div className="w-0.5 h-8 bg-slate-300" />
              <div className="w-full max-w-2xl h-0.5 bg-slate-300" />

              {/* Level 2: Sekretaris & Bendahara */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl pt-4">
                {intiLain.map((item) => renderNode(item, "emerald"))}
              </div>

              {/* Garis Penghubung ke Seksi Bidang */}
              <div className="w-0.5 h-8 bg-slate-300" />
              <div className="w-full max-w-4xl border-t-2 border-dashed border-slate-300 pt-6">
                <p className="text-center text-xs font-bold uppercase tracking-wider text-sky-700 mb-4 flex items-center justify-center gap-1.5">
                  <Shield className="w-4 h-4" /> Koordinator Seksi Bidang
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {seksiList.map((item) => renderNode(item, "blue"))}
                </div>
              </div>

              {/* Garis Penghubung ke Kesra & PKK */}
              <div className="w-0.5 h-8 bg-slate-300" />
              <div className="w-full bg-rose-50/50 border border-rose-200/80 rounded-3xl p-5 md:p-6">
                <p className="text-center text-xs font-bold uppercase tracking-wider text-rose-700 mb-4 flex items-center justify-center gap-1.5">
                  <Users className="w-4 h-4" /> Bidang Kesra & PKK
                </p>
                {/* Puncak Kesra & PKK */}
                <div className="max-w-sm mx-auto">{renderNode(ketuaPKK, "rose")}</div>
                {subPKK.length > 0 && (
                  <>
                    <div className="w-0.5 h-6 bg-rose-200 mx-auto" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {subPKK.map((item) => renderNode(item, "rose"))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
