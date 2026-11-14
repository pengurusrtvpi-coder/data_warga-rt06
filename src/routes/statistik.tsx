import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { PortalNav } from '@/components/warga/PortalNav'
import { getMyAccessRole, hasActiveSession, type Warga } from '@/lib/warga'
import { BarChart3, Printer, Users, ShieldCheck, GraduationCap, Briefcase, HeartHandshake } from 'lucide-react'

export const Route = createFileRoute('/statistik')({
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: '/login', replace: true })
    return { accessRole: await getMyAccessRole() }
  },
  component: StatistikUsiaPage,
})

const MASTER_KAT = [
  { kategori: 'Balita', rentang_usia: '0 – 4 Tahun', urutan: 1 },
  { kategori: 'Anak-anak', rentang_usia: '5 – 12 Tahun', urutan: 2 },
  { kategori: 'Remaja', rentang_usia: '13 – 17 Tahun', urutan: 3 },
  { kategori: 'Pemuda / Dewasa Muda', rentang_usia: '18 – 25 Tahun', urutan: 4 },
  { kategori: 'Dewasa Produktif', rentang_usia: '26 – 59 Tahun', urutan: 5 },
  { kategori: 'Lansia', rentang_usia: '60+ Tahun', urutan: 6 },
]

const COLORS = [
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-blue-600',
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-purple-600 to-fuchsia-600',
]

function hitungUmur(tgl: string): number {
  const lahir = new Date(tgl)
  if (isNaN(lahir.getTime())) return -1
  const now = new Date()
  let umur = now.getFullYear() - lahir.getFullYear()
  const m = now.getMonth() - lahir.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) umur--
  return umur
}

function getKategori(umur: number): string {
  if (umur < 5) return 'Balita'
  if (umur <= 12) return 'Anak-anak'
  if (umur <= 17) return 'Remaja'
  if (umur <= 25) return 'Pemuda / Dewasa Muda'
  if (umur <= 59) return 'Dewasa Produktif'
  return 'Lansia'
}

function StatistikUsiaPage() {
  const { accessRole } = Route.useRouteContext()
  const isAdmin = accessRole === 'admin'
  const [stats, setStats] = useState<any[]>([])
  const [wargaList, setWargaList] = useState<Warga[]>([])
  const [selectedKat, setSelectedKat] = useState('Semua')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      let allWarga: Warga[] = []
      if (isAdmin) {
        const { data } = await (supabase as any).from('data_warga').select('*').order('nama_lengkap', { ascending: true })
        if (data) {
          allWarga = data
          setWargaList(data)
        }
      }

      const { data: statData, error: rpcErr } = await (supabase as any).rpc('get_statistik_usia_rt06')
      if (!rpcErr && statData && statData.length > 0) {
        setStats(statData)
      } else if (allWarga.length > 0) {
        const hitungLokal = MASTER_KAT.map((m) => {
          const cocok = allWarga.filter((w) => {
            if (!w.tanggal_lahir) return false
            const u = hitungUmur(w.tanggal_lahir)
            return u >= 0 && getKategori(u) === m.kategori
          })
          const lk = cocok.filter((w) => (w.jenis_kelamin || '').trim().toUpperCase().startsWith('L')).length
          const pr = cocok.filter((w) => (w.jenis_kelamin || '').trim().toUpperCase().startsWith('P')).length
          return { ...m, laki_laki: lk, perempuan: pr, total: cocok.length }
        })
        setStats(hitungLokal)
      } else {
        setStats(MASTER_KAT.map((m) => ({ ...m, laki_laki: 0, perempuan: 0, total: 0 })))
      }
      setLoading(false)
    }
    loadData()
  }, [isAdmin])

  const totalWarga = stats.reduce((a, c) => a + Number(c.total), 0)
  const totalLaki = stats.reduce((a, c) => a + Number(c.laki_laki), 0)
  const totalPerempuan = stats.reduce((a, c) => a + Number(c.perempuan), 0)
  const maxVal = Math.max(...stats.map((s) => Number(s.total)), 1)

  const filteredWarga = wargaList.filter((w) => {
    if (!w.tanggal_lahir) return false
    const u = hitungUmur(w.tanggal_lahir)
    if (u < 0) return false
    return selectedKat === 'Semua' || getKategori(u) === selectedKat
  })

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <PortalNav role={accessRole} />

      <div className="hidden print:block px-6 pt-4 mb-6">
        <div className="flex items-center justify-between gap-4 border-b-4 border-double border-slate-900 pb-3">
          <img src="/logo_kota_bekasi.jpg" alt="Logo Kota Bekasi" className="h-16 w-16 object-contain" />
          <div className="text-center flex-1">
            <p className="text-base font-extrabold text-slate-900">PENGURUS RUKUN TETANGGA 06 / RW 07</p>
            <p className="text-sm font-bold text-slate-800">VILLA PADURENAN INDAH 2 (VPI-2)</p>
            <p className="text-xs italic text-slate-700">Motto: BERUBAH - PEDULI - BERBAGI</p>
            <p className="text-[11px] text-slate-600">Kelurahan Padurenan, Kecamatan Mustikajaya, Kota Bekasi</p>
          </div>
          <img src="/logo_rt06.jpg" alt="Logo RT 06" className="h-16 w-16 object-contain rounded-full" />
        </div>
        <div className="text-center mt-4">
          <h2 className="text-base font-bold uppercase underline">LAPORAN STATISTIK KEPENDUDUKAN BERDASARKAN USIA</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="no-print bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 text-white py-9 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" /> Pemetaan Kependudukan RT 06
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold">Statistik Warga Berdasarkan Usia</h1>
            <p className="text-emerald-100 text-xs md:text-sm mt-1">Data demografi otomatis Villa Padurenan Indah 2 • Periode 2025–2030</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => window.print()}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Download PDF / Cetak Laporan
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-sm">Menghitung statistik kependudukan...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border p-5 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><Users className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Penduduk Terdata</p>
                  <p className="text-2xl font-extrabold text-slate-800">{totalWarga} <span className="text-xs font-normal text-slate-500">Jiwa</span></p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-5 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0"><Briefcase className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Warga Laki-laki</p>
                  <p className="text-2xl font-extrabold text-slate-800">{totalLaki} <span className="text-xs font-normal text-slate-500">({totalWarga ? Math.round((totalLaki / totalWarga) * 100) : 0}%)</span></p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-5 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0"><HeartHandshake className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Warga Perempuan</p>
                  <p className="text-2xl font-extrabold text-slate-800">{totalPerempuan} <span className="text-xs font-normal text-slate-500">({totalWarga ? Math.round((totalPerempuan / totalWarga) * 100) : 0}%)</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Grafik Distribusi Kategori Usia</h2>
                  <p className="text-xs text-slate-500">Persentase dan perbandingan jumlah warga per kelompok umur</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> Laki-laki</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400 inline-block" /> Perempuan</span>
                </div>
              </div>

              <div className="space-y-5">
                {stats.map((row, idx) => {
                  const total = Number(row.total)
                  const persen = totalWarga > 0 ? ((total / totalWarga) * 100).toFixed(1) : '0'
                  const lebarBar = Math.round((total / maxVal) * 100)
                  return (
                    <div key={row.kategori} className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-slate-800">{row.kategori}</span>
                          <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{row.rentang_usia}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700">
                          <span className="text-sky-600">L: {row.laki_laki}</span> • <span className="text-rose-600">P: {row.perempuan}</span> • <span className="font-extrabold text-slate-900 text-sm">{total} Jiwa ({persen}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div className={`h-full rounded-full bg-gradient-to-r ${COLORS[idx % COLORS.length]} transition-all duration-700`} style={{ width: `${total > 0 ? Math.max(lebarBar, 4) : 0}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm overflow-x-auto">
              <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-700" /> Tabel Rekapitulasi Kepadatan Usia
              </h3>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-600 text-xs uppercase">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Kategori Usia</th>
                    <th className="py-3 px-3">Rentang Umur</th>
                    <th className="py-3 px-3 text-center">Laki-laki</th>
                    <th className="py-3 px-3 text-center">Perempuan</th>
                    <th className="py-3 px-3 text-center">Total Jiwa</th>
                    <th className="py-3 px-3 text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.map((row, i) => (
                    <tr key={row.kategori} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-500">{i + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{row.kategori}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.rentang_usia}</td>
                      <td className="py-2.5 px-3 text-center text-sky-700 font-semibold">{row.laki_laki}</td>
                      <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">{row.perempuan}</td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{row.total}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{totalWarga > 0 ? ((Number(row.total) / totalWarga) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/80 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="py-3 px-3 text-right">JUMLAH KESELURUHAN</td>
                    <td className="py-3 px-3 text-center text-sky-700">{totalLaki}</td>
                    <td className="py-3 px-3 text-center text-rose-700">{totalPerempuan}</td>
                    <td className="py-3 px-3 text-center">{totalWarga}</td>
                    <td className="py-3 px-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isAdmin && (
              <div className="bg-white rounded-3xl border border-emerald-200 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Akses Khusus Pengurus / Admin
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800">Rincian Daftar Warga per Kelompok Usia</h3>
                  </div>
                  <select value={selectedKat} onChange={(e) => setSelectedKat(e.target.value)} className="no-print px-3 py-2 text-xs font-semibold border rounded-xl bg-slate-50">
                    <option value="Semua">Semua Kategori ({wargaList.length})</option>
                    {stats.map((s) => <option key={s.kategori} value={s.kategori}>{s.kategori} ({s.total})</option>)}
                  </select>
                </div>
                <div className="overflow-x-auto max-h-96 print:max-h-none">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b">
                      <tr className="text-slate-600 uppercase">
                        <th className="py-2.5 px-3">Nama Lengkap</th>
                        <th className="py-2.5 px-3">L/P</th>
                        <th className="py-2.5 px-3">Usia</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">Alamat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredWarga.map((w) => {
                        const umur = w.tanggal_lahir ? hitungUmur(w.tanggal_lahir) : 0
                        return (
                          <tr key={w.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-800">{w.nama_lengkap}</td>
                            <td className="py-2 px-3">{(w.jenis_kelamin || '').toUpperCase().startsWith('L') ? 'L' : 'P'}</td>
                            <td className="py-2 px-3 font-semibold">{umur} Thn</td>
                            <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{getKategori(umur)}</span></td>
                            <td className="py-2 px-3 text-slate-600">{w.alamat}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="hidden print:flex justify-end pt-8 pr-8">
              <div className="text-center text-xs">
                <p>Bekasi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold mt-0.5">Ketua RT 06 / RW 07</p>
                <div className="h-16" />
                <p className="font-bold underline">Andy Nugroho S</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
