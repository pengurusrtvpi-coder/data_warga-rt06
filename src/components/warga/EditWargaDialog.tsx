import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
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
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !saving && onClose()}>
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
                return (
                  <div key={field.key} className={cn("space-y-1.5", field.wide && "sm:col-span-2")}>
                    <Label htmlFor={id} className={cn(err && "text-destructive")}>
                      {field.label}
                      {field.required && <span className="ml-0.5 text-destructive">*</span>}
                    </Label>
                    {field.type === "select" ? (
                      <Select
                        value={form[field.key]}
                        onValueChange={(value) => set(field.key, value)}
                      >
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

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
