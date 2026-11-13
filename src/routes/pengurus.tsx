import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { PortalNav } from '@/components/warga/PortalNav'
import { getMyAccessRole, hasActiveSession } from '@/lib/warga'
import { Users, Shield, Award, Edit2, Plus, Trash2, Save, X, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/pengurus')({
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: '/login', replace: true })
    return { accessRole: await getMyAccessRole() }
  },
  component: StrukturPengurusPage,
})

function StrukturPengurusPage() {
  const { accessRole } = Route.useRouteContext()
  const isAdmin = accessRole === 'admin'
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ jabatan: '', nama: '', kategori: 'Inti', urutan: 1 })
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await (supabase as any).from('pengurus_rt').select('*').order('urutan', { ascending: true })
    if (data) setList(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveEdit = async (id: string) => {
    await (supabase as any).from('pengurus_rt').update({ ...form, urutan: Number(form.urutan) }).eq('id', id)
    setEditId(null)
    load()
  }

  const addNew = async () => {
    if (!form.jabatan || !form.nama) return
    await (supabase as any).from('pengurus_rt').insert([{ ...form, urutan: Number(form.urutan) }])
    setAdding(false)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus data pengurus ini?')) return
    await (supabase as any).from('pengurus_rt').delete().eq('id', id)
    load()
  }

  const groups = [
    { title: 'Pengurus Inti RT 06', key: 'Inti', badge: 'bg-emerald-100 text-emerald-800', Icon: Award },
    { title: 'Seksi-Seksi Bidang', key: 'Seksi', badge: 'bg-blue-100 text-blue-800', Icon: Shield },
    { title: 'Bidang Kesra & PKK', key: 'Kesra & PKK', badge: 'bg-rose-100 text-rose-800', Icon: Users },
  ]

  return (
    <div className="min-h-screen bg-background pb-12">
      <PortalNav role={accessRole} />
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white py-10 px-4 text-center shadow">
        <span className="inline-block bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-3">PERIODE 2025 – 2030</span>
        <h1 className="text-2xl md:text-4xl font-extrabold mb-1">Struktur Kepengurusan RT 06</h1>
        <p className="text-emerald-100 text-sm mb-5">Perumahan Villa Padurenan Indah 2</p>
        <div className="inline-block bg-white/10 border border-white/25 rounded-2xl px-6 py-3">
          <p className="text-xs text-amber-200 font-semibold flex items-center justify-center gap-1"><Sparkles className="w-3.5 h-3.5" /> MOTO PENGURUS</p>
          <p className="text-xl font-extrabold">“Beubah – Peduli – Beebagi”</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        {isAdmin && (
          <div className="mb-6 flex justify-end">
            <button onClick={() => { setAdding(!adding); setForm({ jabatan: '', nama: '', kategori: 'Seksi', urutan: list.length + 1 }) }} className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Pengurus
            </button>
          </div>
        )}

        {isAdmin && adding && (
          <div className="bg-white p-4 rounded-xl border mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Jabatan" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
            <input placeholder="Nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
            <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="px-3 py-2 text-sm border rounded-lg">
              <option value="Inti">Inti</option>
              <option value="Seksi">Seksi</option>
              <option value="Kesra & PKK">Kesra & PKK</option>
            </select>
            <button onClick={addNew} className="bg-emerald-600 text-white text-sm font-medium rounded-lg px-3 py-2">Simpan</button>
          </div>
        )}

        {loading ? <p className="text-center py-10 text-muted-foreground">Memuat data...</p> : (
          <div className="space-y-8">
            {groups.map(({ title, key, badge, Icon }) => (
              <section key={key}>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Icon className="w-5 h-5 text-emerald-700" /> {title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {list.filter((i) => i.kategori === key).map((item) => (
                    <div key={item.id} className="bg-card rounded-xl border p-4 shadow-sm flex flex-col justify-between">
                      {editId === item.id ? (
                        <div className="space-y-2">
                          <input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="w-full px-2 py-1 text-sm border rounded" />
                          <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-2 py-1 text-sm border rounded" />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditId(null)} className="px-2 py-1 text-xs bg-muted rounded"><X className="w-3 h-3 inline" /> Batal</button>
                            <button onClick={() => saveEdit(item.id)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded"><Save className="w-3 h-3 inline" /> Simpan</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${badge}`}>{item.jabatan}</span>
                            <h3 className="text-base font-bold">{item.nama}</h3>
                          </div>
                          {isAdmin && (
                            <div className="mt-3 pt-2 border-t flex justify-end gap-2">
                              <button onClick={() => { setEditId(item.id); setForm({ jabatan: item.jabatan, nama: item.nama, kategori: item.kategori, urutan: item.urutan }) }} className="text-xs text-blue-600 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                              <button onClick={() => remove(item.id)} className="text-xs text-red-600 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Hapus</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
