export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs shrink-0 ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <img src="/logo_rt06.jpg" alt="Logo RT 06 VPI-2" className="h-full w-full object-cover" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
            Portal Warga RT 06
          </span>
          <span className="hidden rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200 sm:inline-block">
            VPI-2
          </span>
        </div>
        {!compact && (
          <p className="text-xs text-slate-500">Villa Padurenan Indah 2 · RW 07 Padurenan</p>
        )}
      </div>
    </div>
  );
}
