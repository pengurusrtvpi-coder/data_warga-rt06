import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { PortalNav } from '@/components/warga/PortalNav'
import { fetchKeluargaSaya, getMyAccessRole, hasActiveSession } from '@/lib/warga'
import {
  MessageSquarePlus,
  Send,
  CheckCircle2,
  Clock,
  Wrench,
  Trash2,
  MessageCircleReply,
  UserCheck,
  ShieldAlert,
  Camera,
  Image as ImageIcon,
  X,
  ZoomIn,
} from 'lucide-react'

export const Route = createFileRoute('/aspirasi')({
  ssr: false,
  beforeLoad: async () => {
    if (!(await hasActiveSession())) throw redirect({ to: '/login', replace: true })
    return { accessRole: await getMyAccessRole() }
  },
  component: AspirasiWargaPage,
})

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => { img.src = String(e.target?.result || '') }
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = img.width > 1200 ? 1200 / img.width : 1
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.8)
    }
    img.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

function AspirasiWargaPage() {
  const { accessRole } = Route.useRouteContext()
  const isAdmin = accessRole === 'admin'
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [nama, setNama] = useState('')
  const [alamat, setAlamat] = useState('')
  const [kategori, setKategori] = useState('Saran & Masukan')
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [replyId, setReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyStatus, setReplyStatus] = useState('Diproses')

  const loadData = async () => {
    setLoading(true)
    const { data } = await (supabase as any).from('aspirasi_warga').select('*').order('created_at', { ascending: false })
    if (data) setList(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const detectUser = async () => {
      if (isAdmin) {
        setNama('Pengurus / Admin RT 06')
        setAlamat('Sekretariat RT 06 VPI-2')
        return
      }
      try {
        const kel = await fetchKeluargaSaya()
        if (kel && kel.length > 0) {
          const kk = kel.find((w) => w.hubungan_keluarga?.toLowerCase().includes('kepala')) || kel[0]
          setNama(kk.nama_lengkap)
          setAlamat(kk.alamat || 'Villa Padurenan Indah 2')
        }
      } catch {
        setNama('Warga RT 06')
      }
    }
    detectUser()
  }, [isAdmin])

  const onSelectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!judul.trim() || !isi.trim()) return
    setSubmitting(true)
    try {
      const { data: uData } = await supabase.auth.getUser()
      let uploadedUrl: string | null = null

      if (photoFile) {
        const compressed = await compressImage(photoFile)
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
        const { error: upErr } = await supabase.storage
          .from('photo_aspirasi')
          .upload(fileName, compressed, { contentType: 'image/jpeg' })
        if (upErr) throw new Error('Gagal mengunggah foto: ' + upErr.message)
        uploadedUrl = supabase.storage.from('photo_aspirasi').getPublicUrl(fileName).data.publicUrl
      }

      const { error } = await (supabase as any).from('aspirasi_warga').insert([
        {
          user_id: uData?.user?.id || null,
          nama_pengirim: nama.trim() || 'Warga RT 06',
          alamat_pengirim: alamat.trim() || 'VPI-2 RT 06',
          kategori,
          judul: judul.trim(),
          isi_aspirasi: isi.trim(),
          foto_url: uploadedUrl,
          status: 'Menunggu',
        },
      ])
      if (error) throw new Error(error.message)

      setJudul('')
      setIsi('')
      clearPhoto()
      loadData()
    } catch (err: any) {
      alert(err?.message || 'Gagal mengirim aspirasi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveReply = async (id: string) => {
    const { error } = await (supabase as any)
      .from('aspirasi_warga')
      .update({ status: replyStatus, tanggapan_pengurus: replyText.trim() || null })
      .eq('id', id)
    if (!error) {
      setReplyId(null)
      loadData()
    }
  }

  const handleDelete = async (item: any) => {
    if (!confirm('Hapus aspirasi ini secara permanen?')) return
    if (item.foto_url) {
      const fileName = item.foto_url.split('/').pop()
      if (fileName) await supabase.storage.from('photo_aspirasi').remove([fileName])
    }
    const { error } = await (supabase as any).from('aspirasi_warga').delete().eq('id', item.id)
    if (!error) loadData()
  }

  const badgeStatus = (st: string) => {
    if (st === 'Selesai')
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Selesai</span>
    if (st === 'Diproses')
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Wrench className="w-3.5 h-3.5" /> Diproses</span>
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700"><Clock className="w-3.5 h-3.5" /> Menunggu</span>
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <PortalNav role={accessRole} />
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white py-9 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <MessageSquarePlus className="w-3.5 h-3.5 text-amber-300" /> Ruang Komunikasi Warga RT 06
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold">Aspirasi & Masukan Warga</h1>
          <p className="text-emerald-100 text-xs md:text-sm mt-1">
            Sampaikan usulan atau laporan kondisi lingkungan beserta bukti foto langsung dari kamera atau galeri HP
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-base font-extrabold text-slate-800 mb-1 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-700" /> Tulis Aspirasi Baru
          </h2>
          <p className="text-xs text-slate-500 mb-4">Aspirasi dan foto Anda dapat dilihat bersama oleh warga & pengurus.</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-600">Nama Pengirim</label>
              <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs font-semibold border rounded-xl bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Kategori</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs font-semibold border rounded-xl bg-white">
                <option value="Saran & Masukan">Saran & Masukan</option>
                <option value="Kebersihan & Lingkungan">Kebersihan & Lingkungan</option>
                <option value="Keamanan & Ketertiban">Keamanan & Ketertiban</option>
                <option value="Fasilitas & Infrastruktur">Fasilitas & Infrastruktur</option>
                <option value="Kegiatan Sosial & PKK">Kegiatan Sosial & PKK</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Judul / Topik Singkat</label>
              <input type="text" required placeholder="Contoh: Lampu jalan Blok C mati" value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs border rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Isi Aspirasi / Keterangan</label>
              <textarea rows={3} required placeholder="Jelaskan detail lokasi atau masukan Anda..." value={isi} onChange={(e) => setIsi(e.target.value)} className="w-full mt-1 px-3 py-2 text-xs border rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Bukti Foto (Opsional)</label>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onSelectPhoto} className="hidden" />
              <input ref={galleryRef} type="file" accept="image/*" onChange={onSelectPhoto} className="hidden" />
              {!photoPreview ? (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => cameraRef.current?.click()} className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 text-[11px] font-bold">
                    <Camera className="w-5 h-5 text-emerald-600" /> Ambil Kamera
                  </button>
                  <button type="button" onClick={() => galleryRef.current?.click()} className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/60 hover:bg-sky-100/70 text-sky-800 text-[11px] font-bold">
                    <ImageIcon className="w-5 h-5 text-sky-600" /> Pilih Galeri
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={photoPreview} alt="Pratinjau bukti" className="w-full h-40 object-cover" />
                  <button type="button" onClick={clearPhoto} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-xl shadow-sm flex items-center justify-center gap-2">
              <Send className="w-3.5 h-3.5" /> {submitting ? 'Mengunggah & Mengirim...' : 'Kirim Aspirasi Sekarang'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Papan Aspirasi Warga ({list.length})</h2>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5" /> Mode Pengurus / Admin
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border p-10 text-center text-xs text-slate-500">Memuat daftar aspirasi...</div>
          ) : list.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed p-10 text-center text-xs text-slate-500">Belum ada aspirasi yang masuk.</div>
          ) : (
            list.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="inline-block text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full mb-1.5">{item.kategori}</span>
                    <h3 className="text-base font-extrabold text-slate-800">{item.judul}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Oleh <strong className="text-slate-700">{item.nama_pengirim}</strong> •{' '}
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {badgeStatus(item.status)}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">{item.isi_aspirasi}</p>

                {item.foto_url && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-w-md">
                    <img src={item.foto_url} alt={item.judul} onClick={() => setZoomPhoto(item.foto_url)} className="w-full max-h-64 object-cover cursor-pointer" />
                    <button type="button" onClick={() => setZoomPhoto(item.foto_url)} className="absolute bottom-2 right-2 bg-black/65 text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5" /> Perbesar Foto
                    </button>
                  </div>
                )}

                {item.tanggapan_pengurus && (
                  <div className="bg-emerald-50/80 border-l-4 border-emerald-600 p-3.5 rounded-r-xl">
                    <p className="text-[11px] font-extrabold text-emerald-800 uppercase mb-1">Tanggapan Pengurus RT 06:</p>
                    <p className="text-xs text-slate-800 leading-relaxed">{item.tanggapan_pengurus}</p>
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-2 border-t border-slate-100">
                    {replyId === item.id ? (
                      <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-700">Status:</label>
                          <select value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)} className="px-2.5 py-1 text-xs font-semibold border rounded-lg bg-white">
                            <option value="Menunggu">Menunggu</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                        </div>
                        <textarea rows={2} placeholder="Tulis tanggapan resmi pengurus..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-lg bg-white" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setReplyId(null)} className="px-3 py-1.5 text-xs bg-slate-200 rounded-lg font-semibold">Batal</button>
                          <button onClick={() => handleSaveReply(item.id)} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg font-semibold">Simpan</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setReplyId(item.id); setReplyStatus(item.status); setReplyText(item.tanggapan_pengurus || '') }} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                          <MessageCircleReply className="w-3.5 h-3.5" /> Tanggapi / Ubah Status
                        </button>
                        <button onClick={() => handleDelete(item)} className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {zoomPhoto && (
        <div onClick={() => setZoomPhoto(null)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full">
            <button onClick={() => setZoomPhoto(null)} className="absolute -top-10 right-0 text-white flex items-center gap-1 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full">
              <X className="w-4 h-4" /> Tutup Foto
            </button>
            <img src={zoomPhoto} alt="Bukti penuh" className="w-full max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}
