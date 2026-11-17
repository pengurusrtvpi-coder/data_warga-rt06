import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  Smartphone,
  LogIn,
  Lock,
  EyeOff,
  UserCheck,
  Database,
  Users,
  Wallet,
  FileText,
  Award,
  BarChart3,
  MessageSquarePlus,
  Printer,
  ExternalLink,
} from "lucide-react";
import { BrandMark } from "@/components/warga/BrandMark";

export const Route = createFileRoute("/panduan")({
  head: () => ({
    meta: [{ title: "Pamflet Panduan & Keamanan Data — Portal Warga RT 06 VPI-2" }],
  }),
  component: PanduanPamfletPage,
});

function PanduanPamfletPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      {/* Tombol Cetak / Simpan PDF (Sembunyi saat dicetak) */}
      <div className="no-print mx-auto mb-4 flex max-w-xl items-center justify-between gap-2">
        <a
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Ke Halaman Login
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800"
        >
          <Printer className="h-3.5 w-3.5" /> Simpan Pamflet (PDF)
        </button>
      </div>

      {/* Kanvas Pamflet Infografis */}
      <article className="mx-auto max-w-xl overflow-hidden rounded-3xl border-2 border-emerald-700/20 bg-white shadow-xl">
        {/* Header Pamflet */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 px-6 py-7 text-center text-white">
          <div className="mx-auto mb-3 inline-flex rounded-2xl bg-white/95 px-3 py-1.5 shadow">
            <BrandMark compact />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
            “Berubah · Peduli · Berbagi”
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            PANDUAN PORTAL DIGITAL WARGA
          </h1>
          <p className="mt-1 text-xs text-emerald-100">
            RT 06 / RW 07 Villa Padurenan Indah 2 · Kel. Padurenan, Mustikajaya
          </p>

          <div className="mt-4 inline-block rounded-full border border-amber-300/60 bg-slate-950/60 px-4 py-1.5 text-xs font-extrabold tracking-wide text-amber-300 shadow">
            🔗 https://vercel.app
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {/* Bagian 1: Cara Login */}
          <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-sky-950">
              <LogIn className="h-4 w-4 text-sky-600" /> 1. CARA MASUK (LOGIN WARGA)
            </h2>
            <ol className="mt-2.5 space-y-1.5 text-xs font-medium text-slate-700">
              <li>
                <strong>1. Buka Link Portal:</strong> Ketuk tautan resmi di atas lewat browser HP.
              </li>
              <li>
                <strong>2. Pilih Tab “Login Warga”:</strong> Masukkan <strong>16 Digit NIK</strong>{" "}
                dan <strong>Password</strong> dari pengurus RT.
              </li>
              <li>
                <strong>3. Tekan Masuk:</strong> Data keluarga dan layanan RT otomatis terbuka.
              </li>
            </ol>
          </section>

          {/* Bagian 2: Cara Pasang di Layar Utama HP */}
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-amber-950">
              <Smartphone className="h-4 w-4 text-amber-600" /> 2. PASANG IKON DI LAYAR UTAMA HP
            </h2>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-200/80 bg-white p-3 text-xs">
                <p className="font-extrabold text-emerald-800">📱 Android (Google Chrome)</p>
                <p className="mt-1 leading-relaxed text-slate-600">
                  Ketuk ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas ➔ pilih{" "}
                  <strong>Tambahkan ke layar utama</strong> ➔ tekan <strong>Instal</strong>.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200/80 bg-white p-3 text-xs">
                <p className="font-extrabold text-sky-800">🍎 iPhone (Safari)</p>
                <p className="mt-1 leading-relaxed text-slate-600">
                  Ketuk ikon <strong>Bagikan (⬆️)</strong> di bagian bawah layar ➔ pilih{" "}
                  <strong>Tambah ke Layar Utama</strong> ➔ tekan <strong>Tambah</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Bagian 3: 6 Layanan Warga */}
          <section>
            <h2 className="mb-2.5 text-sm font-extrabold text-slate-800">
              3. LAYANAN DIGITAL YANG TERSEDIA
            </h2>
            <div className="grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-3">
              {[
                { Icon: Users, title: "Data Keluarga", desc: "Cek & perbarui data anggota KK" },
                { Icon: Wallet, title: "Keuangan RT", desc: "Transparansi kas & laporan bulanan" },
                {
                  Icon: FileText,
                  title: "Pelayanan Surat",
                  desc: "Buat surat pengantar & cetak PDF",
                },
                { Icon: Award, title: "Struktur Pengurus", desc: "Susunan pengurus, visi & misi" },
                { Icon: BarChart3, title: "Statistik Usia", desc: "Grafik demografi warga RT 06" },
                {
                  Icon: MessageSquarePlus,
                  title: "Aspirasi Warga",
                  desc: "Kirim saran/laporan + foto kamera",
                },
              ].map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5"
                >
                  <Icon className="h-4 w-4 text-teal-700" />
                  <p className="mt-1.5 font-bold text-slate-800">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bagian 4: Jaminan Keamanan Data (Standar Keamanan Supabase) */}
          <section className="rounded-2xl border-2 border-emerald-700/30 bg-gradient-to-br from-slate-900 to-emerald-950 p-4 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <h2 className="text-sm font-extrabold text-amber-300">
                  4. JAMINAN KEAMANAN DATA (STANDAR SUPABASE)
                </h2>
                <p className="text-[11px] text-emerald-200">
                  Sistem dibangun dengan perlindungan database berlapis untuk menjaga privasi warga:
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 text-xs sm:grid-cols-2">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="flex items-center gap-1.5 font-bold text-amber-200">
                  <Database className="h-3.5 w-3.5" /> Privasi KK Terisolasi (RLS)
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
                  Dilindungi <em>Row Level Security</em>; setiap akun NIK hanya bisa melihat dan
                  mengubah data anggota KK miliknya sendiri.
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-3">
                <p className="flex items-center gap-1.5 font-bold text-amber-200">
                  <Lock className="h-3.5 w-3.5" /> Enkripsi & Autentikasi Aman
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
                  Koneksi terenkripsi HTTPS/TLS serta kata sandi tersimpan teracak (<em>hashed</em>)
                  melalui sistem Supabase Auth.
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-3">
                <p className="flex items-center gap-1.5 font-bold text-amber-200">
                  <EyeOff className="h-3.5 w-3.5" /> Anti-Simpan Jejak NIK
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
                  Formulir masuk dan surat tidak merekam jejak nomor NIK di memori browser sehingga
                  aman di perangkat bersama.
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-3">
                <p className="flex items-center gap-1.5 font-bold text-amber-200">
                  <UserCheck className="h-3.5 w-3.5" /> Identitas Terverifikasi
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
                  Nama pengirim aspirasi terkunci otomatis sesuai NIK yang login, dan hak kelola
                  kas/administrasi dibatasi ketat per peran.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Pamflet */}
        <footer className="border-t bg-slate-50 px-6 py-3.5 text-center text-[11px] font-medium text-slate-600">
          Sekretariat Pengurus RT 06 / RW 07 Villa Padurenan Indah 2 · Periode 2025–2030
        </footer>
      </article>
    </main>
  );
}
