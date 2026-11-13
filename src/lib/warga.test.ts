import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPasswordMock, getUserMock, fromMock } = vi.hoisted(() => ({
  signInWithPasswordMock: vi.fn(),
  getUserMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { signInWithPassword: signInWithPasswordMock, getUser: getUserMock },
    from: fromMock,
  },
}));

import {
  emailFromNik,
  fetchAuditWarga,
  formatAuditValue,
  getAuditChanges,
  getMyAccessRole,
  signInAdmin,
  validateAdminWargaForm,
  validateWargaForm,
  type AdminWargaForm,
  type WargaForm,
} from "./warga";

const validForm: WargaForm = {
  nama_lengkap: "Siti Aminah",
  status_hub_keluarga: "Istri",
  jenis_kelamin: "Perempuan",
  tempat_lahir: "Bekasi",
  tanggal_lahir: "1990-05-12",
  golongan_darah: "O",
  agama: "Islam",
  status_perkawinan: "Kawin",
  pendidikan_terakhir: "SLTA/Sederajat",
  pekerjaan: "",
  kewarganegaraan: "WNI",
  no_hp: "0812-3456-7890",
  email: "",
  alamat: "Jl. Melati No. 6",
  catatan: "",
};

const validAdminForm: AdminWargaForm = {
  ...validForm,
  nik: "3201234567890001",
  no_kk: "3201234567890002",
  rt: "06",
  rw: "02",
  status_warga: "Tetap",
  foto_ktp_url: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("emailFromNik", () => {
  it("appends @warga.lokal to the NIK", () => {
    expect(emailFromNik("3201234567890001")).toBe("3201234567890001@warga.lokal");
  });

  it("trims surrounding spaces before appending", () => {
    expect(emailFromNik("  3201234567890001 ")).toBe("3201234567890001@warga.lokal");
  });
});

describe("signInAdmin", () => {
  it("uses the entered email and password directly, without the NIK email suffix", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    await signInAdmin("  pengurusrtvpi@gmail.com  ", "kata-sandi");

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "pengurusrtvpi@gmail.com",
      password: "kata-sandi",
    });
  });
});

describe("getMyAccessRole", () => {
  it("grants admin mode only when the signed-in user's own role row says admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "admin-user-id" } }, error: null });
    const eqMock = vi.fn().mockResolvedValue({ data: [{ role: "admin" }], error: null });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });

    await expect(getMyAccessRole()).resolves.toBe("admin");
    expect(fromMock).toHaveBeenCalledWith("user_roles");
    expect(selectMock).toHaveBeenCalledWith("role");
    expect(eqMock).toHaveBeenCalledWith("user_id", "admin-user-id");
  });

  it("keeps resident restrictions when the signed-in user has no admin role", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "resident-user-id" } }, error: null });
    const eqMock = vi.fn().mockResolvedValue({ data: [], error: null });
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqMock }) });

    await expect(getMyAccessRole()).resolves.toBe("warga");
  });
});

describe("audit log", () => {
  it("reads the 100 newest audit entries in reverse chronological order", async () => {
    const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });
    fromMock.mockReturnValue({ select: selectMock });

    await expect(fetchAuditWarga()).resolves.toEqual([]);
    expect(fromMock).toHaveBeenCalledWith("audit_log_warga");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(100);
  });

  it("shows the actor's exact before and after values with resident-field labels", () => {
    const changes = getAuditChanges({
      nik: { dari: "3201234567890001", menjadi: "3201234567890099" },
      no_hp: { dari: null, menjadi: "081234567890" },
    });

    expect(changes).toEqual([
      { key: "nik", label: "NIK", dari: "3201234567890001", menjadi: "3201234567890099" },
      { key: "no_hp", label: "No. HP", dari: null, menjadi: "081234567890" },
    ]);
    expect(formatAuditValue(changes[1]?.dari)).toBe("Kosong");
    expect(formatAuditValue(changes[1]?.menjadi)).toBe("081234567890");
  });
});

describe("validateWargaForm", () => {
  it("accepts a valid form and never includes locked columns", () => {
    const result = validateWargaForm(validForm);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const locked of ["id", "nik", "no_kk", "rt", "rw", "status_warga", "foto_ktp_url"]) {
      expect(result.patch).not.toHaveProperty(locked);
    }
    expect(result.patch.no_hp).toBe("081234567890");
    expect(result.patch.pekerjaan).toBeNull();
  });

  it("rejects an empty required (NOT NULL) column", () => {
    const result = validateWargaForm({ ...validForm, alamat: "  " });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.alamat).toBe("Alamat wajib diisi.");
  });

  it("rejects agama outside agama_enum", () => {
    const result = validateWargaForm({ ...validForm, agama: "Konghucu" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.agama).toBeDefined();
  });

  it("rejects a birth date in the future", () => {
    const result = validateWargaForm({ ...validForm, tanggal_lahir: "2999-01-01" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.tanggal_lahir).toBe("Tanggal lahir tidak boleh di masa depan.");
  });

  it("rejects a phone number that does not start with 08/62/+62", () => {
    const result = validateWargaForm({ ...validForm, no_hp: "12345" });
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = validateWargaForm({ ...validForm, email: "budi@" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toContain("email");
  });

  it("stores blank golongan darah as '-' (database default)", () => {
    const result = validateWargaForm({ ...validForm, golongan_darah: "" });
    expect(result.ok && result.patch.golongan_darah).toBe("-");
  });
});

describe("validateAdminWargaForm", () => {
  it("includes NIK, No. KK, RT/RW, status warga, and foto KTP in the admin payload", () => {
    const result = validateAdminWargaForm({
      ...validAdminForm,
      foto_ktp_url: "https://example.com/ktp.jpg",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values).toMatchObject({
      nik: "3201234567890001",
      no_kk: "3201234567890002",
      rt: "06",
      rw: "02",
      status_warga: "Tetap",
      foto_ktp_url: "https://example.com/ktp.jpg",
    });
  });

  it("rejects a NIK that is not exactly 16 digits", () => {
    const result = validateAdminWargaForm({ ...validAdminForm, nik: "12345" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.nik).toBe("NIK harus terdiri dari 16 digit angka.");
  });

  it("requires RT and RW when adding or editing a resident as admin", () => {
    const result = validateAdminWargaForm({ ...validAdminForm, rt: "", rw: "" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.rt).toBe("RT wajib diisi.");
    expect(result.errors.rw).toBe("RW wajib diisi.");
  });
});
