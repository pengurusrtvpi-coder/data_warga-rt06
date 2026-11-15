import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  IdCard,
  Loader2,
  Lock,
  Mail,
  Megaphone,
  Volume2,
  VolumeX,
  Edit3,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandMark } from "@/components/warga/BrandMark";
import { getMyAccessRole, getRoleHome, signInAdmin, signInWithNik } from "@/lib/warga";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — Portal Warga RT 06 VPI-2" },
      { name: "description", content: "Masuk ke Portal Warga RT 06 VPI-2 menggunakan NIK dan password Anda." },
      { property: "og:title", content: "Masuk — Portal Warga RT 06 VPI-2" },
      { property: "og:description", content: "Masuk dengan NIK untuk melihat data keluarga Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

type LoginTab = "warga" | "admin";

interface RunningTextRow {
  id: string;
  pesan: string;
  aktif: boolean;
  updated_at: string;
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [659.25, 880, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.14 + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.14);
      osc.stop(ctx.currentTime + idx * 0.14 + 0.6);
    });
  } catch {
    // Abaikan jika browser memblokir autoplay audio sebelum interaksi
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<LoginTab>("warga");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [announcements, setAnnouncements] = useState<RunningTextRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [newPesan, setNewPesan] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editPesan, setEditPesan] = useState("");
  const [savingText, setSavingText] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const hasPlayedRef = useRef(false);

  async function loadAnnouncements() {
    const { data } = await (supabase as any)
      .from("running_text")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) {
      setAnnouncements(data);
      const activeItems = data.filter((r: RunningTextRow) => r.aktif);
      if (activeItems.length > 0 && !hasPlayedRef.current) {
        hasPlayedRef.current = true;
        playNotificationChime();
        setSoundPlayed(true);
      }
    }
  }

  useEffect(() => {
    loadAnnouncements();

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          const role = await getMyAccessRole();
          setIsAdmin(role === "admin");
        }
      } catch {
        setIsAdmin(false);
      }
    })();

    const channel = supabase
      .channel("realtime-running-text")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "running_text" },
        () => {
          hasPlayedRef.current = false;
          loadAnnouncements();
        }
      )
      .subscribe();

    const unlockAudio = () => {
      if (!hasPlayedRef.current) {
        hasPlayedRef.current = true;
        playNotificationChime();
        setSoundPlayed(true);
      }
      window.removeEventListener("pointerdown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("pointerdown", unlockAudio);
    };
  }, []);

  const activeList = announcements.filter((r) => r.aktif);
  const combinedBannerText =
    activeList.length > 0
      ? activeList.map((r) => `📢 ${r.pesan}`).join("     ✦     ")
      : "Selamat datang di Portal Digital Warga RT 06 / RW 07 VPI-2";

  async function handleAddAnnouncement(e: FormEvent) {
    e.preventDefault();
    if (!newPesan.trim()) return;
    setSavingText(true);
    try {
      const { error: insErr } = await (supabase as any)
        .from("running_text")
        .insert([{ pesan: newPesan.trim(), aktif: true }]);
      if (insErr) throw new Error(insErr.message);
      setNewPesan("");
      await loadAnnouncements();
      playNotificationChime();
    } catch (err: any) {
      alert(err?.message || "Gagal menambah pengumuman.");
    } finally {
      setSavingText(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editPesan.trim()) return;
    setSavingText(true);
    try {
      const { error: updErr } = await (supabase as any)
        .from("running_text")
        .update({ pesan: editPesan.trim(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updErr) throw new Error(updErr.message);
      setEditId(null);
      await loadAnnouncements();
      playNotificationChime();
    } catch (err: any) {
      alert(err?.message || "Gagal memperbarui pengumuman.");
    } finally {
      setSavingText(false);
    }
  }

  async function handleToggleAktif(item: RunningTextRow) {
    await (supabase as any)
      .from("running_text")
      .update({ aktif: !item.aktif, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    await loadAnnouncements();
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm("Hapus pengumuman running text ini?")) return;
    await (supabase as any).from("running_text").delete().eq("id", id);
    await loadAnnouncements();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const credential = String(data.get(tab === "warga" ? "nik" : "email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!credential || !password) {
      setError(tab === "warga" ? "NIK dan password wajib diisi." : "Email dan password wajib diisi.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (tab === "warga") {
        const { data: statusCek, error: rpcErr } = await (supabase as any).rpc(
          "cek_status_login_warga",
          { nik_input: credential }
        );

        if (rpcErr) {
          throw new Error("Gagal memverifikasi status warga. Silakan coba lagi.");
        }

        if (statusCek === "NONAKTIF") {
          throw new Error(
            "Akses login ditolak. Status kependudukan Anda tercatat Pindah/tidak aktif di RT 06. Silakan hubungi pengurus RT 06."
          );
        }

        if (statusCek === "TIDAK_DITEMUKAN") {
          throw new Error("NIK tidak terdaftar di database warga RT 06. Silakan hubungi pengurus RT 06.");
        }

        await signInWithNik(credential, password);
      } else {
        await signInAdmin(credential, password);
      }
      const role = await getMyAccessRole();
      await navigate({ to: getRoleHome(role), replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function changeTab(value: string) {
    setTab(value as LoginTab);
    setError(null);
  }

  const errorAlert = error && (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm font-medium text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  );

  const submitButton = (
    <Button type="submit" size="lg" className="h-11 w-full text-base font-semibold" disabled={loading}>
      {loading && <Loader2 className="animate-spin" />}
      Masuk
    </Button>
  );

  return (
    <main className="flex min-h-screen flex-col bg-sky-gradient">
      <style>{`
        @keyframes rt06Marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .rt06-marquee-track {
          display: inline-block;
          white-space: nowrap;
          padding-left: 100%;
          animation: rt06Marquee 16s linear infinite;
          will-change: transform;
        }
        .rt06-marquee-wrapper:hover .rt06-marquee-track,
        .rt06-marquee-wrapper:active .rt06-marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      <header className="flex items-center justify-between px-4 pt-5 sm:px-8 sm:pt-6">
        <BrandMark />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playNotificationChime();
              setSoundPlayed(true);
            }}
            title="Putar suara notifikasi pengumuman"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-slate-900/85 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-sm hover:bg-slate-900"
          >
            {soundPlayed ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Suara Info</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowManager((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow hover:bg-amber-300"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {showManager ? "Tutup Pengumuman" : "Kelola Running Text"}
            </button>
          )}
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-5 sm:py-8">
        <div className="mb-5 w-full max-w-2xl">
          <div className="rt06-marquee-wrapper relative overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-3.5 py-3 shadow-lg sm:px-5 sm:py-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-300 sm:text-[11px]">
                <Megaphone className="h-3 w-3 shrink-0 text-amber-300 sm:h-3.5 sm:w-3.5" />
                <span>Pengumuman RT 06</span>
              </span>
              <span className="shrink-0 text-[10px] text-amber-200/75">Sentuh untuk jeda</span>
            </div>

            <div className="w-full overflow-hidden py-0.5">
              <div
                className="rt06-marquee-track text-lg font-extrabold leading-snug tracking-tight drop-shadow-[0_2px_6px_rgba(250,204,21,0.35)] sm:text-2xl md:text-3xl"
                style={{ color: "#FACC15" }}
              >
                {combinedBannerText}
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground sm:text-sm">
            {tab === "warga"
              ? "Masuk dengan NIK dan password yang diberikan pengurus RT."
              : "Masuk dengan akun email admin atau bendahara RT."}
          </p>
        </div>

        {isAdmin && showManager && (
          <div className="mb-6 w-full max-w-2xl rounded-2xl border-2 border-amber-400 bg-card p-5 shadow-lg">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-foreground">
              <Megaphone className="h-4 w-4 text-amber-500" /> Kelola Pengumuman Running Text (Khusus Admin)
            </h2>

            <form onSubmit={handleAddAnnouncement} className="mb-4 flex gap-2">
              <Input
                placeholder="Tulis pengumuman baru untuk warga RT 06..."
                value={newPesan}
                onChange={(e) => setNewPesan(e.target.value)}
                required
              />
              <Button type="submit" disabled={savingText} className="shrink-0 bg-amber-500 font-bold text-slate-950 hover:bg-amber-400">
                <Plus className="mr-1 h-4 w-4" /> Tambah
              </Button>
            </form>

            <div className="space-y-2.5">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3 text-xs"
                >
                  {editId === item.id ? (
                    <div className="flex w-full items-center gap-2">
                      <Input
                        value={editPesan}
                        onChange={(e) => setEditPesan(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" onClick={() => handleSaveEdit(item.id)} disabled={savingText}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 pr-2">
                        <p className={`font-semibold ${item.aktif ? "text-foreground" : "text-muted-foreground line-through"}`}>
                          {item.pesan}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant={item.aktif ? "default" : "outline"}
                          className="h-7 px-2.5 text-[11px]"
                          onClick={() => handleToggleAktif(item)}
                        >
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-blue-600"
                          onClick={() => {
                            setEditId(item.id);
                            setEditPesan(item.pesan);
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600"
                          onClick={() => handleDeleteAnnouncement(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full max-w-sm">
          <div className="rounded-2xl border bg-card p-6 shadow-lift">
            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList className="grid h-11 w-full grid-cols-2">
                <TabsTrigger value="warga" className="h-9">Login Warga</TabsTrigger>
                <TabsTrigger value="admin" className="h-9">Login Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="warga" className="mt-5">
                <form onSubmit={onSubmit} className="space-y-5" autoComplete="off" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK</Label>
                    <div className="relative">
                      <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="nik"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        placeholder="16 digit NIK"
                        name="nik"
                        className="h-11 pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-warga">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password-warga"
                        type="password"
                        autoComplete="new-password"
                        data-lpignore="true"
                        placeholder="••••••••"
                        name="password"
                        className="h-11 pl-10"
                        required
                      />
                    </div>
                  </div>

                  {errorAlert}
                  {submitButton}
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-5">
                <form onSubmit={onSubmit} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        placeholder="nama@email.com"
                        name="email"
                        className="h-11 pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-admin">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password-admin"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        name="password"
                        className="h-11 pl-10"
                        required
                      />
                    </div>
                  </div>

                  {errorAlert}
                  {submitButton}
                </form>
              </TabsContent>
            </Tabs>
          </div>
         <p className="mt-6 text-center text-xs text-muted-foreground">
            Lupa password? Hubungi pengurus RT 06 ·{" "}
            <a href="/panduan" className="font-bold text-primary-deep underline">
              Lihat Pamflet Panduan & Keamanan Data
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
