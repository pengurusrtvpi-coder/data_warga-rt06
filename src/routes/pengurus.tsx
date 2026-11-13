import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { PortalNav } from '@/components/warga/PortalNav'
import { getMyAccessRole, hasActiveSession } from '@/lib/warga'
import {
  Users,
  Shield,
  Award,
  Edit2,
  Plus,
  Trash2,
  Save,
  X,
  Sparkles,
  Target,
  Compass,
  HeartHandshake,
  Leaf,
  FileCheck2,
  Wallet,
  Crown,
} from 'lucide-react'

export const Route = createFileRoute('/pengurus')({
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: '/login', replace: true })
    return { accessRole: await getMyAccessRole() }
  },
  head: () => ({
    meta: [
      { title: 'Struktur Pengurus, Visi & Misi RT 06 — Portal VPI-2' },
      { name: 'description', content: 'Moto, Visi, Misi, dan Bagan Struktur Kepengurusan RT 06 Villa Padurenan Indah 2 Periode 2025-2030.' },
    ],
  }),
  component: StrukturPengurusPage,
})

interface Pengurus {
  id: string
  jabatan: string
  nama: string
  kategori: string
  urutan: number
}

const daftarMisi = [
  {
    judul: 'Kerukunan & Sosial',
    isi: 'Meningkatkan kerukunan, kebersamaan, dan rasa gotong royong antarwarga melalui kegiatan sosial yang aktif.',
    Icon: HeartHandshake,
    warna: 'bg-rose-50 text-rose-600 border-rose-100',
  },
  {
    judul: 'Keamanan & Ketertiban',
    isi: 'Bersama-sama menjaga keamanan dan ketertiban lingkungan (siskamling) guna mengantisipasi gangguan.',
    Icon: Shield,
    warna: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    judul: 'Kebersihan & Kesehatan',
    isi: 'Mengajak warga aktif menjaga kebersihan lingkungan, pengelolaan sampah, serta mendukung program kesehatan.',
    Icon: Leaf,
    warna: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    judul: 'Administrasi & Pelayanan',
    isi: 'Memberikan pelayanan administrasi kependudukan yang cepat, jujur, ramah, dan transparan.',
    Icon: FileCheck2,
    warna: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    judul: 'Keterbukaan Keuangan',
    isi: 'Melaporkan kondisi dan pengelolaan keuangan RT (iuran warga, kas, pengeluaran) secara berkala dan terbuka.',
    Icon: Wallet,
    warna: 'bg-teal-50 text-teal-600 border-teal-100',
  },
  {
    judul: 'Pemberdayaan & Generasi',
    isi: 'Memfasilitasi kegiatan pemuda, olahraga, keagamaan, serta pemberdayaan keluarga.',
    Icon: Users,
    warna: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },
]

function StrukturPengurusPage() {
  const { accessRole } = Route.useRouteContext()
  const isAdmin = accessRole === 'admin'

  const [list, setList] = useState<Pengurus[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ jabatan: '', nama: '', kategori: 'Inti', urutan: 1 })
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('pengurus_rt')
      .select('*')
      .order('urutan', { ascending: true })
    if (data) setList(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const saveEdit = async (id: string) => {
    await (supabase as any)
      .from('pengurus_rt')
      .update({ ...form, urutan: Number(form.urutan) })
      .eq('id', id)
    setEditId(null)
    load()
  }

  const addNew = async () => {
    if (!form.jabatan || !form.nama) return alert('Jabatan dan nama wajib diisi')
    await (supabase as any)
      .from('pengurus_rt')
      .insert([{ ...form, urutan: Number(form.urutan) }])
    setAdding(false)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus pengurus ini dari bagan?')) return
    await (supabase as any).from('pengurus_rt').delete().eq('id', id)
    load()
  }

  // Pengelompokan otomatis untuk Bagan Organisasi (Org Chart)
  const intiList = list.filter((i) => i.kategori === 'Inti')
  const ketuaRT = intiList.find((i) => i.jabatan.toLowerCase().includes('ketua')) || intiList[0]
  const pendampingInti = intiList.filter((i) => i.id !== ketuaRT?.id)

  const seksiList = list.filter((i) => i.kategori === 'Seksi')

  const pkkList = list.filter((i) => i.kategori === 'Kesra & PKK')
  const ketuaPKK = pkkList.find((i) => i.jabatan.toLowerCase().includes('ketua')) || pkkList[0]
  const subPKK = pkkList.filter((i) => i.id !== ketuaPKK?.id)

  const renderNodeCard = (
    item: Pengurus,
    variant: 'ketua' | 'inti' | 'seksi' | 'pkk-ketua' | 'pkk-sub'
  ) => {
    const styles = {
      ketua: {
        wrap: 'bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 shadow-md ring-4 ring-amber-400/10',
        badge: 'bg-amber-500 text-white',
      },
      inti: {
        wrap: 'bg-white border-2 border-emerald-500/60 shadow-sm',
        badge: 'bg-emerald-100 text-emerald-800',
      },
      seksi: {
        wrap: 'bg-white border border-blue-200 shadow-sm hover:border-blue-400',
        badge: 'bg-blue-50 text-blue-700 border border-blue-200',
      },
      'pkk-ketua': {
        wrap: 'bg-gradient-to-b from-rose-50 to-white border-2 border-rose-400 shadow-sm',
        badge: 'bg-rose-600 text-white',
      },
      'pkk-sub': {
        wrap: 'bg-white border border-rose-200 shadow-sm hover:border-rose-300',
        badge: 'bg-rose-50 text-rose-700 border border-rose-200',
      },
    }[variant]

    const isEditing = editId === item.id

    return (
      <div
        key={item.id}
        className={`rounded-2xl p-4 text-center transition-all flex flex-col justify-between ${styles.wrap}`}
      >
        {isEditing ? (
          <div className="space-y-2 text-left">
            <input
              value={form.jabatan}
              onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
              placeholder="Jabatan"
              className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
            />
            <input
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama Pengurus"
              className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
            />
            <div className="flex gap-1.5">
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className="flex-1 px-2 py-1 text-xs border rounded-lg"
              >
                <option value="Inti">Inti</option>
                <option value="Seksi">Seksi</option>
                <option value="Kesra & PKK">Kesra & PKK</option>
              </select>
              <input
                type="number"
                value={form.urutan}
                onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })}
                className="w-14 px-2 py-1 text-xs border rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                onClick={() => setEditId(null)}
                className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Batal
              </button>
              <button
                onClick={() => saveEdit(item.id)}
                className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-md flex items-center gap-1"
              >
                <Save className="w-3 h-3" /> Simpan
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2.5 ${styles.badge}`}
              >
                {variant === 'ketua' && <Crown className="w-3 h-3" />}
                {item.jabatan}
              </span>
              <h3 className="text-sm md:text-base font-extrabold text-slate-800 leading-snug">
                {item.nama}
              </h3>
            </div>

            {isAdmin && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setEditId(item.id)
                    setForm({
                      jabatan: item.jabatan,
                      nama: item.nama,
                      kategori: item.kategori,
                      urutan: item.urutan,
                    })
                  }}
                  className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="text-[11px] font-medium text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <PortalNav role={accessRole} />

      {/* 1. HERO HEADER & MOTO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 text-white py-12 px-4 shadow-md">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-4">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            Masa Bakti Periode 2025 – 2030
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">
