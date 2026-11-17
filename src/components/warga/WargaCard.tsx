import { useState } from "react";
import { Camera, Image as ImageIcon, KeyRound, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatTanggal, type Warga } from "@/lib/warga";
function Row({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

/** Kompresi foto profil ringan (maks 480px) agar cepat diunggah dari HP */
async function compressAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 480;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Gagal memproses gambar."));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Gagal mengonversi gambar."));
          resolve(blob);
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File gambar tidak valid."));
    };
    img.src = url;
  });
}

export function WargaCard({
  warga,
  isAdmin = false,
  onEdit,
  onDelete,
  onPhotoUpdated,
}: {
  warga: Warga;
  isAdmin?: boolean;
  onEdit: (w: Warga) => void;
  onDelete?: (w: Warga) => void;
  onPhotoUpdated?: () => void;
}) {
  const rawAvatar = (warga as Warga & { foto_profil_url?: string | null }).foto_profil_url;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    rawAvatar && /^https?:\/\//i.test(rawAvatar) ? rawAvatar : null,
  );
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = (warga.nama_lengkap || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const ttl = [warga.tempat_lahir, warga.tanggal_lahir ? formatTanggal(warga.tanggal_lahir) : null]
    .filter(Boolean)
    .join(", ");
  const rtRw = warga.rt || warga.rw ? `RT ${warga.rt ?? "—"} / RW ${warga.rw ?? "—"}` : null;
  const safeFotoUrl =
    warga.foto_ktp_url && /^https?:\/\//i.test(warga.foto_ktp_url) ? warga.foto_ktp_url : null;

  async function handleUploadAvatar(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressAvatar(file);
      const path = `profil/${warga.id}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("dokumen-rt06")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("dokumen-rt06").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: rpcErr } = await (supabase as any).rpc("update_foto_profil_warga", {
        p_warga_id: warga.id,
        p_foto_url: publicUrl,
      });
      if (rpcErr) throw new Error(rpcErr.message);

      setAvatarUrl(publicUrl);
      setPhotoModalOpen(false);
      toast.success(`Foto profil ${warga.nama_lengkap} berhasil diperbarui.`);
      onPhotoUpdated?.();
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunggah foto profil.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true);
    try {
      const { error: rpcErr } = await (supabase as any).rpc("update_foto_profil_warga", {
        p_warga_id: warga.id,
        p_foto_url: null,
      });
      if (rpcErr) throw new Error(rpcErr.message);

      setAvatarUrl(null);
      setPhotoModalOpen(false);
      toast.success("Foto profil dihapus dan dikembalikan ke inisial nama.");
      onPhotoUpdated?.();
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus foto profil.");
    } finally {
      setUploading(false);
    }
  }
const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  async function handleCreateOrResetAccount(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.trim().length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    setSavingAccount(true);
    try {
      const { data, error } = await (supabase as any).rpc(
        "admin_create_or_reset_warga_account",
        {
          p_nik: warga.nik,
          p_password: newPassword.trim(),
        },
      );
      if (error) throw new Error(error.message);
      toast.success(data || "Akun login warga berhasil disimpan.");
      setNewPassword("");
      setAccountModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Gagal membuat atau memperbarui akun login.");
    } finally {
      setSavingAccount(false);
    }
  }
  return (
    <article className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift">
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setPhotoModalOpen(true)}
          title="Klik untuk ambil foto selfie atau unggah foto profil"
          className="group relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary-soft text-base font-bold text-primary-deep shadow-xs transition hover:border-primary"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={warga.nama_lengkap}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
          <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white shadow group-hover:bg-sky-700">
            <Camera className="h-3 w-3" />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-foreground">{warga.nama_lengkap}</h3>
          <p className="font-mono text-xs text-muted-foreground">NIK {warga.nik}</p>
          {isAdmin && <p className="mt-0.5 font-mono text-xs text-muted-foreground">KK {warga.no_kk}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {warga.status_hub_keluarga && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                {warga.status_hub_keluarga}
              </span>
            )}
            {warga.status_warga && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                {warga.status_warga}
              </span>
            )}
          </div>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
        <div className="col-span-2">
          <Row label="Tempat, Tgl Lahir" value={ttl} />
        </div>
        <Row label="Jenis Kelamin" value={warga.jenis_kelamin} />
        <Row label="Gol. Darah" value={warga.golongan_darah} />
        <Row label="Agama" value={warga.agama} />
        <Row label="Status Kawin" value={warga.status_perkawinan} />
        <Row label="Pendidikan" value={warga.pendidikan_terakhir} />
        <Row label="Pekerjaan" value={warga.pekerjaan} />
        <Row label="Kewarganegaraan" value={warga.kewarganegaraan} />
        <Row label="No. HP" value={warga.no_hp} />
        <div className="col-span-2">
          <Row label="Email" value={warga.email} />
        </div>
        <div className="col-span-2">
          <Row label="Alamat" value={[warga.alamat, rtRw].filter(Boolean).join(" · ")} />
        </div>
        {isAdmin && (
          <div className="col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Foto KTP
            </dt>
            <dd className="mt-0.5 break-all text-sm">
              {safeFotoUrl ? (
                <a
                  href={safeFotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Buka foto KTP
                </a>
              ) : (
                warga.foto_ktp_url || "—"
              )}
            </dd>
          </div>
        )}
        {warga.catatan && (
          <div className="col-span-2">
            <Row label="Catatan" value={warga.catatan} />
          </div>
        )}
        {isAdmin && (
          <>
            <div className="col-span-2">
              <Row label="ID Data" value={warga.id} />
            </div>
            <Row label="Dibuat" value={formatTanggal(warga.created_at)} />
            <Row label="Diperbarui" value={formatTanggal(warga.updated_at)} />
          </>
        )}
      </dl>

      <div className="mt-auto space-y-2 border-t pt-4">
        <div className={isAdmin ? "grid grid-cols-2 gap-2" : ""}>
          <Button variant="outline" className="w-full" onClick={() => onEdit(warga)}>
            <Pencil />
            Edit
          </Button>
          {isAdmin && onDelete && (
            <Button variant="destructive" className="w-full" onClick={() => onDelete(warga)}>
              <Trash2 />
              Hapus
            </Button>
          )}
        </div>

        {isAdmin && (
          <Button
            type="button"
            variant="secondary"
            className="w-full font-semibold text-sky-900 bg-sky-100 hover:bg-sky-200"
            onClick={() => {
              setNewPassword("");
              setAccountModalOpen(true);
            }}
          >
            <KeyRound />
            Buat / Reset Akun Login
          </Button>
        )}
      </div>

      {/* Dialog Buat / Reset Akun Login Warga (Khusus Admin & Ketua RT) */}
      {isAdmin && (
        <Dialog open={accountModalOpen} onOpenChange={(v) => !savingAccount && setAccountModalOpen(v)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Akun Login — {warga.nama_lengkap}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateOrResetAccount} className="space-y-4 py-1">
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1 border">
                <p>
                  <span className="font-semibold text-slate-800">NIK Login:</span>{" "}
                  <span className="font-mono font-bold text-sky-800">{warga.nik}</span>
                </p>
                <p>
                  Jika warga belum memiliki akun, sistem akan otomatis membuatkannya. Jika sudah ada, password akan diperbarui.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`pw-${warga.id}`}>Password Login Baru (Minimal 6 Karakter) *</Label>
                <Input
                  id={`pw-${warga.id}`}
                  type="text"
                  required
                  minLength={6}
                  placeholder="Contoh: tanggal lahir (15081985)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingAccount}
                  onClick={() => setAccountModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={savingAccount || newPassword.trim().length < 6}>
                  {savingAccount ? "Menyimpan…" : "Simpan Akun Login"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Ambil Foto Selfie / Unggah Foto Profil */}
      <Dialog open={photoModalOpen} onOpenChange={(v) => !uploading && setPhotoModalOpen(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Foto Profil — {warga.nama_lengkap}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-sky-100 bg-primary-soft text-2xl font-extrabold text-primary-deep shadow-sm">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={warga.nama_lengkap}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Ambil foto selfie langsung lewat kamera HP atau pilih foto dari galeri untuk mengganti inisial nama.
            </p>

            {uploading ? (
              <div className="flex items-center gap-2 py-3 text-sm font-semibold text-sky-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                Mengunggah foto profil…
              </div>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-sky-700">
                  <Camera className="h-4 w-4" /> Ambil Foto Selfie (Kamera)
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleUploadAvatar(e.target.files?.item(0) ?? undefined)}
                  />
                </label>

                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100">
                  <ImageIcon className="h-4 w-4" /> Pilih Foto dari Galeri
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadAvatar(e.target.files?.item(0) ?? undefined)}
                  />
                </label>

                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="mt-1 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus Foto (Kembali ke Inisial)
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
