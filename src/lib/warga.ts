// Domain helpers + data access for the resident portal.
// All Supabase auth/data calls for the portal live here (see AGENTS.md).
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const NIK_EMAIL_DOMAIN = "@warga.lokal";

/** Login rule: the NIK is never sent alone — it becomes `<nik>@warga.lokal`. */
export function emailFromNik(nik: string): string {
  return `${nik.trim()}${NIK_EMAIL_DOMAIN}`;
}

export type Warga = Database["public"]["Tables"]["data_warga"]["Row"];
type WargaInsert = Database["public"]["Tables"]["data_warga"]["Insert"];
type WargaUpdate = Database["public"]["Tables"]["data_warga"]["Update"];
export type AccessRole = "admin" | "bendahara" | "kesra_pkk" | "seksi_rt" | "warga";

export function getRoleHome(role: AccessRole): "/keluarga" | "/keuangan" | "/jurnal" {
  if (role === "bendahara") return "/keuangan";
  if (role === "kesra_pkk" || role === "seksi_rt") return "/jurnal";
  return "/keluarga";
}

export function canManageFinance(role: AccessRole): boolean {
  return role === "admin" || role === "bendahara";
}

export function canAccessResidentPages(role: AccessRole): boolean {
  return role === "admin" || role === "warga";
}

/** Only existing portal destinations are exposed; residents keep read-only reports. */
export function getPortalMenu(role: AccessRole) {
  if (role === "bendahara") {
    return [
      { to: "/keuangan", label: "Keuangan RT" },
      { to: "/jurnal", label: "Jurnal Kegiatan" },
      { to: "/inventaris", label: "Inventaris RT" },
      { to: "/aspirasi", label: "Aspirasi Warga" },
      { to: "/statistik", label: "Statistik Usia" },
    ] as const;
  }
  if (role === "kesra_pkk") {
    return [
      { to: "/jurnal", label: "Jurnal Kegiatan" },
      { to: "/inventaris", label: "Inventaris RT" },
      { to: "/aspirasi", label: "Aspirasi Warga" },
    ] as const;
  }
  if (role === "seksi_rt") {
    return [
      { to: "/jurnal", label: "Jurnal Kegiatan" },
      { to: "/aspirasi", label: "Aspirasi Warga" },
    ] as const;
  }
  return [
    { to: "/keluarga", label: role === "admin" ? "Data Warga" : "Data Keluarga" },
    { to: "/keuangan", label: role === "admin" ? "Keuangan RT" : "Laporan Keuangan" },
    { to: "/surat", label: "Pelayanan Surat" },
  ] as const;
}
/** Columns a resident may change from the edit dialog. */
export type EditableField =
  | "nama_lengkap"
  | "status_hub_keluarga"
  | "jenis_kelamin"
  | "tempat_lahir"
  | "tanggal_lahir"
  | "golongan_darah"
  | "agama"
  | "status_perkawinan"
  | "pendidikan_terakhir"
  | "pekerjaan"
  | "kewarganegaraan"
  | "no_hp"
  | "email"
  | "alamat"
  | "catatan";

export type AdminOnlyField = "nik" | "no_kk" | "rt" | "rw" | "status_warga" | "foto_ktp_url";
export type AdminEditableField = EditableField | AdminOnlyField;

export type FieldDef<K extends string = EditableField> = {
  key: K;
  label: string;
  type?: "text" | "date" | "tel" | "email" | "select" | "textarea";
  options?: readonly string[];
  required?: boolean;
  wide?: boolean;
  maxLength?: number;
  placeholder?: string;
  numeric?: boolean;
};

export type AdminFieldDef = FieldDef<AdminEditableField>;

// Option lists mirror the database enums (agama_enum, golongan_darah_enum, ...).
export const AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu", "Lainnya"] as const;
export const GOLONGAN_DARAH = ["-", "A", "B", "AB", "O", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Tidak Tahu"] as const;
export const JENIS_KELAMIN = ["Laki-laki", "Perempuan"] as const;
export const STATUS_PERKAWINAN = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"] as const;
export const KEWARGANEGARAAN = ["WNI", "WNA"] as const;
export const HUBUNGAN_KELUARGA = ["Kepala Keluarga", "Istri", "Suami", "Anak", "Menantu", "Cucu", "Orang Tua", "Mertua", "Famili Lain", "Lainnya"] as const;
export const PENDIDIKAN = ["Tidak/Belum Sekolah", "Belum Tamat SD", "Tamat SD", "SLTP/Sederajat", "SLTA/Sederajat", "Diploma I/II", "Diploma III", "Diploma IV/Strata I", "Strata II", "Strata III"] as const;

export const WARGA_FIELDS: FieldDef[] = [
  { key: "nama_lengkap", label: "Nama Lengkap", required: true, wide: true, maxLength: 100 },
  { key: "status_hub_keluarga", label: "Hubungan Keluarga", type: "select", options: HUBUNGAN_KELUARGA, required: true },
  { key: "jenis_kelamin", label: "Jenis Kelamin", type: "select", options: JENIS_KELAMIN, required: true },
  { key: "tempat_lahir", label: "Tempat Lahir", required: true, maxLength: 50 },
  { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date", required: true },
  { key: "golongan_darah", label: "Golongan Darah", type: "select", options: GOLONGAN_DARAH },
  { key: "agama", label: "Agama", type: "select", options: AGAMA, required: true },
  { key: "status_perkawinan", label: "Status Perkawinan", type: "select", options: STATUS_PERKAWINAN, required: true },
  { key: "pendidikan_terakhir", label: "Pendidikan Terakhir", type: "select", options: PENDIDIKAN },
  { key: "pekerjaan", label: "Pekerjaan", maxLength: 50 },
  { key: "kewarganegaraan", label: "Kewarganegaraan", type: "select", options: KEWARGANEGARAAN, required: true },
  { key: "no_hp", label: "No. HP", type: "tel", maxLength: 16, placeholder: "08xxxxxxxxxx" },
  { key: "email", label: "Email", type: "email", wide: true, maxLength: 100, placeholder: "nama@contoh.com" },
  { key: "alamat", label: "Alamat", type: "textarea", wide: true, required: true, maxLength: 255 },
  { key: "catatan", label: "Catatan", type: "textarea", wide: true, maxLength: 500 },
];

/** Every resident-data column; id and timestamps remain database-managed. */
export const ADMIN_WARGA_FIELDS: AdminFieldDef[] = [
  { key: "nik", label: "NIK", required: true, maxLength: 16, numeric: true, placeholder: "16 digit NIK" },
  { key: "no_kk", label: "No. KK", required: true, maxLength: 16, numeric: true, placeholder: "16 digit Nomor KK" },
  { key: "nama_lengkap", label: "Nama Lengkap", required: true, wide: true, maxLength: 100 },
  { key: "status_hub_keluarga", label: "Hubungan Keluarga", type: "select", options: HUBUNGAN_KELUARGA, required: true },
  { key: "jenis_kelamin", label: "Jenis Kelamin", type: "select", options: JENIS_KELAMIN, required: true },
  { key: "tempat_lahir", label: "Tempat Lahir", required: true, maxLength: 50 },
  { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date", required: true },
  { key: "golongan_darah", label: "Golongan Darah", type: "select", options: GOLONGAN_DARAH },
  { key: "agama", label: "Agama", type: "select", options: AGAMA, required: true },
  { key: "status_perkawinan", label: "Status Perkawinan", type: "select", options: STATUS_PERKAWINAN, required: true },
  { key: "status_warga", label: "Status Warga", required: true, maxLength: 50, placeholder: "Tetap / Kontrak/Kost / Pindah" },
  { key: "pendidikan_terakhir", label: "Pendidikan Terakhir", type: "select", options: PENDIDIKAN },
  { key: "pekerjaan", label: "Pekerjaan", maxLength: 50 },
  { key: "kewarganegaraan", label: "Kewarganegaraan", type: "select", options: KEWARGANEGARAAN, required: true },
  { key: "rt", label: "RT", required: true, maxLength: 10, numeric: true },
  { key: "rw", label: "RW", required: true, maxLength: 10, numeric: true },
  { key: "no_hp", label: "No. HP", type: "tel", maxLength: 16, placeholder: "08xxxxxxxxxx" },
  { key: "email", label: "Email", type: "email", wide: true, maxLength: 100, placeholder: "nama@contoh.com" },
  { key: "alamat", label: "Alamat", type: "textarea", wide: true, required: true, maxLength: 255 },
  { key: "foto_ktp_url", label: "URL Foto KTP", wide: true, maxLength: 500, placeholder: "https://…" },
  { key: "catatan", label: "Catatan", type: "textarea", wide: true, maxLength: 500 },
];

export type WargaForm = Record<EditableField, string>;
export type AdminWargaForm = Record<AdminEditableField, string>;
export type WargaFormErrors = Partial<Record<AdminEditableField, string>>;

export function createEmptyAdminWargaForm(): AdminWargaForm {
  const form = {} as AdminWargaForm;
  for (const field of ADMIN_WARGA_FIELDS) form[field.key] = "";
  return {
    ...form,
    golongan_darah: "-",
    kewarganegaraan: "WNI",
    status_warga: "Tetap",
    rt: "06",
  };
}

// ---------- Validation (mirrors data_warga column types & NOT NULL rules) ----------

const req = (label: string) => `${label} wajib diisi.`;
const tooLong = (label: string, n: number) => `${label} maksimal ${n} karakter.`;
const pick = (label: string) => `Pilih ${label.toLowerCase()} dari daftar yang tersedia.`;

const NAME_RE = /^[\p{L}\s.,'-]+$/u;
const PLACE_RE = /^[\p{L}\s.'-]+$/u;
const PHONE_RE = /^(?:\+62|62|0)8\d{7,12}$/;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const requiredText = (label: string, max: number, re?: RegExp, reMsg?: string) => {
  let s = z.string().trim().min(1, req(label)).max(max, tooLong(label, max));
  if (re) s = s.regex(re, reMsg);
  return s;
};

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, tooLong(label, max));

const requiredEnum = (label: string, values: readonly string[]) =>
  z
    .string()
    .trim()
    .min(1, req(label))
    .refine((v) => values.includes(v), pick(label));

const optionalEnum = (label: string, values: readonly string[]) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || values.includes(v), pick(label));

export const wargaFormSchema = z.object({
  nama_lengkap: requiredText("Nama lengkap", 100, NAME_RE, "Nama hanya boleh berisi huruf, spasi, titik, koma, apostrof, dan tanda hubung.").refine(
    (v) => v.length >= 2,
    "Nama lengkap minimal 2 karakter.",
  ),
  status_hub_keluarga: requiredText("Hubungan keluarga", 50),
  jenis_kelamin: requiredEnum("Jenis kelamin", JENIS_KELAMIN),
  tempat_lahir: requiredText("Tempat lahir", 50, PLACE_RE, "Tempat lahir hanya boleh berisi huruf, spasi, titik, dan tanda hubung."),
  tanggal_lahir: z
    .string()
    .trim()
    .min(1, req("Tanggal lahir"))
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir tidak valid.")
    .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Tanggal lahir tidak valid.")
    .refine((v) => v >= "1900-01-01", "Tanggal lahir tidak boleh sebelum tahun 1900.")
    .refine((v) => v <= todayIso(), "Tanggal lahir tidak boleh di masa depan."),
  golongan_darah: optionalEnum("Golongan darah", GOLONGAN_DARAH),
  agama: requiredEnum("Agama", AGAMA),
  status_perkawinan: requiredEnum("Status perkawinan", STATUS_PERKAWINAN),
  pendidikan_terakhir: optionalText("Pendidikan terakhir", 50),
  pekerjaan: optionalText("Pekerjaan", 50),
  kewarganegaraan: requiredEnum("Kewarganegaraan", KEWARGANEGARAAN),
  no_hp: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => v === "" || PHONE_RE.test(v), "No. HP harus diawali 08, 62, atau +62 dan berisi 10–15 digit angka."),
  email: z
    .string()
    .trim()
    .max(100, tooLong("Email", 100))
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Format email tidak valid, contoh: nama@contoh.com."),
  alamat: requiredText("Alamat", 255).refine((v) => v.length >= 5, "Alamat terlalu pendek, minimal 5 karakter."),
  catatan: optionalText("Catatan", 500),
});

const adminWargaFormSchema = wargaFormSchema.extend({
  nik: requiredText("NIK", 16).regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit angka."),
  no_kk: requiredText("No. KK", 16).regex(/^\d{16}$/, "No. KK harus terdiri dari 16 digit angka."),
  rt: requiredText("RT", 10).regex(/^\d+$/, "RT hanya boleh berisi angka."),
  rw: requiredText("RW", 10).regex(/^\d+$/, "RW hanya boleh berisi angka."),
  status_warga: requiredText("Status warga", 50),
  foto_ktp_url: optionalText("URL foto KTP", 500),
});

export type ValidationResult =
  | { ok: true; patch: WargaUpdate }
  | { ok: false; errors: WargaFormErrors };

export type AdminValidationResult =
  | { ok: true; values: WargaInsert }
  | { ok: false; errors: WargaFormErrors };

function residentValues(d: z.infer<typeof wargaFormSchema>) {
  const orNull = (v: string) => (v === "" ? null : v);
  return {
    nama_lengkap: d.nama_lengkap,
    status_hub_keluarga: d.status_hub_keluarga,
    jenis_kelamin: d.jenis_kelamin,
    tempat_lahir: d.tempat_lahir,
    tanggal_lahir: d.tanggal_lahir,
    golongan_darah: d.golongan_darah === "" ? "-" : d.golongan_darah,
    agama: d.agama,
    status_perkawinan: d.status_perkawinan,
    pendidikan_terakhir: orNull(d.pendidikan_terakhir),
    pekerjaan: orNull(d.pekerjaan),
    kewarganegaraan: d.kewarganegaraan,
    no_hp: orNull(d.no_hp),
    email: orNull(d.email),
    alamat: d.alamat,
    catatan: orNull(d.catatan),
  };
}

/** Residents: locked identity and location columns never enter the UPDATE payload. */
export function validateWargaForm(form: WargaForm): ValidationResult {
  const parsed = wargaFormSchema.safeParse(form);
  if (!parsed.success) {
    const errors: WargaFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as EditableField;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  return {
    ok: true,
    patch: {
      ...residentValues(parsed.data),
      updated_at: new Date().toISOString(),
    },
  };
}

/** Admins: validates and returns every resident-data column for INSERT or UPDATE. */
export function validateAdminWargaForm(form: AdminWargaForm): AdminValidationResult {
  const parsed = adminWargaFormSchema.safeParse(form);
  if (!parsed.success) {
    const errors: WargaFormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as AdminEditableField;
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  const d = parsed.data;
  return {
    ok: true,
    values: {
      ...residentValues(d),
      nik: d.nik,
      no_kk: d.no_kk,
      rt: d.rt,
      rw: d.rw,
      status_warga: d.status_warga,
      foto_ktp_url: d.foto_ktp_url === "" ? null : d.foto_ktp_url,
    },
  };
}

export function formatTanggal(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// ---------- Audit log helpers ----------

export type AuditLogWarga = Database["public"]["Tables"]["audit_log_warga"]["Row"];
export type AuditChange = {
  key: string;
  label: string;
  dari?: unknown;
  menjadi?: unknown;
};

export const AUDIT_LOG_LIMIT = 100;

export function formatAuditWaktu(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  })} WIB`;
}

export function formatAuditValue(value: unknown): string {
  if (value == null || value === "") return "Kosong";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/** Turns the database's JSON diff into labelled before/after rows for the admin UI. */
export function getAuditChanges(perubahan: AuditLogWarga["perubahan"]): AuditChange[] {
  if (!perubahan || typeof perubahan !== "object" || Array.isArray(perubahan)) return [];
  const labels = new Map(ADMIN_WARGA_FIELDS.map((field) => [field.key, field.label]));
  const changes: AuditChange[] = [];

  for (const [key, raw] of Object.entries(perubahan)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const value = raw as Record<string, unknown>;
    if (!("dari" in value) && !("menjadi" in value)) continue;
    changes.push({
      key,
      label: labels.get(key as AdminEditableField) ?? key.replaceAll("_", " "),
      ...( "dari" in value ? { dari: value["dari"] } : {}),
      ...( "menjadi" in value ? { menjadi: value["menjadi"] } : {}),
    });
  }
  return changes;
}

// ---------- Supabase calls ----------

export async function signInWithNik(nik: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailFromNik(nik),
    password,
  });
  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      throw new Error("NIK atau password salah. Silakan periksa kembali.");
    }
    throw new Error("Gagal masuk. Periksa koneksi internet Anda dan coba lagi.");
  }
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      throw new Error("Email atau password salah. Silakan periksa kembali.");
    }
    throw new Error("Gagal masuk. Periksa koneksi internet Anda dan coba lagi.");
  }
}

export async function signOutWarga(): Promise<void> {
  await supabase.auth.signOut();
}

export async function hasActiveSession(): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  return !error && !!data.user;
}

/** Role comes from the protected user_roles table through own-row RLS, never user_metadata. */
export async function getMyAccessRole(): Promise<AccessRole> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sesi login tidak valid. Silakan masuk kembali.");

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  if (error) throw new Error("Gagal memeriksa hak akses. Silakan coba lagi.");
  const roles = data ?? [];
  if (roles.some((row) => row.role === "admin")) return "admin";
  if (roles.some((row) => row.role === "bendahara")) return "bendahara";
  if (roles.some((row) => (row as { role?: string }).role === "kesra_pkk")) return "kesra_pkk";
  if (roles.some((row) => (row as { role?: string }).role === "seksi_rt")) return "seksi_rt";
  return "warga";
}

/** Resident read path: security-definer RPC returns only the caller's own KK (from the NIK login email). */
export async function fetchKeluargaSaya(): Promise<Warga[]> {
  try {
    const { data, error } = await supabase.rpc("get_my_keluarga" as never);
    if (error) throw error;
    return (data as unknown as Warga[]) ?? [];
  } catch (err) {
    console.error("[fetchKeluargaSaya]", err instanceof Error ? err.message : (err as { message?: string })?.message ?? err);
    throw new Error("Gagal memuat data keluarga Anda. " + ((err as { message?: string })?.message ?? ""));
  }
}

export async function fetchKeluarga(noKk: string): Promise<Warga[]> {
  const { data, error } = await supabase
    .from("data_warga")
    .select("*")
    .eq("no_kk", noKk.trim())
    .order("created_at", { ascending: true });
  if (error) throw new Error("Gagal memuat data keluarga. Coba lagi beberapa saat.");
  return data ?? [];
}

/** Admin-only in the UI; the admin RLS policy is the enforcing boundary. */
export async function fetchSemuaWarga(search = ""): Promise<Warga[]> {
  const rawTerm = search.trim();
  const term = /^\d+$/.test(rawTerm) ? rawTerm : rawTerm.replace(/[%_]/g, "").trim();
  const pageSize = 1000;
  const rows: Warga[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from("data_warga")
      .select("*")
      .order("no_kk", { ascending: true })
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (term && /^\d+$/.test(term)) {
      query = query.or(`nik.eq.${term},no_kk.eq.${term}`);
    } else if (term) {
      query = query.ilike("nama_lengkap", `%${term}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[fetchSemuaWarga]", error.message);
      throw new Error(`Gagal memuat data warga: ${error.message}`);
    }
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

export async function createWarga(values: WargaInsert): Promise<void> {
  const { error } = await supabase.from("data_warga").insert(values).select("id").single();
  if (error) {
    if (error.code === "23505") throw new Error("NIK atau No. KK tersebut sudah terdaftar.");
    if (error.code === "42501" && error.message) throw new Error(error.message);
    throw new Error("Gagal menambahkan data warga. Periksa kembali isian Anda.");
  }
}

export async function updateWarga(id: Warga["id"], patch: WargaUpdate): Promise<void> {
  const { data, error } = await supabase.from("data_warga").update(patch).eq("id", id).select("id");
  if (error) {
    if (error.code === "42501" && error.message) throw new Error(error.message);
    if (error.code === "23505") throw new Error("NIK atau No. KK tersebut sudah terdaftar.");
    throw new Error("Gagal menyimpan data. Periksa kembali isian Anda.");
  }
  if (!data || data.length === 0) {
    throw new Error("Data tidak tersimpan atau Anda tidak memiliki akses untuk mengubahnya.");
  }
}

export async function deleteWarga(id: Warga["id"]): Promise<void> {
  const { data, error } = await supabase.from("data_warga").delete().eq("id", id).select("id");
  if (error) {
    if (error.code === "42501" && error.message) throw new Error(error.message);
    throw new Error("Gagal menghapus data warga. Silakan coba lagi.");
  }
  if (!data || data.length === 0) {
    throw new Error("Data tidak terhapus atau Anda tidak memiliki akses untuk menghapusnya.");
  }
}

/** Admin-only through RLS; audit rows themselves are written by database triggers. */
export async function fetchAuditWarga(): Promise<AuditLogWarga[]> {
  const { data, error } = await supabase
    .from("audit_log_warga")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(AUDIT_LOG_LIMIT);
  if (error) throw new Error("Gagal memuat riwayat audit. Silakan coba lagi.");
  return data ?? [];
}

// ---------- Finance & letters ----------
export type Transaksi = Database['public']['Tables']['transaksi_keuangan']['Row'];
export type Bulanan = Database['public']['Views']['view_laporan_keuangan_bulanan']['Row'];
export type Surat = Database['public']['Tables']['pelayanan_surat']['Row'];
export const JENIS_SURAT = ['Surat Pengantar KTP/KK', 'Surat Keterangan Domisili', 'Surat Keterangan Usaha', 'Surat Keterangan Tidak Mampu', 'Surat Keterangan Kematian', 'Surat Keterangan Pindah', 'Lainnya'] as const;
export const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
export function jakartaToday() {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Jakarta', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
export function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);
}
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;
}
export const transaksiSchema = z.object({
  tanggal:z.string().refine(v => {try {return validDate(v);} catch {return false;}},'Tanggal transaksi tidak valid.'),
  jenis:z.enum(['Pemasukan','Pengeluaran']),
  kategori:z.string().trim().min(1,'Kategori wajib diisi.'),
  jumlah:z.coerce.number().finite().positive('Jumlah harus lebih dari nol.'),
  keterangan:z.string().trim(), nama_warga:z.string().trim(),
}).refine(v => v.kategori !== 'Iuran Bulanan' || v.nama_warga.length > 0,{message:'Pilih nama warga untuk Iuran Bulanan.',path:['nama_warga']});
export type TransaksiInput = z.infer<typeof transaksiSchema>;
export function financeSummary(rows: Pick<Transaksi,'jenis'|'jumlah'>[]) {
  const pemasukan = rows.filter(r => r.jenis === 'Pemasukan').reduce((s,r) => s + Number(r.jumlah),0);
  const pengeluaran = rows.filter(r => r.jenis === 'Pengeluaran').reduce((s,r) => s + Number(r.jumlah),0);
  return {pemasukan,pengeluaran,saldo:pemasukan-pengeluaran};
}
export function yearSeries(rows: Bulanan[], year: number) {
  return BULAN.map((bulan,i) => {
    const row=rows.find(r=>Number(r.tahun_angka)===year && Number(r.bulan_angka)===i+1);
    const pemasukan=Number(row?.total_pemasukan??0),pengeluaran=Number(row?.total_pengeluaran??0);
    return {bulan, pemasukan,pengeluaran,saldo:pemasukan-pengeluaran};
  });
}
export function analyseYear(series: ReturnType<typeof yearSeries>) {
  const active=series.filter(r=>r.pemasukan!==0||r.pengeluaran!==0);
  if (!active.length) return null;
  const highestExpense=active.reduce((a,b)=>b.pengeluaran>a.pengeluaran?b:a);
  const lowestExpense=active.reduce((a,b)=>b.pengeluaran<a.pengeluaran?b:a);
  const highestIncome=active.reduce((a,b)=>b.pemasukan>a.pemasukan?b:a);
  return {highestExpense,lowestExpense,highestIncome,saldo:series.reduce((s,r)=>s+r.saldo,0)};
}
export async function fetchFinance() {
  const transaksi:Transaksi[]=[];
  for(let from=0;;from+=1000) {
    const {data,error}=await supabase.from('transaksi_keuangan').select('*').order('tanggal',{ascending:false}).order('id').range(from,from+999);
    if(error) throw new Error('Gagal memuat transaksi keuangan. Silakan coba lagi.');
    transaksi.push(...(data??[])); if(!data||data.length<1000)break;
  }
  const bulanan:Bulanan[]=[];
  for(let from=0;;from+=1000) {
    const {data,error}=await supabase.from('view_laporan_keuangan_bulanan').select('*').order('bulan_tahun').range(from,from+999);
    if(error) throw new Error('Gagal memuat laporan bulanan. Silakan coba lagi.');
    bulanan.push(...(data??[]));if(!data||data.length<1000)break;
  }
  return {transaksi,bulanan};
}
async function requireAdmin() {
  if(await getMyAccessRole()!=='admin')throw new Error('Tindakan ini hanya untuk pengurus RT.');
}
async function requireFinanceManager() {
  if (!canManageFinance(await getMyAccessRole())) throw new Error('Tindakan ini hanya untuk pengurus keuangan (admin atau bendahara).');
}
export async function saveTransaksi(input: TransaksiInput,id?:string) {
  await requireFinanceManager();
  const d=transaksiSchema.parse(input);
  const values={...d,nama_warga:d.kategori==='Iuran Bulanan'?d.nama_warga:null,keterangan:d.keterangan||null};
  const query=id?supabase.from('transaksi_keuangan').update(values).eq('id',id):supabase.from('transaksi_keuangan').insert(values);
  const {data,error}=await query.select('id');
  if(error||!data?.length)throw new Error('Transaksi tidak tersimpan. Periksa isian dan hak akses Anda.');
}
export async function deleteTransaksi(id:string) {
  await requireFinanceManager();const {data,error}=await supabase.from('transaksi_keuangan').delete().eq('id',id).select('id');
  if(error||!data?.length)throw new Error('Transaksi tidak berhasil dihapus.');
}
export async function findWargaNik(nik:string) {
  if(!/^\d{16}$/.test(nik.trim()))throw new Error('NIK harus terdiri dari 16 digit angka.');
  const {data,error}=await supabase.from('data_warga').select('*').eq('nik',nik.trim()).maybeSingle();
  if(error){console.error('[findWargaNik]',error.message);throw new Error(`Gagal memeriksa NIK: ${error.message}`);}
  if(!data)throw new Error('NIK tidak ditemukan atau bukan anggota keluarga akun Anda.');
  return data;
}
export async function fetchSurat():Promise<Surat[]> {
  const rows:Surat[]=[];
  for(let from=0;;from+=1000){
    const {data,error}=await supabase.from('pelayanan_surat').select('*').order('created_at',{ascending:false}).order('id').range(from,from+999);
    if(error){console.error('[fetchSurat]',error.message);throw new Error(`Gagal memuat riwayat surat: ${error.message}`);}
    rows.push(...(data??[]));if(!data||data.length<1000)break;
  }
  return rows;
}
export function letterPayload(w:Warga,jenis:string,keperluan:string) {
  if(!JENIS_SURAT.includes(jenis as typeof JENIS_SURAT[number]))throw new Error('Pilih jenis surat dari daftar.');
  if(!keperluan.trim())throw new Error('Keperluan surat wajib diisi.');
  return {nik:w.nik,nama_pemohon:w.nama_lengkap,tempat_tgl_lahir:`${w.tempat_lahir}, ${formatTanggal(w.tanggal_lahir)}`,jenis_kelamin:w.jenis_kelamin,agama:w.agama,pekerjaan:w.pekerjaan,alamat:w.alamat,jenis_surat:jenis,keperluan:keperluan.trim()};
}
export async function createSurat(w:Warga,jenis:string,keperluan:string):Promise<Surat> {
  const {data,error}=await supabase.from('pelayanan_surat').insert(letterPayload(w,jenis,keperluan)).select('*').single();
  if(error||!data)throw new Error('Surat tidak tersimpan. Periksa isian dan akses NIK Anda.');
  return data;
}
/** Resident path: insert by NIK only; the DB trigger fills biodata and enforces own-KK, RLS checks the creator. */
export async function createSuratByNik(nik:string,jenis:string,keperluan:string):Promise<Surat> {
  const n=nik.trim();
  if(!/^\d{16}$/.test(n))throw new Error('NIK harus terdiri dari 16 digit angka.');
  if(!JENIS_SURAT.includes(jenis as typeof JENIS_SURAT[number]))throw new Error('Pilih jenis surat dari daftar.');
  if(!keperluan.trim())throw new Error('Keperluan surat wajib diisi.');
  const {data:u}=await supabase.auth.getUser();
  const {data,error}=await supabase.from('pelayanan_surat').insert({nik:n,nama_pemohon:'-',jenis_surat:jenis,keperluan:keperluan.trim(),email_pembuat:u.user?.email??null}).select('*').single();
  if(error||!data){
    console.error('[createSuratByNik]',error?.message);
    const msg=error?.message??'';
    if(/row-level security/i.test(msg))throw new Error('Pengajuan ditolak: akun Anda tidak berhak mengajukan surat untuk NIK ini.');
    throw new Error(msg?`Surat tidak tersimpan: ${msg}`:'Surat tidak tersimpan.');
  }
  return data;
}
export async function deleteSurat(id:string) {
  await requireAdmin();const {data,error}=await supabase.from('pelayanan_surat').delete().eq('id',id).select('id');
  if(error||!data?.length)throw new Error('Surat tidak berhasil dihapus.');
}

/** Masks NIK for on-screen display while preserving the original value for forms and printouts. */
export function maskNik(nik?: string | null): string {
  if (!nik) return '-';
  const clean = String(nik).trim();
  if (clean.length < 10) return clean;
  return `${clean.slice(0, 6)}${'*'.repeat(Math.max(clean.length - 8, 4))}${clean.slice(-2)}`;
}
