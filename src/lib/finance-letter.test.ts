import { describe, it, expect, vi, beforeEach } from "vitest";
const { from, getUser } = vi.hoisted(() => ({ from: vi.fn(), getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth: { getUser } } }));
import {
  financeSummary,
  yearSeries,
  analyseYear,
  transaksiSchema,
  letterPayload,
  saveTransaksi,
  deleteTransaksi,
  deleteSurat,
  createSurat,
  findWargaNik,
  fetchFinance,
  type Warga,
} from "./warga";
beforeEach(() => vi.clearAllMocks());
const transaction = {
  tanggal: "2026-11-10",
  jenis: "Pemasukan",
  kategori: "Iuran Bulanan",
  jumlah: 150000,
  keterangan: "November",
  nama_warga: "Siti Aminah",
};
const resident = {
  nik: "3201234567890001",
  nama_lengkap: "Siti Aminah",
  tempat_lahir: "Bekasi",
  tanggal_lahir: "1990-05-12",
  jenis_kelamin: "Perempuan",
  agama: "Islam",
  pekerjaan: "Guru",
  alamat: "Jl. Melati 6",
} as Warga;
describe("finance calculations", () => {
  it("cash is income minus expenses", () =>
    expect(
      financeSummary([
        { jenis: "Pemasukan", jumlah: 1000000 },
        { jenis: "Pengeluaran", jumlah: 250000 },
      ]),
    ).toEqual({ pemasukan: 1000000, pengeluaran: 250000, saldo: 750000 }));
  it("returns twelve months only for the chosen year, including empty months", () => {
    const rows = [
      {
        bulan_tahun: "2026-11",
        bulan_angka: 11,
        tahun_angka: 2026,
        total_pemasukan: 500000,
        total_pengeluaran: 200000,
        surplus_defisit: 300000,
      },
      {
        bulan_tahun: "2025-11",
        bulan_angka: 11,
        tahun_angka: 2025,
        total_pemasukan: 900000,
        total_pengeluaran: 0,
        surplus_defisit: 900000,
      },
    ];
    const series = yearSeries(rows, 2026);
    expect(series).toHaveLength(12);
    expect(series[10]).toEqual({
      bulan: "November",
      pemasukan: 500000,
      pengeluaran: 200000,
      saldo: 300000,
    });
    expect(series[0]?.saldo).toBe(0);
  });
  it("finds highest/lowest expenses, highest income, and annual deficit", () => {
    const a = analyseYear([
      { bulan: "Januari", pemasukan: 200, pengeluaran: 100, saldo: 100 },
      { bulan: "Februari", pemasukan: 300, pengeluaran: 600, saldo: -300 },
    ]);
    expect(a?.highestExpense.bulan).toBe("Februari");
    expect(a?.lowestExpense.bulan).toBe("Januari");
    expect(a?.highestIncome.bulan).toBe("Februari");
    expect(a?.saldo).toBe(-200);
  });
  it("requires a resident name for Iuran Bulanan", () =>
    expect(transaksiSchema.safeParse({ ...transaction, nama_warga: "" }).success).toBe(false));
  it("rejects zero and negative amounts", () => {
    expect(transaksiSchema.safeParse({ ...transaction, jumlah: 0 }).success).toBe(false);
    expect(transaksiSchema.safeParse({ ...transaction, jumlah: -1 }).success).toBe(false);
  });
  it("rejects an impossible date", () =>
    expect(transaksiSchema.safeParse({ ...transaction, tanggal: "2026-02-31" }).success).toBe(
      false,
    ));
});
describe("access boundaries", () => {
  it.each([
    ["save", () => saveTransaksi(transaction as Parameters<typeof saveTransaksi>[0])],
    ["delete transaction", () => deleteTransaksi("one")],
    ["delete letter", () => deleteSurat("one")],
  ] as const)("residents cannot %s", async (_, action) => {
    getUser.mockResolvedValue({ data: { user: { id: "resident" } }, error: null });
    const eq = vi.fn().mockResolvedValue({ data: [], error: null });
    from.mockReturnValue({ select: () => ({ eq }) });
    await expect(action()).rejects.toThrow("hanya untuk pengurus");
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("user_roles");
  });
});
describe("letters", () => {
  it("copies resident fields and leaves letter number to the trigger", () => {
    const payload = letterPayload(resident, "Surat Keterangan Domisili", "  Administrasi bank  ");
    expect(payload).toMatchObject({
      nik: resident.nik,
      nama_pemohon: "Siti Aminah",
      alamat: "Jl. Melati 6",
      keperluan: "Administrasi bank",
    });
    expect(payload).not.toHaveProperty("nomor_surat");
    expect(payload).not.toHaveProperty("created_at");
  });
  it("requires a purpose", () =>
    expect(() => letterPayload(resident, "Lainnya", " ")).toThrow("Keperluan"));
  it("returns the stored letter number and original creation date", async () => {
    const row = {
      ...letterPayload(resident, "Lainnya", "Administrasi"),
      id: "letter",
      nomor_surat: "001/RT06-RW07/XI/2026",
      created_at: "2026-11-10T00:00:00Z",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    from.mockReturnValue({ insert: () => ({ select: () => ({ single }) }) });
    expect(await createSurat(resident, "Lainnya", "Administrasi")).toEqual(row);
  });
  it("handles a NIK not visible through RLS", async () => {
    from.mockReturnValue({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
    });
    await expect(findWargaNik("3201234567890001")).rejects.toThrow("NIK tidak ditemukan");
  });
});
describe("complete reports", () => {
  it("reads beyond the 1000-row API limit", async () => {
    const range = vi
      .fn()
      .mockImplementation((start: number) =>
        Promise.resolve({
          data:
            start === 0
              ? Array.from({ length: 1000 }, () => ({
                  id: "t",
                  tanggal: "2026-11-10",
                  jenis: "Pemasukan",
                  jumlah: 1,
                }))
              : [{ id: "last", tanggal: "2026-11-10", jenis: "Pemasukan", jumlah: 5 }],
          error: null,
        }),
      );
    const chain = { order: vi.fn(), range };
    chain.order.mockReturnValue(chain);
    from.mockImplementation((table: string) =>
      table === "transaksi_keuangan"
        ? { select: () => chain }
        : {
            select: () => ({
              order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }),
            }),
          },
    );
    const data = await fetchFinance();
    expect(data.transaksi).toHaveLength(1001);
    expect(range).toHaveBeenCalledWith(1000, 1999);
    expect(financeSummary(data.transaksi).saldo).toBe(1005);
  });
});
