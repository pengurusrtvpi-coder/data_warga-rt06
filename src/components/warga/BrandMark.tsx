import { Home } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-gradient text-primary-foreground shadow-soft">
        <Home className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight text-foreground">Portal Warga RT 06</p>
        {!compact && <p className="text-xs text-muted-foreground">VPI-2</p>}
      </div>
    </div>
  );
}
