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
    const accessRole = await getMyAccessRole()
    return { accessRole }
  },
  head: () => ({
    meta: [
      { title: 'Struktur Pengurus RT 06 — Portal RT 06 VPI-2' },
      { name: 'description', content: 'Susunan Pengurus RT 06 Villa Padurenan Indah 2 Periode 2025-2030.' },
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

function StrukturPengurusPage() {
  const { accessRole } = Route.useRouteContext()
  const isAdmin = accessRole === 'admin'

  const [pengurus, setPengurus] = useState<Pengurus[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ jabatan: '', nama: '', kategori: 'Inti', urutan: 1 })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newForm, setNewForm] = useState({ jabatan: '', nama: '', kategori: 'Seksi', urutan: 13 })

  useEffect(() => {
    fetchPengurus()
  }, [])

  async function fetchPengurus() {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('pengurus_rt')
      .select('*')
      .order('urutan', { ascending: true })

    if (!error && data) {
      setPengurus(data)
    }
    setLoading(false)
  }

  async function handleSaveEdit(id: string) {
    const { error } = await (supabase as any)
      .from('pengurus_rt')
      .update({
        jabatan: editForm.jabatan,
        nama: editForm.nama,
        kategori: editForm.kategori,
        urutan: Number(editForm.urutan),
      })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchPengurus()
    } else {
      alert('Gagal menyimpan perubahan: ' + error.message)
    }
  }

  async function handleAddNew() {
    if (!newForm.jabatan || !newForm.nama) return alert('Jabatan dan nama wajib diisi')
    const { error } = await (supabase as any).from('pengurus_rt').insert([
      {
        jabatan: newForm.jabatan,
        nama: newForm.nama,
        kategori: newForm.kategori,
        urutan: Number(newForm.urutan),
      },
    ])

    if (!error) {
      setShowAddForm(false)
      setNewForm({ jabatan: '', nama: '', kategori: 'Seksi', urutan: pengurus.length + 1 })
      fetchPengurus()
    } else {
      alert('Gagal menambah pengurus: ' + error.message)
    }
  }

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Hapus ${nama} dari daftar pengurus?`)) return
    const { error } = await (supabase as any).from('pengurus_rt').delete().eq('id', id)
    if (!error) fetchPengurus()
  }

  const pengurusInti = pengurus.filter((p) => p.kategori === 'Inti')
  const pengurusSeksi = pengurus.filter((p) => p.kategori === 'Seksi')
  const pengurusPKK = pengurus.filter((p) => p.kategori === 'Kesra & PKK')

  const renderCard = (item: Pengurus, badgeColor: string) => {
    const isEditing = editingId === item.id

    return (
      <div
        key={item.id}
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
      >
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Jabatan</label>
              <input
                type="text"
                value={editForm.jabatan}
                onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Nama Pengurus</label>
              <input
                type="text"
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <div className="w-2/3">
                <label className="text-xs font-medium text-slate-500">Kategori</label>
                <select
                  value={editForm.kategori}
                  onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                  className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg"
                >
                  <option value="Inti">Inti</option>
                  <option value="Seksi">Seksi</option>
                  <option value="Kesra & PKK">Kesra & PKK</option>
                </select>
              </div>
              <div className="w-1/3">
                <label className="text-xs font-medium text-slate-500">Urutan</label>
                <input
                  type="number"
                  value={editForm.urutan}
                  onChange={(e) => setEditForm({ ...editForm, urutan: Number(e.target.value) })}
                  className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Batal
              </button>
              <button
                onClick={() => handleSaveEdit(item.id)}
                className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Simpan
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${badgeColor}`}>
                {item.jabatan}
              </span>
              <h3 className="text-lg font-bold text-slate-800 leading-snug">{item.nama}</h3>
            </div>
            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingId(item.id)
                    setEditForm({
                      jabatan: item.jabatan,
                      nama: item.nama,
                      kategori: item.kategori,
                      urutan: item.urutan,
                    })
                  }}
                  className="text-xs text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.nama)}
                  className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-md flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <PortalNav role={accessRole} />

      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white py-10 px-4 shadow-md">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4">
            <Shield className="w-4 h-4 text-amber-300" />
            Periode Bakti 2025 – 2030
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">
            Struktur Kepengurusan RT 06
          </h1>
          <p className="text-emerald-100 text-sm md:text-base mb-6">
            Perumahan Villa Padurenan Indah 2 • Kel. Padurenan, Kec. Mustikajaya
          </p>

          <div className="inline-block bg-white/10 border border-white/25 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-xs uppercase tracking-widest text-amber-200 font-semibold mb-1 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Moto Pengurus RT 06 <Sparkles className="w-3.5 h-3.5" />
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-white tracking-wide">
              “Beubah – Peduli – Beebagi”
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        {isAdmin && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Pengurus Baru
            </button>
          </div>
        )}

        {isAdmin && showAddForm && (
          <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm mb-8">
            <h3 className="font-bold text-slate-800 mb-3 text-sm">Tambah Data Pengurus</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
