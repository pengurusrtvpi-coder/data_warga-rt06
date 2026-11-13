import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle, IdCard, Loader2, Lock, Mail } from "lucide-react";

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

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<LoginTab>("warga");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      <header className="px-5 pt-6 sm:px-8">
        <BrandMark />
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Selamat datang</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {tab === "warga"
                ? "Masuk dengan NIK dan password yang diberikan pengurus RT."
                 : "Masuk dengan akun email admin atau bendahara RT."}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-lift">
            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList className="grid h-11 w-full grid-cols-2">
                <TabsTrigger value="warga" className="h-9">Login Warga</TabsTrigger>
                <TabsTrigger value="admin" className="h-9">Login Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="warga" className="mt-5">
                <form onSubmit={onSubmit} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK</Label>
                    <div className="relative">
                      <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="nik"
                        type="text"
                        inputMode="numeric"
                        autoComplete="username"
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
            Lupa password? Hubungi pengurus RT 06.
          </p>
        </div>
      </section>
    </main>
  );
}
