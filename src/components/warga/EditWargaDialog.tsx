import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Camera, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ADMIN_WARGA_FIELDS,
  createEmptyAdminWargaForm,
  createWarga,
  updateWarga,
  validateAdminWargaForm,
  validateWargaForm,
  WARGA_FIELDS,
  type AdminEditableField,
  type AdminWargaForm,
  type Warga,
  type WargaFormErrors,
} from "@/lib/warga";

function toForm(w: Warga): AdminWargaForm {
  const out = createEmptyAdminWargaForm();
  for (const field of ADMIN_WARGA_FIELDS) {
    const value = w[field.key];
    out[field.key] =
      value == null ? "" : String(value).slice(0, field.type === "date" ? 10 : undefined);
  }
  return out;
}

/** Kompresi foto KTP (maks lebar 1280px) agar jelas dibaca namun ringan diunggah */
async function compressKtpImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1280;
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
      if (!ctx) return reject(new Error("Gagal memproses foto KTP."));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Gagal mengonversi foto KTP."));
          resolve(blob);
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File gambar KTP tidak valid."));
    };
    img.src = url;
  });
}

export function EditWargaDialog({
  warga,
  open: openProp,
  isAdmin = false,
  onClose,
  onSaved,
}: {
  warga: Warga | null;
  open?: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const open = openProp ?? Boolean(warga);
  const fields = isAdmin ? ADMIN_WARGA_FIELDS : WARGA_FIELDS;
  const [form, setForm] = useState<AdminWargaForm | null>(null);
  const [errors, setErrors] = useState<WargaFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) {
      setForm(null);
    } else if (warga) {
      setForm(toForm(warga));
    } else if (isAdmin) {
      setForm(createEmptyAdminWargaForm());
    }
    setErrors({});
  }, [warga, open, isAdmin]);

  const set = (key: AdminEditableField, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  async function handleUploadKtp(file?: File) {
    if (!file || !form) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran foto KTP maksimal 10 MB.");
      return;
    }
    setUploadingKtp(true);
    try {
      const compressed = await compressKtpImage(file);
      const nikPrefix = (form.nik || warga?.nik || "warga").trim();
      const path = `ktp/${nikPrefix}-${Date.now()}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("photo_warga")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("photo_warga").getPublicUrl(path);
      set("foto_ktp_url", pub.publicUrl);
      toast.success("Foto KTP berhasil diunggah. Klik Simpan untuk menyimpan perubahan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto KTP.");
    } finally {
      setUploadingKtp(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;

    const result = isAdmin ? validateAdminWargaForm(form) : validateWargaForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      const first = fields.find((field) => result.errors[field.key]);
      if (first) {
        const el = formRef.current?.querySelector<HTMLElement>(`#f-${first.key}`);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus({ preventScroll: true });
      }
      return;
    }

    setSaving(true);
    try {
      if ("values" in result) {
        if (warga) {
          await updateWarga(warga.id, { ...result.values, updated_at: new Date().toISOString() });
        } else {
          await createWarga(result.values);
        }
      } else {
        if (!warga) return;
        await updateWarga(warga.id, result.patch);
      }
      toast.success(warga ? "Data berhasil disimpan" : "Data warga berhasil ditambahkan");
      onClose();
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  }

  const errorCount = Object.keys(errors).length;
  const title = warga
    ? isAdmin
      ? "Edit Data Warga (Admin)"
      : "Edit Data Anggota"
    : "Tambah Data Warga";
  const description = isAdmin
    ? "Akses admin: seluruh kolom data warga dapat diisi dan diubah. ID serta waktu sistem dikelola otomatis."
    : warga
      ? `NIK ${warga.nik} · KK ${warga.no_kk}. NIK, No. KK, RT/RW, dan status warga hanya bisa diubah pengurus RT.`
      : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && !saving && !uploadingKtp && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {form && (
          <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
            {errorCount > 0 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-soft px-3 py-2.5 text-sm font-medium text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Data belum disimpan. Perbaiki {errorCount} isian yang ditandai merah di bawah.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const id = `f-${field.key}`;
                const err = errors[field.key];
                const errId = `${id}-error`;
                const invalidCls = err ? "border-destructive focus-visible:ring-destructive" : "";
                const aria = {
                  "aria-invalid": err ? true : undefined,
                  "aria-describedby": err ? errId : undefined,
                } as const;

                if (field.key === "foto_ktp_url") {
                  const currentKtpUrl =
                    form.foto_ktp_url &&
                    /^https?:\/\//i.test(form.foto_ktp_url) &&
                    !form.foto_ktp_url.includes("/photo_warga/http")
                      ? form.foto_ktp_url
                      : "";

                  return (
                    <div key={field.key} className="space-y-2 sm:col-span-2">
                      <Label>Foto KTP (Kamera / Galeri)</Label>
                      <div className="rounded-xl border bg-slate-50/70 p-3.5 space-y-3">
                        {uploadingKtp ? (
                          <div className="flex items-center gap-2 py-2 text-xs font-semibold text-sky-700">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengunggah foto KTP…
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-sky-700">
                              <Camera className="h-3.5 w-3.5" /> Ambil Foto KTP (Kamera)
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => handleUploadKtp(e.target.files?.item(0) ?? undefined)}
                              />
                            </label>

                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100">
                              <ImageIcon className="h-3.5 w-3.5" /> Pilih Foto KTP dari Galeri
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleUploadKtp(e.target.files?.item(0) ?? undefined)}
                              />
                            </label>

                            {currentKtpUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => set("foto_ktp_url", "")}
                                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus Foto KTP
                              </Button>
                            )}
                          </div>
                        )}

                        {currentKtpUrl ? (
                          <div className="space-y-1.5">
                            <img
                              src={currentKtpUrl}
                              alt="Pratinjau KTP"
                              className="max-h-44 rounded-lg border object-contain bg-white"
                            />
                            <p className="text-[11px] text-emerald-700 font-medium">
                              Foto KTP terpasang. Jangan lupa klik tombol Simpan di bawah.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Belum ada foto KTP terunggah.
                          </p>
                        )}
                      </div>
                      {err && (
                        <p id={errId} className="text-xs font-medium text-destructive">
                          {err}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={field.key} className={cn("space-y-1.5", field.wide && "sm:col-span-2")}>
                    <Label htmlFor={id} className={cn(err && "text-destructive")}>
                      {field.label}
                      {field.required && <span className="ml-0.5 text-destructive">*</span>}
                    </Label>
                    {field.type === "select" ? (
                      <Select value={form[field.key]} onValueChange={(value) => set(field.key, value)}>
                        <SelectTrigger id={id} className={cn("w-full", invalidCls)} {...aria}>
                          <SelectValue placeholder="Pilih…" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            ...new Set([
                              ...(field.options ?? []),
                              ...(form[field.key] ? [form[field.key]] : []),
                            ]),
                          ].map((option) => (
                            <SelectItem key={option} value={option}>
                              {option === "-" ? "- (belum diketahui)" : option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === "textarea" ? (
                      <Textarea
                        id={id}
                        rows={2}
                        value={form[field.key]}
                        maxLength={field.maxLength}
                        placeholder={field.placeholder}
                        onChange={(e) => set(field.key, e.target.value)}
                        className={invalidCls}
                        {...aria}
                      />
                    ) : (
                      <Input
                        id={id}
                        type={field.type ?? "text"}
                        inputMode={
                          field.numeric ? "numeric" : field.type === "tel" ? "tel" : undefined
                        }
                        value={form[field.key]}
                        maxLength={field.maxLength}
                        placeholder={field.placeholder}
                        max={
                          field.type === "date" ? new Date().toISOString().slice(0, 10) : undefined
                        }
                        onChange={(e) => set(field.key, e.target.value)}
                        className={invalidCls}
                        {...aria}
                      />
                    )}
                    {err && (
                      <p id={errId} className="text-xs font-medium text-destructive">
                        {err}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> wajib diisi
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving || uploadingKtp}
                onClick={onClose}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving || uploadingKtp}>
                {saving && <Loader2 className="animate-spin" />}
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
