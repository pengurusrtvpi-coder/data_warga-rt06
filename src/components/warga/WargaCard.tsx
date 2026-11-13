import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatTanggal, type Warga } from "@/lib/warga";

function Row({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export function WargaCard({
  warga,
  isAdmin = false,
  onEdit,
  onDelete,
}: {
  warga: Warga;
  isAdmin?: boolean;
  onEdit: (w: Warga) => void;
  onDelete?: (w: Warga) => void;
}) {
  const initials = (warga.nama_lengkap || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const ttl = [warga.tempat_lahir, warga.tanggal_lahir ? formatTanggal(warga.tanggal_lahir) : null]
    .filter(Boolean)
    .join(", ");
  const rtRw = warga.rt || warga.rw ? `RT ${warga.rt ?? "—"} / RW ${warga.rw ?? "—"}` : null;
  const safeFotoUrl = warga.foto_ktp_url && /^https?:\/\//i.test(warga.foto_ktp_url) ? warga.foto_ktp_url : null;

  return (
    <article className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift">
      <header className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-deep">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-foreground">{warga.nama_lengkap}</h3>
          <p className="font-mono text-xs text-muted-foreground">NIK {warga.nik}</p>
          {isAdmin && <p className="mt-0.5 font-mono text-xs text-muted-foreground">KK {warga.no_kk}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {warga.status_hub_keluarga && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                {warga.status_hub_keluarga}
              </span>
            )}
            {warga.status_warga && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                {warga.status_warga}
              </span>
            )}
          </div>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
        <div className="col-span-2">
          <Row label="Tempat, Tgl Lahir" value={ttl} />
        </div>
        <Row label="Jenis Kelamin" value={warga.jenis_kelamin} />
        <Row label="Gol. Darah" value={warga.golongan_darah} />
        <Row label="Agama" value={warga.agama} />
        <Row label="Status Kawin" value={warga.status_perkawinan} />
        <Row label="Pendidikan" value={warga.pendidikan_terakhir} />
        <Row label="Pekerjaan" value={warga.pekerjaan} />
        <Row label="Kewarganegaraan" value={warga.kewarganegaraan} />
        <Row label="No. HP" value={warga.no_hp} />
        <div className="col-span-2">
          <Row label="Email" value={warga.email} />
        </div>
        <div className="col-span-2">
          <Row label="Alamat" value={[warga.alamat, rtRw].filter(Boolean).join(" · ")} />
        </div>
        {isAdmin && (
          <div className="col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Foto KTP</dt>
            <dd className="mt-0.5 break-all text-sm">
              {safeFotoUrl ? (
                <a href={safeFotoUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                  Buka foto KTP
                </a>
              ) : (
                warga.foto_ktp_url || "—"
              )}
            </dd>
          </div>
        )}
        {warga.catatan && (
          <div className="col-span-2">
            <Row label="Catatan" value={warga.catatan} />
          </div>
        )}
        {isAdmin && (
          <>
            <div className="col-span-2">
              <Row label="ID Data" value={warga.id} />
            </div>
            <Row label="Dibuat" value={formatTanggal(warga.created_at)} />
            <Row label="Diperbarui" value={formatTanggal(warga.updated_at)} />
          </>
        )}
      </dl>

      <div className={isAdmin ? "mt-auto grid grid-cols-2 gap-2 border-t pt-4" : "mt-auto border-t pt-4"}>
        <Button variant="outline" className="w-full" onClick={() => onEdit(warga)}>
          <Pencil />
          Edit
        </Button>
        {isAdmin && onDelete && (
          <Button variant="destructive" className="w-full" onClick={() => onDelete(warga)}>
            <Trash2 />
            Hapus
          </Button>
        )}
      </div>
    </article>
  );
}
